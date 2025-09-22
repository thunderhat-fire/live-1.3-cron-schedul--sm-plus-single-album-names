import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import GoogleMerchantService from '@/lib/google-merchant';

interface RouteParams {
  params: {
    id: string;
  };
}

// Get product status from Google Merchant Center
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const googleMerchant = new GoogleMerchantService();
    const result = await googleMerchant.getProductStatus(id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching Google Merchant product status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update specific product in Google Merchant Center
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Fetch updated NFT data
    const nft = await prisma.nFT.findUnique({
      where: { id },
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

    if (nft.isDeleted) {
      // If NFT is deleted, remove from Google Merchant Center
      const googleMerchant = new GoogleMerchantService();
      const result = await googleMerchant.removeProduct(id);
      return NextResponse.json(result);
    }

    // Calculate current pricing
    let price: number;
    if (nft.recordSize === '7 inch') {
      price = 13;
    } else {
      price = 26;
      if (nft.targetOrders === 200) price = 22;
      if (nft.targetOrders === 500) price = 20;
    }

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

    const googleMerchant = new GoogleMerchantService();
    const result = await googleMerchant.updateProduct(productData);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating Google Merchant product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Remove product from Google Merchant Center
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const googleMerchant = new GoogleMerchantService();
    const result = await googleMerchant.removeProduct(id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error removing Google Merchant product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
