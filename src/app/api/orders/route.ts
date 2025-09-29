import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();
    const { nftId, format, quantity } = data;

    // Get the NFT
    const nft = await prisma.nFT.findUnique({
      where: { id: nftId }
    });

    if (!nft) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 });
    }

    // Check if digital format is available
    if (format === 'digital') {
      // Digital is available if presale time has ended, regardless of success/failure
      const isDigitalAvailable = nft.isVinylPresale ? 
        (nft.endDate && new Date(nft.endDate) < new Date()) : 
        true;
      
      if (!isDigitalAvailable) {
        return NextResponse.json({ 
          error: 'Digital format not yet available' 
        }, { status: 400 });
      }
    }

    // Calculate price
    let price: number;
    
    if (format === 'digital') {
      // Digital pricing based on record size
      price = nft.recordSize === '7 inch' ? 4.00 : 13.00;
    } else {
      // Vinyl pricing
      if (nft.recordSize === '7 inch') {
        price = 13.00; // Fixed price for 7-inch vinyl
      } else {
        // 12-inch tiered pricing based on target orders
        if (nft.targetOrders === 200) price = 22.00;
        else if (nft.targetOrders === 500) price = 20.00;
        else price = 26.00; // Default for 100 orders or unspecified
      }
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        nftId: nft.id,
        format,
        quantity,
        totalPrice: price * quantity,
        status: 'pending'
      }
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: user.id
      },
      include: {
        nft: {
          select: {
            id: true,
            name: true, // Album title
            sideATracks: true, // Include tracks for digital downloads
            sideBTracks: true, // Include tracks for digital downloads
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Most recent first
      }
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 