import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { trackId, action } = await request.json();

    if (!trackId || !action || !['like', 'unlike'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    if (action === 'like') {
      // Check if already liked
      const existingLike = await prisma.like.findFirst({
        where: {
          userId,
          nftId: trackId,
        },
      });

      if (existingLike) {
        return NextResponse.json(
          { success: true, message: 'Track already liked' },
          { status: 200 }
        );
      }

      // Create new like
      await prisma.like.create({
        data: {
          userId,
          nftId: trackId,
        },
      });

    } else if (action === 'unlike') {
      // Remove like
      const deletedLike = await prisma.like.deleteMany({
        where: {
          userId,
          nftId: trackId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Track ${action === 'like' ? 'liked' : 'unliked'} successfully`,
    });

  } catch (error) {
    console.error('Error handling radio like:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process like action' },
      { status: 500 }
    );
  }
} 