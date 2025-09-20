import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get total count of NFTs
    const totalCount = await prisma.nFT.count();
    
    // Get a sample of NFTs with their creators
    const sampleNFTs = await prisma.nFT.findMany({
      take: 5,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      totalCount,
      sampleNFTs
    });
  } catch (error) {
    console.error('Error in test route:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch test data'
      },
      { status: 500 }
    );
  }
} 