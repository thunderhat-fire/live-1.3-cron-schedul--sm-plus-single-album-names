import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all completed digital orders and sum quantities by NFT
    const digitalSales = await prisma.order.groupBy({
      by: ['nftId'],
      where: {
        format: 'digital',
        status: { in: ['completed', 'processing'] },
        paymentStatus: { in: ['processed', 'captured', 'completed'] },
      },
      _sum: {
        quantity: true,
      },
    });

    // Convert to object with nftId as key and total quantity as value
    const salesByNft = digitalSales.reduce((acc, sale) => {
      acc[sale.nftId] = sale._sum.quantity || 0;
      return acc;
    }, {} as { [nftId: string]: number });

    return NextResponse.json({
      success: true,
      salesByNft,
      totalDigitalSales: Object.values(salesByNft).reduce((sum, count) => sum + count, 0),
    });
  } catch (error) {
    console.error('Error fetching digital sales:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch digital sales data' },
      { status: 500 }
    );
  }
} 