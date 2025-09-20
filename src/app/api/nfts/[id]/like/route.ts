import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const nft = await prisma.nFT.findUnique({
      where: { id: params.id }
    });

    if (!nft) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 });
    }

    // Check if like exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_nftId: {
          userId: session.user.id,
          nftId: params.id
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.like.delete({
          where: {
            userId_nftId: {
              userId: session.user.id,
              nftId: params.id
            }
          }
        })
      ]);

      return NextResponse.json({
        success: true,
        liked: false
      });
    } else {
      // Like
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId: session.user.id,
            nftId: params.id
          }
        })
      ]);

      return NextResponse.json({
        success: true,
        liked: true
      });
    }
  } catch (error: any) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: error.message || 'Error toggling like' },
      { status: 500 }
    );
  }
} 