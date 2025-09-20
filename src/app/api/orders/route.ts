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
    let vinylPrice = 26;
    if (nft.targetOrders === 200) vinylPrice = 22;
    if (nft.targetOrders === 500) vinylPrice = 20;
    const price = format === 'digital'
      ? (vinylPrice / 2)
      : vinylPrice;

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