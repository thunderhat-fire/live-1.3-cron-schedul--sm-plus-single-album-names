import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Simple tracks API for live streaming
 * Bypasses subscription status filtering
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🎵 Live Stream Tracks API: Fetching tracks for streaming...');
    
    // Get tracks using same criteria as debug endpoint
    const tracks = await prisma.nFT.findMany({
      where: {
        isRadioEligible: true,
        isDeleted: false,
        previewAudioUrl: { not: null },
        // No subscription status filtering
      },
      include: {
        user: { 
          select: { 
            name: true,
            subscriptionStatus: true,
            subscriptionTier: true 
          } 
        },
        sideATracks: true,
        sideBTracks: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log(`🎵 Live Stream Tracks API: Found ${tracks.length} tracks`);
    
    // Debug log each track
    tracks.forEach(track => {
      console.log(`🎵 Track: ${track.name} | Radio: ${track.isRadioEligible} | Audio: ${track.hasPreviewAudio} | User: ${track.user?.name} (${track.user?.subscriptionStatus})`);
    });

    return NextResponse.json({
      success: true,
      tracks,
      count: tracks.length
    });

  } catch (error) {
    console.error('🎵 Live Stream Tracks API: Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks for streaming' },
      { status: 500 }
    );
  }
}

