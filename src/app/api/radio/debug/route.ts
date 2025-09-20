import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { radioService } from '@/lib/radio/radioService';

export async function GET(request: NextRequest) {
  try {
    // Get all NFTs with their radio eligibility info
    const nfts = await prisma.nFT.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            name: true,
            subscriptionStatus: true,
          },
        },
        sideATracks: true,
        sideBTracks: true,
      },
    });

    const eligibilityCheck = nfts.map(nft => ({
      id: nft.id,
      name: nft.name,
      isRadioEligible: nft.isRadioEligible,
      isDeleted: nft.isDeleted,
      hasPreviewAudio: !!nft.previewAudioUrl,
      previewAudioUrl: nft.previewAudioUrl,
      userSubscriptionStatus: nft.user.subscriptionStatus,
      hasTracks: (nft.sideATracks?.length || 0) + (nft.sideBTracks?.length || 0) > 0,
      trackCount: (nft.sideATracks?.length || 0) + (nft.sideBTracks?.length || 0),
      wouldBeEligible: nft.isRadioEligible && 
                      !nft.isDeleted && 
                      !!nft.previewAudioUrl && 
                      nft.user.subscriptionStatus === 'active',
    }));

    const eligibleCount = eligibilityCheck.filter(nft => nft.wouldBeEligible).length;
    const totalCount = eligibilityCheck.length;

    // Get current radio stream and playlist info
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

    // Test playlist generation
    let playlistGenerationTest = null;
    try {
      const eligibleTracks = await radioService.getEligibleTracks();
      playlistGenerationTest = {
        eligibleTracksCount: eligibleTracks.length,
        tracks: eligibleTracks.slice(0, 3).map(track => ({
          name: track.name,
          artist: track.artist,
          duration: track.totalDuration,
        })),
      };
    } catch (error) {
      playlistGenerationTest = {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return NextResponse.json({
      success: true,
      totalNFTs: totalCount,
      eligibleForRadio: eligibleCount,
      nfts: eligibilityCheck,
      summary: {
        missingPreviewAudio: eligibilityCheck.filter(nft => !nft.hasPreviewAudio).length,
        inactiveSubscriptions: eligibilityCheck.filter(nft => nft.userSubscriptionStatus !== 'active').length,
        notRadioEligible: eligibilityCheck.filter(nft => !nft.isRadioEligible).length,
        deleted: eligibilityCheck.filter(nft => nft.isDeleted).length,
      },
      currentRadioStream: radioStream ? {
        id: radioStream.id,
        name: radioStream.name,
        status: radioStream.status,
        isLive: radioStream.isLive,
        currentPlaylistId: radioStream.currentPlaylistId,
        currentTrackIndex: radioStream.currentTrackIndex,
        playlist: radioStream.currentPlaylist ? {
          id: radioStream.currentPlaylist.id,
          name: radioStream.currentPlaylist.name,
          trackCount: radioStream.currentPlaylist.trackCount,
          totalDuration: radioStream.currentPlaylist.totalDuration,
          tracks: radioStream.currentPlaylist.tracks.slice(0, 5).map(track => ({
            position: track.position,
            isAd: track.isAd,
            isIntro: track.isIntro,
            nftName: track.nft?.name,
            duration: track.duration,
          })),
        } : null,
      } : null,
      playlistGenerationTest,
    });

  } catch (error) {
    console.error('Error in radio debug endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to debug radio system' },
      { status: 500 }
    );
  }
} 