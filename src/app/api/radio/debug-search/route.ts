import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { radioService } from '@/lib/radio/radioService';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Search: Starting diagnostic...');
    
    // 1. Check if radio stream exists and is active
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

    console.log('🔍 Radio stream found:', !!radioStream);
    console.log('🔍 Current playlist:', !!radioStream?.currentPlaylist);
    console.log('🔍 Playlist tracks count:', radioStream?.currentPlaylist?.tracks?.length || 0);

    // 2. Check current track data
    const currentTrackData = await radioService.getCurrentTrack();
    console.log('🔍 Current track data:', !!currentTrackData);
    console.log('🔍 Current track ID:', currentTrackData?.track?.nft?.id);

    // 3. Test setting a specific track
    let setTrackTest = null;
    if (radioStream?.currentPlaylist?.tracks && radioStream.currentPlaylist.tracks.length > 0) {
      const firstTrack = radioStream.currentPlaylist.tracks[0];
      const testNftId = firstTrack.nftId;
      console.log('🔍 Testing setCurrentTrack with nftId:', testNftId);
      
      if (testNftId) {
        const setResult = await radioService.setCurrentTrack(testNftId);
        console.log('🔍 Set track result:', setResult);
        
        // Check if it actually changed
        const newTrackData = await radioService.getCurrentTrack();
        setTrackTest = {
          attempted: testNftId,
          success: setResult,
          newCurrentTrack: newTrackData?.track?.nft?.id,
          changed: newTrackData?.track?.nft?.id === testNftId,
        };
      } else {
        setTrackTest = {
          attempted: null,
          success: false,
          error: 'No nftId found for first track',
          newCurrentTrack: null,
          changed: false,
        };
      }
    }

    // 4. Get playlist for search
    const playlistTracks = radioStream?.currentPlaylist?.tracks?.map(track => ({
      id: track.id,
      nftId: track.nftId,
      position: track.position,
      nft: track.nft ? {
        id: track.nft.id,
        name: track.nft.name,
        genre: track.nft.genre,
        user: track.nft.user,
      } : null,
    })) || [];

    return NextResponse.json({
      success: true,
      debug: {
        radioStream: {
          exists: !!radioStream,
          id: radioStream?.id,
          status: radioStream?.status,
          currentPlaylistId: radioStream?.currentPlaylistId,
          currentTrackIndex: radioStream?.currentTrackIndex,
        },
        playlist: {
          exists: !!radioStream?.currentPlaylist,
          id: radioStream?.currentPlaylist?.id,
          trackCount: radioStream?.currentPlaylist?.tracks?.length || 0,
          tracks: playlistTracks.slice(0, 3), // First 3 tracks for debugging
        },
        currentTrack: {
          exists: !!currentTrackData,
          trackId: currentTrackData?.track?.id,
          nftId: currentTrackData?.track?.nft?.id,
          trackName: currentTrackData?.track?.nft?.name,
        },
        setTrackTest,
      },
    });

  } catch (error) {
    console.error('🔍 Debug Search Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined,
        }
      },
      { status: 500 }
    );
  }
} 