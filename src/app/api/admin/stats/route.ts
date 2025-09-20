import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('API - Session:', session);
    console.log('API - Is admin?', session?.user?.isAdmin);

    if (!session?.user?.isAdmin) {
      console.log('API - Unauthorized: Not admin');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get total NFTs
    const totalNFTs = await prisma.nFT.count();

    // Get currently logged in users (sessions active in last 10 minutes)
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    // Check for users with recent activity as proxy for "currently logged in"
    const recentlyActiveUsers = await prisma.user.findMany({
      where: {
        OR: [
          // Users who performed actions very recently (last 10 minutes)
          { nfts: { some: { updatedAt: { gte: tenMinutesAgo } } } },
          { likes: { some: { createdAt: { gte: tenMinutesAgo } } } },
          { orders: { some: { updatedAt: { gte: tenMinutesAgo } } } },
          { masteringRequests: { some: { updatedAt: { gte: tenMinutesAgo } } } },
        ],
      },
      select: { id: true, email: true, name: true },
    });

    console.log('API - Currently active users (recent activity):', recentlyActiveUsers.map(u => ({ email: u.email, name: u.name })));
    const activeUsers = recentlyActiveUsers.length;

    // Calculate total sales volume (matching collection page calculation)
    // Get all NFTs with their order data
    const nftsWithOrders = await prisma.nFT.findMany({
      select: {
        id: true,
        targetOrders: true,
        currentOrders: true,
        isVinylPresale: true,
      },
      where: {
        isDeleted: false,
      }
    });

    // Get digital sales data
    const digitalSales = await prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: {
        format: 'digital',
        status: { in: ['completed', 'processing'] },
        paymentStatus: { in: ['processed', 'captured', 'completed'] },
      },
    });

    // Calculate total volume (matching collection page logic)
    let totalSalesVolume = 0;

    // 1. Add presale vinyl revenue (using original vinyl prices)
    for (const nft of nftsWithOrders) {
      if (nft.isVinylPresale && nft.targetOrders && nft.currentOrders !== undefined) {
        // Calculate sold quantity: currentOrders represents actual orders sold
        const soldQuantity = Math.max(0, nft.currentOrders);
        // Use ORIGINAL vinyl price when the presale orders were sold
        const originalVinylPrice = nft.targetOrders === 100 ? 26 : nft.targetOrders === 200 ? 22 : nft.targetOrders === 500 ? 20 : 26;
        totalSalesVolume += (soldQuantity * originalVinylPrice);
      }
    }

    // 2. Add digital download revenue
    const digitalRevenue = digitalSales._sum.totalPrice || 0;
    totalSalesVolume += digitalRevenue;

    const stats = {
      totalUsers,
      totalNFTs,
      totalSales: Math.round(totalSalesVolume * 100) / 100, // Round to 2 decimal places
      activeUsers,
    };

    console.log('API - Stats:', stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
} 