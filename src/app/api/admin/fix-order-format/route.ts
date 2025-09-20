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

    // Find orders that are likely digital downloads (£13.00 price) but marked as vinyl
    const suspiciousOrders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        format: 'vinyl',
        totalPrice: 13.0, // Digital price
      },
      include: {
        nft: {
          select: {
            name: true,
            isVinylPresale: true,
          }
        }
      }
    });

    if (suspiciousOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orders found that need fixing',
        fixed: 0
      });
    }

    // Fix the orders
    const fixedOrders = [];
    for (const order of suspiciousOrders) {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          format: 'digital',
          isPresaleOrder: false, // Digital downloads are not presale orders
        },
      });

      fixedOrders.push({
        id: updatedOrder.id,
        nftName: order.nft.name,
        oldFormat: 'vinyl',
        newFormat: 'digital',
        price: updatedOrder.totalPrice,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedOrders.length} order(s)`,
      fixed: fixedOrders.length,
      orders: fixedOrders,
    });
  } catch (error) {
    console.error('Error fixing order format:', error);
    return NextResponse.json(
      { error: 'Failed to fix order format' },
      { status: 500 }
    );
  }
} 