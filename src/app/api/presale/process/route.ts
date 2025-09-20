import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAndProcessPresaleThresholds, handleFailedPresales } from '@/lib/payment-service';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process successful presales (threshold met)
    const successfulResult = await checkAndProcessPresaleThresholds();
    
    // Process failed presales (time ended, threshold not met)
    const failedResult = await handleFailedPresales();

    return NextResponse.json({
      success: true,
      successful: successfulResult,
      failed: failedResult,
    });
  } catch (error) {
    console.error('Error processing presales:', error);
    return NextResponse.json(
      { error: 'Failed to process presales' },
      { status: 500 }
    );
  }
} 