import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get stream stats
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const stream = await prisma.stream.findUnique({
      where: { id: params.id },
      select: {
        viewCount: true,
        likeCount: true,
        shareCount: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    return NextResponse.json({
      viewCount: stream.viewCount,
      likeCount: stream.likeCount,
      shareCount: stream.shareCount,
      chatCount: stream._count.messages,
    });
  } catch (error) {
    console.error('Failed to fetch stream stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stream stats' }, { status: 500 });
  }
}

// Update stream stats
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { type } = await req.json();

  if (!['view', 'like', 'share'].includes(type)) {
    return NextResponse.json({ error: 'Invalid stat type' }, { status: 400 });
  }

  try {
    const updateData = {
      [type === 'view' ? 'viewCount' : type === 'like' ? 'likeCount' : 'shareCount']: {
        increment: 1,
      },
    };

    const stream = await prisma.stream.update({
      where: { id: params.id },
      data: updateData,
      select: {
        viewCount: true,
        likeCount: true,
        shareCount: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    return NextResponse.json({
      viewCount: stream.viewCount,
      likeCount: stream.likeCount,
      shareCount: stream.shareCount,
      chatCount: stream._count.messages,
    });
  } catch (error) {
    console.error('Failed to update stream stats:', error);
    return NextResponse.json({ error: 'Failed to update stream stats' }, { status: 500 });
  }
} 