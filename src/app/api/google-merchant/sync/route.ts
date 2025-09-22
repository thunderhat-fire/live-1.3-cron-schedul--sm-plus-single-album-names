import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import GoogleMerchantService from '@/lib/google-merchant';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nftId, action = 'sync' } = body;

    if (!nftId) {
      return NextResponse.json(
        { success: false, error: 'NFT ID is required' },
        { status: 400 }
      );
    }

    // Fetch NFT data from database
    const nft = await prisma.nFT.findUnique({
      where: { id: nftId },
      include: {
        user: {
          select: {
            name: true,
            subscriptionTier: true,
          },
        },
        presaleThreshold: true,
      },
    });

    if (!nft) {
      return NextResponse.json(
        { success: false, error: 'NFT not found' },
        { status: 404 }
      );
    }

    // Check if NFT should be synced (not deleted, etc.)
    if (nft.isDeleted) {
      return NextResponse.json(
        { success: false, error: 'Cannot sync deleted NFT' },
        { status: 400 }
      );
    }

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

    // Prepare product data for Google Merchant Center
    const productData = {
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

    // Initialize Google Merchant Service
    const googleMerchant = new GoogleMerchantService();

    let result;
    if (action === 'remove') {
      result = await googleMerchant.removeProduct(nftId);
    } else {
      result = await googleMerchant.syncProduct(productData);
    }

    // Log the sync operation (optional: store in database)
    console.log(`Google Merchant ${action} for NFT ${nftId}:`, result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in Google Merchant sync API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Batch sync endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { nftIds } = body;

    if (!nftIds || !Array.isArray(nftIds)) {
      return NextResponse.json(
        { success: false, error: 'Array of NFT IDs is required' },
        { status: 400 }
      );
    }

    // Fetch all NFTs
    const nfts = await prisma.nFT.findMany({
      where: {
        id: { in: nftIds },
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            name: true,
            subscriptionTier: true,
          },
        },
        presaleThreshold: true,
      },
    });

    // Transform to product data
    const productsData = nfts.map(nft => {
      // Calculate correct pricing
      let price: number;
      if (nft.recordSize === '7 inch') {
        price = 13;
      } else {
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

    // Batch sync to Google Merchant Center
    const googleMerchant = new GoogleMerchantService();
    const result = await googleMerchant.batchSyncProducts(productsData);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in Google Merchant batch sync API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
