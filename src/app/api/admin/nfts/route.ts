import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the showDeleted parameter from the URL
    const { searchParams } = new URL(request.url);
    const showDeleted = searchParams.get('showDeleted') === 'true';

    // Define the where clause based on showDeleted
    const where: Prisma.NFTWhereInput = showDeleted 
      ? {} // Show all NFTs when showDeleted is true
      : { isDeleted: false }; // Only show non-deleted NFTs

    const nfts = await prisma.nFT.findMany({
      where,
      select: {
        id: true,
        name: true,
        price: true,
        currentOrders: true,
        createdAt: true,
        isDeleted: true,
        deletedAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Found NFTs:', nfts.length); // Debug log
    return NextResponse.json(nfts);
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Albums' },
      { status: 500 }
    );
  }
} 