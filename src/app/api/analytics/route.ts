import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessAnalytics, canAccessFullAnalytics } from '@/lib/subscription';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has basic analytics access
    const hasBasicAccess = canAccessAnalytics(user);
    if (!hasBasicAccess) {
      return NextResponse.json({ error: 'Analytics access not available in your plan' }, { status: 403 });
    }

    // Check if user has full analytics access (Gold tier only)
    const hasFullAccess = canAccessFullAnalytics(user);

    // Get timeframe from query params
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '7d';
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (timeframe) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Fetch basic analytics data (available to all tiers)
    const [viewStats, uniqueNFTs, vinylUnitsOrdered, digitalDownloadsCount, digitalDownloadSales, successfulPresales] = await Promise.all([
      // Get total views
      prisma.nFT.aggregate({
        where: {
          userId: user.id,
        },
        _sum: {
          viewCount: true,
        },
      }),
      // Get unique NFTs count
      prisma.nFT.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: startDate,
            lte: now
          }
        }
      }),
      // Get vinyl units ordered (same logic as subscription dashboard)
      prisma.order.aggregate({
        _sum: { quantity: true },
        where: {
          nft: {
            userId: user.id,
          },
          format: 'vinyl',
          status: { in: ['completed', 'pending', 'processing'] },
          paymentStatus: { in: ['captured', 'processed', 'pending', 'completed'] },
          isPresaleOrder: true,
        },
      }),
      // Get digital downloads count (same as subscription dashboard)
      prisma.order.count({
        where: {
          nft: {
            userId: user.id, // Orders for NFTs owned by this user
          },
          format: 'digital',
          status: { in: ['completed', 'processing'] }, // Include both completed and processing digital orders
          paymentStatus: { in: ['processed', 'captured', 'completed'] }, // Include processed/captured/completed payments
        },
      }),
      // Get digital download sales total (same as subscription dashboard)
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { 
          nft: {
            userId: user.id, // Orders for NFTs owned by this user
          },
          format: 'digital',
          status: { in: ['completed', 'processing'] }, // Include both completed and processing digital orders
          paymentStatus: { in: ['processed', 'captured', 'completed'] }, // Include processed/captured/completed payments
        },
      }),
      // Get successful presales for earnings calculation (same as subscription dashboard)
      prisma.presaleThreshold.findMany({
        where: {
          nft: {
            userId: user.id,
          },
          status: {
            in: ['reached', 'completed'], // Count presales that reached target
          },
        },
        include: {
          nft: {
            select: {
              targetOrders: true,
            },
          },
        },
      })
    ]);

    // Calculate presale earnings (same logic as subscription dashboard)
    let presaleEarnings = 0;
    successfulPresales.forEach(presale => {
      if (presale.nft.targetOrders === 100) presaleEarnings += 260;
      else if (presale.nft.targetOrders === 200) presaleEarnings += 750;
      else if (presale.nft.targetOrders === 500) presaleEarnings += 3000;
    });

    const digitalSalesTotal = digitalDownloadSales._sum.totalPrice || 0;
    const vinylUnitsCount = vinylUnitsOrdered._sum.quantity || 0;
    
    // Count successful presale campaigns for the breakdown
    const successfulPresalesCount = successfulPresales.length;
    
    // Total sales = vinyl units ordered + digital downloads
    const totalSales = vinylUnitsCount + digitalDownloadsCount;
    
    // Total revenue = presale earnings + digital download sales
    const totalRevenue = presaleEarnings + digitalSalesTotal;

    // Get recent sales for display (last 5 completed presales and digital orders)
    const recentOrders = await prisma.order.findMany({
      where: {
        nft: {
          userId: user.id,
        },
        format: { in: ['digital','vinyl'] },
        status: { in: ['pending', 'processing', 'completed'] },
        paymentStatus: { in: ['pending', 'authorized', 'processed', 'captured', 'completed'] },
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      select: {
        createdAt: true,
        totalPrice: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    const recentSales = recentOrders.map(order => ({
      date: order.createdAt.toISOString(),
      amount: order.totalPrice,
    }));

    // Base analytics data for all tiers
    const analyticsData: any = {
      views: Number(viewStats._sum.viewCount ?? 0),
      sales: totalSales, // Total successful presales + digital downloads
      revenue: Number(totalRevenue), // Presale earnings + digital sales
      uniqueVisitors: uniqueNFTs,
      recentSales: recentSales, // Recent digital sales
      hasFullAccess, // Include access level info
      subscriptionTier: user.subscriptionTier,
      // Additional breakdown for clarity
      breakdown: {
        vinylUnitsOrdered: vinylUnitsCount,
        successfulPresales: successfulPresalesCount,
        digitalDownloads: digitalDownloadsCount,
        presaleEarnings: presaleEarnings,
        digitalSales: digitalSalesTotal
      }
    };

    // Full analytics features only for Gold users
    if (hasFullAccess) {
      // Get real buyer location data from orders
      const buyerLocations = await prisma.order.groupBy({
        by: ['buyerCountry'],
        where: {
          nft: { userId: user.id },
          buyerCountry: { not: null },
          status: { in: ['completed', 'processing'] },
          paymentStatus: { in: ['processed', 'captured'] },
        },
        _count: {
          buyerCountry: true,
        },
        orderBy: {
          _count: {
            buyerCountry: 'desc',
          },
        },
        take: 10, // Top 10 countries
      });

      // Format location data for frontend
      analyticsData.topLocations = buyerLocations.length > 0 
        ? buyerLocations.map(location => ({
            location: location.buyerCountry || 'Unknown',
            count: location._count.buyerCountry,
          }))
        : [{ location: 'No buyer location data yet', count: 0 }];

      // Calculate real player analytics from tracked events
      const playerAnalytics = await calculatePlayerAnalytics(user.id, startDate, now);
      analyticsData.playerCounts = playerAnalytics;
    } else {
      // For non-Gold users, provide limited location data
      analyticsData.topLocations = [
        { location: 'Upgrade to Gold for detailed location data', count: 0 }
      ];
    }

    return NextResponse.json({ 
      success: true, 
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

// Helper function to calculate real player analytics
async function calculatePlayerAnalytics(userId: string, startDate: Date, endDate: Date) {
  try {
    // Get all player events for user's NFTs in the date range
    const [
      totalPlaysResult,
      playSessionsWithDuration,
      skipEvents,
      completedPlays
    ] = await Promise.all([
      // Total plays (play_start events)
      prisma.playerEvent.count({
        where: {
          nft: { userId },
          eventType: 'play_start',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),

      // Play sessions with duration calculation
      prisma.playerEvent.findMany({
        where: {
          nft: { userId },
          eventType: { in: ['play_start', 'play_end', 'skip', 'progress'] },
          createdAt: { gte: startDate, lte: endDate }
        },
        select: {
          sessionId: true,
          eventType: true,
          playPosition: true,
          trackDuration: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' }
      }),

      // Skip events
      prisma.playerEvent.count({
        where: {
          nft: { userId },
          eventType: 'skip',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),

      // Completed plays (play_end events where position >= 80% of track)
      prisma.playerEvent.findMany({
        where: {
          nft: { userId },
          eventType: 'play_end',
          createdAt: { gte: startDate, lte: endDate }
        },
        select: {
          playPosition: true,
          trackDuration: true,
        }
      })
    ]);

    // Calculate average play duration from sessions
    const sessionDurations = new Map();
    
    playSessionsWithDuration.forEach(event => {
      if (!sessionDurations.has(event.sessionId)) {
        sessionDurations.set(event.sessionId, { 
          startPosition: 0,
          maxPosition: 0,
        });
      }
      
      const session = sessionDurations.get(event.sessionId);
      
      if (event.eventType === 'play_start') {
        session.startPosition = event.playPosition;
      }
      
      // Track the maximum position reached (from any event type)
      session.maxPosition = Math.max(session.maxPosition, event.playPosition);
    });

    // Calculate duration for each session (max position - start position)
    const validDurations = Array.from(sessionDurations.values())
      .map(session => Math.max(0, session.maxPosition - session.startPosition))
      .filter(d => d > 0);

    const averagePlayDuration = validDurations.length > 0 
      ? Math.round(validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length)
      : 0;

    // Calculate rates
    const skipRate = totalPlaysResult > 0 ? skipEvents / totalPlaysResult : 0;
    
    // Filter completed plays (played at least 80% of track duration)
    const completedPlaysCount = completedPlays.filter(play => 
      play.playPosition >= (play.trackDuration * 0.8)
    ).length;
    
    const completionRate = totalPlaysResult > 0 ? completedPlaysCount / totalPlaysResult : 0;

    return {
      totalPlays: totalPlaysResult,
      averagePlayDuration,
      skipRate: Math.round(skipRate * 100) / 100, // Round to 2 decimal places
      completionRate: Math.round(completionRate * 100) / 100
    };
  } catch (error) {
    console.error('Error calculating player analytics:', error);
    // Return fallback data if calculation fails
    return {
      totalPlays: 0,
      averagePlayDuration: 0,
      skipRate: 0,
      completionRate: 0
    };
  }
} 