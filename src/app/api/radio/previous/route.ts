import { NextResponse } from 'next/server';
import { radioService } from '@/lib/radio/radioService';

export async function POST() {
  try {
    console.log('API: Previous track requested');
    
    const success = await radioService.goToPreviousTrack();
    
    if (success) {
      console.log('API: Previous track successful');
      return NextResponse.json({ success: true, message: 'Previous track successful' });
    } else {
      console.log('API: Previous track failed');
      return NextResponse.json({ success: false, message: 'Failed to go to previous track' }, { status: 500 });
    }
  } catch (error) {
    console.error('API: Previous track error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 