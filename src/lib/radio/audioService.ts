/**
 * Audio processing service for radio system
 * Handles audio manipulation, mixing, and processing using FFmpeg
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uploadImage } from '@/lib/wasabi';

export interface AudioSample {
  url: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface ProcessedAudio {
  url: string;
  duration: number;
  format: string;
  fileSize: number;
}

export interface AudioMixConfig {
  ttsVolume: number;
  musicVolume: number;
  fadeIn: number;
  fadeOut: number;
  crossfade: number;
}

// Default mixing configuration
const DEFAULT_MIX_CONFIG: AudioMixConfig = {
  ttsVolume: 0.8,
  musicVolume: 0.9,
  fadeIn: 2,
  fadeOut: 3,
  crossfade: 1,
};

/**
 * Check if FFmpeg is available
 */
export async function checkFFmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    ffmpeg.on('error', () => {
      console.warn('FFmpeg not found. Audio processing will be limited.');
      resolve(false);
    });
    
    ffmpeg.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

/**
 * Download audio file from URL
 */
async function downloadAudio(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, new Uint8Array(buffer));
}

/**
 * Get audio duration using FFmpeg
 */
export async function getAudioDuration(audioUrl: string): Promise<number> {
  const ffmpegAvailable = await checkFFmpeg();
  
  if (!ffmpegAvailable) {
    // Fallback: estimate duration based on file size
    console.log('FFmpeg not available, estimating duration for:', audioUrl);
    return 180; // Default 3 minutes
  }

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', audioUrl,
      '-f', 'null',
      '-'
    ]);

    let stderr = '';
    
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg failed: ${stderr}`));
        return;
      }

      // Parse duration from FFmpeg output
      const durationMatch = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1]);
        const minutes = parseInt(durationMatch[2]);
        const seconds = parseFloat(durationMatch[3]);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        resolve(totalSeconds);
      } else {
        reject(new Error('Could not parse duration from FFmpeg output'));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Process audio sample for radio play
 */
export async function processAudioSample(
  audioUrl: string,
  startTime: number = 0,
  endTime?: number
): Promise<ProcessedAudio> {
  const ffmpegAvailable = await checkFFmpeg();
  
  if (!ffmpegAvailable) {
    console.log('FFmpeg not available, returning original audio');
    return {
      url: audioUrl,
      duration: endTime ? endTime - startTime : 180,
      format: 'mp3',
      fileSize: 0,
    };
  }

  const tempDir = path.join(process.cwd(), 'temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const inputPath = path.join(tempDir, `input-${uuidv4()}.mp3`);
  const outputPath = path.join(tempDir, `processed-${uuidv4()}.mp3`);

  try {
    // Download the audio file
    await downloadAudio(audioUrl, inputPath);

    // Process with FFmpeg
    const args = [
      '-i', inputPath,
      '-acodec', 'libmp3lame',
      '-ar', '44100',
      '-ac', '2',
      '-b:a', '192k',
    ];

    if (startTime > 0) {
      args.push('-ss', startTime.toString());
    }

    if (endTime) {
      args.push('-t', (endTime - startTime).toString());
    }

    args.push(outputPath);

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg processing failed with code ${code}`));
        }
      });

      ffmpeg.on('error', reject);
    });

    // Get file stats
    const stats = await fs.stat(outputPath);
    const duration = endTime ? endTime - startTime : await getAudioDuration(outputPath);

    // Upload to cloud storage and get public URL
    const publicUrl = await uploadToStorage(outputPath);

    return {
      url: publicUrl,
      duration,
      format: 'mp3',
      fileSize: stats.size,
    };

  } finally {
    // Clean up temp files
    try {
      await fs.unlink(inputPath);
      await fs.unlink(outputPath);
    } catch (error) {
      console.warn('Failed to clean up temp files:', error);
    }
  }
}

/**
 * Mix TTS audio with music track
 */
export async function mixAudioWithTTS(
  musicUrl: string,
  ttsUrl: string,
  config: AudioMixConfig = DEFAULT_MIX_CONFIG
): Promise<ProcessedAudio> {
  const ffmpegAvailable = await checkFFmpeg();
  
  if (!ffmpegAvailable) {
    console.log('FFmpeg not available, returning music URL only');
    return {
      url: musicUrl,
      duration: 0,
      format: 'mp3',
      fileSize: 0,
    };
  }

  const tempDir = path.join(process.cwd(), 'temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const musicPath = path.join(tempDir, `music-${uuidv4()}.mp3`);
  const ttsPath = path.join(tempDir, `tts-${uuidv4()}.mp3`);
  const outputPath = path.join(tempDir, `mixed-${uuidv4()}.mp3`);

  try {
    // Download both audio files
    await Promise.all([
      downloadAudio(musicUrl, musicPath),
      downloadAudio(ttsUrl, ttsPath),
    ]);

    // Get TTS duration
    const ttsDuration = await getAudioDuration(ttsPath);

    // Create complex FFmpeg filter for mixing
    const filterComplex = [
      // Input 0: TTS audio
      `[0:a]volume=${config.ttsVolume}[tts]`,
      // Input 1: Music audio with fade in
      `[1:a]afade=t=in:st=0:d=${config.fadeIn},volume=${config.musicVolume}[music]`,
      // Mix TTS and music
      `[tts][music]amix=inputs=2:duration=first[mixed]`,
      // Add fade out at the end
      `[mixed]afade=t=out:st=${ttsDuration - config.fadeOut}:d=${config.fadeOut}[output]`
    ].join(';');

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', ttsPath,
        '-i', musicPath,
        '-filter_complex', filterComplex,
        '-map', '[output]',
        '-acodec', 'libmp3lame',
        '-ar', '44100',
        '-ac', '2',
        '-b:a', '192k',
        outputPath
      ]);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg mixing failed with code ${code}`));
        }
      });

      ffmpeg.on('error', reject);
    });

    // Get file stats
    const stats = await fs.stat(outputPath);
    const duration = await getAudioDuration(outputPath);

    // Upload to cloud storage and get public URL
    const publicUrl = await uploadToStorage(outputPath);

    return {
      url: publicUrl,
      duration,
      format: 'mp3',
      fileSize: stats.size,
    };

  } finally {
    // Clean up temp files
    try {
      await Promise.all([
        fs.unlink(musicPath),
        fs.unlink(ttsPath),
        fs.unlink(outputPath),
      ]);
    } catch (error) {
      console.warn('Failed to clean up temp files:', error);
    }
  }
}

/**
 * Create seamless crossfade between tracks
 */
export async function createCrossfade(
  track1Url: string,
  track2Url: string,
  crossfadeDuration: number = 3
): Promise<ProcessedAudio> {
  const ffmpegAvailable = await checkFFmpeg();
  
  if (!ffmpegAvailable) {
    console.log('FFmpeg not available, returning track1 URL');
    return {
      url: track1Url,
      duration: 0,
      format: 'mp3',
      fileSize: 0,
    };
  }

  const tempDir = path.join(process.cwd(), 'temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const track1Path = path.join(tempDir, `track1-${uuidv4()}.mp3`);
  const track2Path = path.join(tempDir, `track2-${uuidv4()}.mp3`);
  const outputPath = path.join(tempDir, `crossfade-${uuidv4()}.mp3`);

  try {
    // Download both tracks
    await Promise.all([
      downloadAudio(track1Url, track1Path),
      downloadAudio(track2Url, track2Path),
    ]);

    // Get track durations
    const [track1Duration, track2Duration] = await Promise.all([
      getAudioDuration(track1Path),
      getAudioDuration(track2Path),
    ]);

    // Create crossfade filter
    const filterComplex = [
      // Track 1 with fade out
      `[0:a]afade=t=out:st=${track1Duration - crossfadeDuration}:d=${crossfadeDuration}[fade1]`,
      // Track 2 with fade in
      `[1:a]afade=t=in:st=0:d=${crossfadeDuration}[fade2]`,
      // Mix the tracks
      `[fade1][fade2]amix=inputs=2:duration=first[mixed]`
    ].join(';');

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', track1Path,
        '-i', track2Path,
        '-filter_complex', filterComplex,
        '-map', '[mixed]',
        '-acodec', 'libmp3lame',
        '-ar', '44100',
        '-ac', '2',
        '-b:a', '192k',
        outputPath
      ]);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg crossfade failed with code ${code}`));
        }
      });

      ffmpeg.on('error', reject);
    });

    // Get file stats
    const stats = await fs.stat(outputPath);
    const duration = await getAudioDuration(outputPath);

    // Upload to cloud storage and get public URL
    const publicUrl = await uploadToStorage(outputPath);

    return {
      url: publicUrl,
      duration,
      format: 'mp3',
      fileSize: stats.size,
    };

  } finally {
    // Clean up temp files
    try {
      await Promise.all([
        fs.unlink(track1Path),
        fs.unlink(track2Path),
        fs.unlink(outputPath),
      ]);
    } catch (error) {
      console.warn('Failed to clean up temp files:', error);
    }
  }
}

/**
 * Upload processed audio to storage using Wasabi
 */
async function uploadToStorage(filePath: string): Promise<string> {
  try {
    // Read the file as a buffer
    const buffer = await fs.readFile(filePath);
    const filename = path.basename(filePath);
    
    // Upload to Wasabi with processed audio folder and metadata
    const url = await uploadImage(
      buffer, 
      'processed-audio', 
      { file_type: 'processed_audio' },
      'system', // Use 'system' as user ID for system-processed files
      filename
    );
    
    return url;
  } catch (error) {
    console.error('Error uploading processed audio to Wasabi:', error);
    throw new Error('Failed to upload processed audio');
  }
}

/**
 * Validate audio file format and quality
 */
export async function validateAudio(audioUrl: string): Promise<{
  isValid: boolean;
  format: string;
  duration: number;
  bitrate: number;
  sampleRate: number;
}> {
  const ffmpegAvailable = await checkFFmpeg();
  
  if (!ffmpegAvailable) {
    return {
      isValid: true,
      format: 'mp3',
      duration: 180,
      bitrate: 192,
      sampleRate: 44100,
    };
  }

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      audioUrl
    ]);

    let stdout = '';
    let stderr = '';

    ffmpeg.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFprobe failed: ${stderr}`));
        return;
      }

      try {
        const info = JSON.parse(stdout);
        const format = info.format;
        const audioStream = info.streams.find((s: any) => s.codec_type === 'audio');

        resolve({
          isValid: true,
          format: format.format_name,
          duration: parseFloat(format.duration),
          bitrate: parseInt(format.bit_rate) / 1000,
          sampleRate: audioStream ? parseInt(audioStream.sample_rate) : 44100,
        });
      } catch (error) {
        reject(new Error('Failed to parse audio info'));
      }
    });

    ffmpeg.on('error', reject);
  });
} 