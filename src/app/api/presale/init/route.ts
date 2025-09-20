import { NextResponse } from 'next/server';
import { initializePresaleScheduler } from '@/lib/presale-scheduler';

/**
 * Initialize the presale scheduler
 * This endpoint should be called once when the app starts up
 */
export async function POST(request: Request) {
  try {
    // No authentication required for initialization
    // This should be called by the deployment process or manually by admin
    
    initializePresaleScheduler();
    
    return NextResponse.json({
      success: true,
      message: 'Presale scheduler initialized successfully',
      schedule: 'Every hour + every 15min during peak hours (9 AM - 11 PM UTC)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error initializing presale scheduler:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize presale scheduler',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Check if scheduler is needed and provide instructions
 */
export async function GET(request: Request) {
  return NextResponse.json({
    success: true,
    message: 'Presale scheduler initialization endpoint',
    instructions: {
      initialize: 'POST /api/presale/init',
      manage: 'POST /api/presale/scheduler with action: start|stop|trigger',
      manual: 'POST /api/presale/process'
    },
    schedule: 'Every hour + every 15min during peak hours (9 AM - 11 PM UTC)',
    purpose: 'Automatically processes failed presales when auction time expires'
  });
}
