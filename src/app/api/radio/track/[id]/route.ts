import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trackId = params.id;

    const nft = await prisma.nFT.findUnique({
      where: { id: trackId },
      include: {
        user: {
          select: { name: true },
        },
        sideATracks: true,
        sideBTracks: true,
      },
    });

    if (!nft) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    const allTracks = [...(nft.sideATracks || []), ...(nft.sideBTracks || [])];
    const totalDuration = allTracks.reduce((sum, track) => sum + track.duration, 0);

    return NextResponse.json({
      success: true,
      id: nft.id,
      name: nft.name,
      artist: nft.user.name,
      genre: nft.genre || 'Unknown',
      recordLabel: nft.recordLabel || 'Independent',
      previewAudioUrl: nft.previewAudioUrl,
      duration: totalDuration,
      albumArt: nft.sideAImage,
    });

  } catch (error) {
    console.error('Error fetching track:', error);
    return NextResponse.json(
      { error: 'Failed to fetch track' },
      { status: 500 }
    );
  }
} 