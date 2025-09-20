import { NextRequest, NextResponse } from 'next/server';
import { radioService } from '@/lib/radio/radioService';

export async function POST(request: NextRequest) {
  try {
    // Trigger playlist regeneration with new content
    await radioService.onNewContentAdded();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Radio playlist refreshed successfully' 
    });

  } catch (error) {
    console.error('Error refreshing radio playlist:', error);
    return NextResponse.json(
      { error: 'Failed to refresh radio playlist' },
      { status: 500 }
    );
  }
} 