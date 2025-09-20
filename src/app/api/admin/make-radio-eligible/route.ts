import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🎵 Making tracks radio eligible...');

    // Update all NFTs that have preview audio to be radio eligible
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

    console.log(`✅ Made ${updateResult.count} tracks radio eligible`);

    // Get some details about what was updated
    const eligibleTracks = await prisma.nFT.findMany({
      where: {
        isRadioEligible: true,
        isDeleted: false,
        previewAudioUrl: { not: null },
        user: {
          subscriptionStatus: 'active',
        },
      },
      include: {
        user: { select: { name: true } },
      },
      take: 10, // First 10 for preview
    });

    return NextResponse.json({
      success: true,
      count: updateResult.count,
      message: `Successfully made ${updateResult.count} tracks radio eligible`,
      preview: eligibleTracks.map(track => ({
        name: track.name,
        artist: track.user.name,
        genre: track.genre,
        hasPreviewAudio: !!track.previewAudioUrl
      }))
    });

  } catch (error) {
    console.error('❌ Error making tracks radio eligible:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to make tracks radio eligible', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 