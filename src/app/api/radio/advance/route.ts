import { NextRequest, NextResponse } from 'next/server';
import { radioService } from '@/lib/radio/radioService';

export async function POST(request: NextRequest) {
  try {
    const success = await radioService.advanceToNextTrack();
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Advanced to next track successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'No active radio stream or playlist' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error advancing track:', error);
    return NextResponse.json(
      { error: 'Failed to advance track' },
      { status: 500 }
    );
  }
} 