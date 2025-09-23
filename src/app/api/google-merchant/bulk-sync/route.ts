import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import GoogleMerchantService from '@/lib/google-merchant';

// Bulk sync all active NFTs to Google Merchant Center
export async function POST(request: NextRequest) {
  try {
    // For now, allow bulk sync without session auth for testing
    // TODO: Re-enable session auth in production
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Optional: Add admin role check here
    // const user = await prisma.user.findUnique({
    //   where: { email: session.user.email },
    //   select: { role: true }
    // });
    // if (user?.role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    const body = await request.json();
    const { forceResync = false, onlyActive = true } = body;

    console.log('🔄 Starting bulk sync to Google Merchant Center...');

    // Fetch all NFTs that should be synced
    const whereCondition: any = {
      isDeleted: false,
    };

    if (onlyActive) {
      whereCondition.OR = [
        { isVinylPresale: true, endDate: { gte: new Date() } }, // Active presales
        { isVinylPresale: false }, // Digital releases
      ];
    }

    const nfts = await prisma.nFT.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            name: true,
            subscriptionTier: true,
          },
        },
        presaleThreshold: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📦 Found ${nfts.length} NFTs to sync`);

    // Transform to product data
    const productsData = nfts.map(nft => {
      // Calculate correct pricing based on record size
      let price: number;
      if (nft.recordSize === '7 inch') {
        price = 13; // Fixed price for 7-inch records
      } else {
        // 12-inch tiered pricing
        price = 26;
        if (nft.targetOrders === 200) price = 22;
        if (nft.targetOrders === 500) price = 20;
      }

      return {
        id: nft.id,
        name: nft.name,
        description: nft.description || `${nft.name} by ${nft.user?.name || 'Independent Artist'}`,
        price,
        recordSize: nft.recordSize || '12 inch',
        genre: nft.genre || undefined,
        imageUrl: nft.sideAImage || nft.sideBImage || '',
        sideAImage: nft.sideAImage || undefined,
        artistName: nft.user?.name || 'Independent Artist',
        isVinylPresale: nft.isVinylPresale || false,
        targetOrders: nft.targetOrders || 100,
        currentOrders: nft.currentOrders || 0,
        endDate: nft.endDate?.toISOString(),
      };
    });

    // Use the class to batch sync products
    const googleMerchant = new GoogleMerchantService();
    const result = await googleMerchant.batchSyncProducts(productsData);

    const response = {
      success: result.success,
      totalProcessed: productsData.length,
      successCount: result.results.filter(r => r.success).length,
      errorCount: result.errors.length,
      results: result.results,
      errors: result.errors,
    };

    console.log('✅ Bulk sync completed:', response);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in bulk sync:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get sync status for all products
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get count of active NFTs
    const totalNFTs = await prisma.nFT.count({
      where: {
        isDeleted: false,
        OR: [
          { isVinylPresale: true, endDate: { gte: new Date() } },
          { isVinylPresale: false },
        ],
      },
    });

    // Get recent NFTs for status check
    const recentNFTs = await prisma.nFT.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        isVinylPresale: true,
        endDate: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      totalNFTs,
      recentNFTs,
      lastSyncTime: new Date().toISOString(),
      googleMerchantConfigured: !!(
        process.env.GOOGLE_MERCHANT_CENTER_ID &&
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
        process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
      ),
    });
  } catch (error: any) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
