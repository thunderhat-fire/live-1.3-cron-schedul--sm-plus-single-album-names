import { NextRequest, NextResponse } from 'next/server';
import { TTSCache } from '@/lib/radio/ttsCache';

export async function POST(request: NextRequest) {
  try {
    const { action, voiceId } = await request.json();
    const ttsCache = TTSCache.getInstance();

    switch (action) {
      case 'pregenerate':
        console.log('Admin: Pre-generating TTS cache...');
        await ttsCache.preGenerateGenericAds(voiceId || 'EXAVITQu4vr4xnSDxMaL');
        
        const stats = await ttsCache.getCacheStats();
        return NextResponse.json({
          success: true,
          message: 'TTS cache pre-generated successfully',
          stats
        });

      case 'cleanup':
        console.log('Admin: Cleaning up old TTS cache...');
        await ttsCache.cleanupOldCache();
        
        const statsAfterCleanup = await ttsCache.getCacheStats();
        return NextResponse.json({
          success: true,
          message: 'TTS cache cleaned up successfully',
          stats: statsAfterCleanup
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "pregenerate" or "cleanup"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin TTS Cache Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const ttsCache = TTSCache.getInstance();
    const stats = await ttsCache.getCacheStats();
    
    return NextResponse.json({
      success: true,
      stats,
      message: 'TTS cache statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Admin TTS Cache Stats Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 