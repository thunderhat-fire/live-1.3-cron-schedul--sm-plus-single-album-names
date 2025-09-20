import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the track
    const track = await prisma.track.findUnique({
      where: { id: params.id },
      include: {
        nftA: {
          select: {
            id: true,
          },
        },
        nftB: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Just return the existing URL (Cloudinary URLs are permanent)
    return NextResponse.json({ url: track.url });
  } catch (error) {
    console.error('Error refreshing track URL:', error);
    return NextResponse.json(
      { error: 'Failed to refresh track URL' },
      { status: 500 }
    );
  }
} 