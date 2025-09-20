import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface NFTWithRelations {
  [key: string]: any;
}

interface LikeWithNFT {
  nft: any;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = params.id;

    // First get all liked NFTs for the user with complete counts
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        likes: {
          include: {
            nft: {
              include: {
                sideATracks: true,
                sideBTracks: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    subscriptionTier: true,
                    subscriptionStatus: true,
                  }
                },
                likes: {
                  select: {
                    id: true
                  }
                },
                _count: {
                  select: {
                    likes: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Found liked NFTs:', user.likes.length);
    if (user.likes.length > 0) {
      console.log('Sample liked NFT structure:', {
        id: user.likes[0].nft.id,
        name: user.likes[0].nft.name,
        hasSideBTracks: !!user.likes[0].nft.sideBTracks,
        hasIsVinylPresale: 'isVinylPresale' in user.likes[0].nft,
        hasRecordLabel: !!user.likes[0].nft.recordLabel,
        user: user.likes[0].nft.user
      });
    }

    // Get all NFT IDs from the user's likes
    const nftIds = user.likes.map((like: any) => like.nft.id);

    // Get current user's likes for these NFTs
    const currentUserLikes = session?.user?.id ? await prisma.like.findMany({
      where: {
        userId: session.user.id,
        nftId: {
          in: nftIds
        }
      },
      select: {
        nftId: true
      }
    }) : [];

    // Create a Set of NFT IDs that the current user has liked for quick lookup
    const likedByCurrentUser = new Set(currentUserLikes.map((like: any) => like.nftId));

    // Get total like counts for all NFTs
    const likeCounts = await prisma.like.groupBy({
      by: ['nftId'],
      where: {
        nftId: {
          in: nftIds
        }
      },
      _count: {
        _all: true
      }
    });

    // Create a map of NFT ID to like count
    const likeCountMap = new Map(
      likeCounts.map((count: any) => [count.nftId, count._count._all])
    );

    // Transform the data to include all required fields for CardNFTMusic
    const transformedNFTs = user.likes.map((like: any) => ({
      id: like.nft.id,
      name: like.nft.name,
      description: like.nft.description || '',
      genre: like.nft.genre,
      creator: like.nft.user.name || 'Unknown Artist',
      userImage: like.nft.user.image || '/images/avatars/default-avatar.png',
      creatorSubscriptionTier: like.nft.user.subscriptionTier || 'starter',
      price: like.nft.price,
      currentOrders: like.nft.currentOrders || 0,
      targetOrders: like.nft.targetOrders || 100,
      sideAImage: like.nft.sideAImage,
      imageUrl: like.nft.sideAImage,
      sideBImage: like.nft.sideBImage,
      endDate: like.nft.endDate?.toISOString() || '',
      recordSize: like.nft.recordSize,
      recordLabel: like.nft.recordLabel || 'Unknown Label',
      viewCount: like.nft.viewCount || 0,
      sideATracks: like.nft.sideATracks,
      sideBTracks: like.nft.sideBTracks || [],
      isLiked: likedByCurrentUser.has(like.nft.id),
      likeCount: likeCountMap.get(like.nft.id) || 0,
      isVinylPresale: like.nft.isVinylPresale ?? true,
      isDeleted: false,
      isCurated: like.nft.isCurated || false,
      isRadioEligible: like.nft.isRadioEligible || false,
      user: {
        id: like.nft.user.id,
        name: like.nft.user.name || 'Unknown Artist',
        image: like.nft.user.image || '/images/avatars/default-avatar.png',
        subscriptionTier: like.nft.user.subscriptionTier || 'starter'
      },
    }));

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