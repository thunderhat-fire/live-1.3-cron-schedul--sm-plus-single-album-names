import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all NFTs that the user has liked using Prisma with proper includes
    const likedNFTs = await prisma.like.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        nft: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                subscriptionTier: true,
                subscriptionStatus: true,
              }
            },
            sideATracks: true,
            sideBTracks: true,
            likes: {
              select: {
                id: true,
                userId: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Found liked NFTs:', likedNFTs.length);

    const transformedNFTs = likedNFTs.map((like: any) => {
      const nft = like.nft;
      return {
        id: nft.id,
        name: nft.name,
        description: nft.description || '',
        genre: nft.genre,
        creator: nft.user.name || 'Unknown Artist',
        userImage: nft.user.image || '/images/avatars/default-avatar.png',
        creatorSubscriptionTier: nft.user.subscriptionTier || 'starter',
        recordSize: nft.recordSize,
        recordLabel: nft.recordLabel || 'Unknown Label',
        price: nft.price,
        endDate: nft.endDate?.toISOString() || '',
        imageUrl: nft.sideAImage,
        sideAImage: nft.sideAImage,
        sideBImage: nft.sideBImage,
        sideATracks: nft.sideATracks,
        sideBTracks: nft.sideBTracks,
        currentOrders: nft.currentOrders ?? 0,
        targetOrders: nft.targetOrders ?? 100,
        isVinylPresale: nft.isVinylPresale ?? true,
        isLiked: true, // Since these are liked NFTs
        likeCount: nft.likes.length,
        viewCount: nft.viewCount || 0,
        isDeleted: false,
        isCurated: nft.isCurated || false,
        isRadioEligible: nft.isRadioEligible || false,
        user: {
          id: nft.user.id,
          name: nft.user.name || 'Unknown Artist',
          image: nft.user.image || '/images/avatars/default-avatar.png',
          subscriptionTier: nft.user.subscriptionTier || 'starter'
        },
      };
    });

    return NextResponse.json({
      success: true,
      nfts: transformedNFTs
    });
  } catch (error: any) {
    console.error('Error fetching liked NFTs:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching liked NFTs' },
      { status: 500 }
    );
  }
} 