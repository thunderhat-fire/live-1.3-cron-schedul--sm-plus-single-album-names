import fs from 'fs/promises';
import path from 'path';

export async function generateTTSAdAndSave(text: string, voiceId: string = 'EXAVITQu4vr4xnSDxMaL') {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  console.log('TTS Service: Starting TTS generation...');
  console.log('TTS Service: API Key present:', !!apiKey);
  console.log('TTS Service: Voice ID:', voiceId);
  console.log('TTS Service: Text length:', text.length);
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set');
  }
  
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  console.log('TTS Service: Making request to:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    console.log('TTS Service: Response status:', response.status);
    console.log('TTS Service: Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS Service: Error response:', errorText);
      throw new Error(`ElevenLabs TTS failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const audioBuffer = new Uint8Array(await response.arrayBuffer());
    console.log('TTS Service: Audio buffer size:', audioBuffer.length);

    // Save to public/tts-ads/ with a unique filename
    const fileName = `ad-${Date.now()}.mp3`;
    const filePath = path.join(process.cwd(), 'public', 'tts-ads', fileName);
    console.log('TTS Service: Saving to:', filePath);
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, audioBuffer);

    // Return the public URL
    const publicUrl = `/tts-ads/${fileName}`;
    console.log('TTS Service: Generated TTS successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('TTS Service: Error in generateTTSAdAndSave:', error);
    throw error;
  }
}