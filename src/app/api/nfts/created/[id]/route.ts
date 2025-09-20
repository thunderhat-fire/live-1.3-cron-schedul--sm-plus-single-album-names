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
    const userId = params.id;

    const nfts = await prisma.nFT.findMany({
      where: {
        userId: userId
      },
      include: {
        sideATracks: true,
        likes: {
          where: {
            userId: session?.user?.id || ''
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform NFTs to include like status
    const transformedNFTs = nfts.map(nft => ({
      id: nft.id,
      name: nft.name,
      price: nft.price,
      currentOrders: nft.currentOrders,
      sideAImage: nft.sideAImage,
      imageUrl: nft.sideAImage,
      endDate: nft.endDate,
      recordSize: nft.recordSize,
      viewCount: nft.viewCount,
      sideATracks: nft.sideATracks,
      isLiked: nft.likes.length > 0
    }));

    return NextResponse.json({
      success: true,
      nfts: transformedNFTs
    });
  } catch (error: any) {
    console.error('Error fetching created NFTs:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching created Albums' },
      { status: 500 }
    );
  }
} 