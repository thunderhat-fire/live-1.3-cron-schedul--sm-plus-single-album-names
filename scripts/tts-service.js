const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

class TTSService {
  constructor() {
    this.execAsync = util.promisify(exec);
    this.tempDir = '/tmp/tts';
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  async generateTTSAudio(text, options = {}) {
    const {
      voiceId = '21m00Tcm4TlvDq8ikWAM', // Rachel voice (default)
      stability = 0.5,
      similarityBoost = 0.75,
      outputFormat = 'mp3'
    } = options;

    const outputPath = path.join(this.tempDir, `tts-${Date.now()}.${outputFormat}`);
    
    try {
      // Use ElevenLabs TTS
      if (this.elevenLabsApiKey) {
        return await this.generateWithElevenLabs(text, voiceId, stability, similarityBoost, outputPath);
      }
      
      // Fallback to system TTS
      return await this.generateWithSystemTTS(text, outputPath);
      
    } catch (error) {
      console.error('TTS generation failed:', error);
      // Return a silent audio file as fallback
      return await this.generateSilentAudio(outputPath);
    }
  }

  async generateWithElevenLabs(text, voiceId, stability, similarityBoost, outputPath) {
    const fetch = require('node-fetch');
    
    const requestBody = {
      text: text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: stability,
        similarity_boost: similarityBoost
      }
    };

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.elevenLabsApiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const audioBuffer = await response.buffer();
    await fs.writeFile(outputPath, audioBuffer);
    
    console.log(`Generated TTS audio: ${text.substring(0, 50)}...`);
    return outputPath;
  }

  async generateWithSystemTTS(text, outputPath) {
    // macOS TTS
    if (process.platform === 'darwin') {
      const command = `say -v "Samantha" -o "${outputPath}" --file-format=mp4f "${text}"`;
      await this.execAsync(command);
      return outputPath;
    }
    
    // Linux TTS (using espeak)
    if (process.platform === 'linux') {
      const command = `espeak -v en -s 150 -w "${outputPath}" "${text}"`;
      await this.execAsync(command);
      return outputPath;
    }
    
    throw new Error('Unsupported platform for system TTS');
  }

  async generateSilentAudio(outputPath) {
    // Generate 1 second of silence as fallback
    const command = `ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 1 -c:a mp3 "${outputPath}"`;
    await this.execAsync(command);
    return outputPath;
  }

  async getAvailableVoices() {
    if (!this.elevenLabsApiKey) {
      return [];
    }

    try {
      const fetch = require('node-fetch');
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.elevenLabsApiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error);
      return [];
    }
  }

  async cleanupOldFiles() {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old TTS files:', error);
    }
  }

  async getAudioDuration(audioPath) {
    try {
      const command = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`;
      const { stdout } = await this.execAsync(command);
      return parseFloat(stdout) * 1000; // Convert to milliseconds
    } catch (error) {
      console.error('Error getting audio duration:', error);
      return 5000; // Default 5 seconds
    }
  }
}

module.exports = TTSService; 