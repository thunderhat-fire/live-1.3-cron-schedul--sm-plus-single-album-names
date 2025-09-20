import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nftId, requestedQuantity } = body;

    if (!nftId || !requestedQuantity) {
      return NextResponse.json(
        { error: 'nftId and requestedQuantity are required' },
        { status: 400 }
      );
    }

    // Get NFT details
    const nft = await prisma.nFT.findUnique({
      where: { id: nftId },
      include: {
        presaleThreshold: true,
      },
    });

    if (!nft) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      );
    }

    // Calculate available quantity
    // For presale items, availableQuantity = targetOrders - currentOrders (remaining slots)
    // For non-presale items, there's no limit
    let availableQuantity = Infinity;
    let maxQuantityPerOrder = Infinity;

    if (nft.isVinylPresale) {
      // For presale items, calculate remaining available slots
      availableQuantity = Math.max(0, (nft.targetOrders || 100) - (nft.currentOrders || 0));
      
      // Set a reasonable max per order (e.g., 10% of target or 10, whichever is smaller)
      const maxPercentage = Math.floor((nft.targetOrders || 100) * 0.1);
      maxQuantityPerOrder = Math.min(maxPercentage, 10, availableQuantity);
    }

    // Check if the requested quantity is available
    const isAvailable = requestedQuantity <= availableQuantity;
    const adjustedQuantity = Math.min(requestedQuantity, availableQuantity);

    return NextResponse.json({
      success: true,
      nftId,
      requestedQuantity,
      availableQuantity: availableQuantity === Infinity ? 999999 : availableQuantity,
      maxQuantityPerOrder: maxQuantityPerOrder === Infinity ? 999999 : maxQuantityPerOrder,
      isAvailable,
      adjustedQuantity,
      message: !isAvailable 
        ? `Only ${availableQuantity} items available, adjusted to ${adjustedQuantity}`
        : 'Quantity available',
    });
  } catch (error) {
    console.error('Error checking inventory:', error);
    return NextResponse.json(
      { error: 'Failed to check inventory' },
      { status: 500 }
    );
  }
} 