import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { autoCapturePaymentsForNFT, checkAndAutoCaptureAllThresholds } from '@/lib/payment-service';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin (you might want to add additional security)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { nftId, action } = body;

    if (action === 'check-all') {
      // Check all thresholds and auto-capture those that are ready
      const result = await checkAndAutoCaptureAllThresholds();
      
      return NextResponse.json({
        success: true,
        message: `Processed ${result.processedCount} thresholds`,
        processedCount: result.processedCount,
        results: result.results,
        error: result.error,
      });
    } else if (action === 'capture-specific' && nftId) {
      // Capture payments for a specific NFT
      const result = await autoCapturePaymentsForNFT(nftId);
      
      return NextResponse.json({
        success: true,
        message: `Auto-capture completed for ${result.nftName || 'Unknown NFT'}`,
        nftName: result.nftName,
        result: result, // Include the full result object
      });
    } else {
      return NextResponse.json({ error: 'Invalid action or missing nftId' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in auto-capture endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process auto-capture' },
      { status: 500 }
    );
  }
}

// GET endpoint to check threshold status
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const nftId = searchParams.get('nftId');

    if (nftId) {
      // Get status for specific NFT
      const { prisma } = await import('@/lib/prisma');
      const threshold = await prisma.presaleThreshold.findUnique({
        where: { nftId },
        include: {
          nft: {
            include: {
              orders: {
                where: { isPresaleOrder: true },
              },
            },
          },
        },
      });

      if (!threshold) {
        return NextResponse.json({ error: 'Threshold not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        threshold: {
          id: threshold.id,
          nftId: threshold.nftId,
          nftName: threshold.nft.name,
          currentOrders: threshold.currentOrders,
          targetOrders: threshold.targetOrders,
          status: threshold.status,
          createdAt: threshold.createdAt,
          updatedAt: threshold.updatedAt,
          isReadyForCapture: threshold.currentOrders >= threshold.targetOrders && threshold.status === 'active',
          totalOrders: threshold.nft.orders.length,
        },
      });
    } else {
      // Get all thresholds
      const { prisma } = await import('@/lib/prisma');
      const thresholds = await prisma.presaleThreshold.findMany({
        include: {
          nft: {
            include: {
              orders: {
                where: { isPresaleOrder: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        success: true,
        thresholds: thresholds.map(threshold => ({
          id: threshold.id,
          nftId: threshold.nftId,
          nftName: threshold.nft.name,
          currentOrders: threshold.currentOrders,
          targetOrders: threshold.targetOrders,
          status: threshold.status,
          createdAt: threshold.createdAt,
          updatedAt: threshold.updatedAt,
          isReadyForCapture: threshold.currentOrders >= threshold.targetOrders && threshold.status === 'active',
          totalOrders: threshold.nft.orders.length,
        })),
      });
    }
  } catch (error) {
    console.error('Error getting threshold status:', error);
    return NextResponse.json(
      { error: 'Failed to get threshold status' },
      { status: 500 }
    );
  }
} 