import { prisma } from '@/lib/prisma';
import { uploadImage } from '@/lib/wasabi';

export interface TTSRequest {
  text: string;
  voiceId: string;
  modelId?: string;
  voiceSettings?: {
    stability: number;
    similarityBoost: number;
    style: number;
    useSpeakerBoost: boolean;
  };
}

export interface TTSResponse {
  id: string;
  audioUrl: string;
  duration: number;
  status: string;
}

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// Default voice settings
const DEFAULT_VOICE_SETTINGS = {
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0.0,
  useSpeakerBoost: true,
};

// Available voices (you can expand this)
export const AVAILABLE_VOICES = {
  default: '21m00Tcm4TlvDq8ikWAM', // Rachel - Default voice
  male: 'AZnzlk1XvdvUeBnXmlld', // Dom - Male voice
  female: 'EXAVITQu4vr4xnSDxMaL', // Bella - Female voice
  british: 'VR6AewLTigWG4xSOukaG', // Arnold - British accent
  australian: 'pNInz6obpgDQGcFmaJgB', // Adam - Australian accent
};

/**
 * Generate TTS audio using ElevenLabs API
 */
export async function generateTTS(
  text: string, 
  voiceId: string = AVAILABLE_VOICES.default
): Promise<TTSResponse> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  try {
    // Create TTS record in database
    const ttsRecord = await prisma.tTSAudio.create({
      data: {
        text,
        voiceId,
        audioUrl: '',
        duration: 0,
        status: 'processing',
      },
    });

    // Prepare request payload
    const payload = {
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: DEFAULT_VOICE_SETTINGS,
    };

    // Call ElevenLabs API
    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`ElevenLabs API error: ${errorData.detail || response.statusText}`);
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Upload to your storage (Cloudinary, AWS S3, etc.)
    const audioUrl = await uploadAudioToStorage(audioBuffer, `tts-${ttsRecord.id}.mp3`);
    
    // Calculate duration (approximate - 1 second per ~150 characters)
    const estimatedDuration = Math.ceil(text.length / 150);

    // Update TTS record
    const updatedTts = await prisma.tTSAudio.update({
      where: { id: ttsRecord.id },
      data: {
        audioUrl,
        duration: estimatedDuration,
        status: 'completed',
      },
    });

    return {
      id: updatedTts.id,
      audioUrl: updatedTts.audioUrl,
      duration: updatedTts.duration,
      status: updatedTts.status,
    };

  } catch (error) {
    console.error('TTS generation failed:', error);
    
    // Update record with error status
    if (error instanceof Error && error.message.includes('ttsRecord')) {
      // Record was created, update it with error
      await prisma.tTSAudio.update({
        where: { id: (error as any).recordId },
        data: { status: 'failed' },
      });
    }
    
    throw error;
  }
}

/**
 * Upload audio buffer to storage using Wasabi
 */
async function uploadAudioToStorage(audioBuffer: ArrayBuffer, filename: string): Promise<string> {
  try {
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(audioBuffer);
    
    // Upload to Wasabi with TTS-specific folder and metadata
    const url = await uploadImage(
      buffer, 
      'tts', 
      { file_type: 'tts_audio' },
      'system', // Use 'system' as user ID for TTS-generated files
      filename
    );
    
    return url;
  } catch (error) {
    console.error('Error uploading TTS audio to Wasabi:', error);
    throw new Error('Failed to upload TTS audio');
  }
}

/**
 * Get available voices from ElevenLabs
 */
export async function getAvailableVoices(): Promise<any[]> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error) {
    console.error('Failed to fetch voices:', error);
    return [];
  }
}

/**
 * Get TTS audio by ID
 */
export async function getTTSAudio(id: string): Promise<TTSResponse | null> {
  const tts = await prisma.tTSAudio.findUnique({
    where: { id },
  });

  if (!tts) {
    return null;
  }

  return {
    id: tts.id,
    audioUrl: tts.audioUrl,
    duration: tts.duration,
    status: tts.status,
  };
}

/**
 * Clean up old TTS audio files
 */
export async function cleanupOldTTSAudio(daysOld: number = 30): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const oldTTS = await prisma.tTSAudio.findMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
      status: 'completed',
    },
  });

  for (const tts of oldTTS) {
    // TODO: Delete from storage service
    console.log(`Would delete TTS audio: ${tts.audioUrl}`);
    
    // Delete from database
    await prisma.tTSAudio.delete({
      where: { id: tts.id },
    });
  }
} 