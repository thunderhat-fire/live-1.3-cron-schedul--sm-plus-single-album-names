import { NextRequest, NextResponse } from 'next/server';
import { radioService } from '@/lib/radio/radioService';

export async function POST(request: NextRequest) {
  try {
    const { trackId } = await request.json();
    
    if (!trackId) {
      return NextResponse.json(
        { error: 'trackId is required' },
        { status: 400 }
      );
    }

    const success = await radioService.setCurrentTrack(trackId);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Track set successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to set track - track not found in current playlist or no active radio stream' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error setting track:', error);
    return NextResponse.json(
      { error: 'Failed to set track' },
      { status: 500 }
    );
  }
} 