import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Define the expected request body type
interface IncrementViewsRequest {
  nftId: string;
}

export async function POST(request: Request) {
  try {
    const { nftId } = await request.json();

    if (!nftId) {
      return NextResponse.json(
        { error: 'NFT ID is required' },
        { status: 400 }
      );
    }

    // Update using Prisma's updateMany
    const result = await prisma.nFT.updateMany({
      where: { id: nftId },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    // Check if update was successful
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      );
    }

    // Get the updated view count
    const updatedNFT = await prisma.nFT.findUnique({
      where: { id: nftId },
      select: { viewCount: true }
    });

    return NextResponse.json({
      success: true,
      viewCount: updatedNFT?.viewCount ?? 1
    });

  } catch (error) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    );
  }
} 