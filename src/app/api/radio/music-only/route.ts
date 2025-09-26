import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to add cache-busting parameters to image URLs
const addCacheBusting = (url: string | null | undefined, trackId?: string): string => {
  if (!url) return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop';
  
  // Add cache-busting parameters for deployed environments
  const separator = url.includes('?') ? '&' : '?';
  const timestamp = Date.now();
  const cacheBuster = `${separator}v=${timestamp}&t=${trackId || 'default'}`;
  
  return `${url}${cacheBuster}`;
};

/**
 * Music-only radio API
 * Returns only music tracks, no ads or sponsored content
 * Specifically for the footer player
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Music-only API: Fetching music tracks without ads...');

    // Get all radio-eligible NFTs directly (no ads)
    const musicTracks = await prisma.nFT.findMany({
      where: {
        isRadioEligible: true,
        isActive: true,
        OR: [
          { isVinylPresale: false }, // Digital releases
          { 
            isVinylPresale: true,
            endDate: { gte: new Date() } // Active presales
          }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        sideATracks: true,
        sideBTracks: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit for performance
    });

    console.log(`Music-only API: Found ${musicTracks.length} music tracks`);

    // Transform to radio track format
    const playlist = musicTracks.map((nft) => {
      const allTracks = [...(nft.sideATracks || []), ...(nft.sideBTracks || [])];
      const totalDuration = allTracks.reduce((sum, track) => sum + (track.duration || 0), 0);

      return {
        id: `music-${nft.id}`,
        name: nft.name || 'Unknown Track',
        artist: nft.user?.name || 'Unknown Artist',
        albumArt: addCacheBusting(nft.sideAImage, nft.id),
        duration: totalDuration,
        genre: nft.genre || 'Unknown',
        recordLabel: nft.recordLabel || 'Independent',
        isAd: false, // Explicitly mark as not an ad
        isIntro: false,
        nftId: nft.id,
      };
    });

    // Shuffle the playlist for variety
    const shuffledPlaylist = playlist.sort(() => Math.random() - 0.5);

    // Get current playing track index (for sync with main radio if needed)
    const radioStream = await prisma.radioStream.findFirst({
      where: { isLive: true },
      include: {
        currentPlaylist: {
          include: {
            tracks: {
              include: {
                nft: {
                  include: {
                    user: { select: { name: true } }
                  }
                }
              },
              orderBy: { position: 'asc' }
            }
          }
        }
      }
    });

    let currentTrackIndex = 0;
    let currentTrack = shuffledPlaylist[0] || null;

    // Try to sync with main radio if it's playing music (not ads)
    if (radioStream?.currentPlaylist?.tracks) {
      const mainRadioCurrentIndex = radioStream.currentTrackIndex || 0;
      const mainRadioTrack = radioStream.currentPlaylist.tracks[mainRadioCurrentIndex];
      
      if (mainRadioTrack && !mainRadioTrack.isAd && mainRadioTrack.nft) {
        // Find matching track in our music-only playlist
        const matchingIndex = shuffledPlaylist.findIndex(track => 
          track.nftId === mainRadioTrack.nft?.id
        );
        
        if (matchingIndex !== -1) {
          currentTrackIndex = matchingIndex;
          currentTrack = shuffledPlaylist[matchingIndex];
        }
      }
    }

    const response = {
      success: true,
      currentTrack,
      nextTrack: shuffledPlaylist[currentTrackIndex + 1] || shuffledPlaylist[0],
      currentTrackIndex,
      playlist: shuffledPlaylist,
      playlistLength: shuffledPlaylist.length,
      totalListeners: 0, // Music-only player doesn't need listener stats
      peakListeners: 0,
      uptime: 0,
      isLive: shuffledPlaylist.length > 0,
      progress: 0,
      totalDuration: currentTrack?.duration || 0,
      playlistId: 'music-only',
      isPlaying: false, // Let the client manage play state
    };

    console.log(`Music-only API: Returning ${response.playlist.length} music tracks`);
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Music-only API: Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch music tracks' },
      { status: 500 }
    );
  }
}
