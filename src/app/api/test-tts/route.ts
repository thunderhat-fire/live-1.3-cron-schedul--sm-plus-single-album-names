import { NextRequest, NextResponse } from 'next/server';
import { generateTTSAdAndSave } from '@/lib/tts/elevenlabs';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing TTS generation via API...');
    console.log('ELEVENLABS_API_KEY present:', !!process.env.ELEVENLABS_API_KEY);
    
    const testText = "You're listening to VinylFunders Radio. Discover amazing independent artists and support the vinyl revival!";
    
    console.log('Generating TTS for text:', testText);
    const result = await generateTTSAdAndSave(testText);
    
    console.log('TTS generation successful!');
    console.log('Result:', result);
    
    return NextResponse.json({ 
      success: true, 
      result,
      message: 'TTS generation successful' 
    });
    
  } catch (error) {
    console.error('TTS generation failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        message: 'TTS generation failed' 
      },
      { status: 500 }
    );
  }
} 