import { NextRequest, NextResponse } from 'next/server';
import { radioService } from '@/lib/radio/radioService';
import { liveStreamService } from '@/lib/radio/liveStreamService';
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

export async function GET(request: NextRequest) {
  try {
    console.log('Radio status API: Starting request...');
    
    // Get current track with enhanced information
    const currentTrackData = await radioService.getCurrentTrack();
    console.log('Radio status API: getCurrentTrack result:', currentTrackData ? 'Found' : 'Null');

    // Check if radio is active
    const isActive = !!currentTrackData;

    // If no active radio, return demo data
    if (!isActive) {
      console.log('Radio status API: No active radio, returning demo data');
      return NextResponse.json({
        success: true,
        isActive: false,
        currentTrack: {
          id: 'demo-track-1',
          name: 'Demo Track - Vinyl Dreams',
          artist: 'Demo Artist',
          albumArt: addCacheBusting('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', 'demo-track-1'),
          duration: 180,
          genre: 'Indie Rock',
          recordLabel: 'Demo Records',
        },
        totalListeners: 0,
        peakListeners: 0,
        uptime: 0,
        isLive: false,
        nextTrack: {
          id: 'demo-track-2',
          name: 'Demo Track - Digital Age',
          artist: 'Demo Artist 2',
          albumArt: addCacheBusting('https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop', 'demo-track-2'),
          duration: 210,
        },
        playlist: {
          id: 'demo-playlist',
          name: 'Demo Playlist',
          trackCount: 5,
          totalDuration: 900,
        },
        isDemo: true,
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    console.log('Radio status API: Processing active radio data...');
    console.log('Radio status API: Current track data structure:', {
      hasTrack: !!currentTrackData.track,
      hasNft: !!currentTrackData.track?.nft,
      hasUser: !!currentTrackData.track?.nft?.user,
      isAd: currentTrackData.track?.isAd,
    });

    // Format current track data
    const t = currentTrackData.track;
    const isAd = t.isAd;
    const isIntro = t.isIntro;

    const currentTrack = {
      id: t.id,
      name: isAd
        ? 'Sponsored Message'
        : isIntro
          ? `Intro: ${t.nft?.name || 'Track'}`
          : t.trackTitle ? `${t.nft?.name || 'Album'} – ${t.trackTitle}` : t.nft?.name || 'Unknown Track',
      artist: isAd
        ? 'Ad'
        : isIntro
          ? t.nft?.user?.name || 'Intro'
          : t.nft?.user?.name || 'Unknown Artist',
      albumArt: addCacheBusting(
        isAd
          ? 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'
          : t.nft?.sideAImage,
        t.id
      ),
      duration: currentTrackData.totalDuration,
      genre: isAd
        ? 'Ad'
        : isIntro
          ? 'Intro'
          : t.nft?.genre || 'Unknown',
      recordLabel: isAd
        ? 'Sponsored'
        : isIntro
          ? t.nft?.recordLabel || 'Independent'
          : t.nft?.recordLabel || 'Independent',
      progress: currentTrackData.progress,
      isComplete: currentTrackData.isComplete,
      isAd,
      isIntro,
      audioUrl: t.audioUrl || (t.ttsAudioUrl as any) || null,
      albumName: t.nft?.name || null,
    };

    console.log('Radio status API: Formatted current track:', currentTrack);

    // Format next track data
    let nextTrack = null;
    if (currentTrackData.nextTrack) {
      const nt = currentTrackData.nextTrack;
      const isAdNext = nt.isAd;
      const isIntroNext = nt.isIntro;
      nextTrack = {
        id: nt.id,
        name: isAdNext
          ? 'Sponsored Message'
          : isIntroNext
            ? `Intro: ${nt.nft?.name || 'Track'}`
            : nt.trackTitle ? `${nt.nft?.name || 'Album'} – ${nt.trackTitle}` : nt.nft?.name || 'Unknown Track',
        artist: isAdNext
          ? 'Ad'
          : isIntroNext
            ? nt.nft?.user?.name || 'Intro'
            : nt.nft?.user?.name || 'Unknown Artist',
        albumArt: addCacheBusting(
          isAdNext
            ? 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'
            : nt.nft?.sideAImage,
          nt.id
        ),
        duration: nt.duration,
        genre: isAdNext
          ? 'Ad'
          : isIntroNext
            ? 'Intro'
            : nt.nft?.genre || 'Unknown',
        recordLabel: isAdNext
          ? 'Sponsored'
          : isIntroNext
            ? nt.nft?.recordLabel || 'Independent'
            : nt.nft?.recordLabel || 'Independent',
        isAd: isAdNext,
        isIntro: isIntroNext,
        audioUrl: nt.audioUrl || (nt.ttsAudioUrl as any) || null,
        albumName: nt.nft?.name || null,
      };
    }

    // Get radio stream info for uptime and playlist
    const radioStream = await prisma.radioStream.findFirst({
      where: { status: 'active' },
      include: {
        currentPlaylist: {
          include: {
            tracks: {
              include: {
                nft: {
                  include: {
                    user: {
                      select: { name: true },
                    },
                  },
                },
              },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    // Format playlist data for the UI
    const playlist = radioStream?.currentPlaylist?.tracks?.map((track) => {
      const t = track;
      const isAd = t.isAd;
      const isIntro = t.isIntro;

      return {
        id: t.id,
        name: isAd
          ? 'Sponsored Message'
          : isIntro
            ? `Intro: ${t.nft?.name || 'Track'}`
            : t.nft?.name || 'Unknown Track',
        artist: isAd
          ? 'Ad'
          : isIntro
            ? t.nft?.user?.name || 'Intro'
            : t.nft?.user?.name || 'Unknown Artist',
        albumArt: addCacheBusting(
          isAd
            ? 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'
            : t.nft?.sideAImage,
          t.id
        ),
        duration: t.duration,
        genre: isAd
          ? 'Ad'
          : isIntro
            ? 'Intro'
            : t.nft?.genre || 'Unknown',
        recordLabel: isAd
          ? 'Sponsored'
          : isIntro
            ? t.nft?.recordLabel || 'Independent'
            : t.nft?.recordLabel || 'Independent',
        isAd,
        isIntro,
      };
    }) || [];

    const response = {
      success: true,
      isActive,
      currentTrack,
      totalListeners: currentTrackData.streamStats.totalListeners,
      peakListeners: currentTrackData.streamStats.peakListeners,
      uptime: radioStream ? Math.floor((Date.now() - radioStream.createdAt.getTime()) / 1000) : 0,
      isLive: radioStream?.isLive || false,
      nextTrack,
      progress: currentTrackData.progress,
      totalDuration: currentTrackData.totalDuration,
      currentTrackIndex: radioStream?.currentTrackIndex || 0,
      playlist,
      playlistLimited: playlist.slice(currentTrackData.currentTrackIndex || 0, (currentTrackData.currentTrackIndex || 0) + 6),
      playlistId: radioStream?.currentPlaylistId || null,
    };

    console.log('Radio status API: Returning response:', response);
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Radio status API: Error getting radio status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get radio status',
        isActive: false,
        currentTrack: null,
        totalListeners: 0,
        peakListeners: 0,
        uptime: 0,
        isLive: false,
        nextTrack: null,
        playlist: null,
        isDemo: false,
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }
} 