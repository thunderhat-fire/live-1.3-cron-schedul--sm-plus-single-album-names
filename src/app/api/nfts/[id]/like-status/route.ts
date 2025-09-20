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

    if (!session?.user?.email) {
      return NextResponse.json({ isLiked: false });
    }

    // Check if the like exists
    const like = await prisma.like.findUnique({
      where: {
        userId_nftId: {
          userId: session.user.id,
          nftId: params.id
        }
      }
    });

    return NextResponse.json({ isLiked: !!like });
  } catch (error: any) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: error.message || 'Error checking like status' },
      { status: 500 }
    );
  }
} 