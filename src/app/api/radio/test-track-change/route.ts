import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { radioService } from '@/lib/radio/radioService';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test Track Change: Starting...');
    
    // Get the current radio stream and playlist
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

    if (!radioStream?.currentPlaylist?.tracks || radioStream.currentPlaylist.tracks.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active radio stream or playlist found',
      });
    }

    // Get current track before change
    const beforeTrackData = await radioService.getCurrentTrack();
    console.log('🧪 Before change - Current track:', beforeTrackData?.track?.nft?.id);

    // Try to change to the next track in the playlist
    const currentIndex = radioStream.currentTrackIndex || 0;
    const nextIndex = (currentIndex + 1) % radioStream.currentPlaylist.tracks.length;
    const nextTrack = radioStream.currentPlaylist.tracks[nextIndex];
    
    console.log('🧪 Attempting to change to track:', nextTrack.nftId);
    console.log('🧪 Track name:', nextTrack.nft?.name);

    if (!nextTrack.nftId) {
      return NextResponse.json({
        success: false,
        error: 'Next track has no nftId',
        debug: {
          nextTrack: {
            id: nextTrack.id,
            position: nextTrack.position,
            nftId: nextTrack.nftId,
          }
        }
      });
    }

    // Set the track
    const setResult = await radioService.setCurrentTrack(nextTrack.nftId);
    console.log('🧪 Set track result:', setResult);

    // Get current track after change
    const afterTrackData = await radioService.getCurrentTrack();
    console.log('🧪 After change - Current track:', afterTrackData?.track?.nft?.id);

    // Check if the change was successful
    const changeSuccessful = afterTrackData?.track?.nft?.id === nextTrack.nftId;
    console.log('🧪 Change successful:', changeSuccessful);

    return NextResponse.json({
      success: true,
      test: {
        radioStreamExists: !!radioStream,
        playlistExists: !!radioStream.currentPlaylist,
        trackCount: radioStream.currentPlaylist.tracks.length,
        beforeTrack: {
          id: beforeTrackData?.track?.nft?.id,
          name: beforeTrackData?.track?.nft?.name,
          index: currentIndex,
        },
        attemptedTrack: {
          id: nextTrack.nftId,
          name: nextTrack.nft?.name,
          index: nextIndex,
        },
        setResult,
        afterTrack: {
          id: afterTrackData?.track?.nft?.id,
          name: afterTrackData?.track?.nft?.name,
        },
        changeSuccessful,
      },
    });

  } catch (error) {
    console.error('🧪 Test Track Change Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
} 