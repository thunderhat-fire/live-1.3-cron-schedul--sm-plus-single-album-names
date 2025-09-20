import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { autoCapturePaymentsForNFT } from '@/lib/payment-service';
import { PresaleThresholdStatus } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting retry capture process...');

    // Find presales that are in processing state and need retries
    const presalesNeedingRetry = await prisma.presaleThreshold.findMany({
      where: {
        status: PresaleThresholdStatus.PROCESSING,
        currentOrders: {
          gte: prisma.presaleThreshold.fields.targetOrders,
        },
      },
      include: {
        nft: {
          include: {
            captureAttempts: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    console.log(`Found ${presalesNeedingRetry.length} presales needing retry`);

    const retryResults = [];

    for (const presale of presalesNeedingRetry) {
      const latestAttempt = presale.nft.captureAttempts[0];
      
      if (!latestAttempt) {
        console.log(`No capture attempts found for ${presale.nft.name}, skipping`);
        continue;
      }

      // Check if enough time has passed since last attempt (wait at least 12 hours)
      const hoursSinceLastAttempt = (Date.now() - latestAttempt.createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastAttempt < 12) {
        console.log(`Not enough time passed for ${presale.nft.name} (${hoursSinceLastAttempt.toFixed(1)} hours), skipping`);
        continue;
      }

      // Check if we've reached max attempts or max time
      const daysSinceFirst = Math.floor((Date.now() - latestAttempt.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (latestAttempt.attemptNumber >= 5 || daysSinceFirst >= 3) {
        console.log(`Max attempts or time reached for ${presale.nft.name}, will trigger final processing`);
      }

      console.log(`🔄 Retrying capture for ${presale.nft.name} (attempt ${latestAttempt.attemptNumber + 1})`);

      try {
        const result = await autoCapturePaymentsForNFT(presale.nftId);
        retryResults.push({
          nftId: presale.nftId,
          nftName: presale.nft.name,
          ...result,
        });
      } catch (error) {
        console.error(`Error retrying capture for ${presale.nft.name}:`, error);
        retryResults.push({
          nftId: presale.nftId,
          nftName: presale.nft.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`🔄 Retry process completed. Processed ${retryResults.length} presales`);

    return NextResponse.json({
      success: true,
      message: `Processed ${retryResults.length} presales for retry`,
      results: retryResults,
    });
  } catch (error) {
    console.error('Error in retry captures:', error);
    return NextResponse.json(
      { error: 'Failed to process retry captures' },
      { status: 500 }
    );
  }
} 