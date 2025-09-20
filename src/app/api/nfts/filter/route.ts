import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'recent';
    const userId = searchParams.get('userId');

    console.log('Filter API called with:', { filter, userId });

    const baseInclude = {
      user: {
        select: {
          name: true,
          image: true,
        }
      },
      likes: {
        where: {
          userId: session?.user?.id || ''
        },
        select: { id: true }
      },
      sideATracks: true,
      _count: {
        select: { likes: true }
      }
    };

    let orderBy: any = {};
    switch (filter) {
      case 'viewed':
        orderBy = { viewCount: 'desc' };
        break;
      case 'appreciated':
        orderBy = { likes: { _count: 'desc' } };
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const whereClause = {
      ...userId ? { userId } : {},
      isDeleted: false
    };

    const nfts = await prisma.nFT.findMany({
      where: whereClause,
      include: baseInclude,
      orderBy
    });

    console.log(`Filter API: Found ${nfts.length} NFTs`);

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
      likesCount: nft._count.likes,
      isLiked: nft.likes.length > 0,
      author: {
        name: nft.user.name || 'Anonymous',
        image: nft.user.image || '/images/avatars/default-avatar.png'
      }
    }));

    return NextResponse.json({
      success: true,
      nfts: transformedNFTs
    });
  } catch (error) {
    console.error('Error in filter API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to filter NFTs'
      },
      { status: 500 }
    );
  }
} 