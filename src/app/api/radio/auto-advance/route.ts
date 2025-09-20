import { NextRequest, NextResponse } from 'next/server';
import { radioService } from '@/lib/radio/radioService';

export async function POST(request: NextRequest) {
  try {
    // Check if current track should auto-advance
    const advanced = await radioService.checkAutoAdvance();
    
    if (advanced) {
      return NextResponse.json({
        success: true,
        message: 'Track auto-advanced successfully',
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'No auto-advance needed',
      });
    }
  } catch (error) {
    console.error('Error in auto-advance:', error);
    return NextResponse.json(
      { error: 'Failed to check auto-advance' },
      { status: 500 }
    );
  }
} 