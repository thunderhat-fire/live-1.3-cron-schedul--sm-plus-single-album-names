import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { initializePresaleScheduler, stopPresaleScheduler, triggerPresaleProcessing } from '@/lib/presale-scheduler';

/**
 * Initialize or manage the presale scheduler
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    switch (action) {
      case 'start':
        initializePresaleScheduler();
        return NextResponse.json({
          success: true,
          message: 'Presale scheduler started',
          schedule: 'Every hour + every 15min during peak hours (9 AM - 11 PM UTC)'
        });

      case 'stop':
        stopPresaleScheduler();
        return NextResponse.json({
          success: true,
          message: 'Presale scheduler stopped'
        });

      case 'trigger':
        const result = await triggerPresaleProcessing();
        return NextResponse.json(result);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, or trigger' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing presale scheduler:', error);
    return NextResponse.json(
      { error: 'Failed to manage presale scheduler' },
      { status: 500 }
    );
  }
}

/**
 * Check scheduler status
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Presale scheduler status endpoint',
      endpoints: {
        start: 'POST /api/presale/scheduler with { "action": "start" }',
        stop: 'POST /api/presale/scheduler with { "action": "stop" }',
        trigger: 'POST /api/presale/scheduler with { "action": "trigger" }',
        manual: 'POST /api/presale/process (existing endpoint)'
      },
      schedule: 'Every hour + every 15min during peak hours (9 AM - 11 PM UTC)'
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    return NextResponse.json(
      { error: 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}
