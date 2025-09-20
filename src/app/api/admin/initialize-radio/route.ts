import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { radioService } from '@/lib/radio/radioService';

export async function POST(request: NextRequest) {
  try {
    console.log('🎵 Initializing 24/7 VinylFunders Radio System...');

    // First, make sure we have tracks that are radio eligible
    const eligibleNFTs = await prisma.nFT.findMany({
      where: {
        isDeleted: false,
        previewAudioUrl: { not: null },
        user: {
          subscriptionStatus: 'active',
        },
      },
      include: {
        user: { select: { name: true } },
        sideATracks: true,
        sideBTracks: true
      }
    });

    console.log(`Found ${eligibleNFTs.length} NFTs with preview audio`);

    // Make all tracks with preview audio radio eligible
    const updateResult = await prisma.nFT.updateMany({
      where: {
        isDeleted: false,
        previewAudioUrl: { not: null },
        user: {
          subscriptionStatus: 'active',
        },
      },
      data: {
        isRadioEligible: true,
      },
    });

    console.log(`Made ${updateResult.count} tracks radio eligible`);

    if (eligibleNFTs.length === 0) {
      return NextResponse.json({ 
        error: 'No NFTs found with preview audio for radio playlist' 
      }, { status: 400 });
    }

    // Clean up existing radio data
    console.log('Cleaning up existing radio data...');
    await prisma.radioStream.deleteMany();
    await prisma.playlistTrack.deleteMany();
    await prisma.playlist.deleteMany();

    // Generate a new playlist using the radio service (24-hour playlist)
    console.log('Generating 24-hour radio playlist...');
    const playlistId = await radioService.generatePlaylist({
      maxDuration: 86400, // 24 hours in seconds
      includeTTS: true, // Enable TTS for ads and intros
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Default voice
      shuffleTracks: true,
    });

    // Create radio stream
    const radioStream = await prisma.radioStream.create({
      data: {
        name: 'VinylFunders 24/7 Radio Stream',
        status: 'active',
        isLive: true,
        totalListeners: 0,
        peakListeners: 0,
        currentTrackIndex: 0,
        currentTrackStartTime: new Date(),
        currentPlaylistId: playlistId,
      }
    });

    console.log('✅ 24/7 Radio system initialized successfully!');

    // Get playlist info for response
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        tracks: {
          include: {
            nft: {
              include: {
                user: { select: { name: true } }
              }
            }
          },
          take: 5, // First 5 tracks for preview
          orderBy: { position: 'asc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: '24/7 Radio system initialized and started!',
      data: {
        radioStreamId: radioStream.id,
        playlistId: playlistId,
        trackCount: playlist?.trackCount || 0,
        totalDuration: Math.round((playlist?.totalDuration || 0) / 3600), // Hours
        eligibleTracks: updateResult.count,
        status: 'LIVE - 24/7 Automated Radio',
        features: [
          '🎵 Continuous 24/7 playback',
          '🤖 AI-generated track introductions',
          '📢 Automated advertising spots',
          '🔄 Auto-loops when playlist ends',
          '📡 Automatic new track integration'
        ],
        preview: playlist?.tracks.map(track => ({
          position: track.position,
          name: track.isAd ? 'Sponsored Message' : (track.isIntro ? `Intro: ${track.nft?.name}` : track.nft?.name),
          artist: track.isAd ? 'Advertisement' : (track.isIntro ? 'Track Introduction' : track.nft?.user?.name),
          duration: `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`,
          type: track.isAd ? '📢 Ad' : (track.isIntro ? '🎤 Intro' : '🎵 Music')
        })) || []
      }
    });

  } catch (error) {
    console.error('❌ Error initializing 24/7 radio system:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize 24/7 radio system', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 