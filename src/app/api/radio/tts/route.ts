import { NextRequest, NextResponse } from 'next/server';
import { generateTTS, getAvailableVoices, getTTSAudio } from '@/lib/radio/ttsService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, voiceId = 'default' } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const ttsResult = await generateTTS(text, voiceId);

    return NextResponse.json({ 
      success: true, 
      tts: ttsResult,
      message: 'TTS generated successfully' 
    });

  } catch (error) {
    console.error('Error generating TTS:', error);
    return NextResponse.json(
      { error: 'Failed to generate TTS' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const voices = searchParams.get('voices');

    if (id) {
      // Get specific TTS audio
      const tts = await getTTSAudio(id);
      
      if (!tts) {
        return NextResponse.json({ error: 'TTS audio not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, tts });
    }

    if (voices) {
      // Get available voices
      const availableVoices = await getAvailableVoices();
      return NextResponse.json({ success: true, voices: availableVoices });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching TTS:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TTS' },
      { status: 500 }
    );
  }
} 