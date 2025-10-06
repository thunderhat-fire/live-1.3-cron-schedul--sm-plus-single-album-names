import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface UserWithSubscription {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  subscriptionTier: string;
  _count: {
    nfts: number;
    User_B: number;  // followers count
  };
  User_A: any[];  // followers
  nfts: {
    id: string;
    createdAt: Date;
    viewCount: number | null;
    favoritesCount: number | null;
    currentOrders: number | null;
    targetOrders: number | null;
    isVinylPresale: boolean;
  }[];
}

export async function GET(request: Request) {
  try {
    console.log('Starting popular users fetch...');
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.id);

    // Get the timeFilter from the URL
    const url = new URL(request.url);
    const timeFilter = url.searchParams.get('timeFilter') || 'all';

    // Calculate the date range based on the timeFilter
    let dateFilter: Date | null = null;
    if (timeFilter === 'today') {
      dateFilter = new Date(new Date().setHours(0, 0, 0, 0));
    } else if (timeFilter === '7days') {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeFilter === '30days') {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get users with active subscriptions and their performance metrics
    const users = (await prisma.user.findMany({
      where: {
        subscriptionStatus: 'active', // Only active users
        subscriptionTier: {
          in: ['starter', 'plus', 'gold'] // Exclude basic tier from featured authors
        },
        nfts: {
          some: {} // Only users who have created NFTs
        }
      },
      include: {
        _count: {
          select: {
            nfts: dateFilter ? {
              where: {
                createdAt: {
                  gte: dateFilter
                },
                isDeleted: false
              }
            } : {
              where: {
                isDeleted: false
              }
            },
            User_B: true  // Count of followers
          }
        },
        User_A: session?.user?.id ? {
          where: {
            id: session.user.id
          }
        } : false,
        nfts: {
          select: {
            id: true,
            createdAt: true,
            viewCount: true,
            favoritesCount: true,
            currentOrders: true,
            targetOrders: true,
            isVinylPresale: true,
            recordSize: true
          },
          where: {
            isDeleted: false,
            ...(dateFilter && {
              createdAt: {
                gte: dateFilter
              }
            })
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })) as unknown as UserWithSubscription[];

    console.log('Found users before ranking:', users.length);

    // Calculate performance score for each user
    const rankedUsers = users.map(user => {
      const nfts = user.nfts;
      
      // Calculate metrics
      const nftsCount = nfts.length;
      const singlesCount = nfts.filter(nft => nft.recordSize === '7 inch').length;
      const albumsCount = nfts.filter(nft => nft.recordSize === '12 inch').length;
      const totalViews = nfts.reduce((sum, nft) => sum + (nft.viewCount || 0), 0);
      const totalLikes = nfts.reduce((sum, nft) => sum + (nft.favoritesCount || 0), 0);
      const totalOrdersReceived = nfts.reduce((sum, nft) => {
        // For presale NFTs, count orders received (target - current)
        if (nft.isVinylPresale) {
          const ordersReceived = (nft.targetOrders || 100) - (nft.currentOrders || 100);
          return sum + Math.max(0, ordersReceived);
        }
        return sum;
      }, 0);
      
      // Performance score calculation
      // Weighted scoring: NFTs (30%), Orders (40%), Views (20%), Likes (10%)
      const performanceScore = 
        (nftsCount * 30) + 
        (totalOrdersReceived * 2) + // 2 points per order
        (totalViews * 0.1) + 
        (totalLikes * 5) +
        (user._count.User_B * 3); // Followers bonus
      
      return {
        ...user,
        performanceScore,
        totalOrdersReceived,
        totalViews,
        totalLikes,
        singlesCount,
        albumsCount
      };
    })
    .filter(user => user._count.nfts > 0) // Only users with NFTs
    .sort((a, b) => b.performanceScore - a.performanceScore) // Sort by performance score
    .slice(0, 6); // Limit to top 6 performing authors

    console.log('Top 6 ranked users:', rankedUsers.map(u => ({
      name: u.name,
      nfts: u._count.nfts,
      orders: u.totalOrdersReceived,
      score: u.performanceScore
    })));

    // Transform the response
    const transformedUsers = rankedUsers.map(user => ({
      id: user.id,
      name: user.name,
      image: user.image,
      bio: user.bio,
      nftsCount: user._count.nfts,
      singlesCount: user.singlesCount,
      albumsCount: user.albumsCount,
      followersCount: user._count.User_B,
      isFollowing: user.User_A?.length > 0,
      subscriptionTier: user.subscriptionTier,
      performanceScore: user.performanceScore,
      totalOrdersReceived: user.totalOrdersReceived
    }));

    return NextResponse.json({
      success: true,
      users: transformedUsers
    });

  } catch (error) {
    console.error('Error fetching popular users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular users' },
      { status: 500 }
    );
  }
} 