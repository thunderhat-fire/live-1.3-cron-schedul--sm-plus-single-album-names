/**
 * Real-time audio processing service for live radio streaming
 * Handles live mixing, crossfading, and audio stream management
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface AudioStream {
  id: string;
  url: string;
  type: 'music' | 'tts' | 'ad' | 'transition';
  duration: number;
  startTime: number;
  endTime: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

export interface LiveMixConfig {
  masterVolume: number;
  crossfadeDuration: number;
  ttsVolume: number;
  musicVolume: number;
  adVolume: number;
  autoFade: boolean;
  normalizeAudio: boolean;
}

export interface StreamMetadata {
  currentTrack: string;
  nextTrack: string;
  timeRemaining: number;
  totalListeners: number;
  peakListeners: number;
  uptime: number;
}

export class LiveAudioProcessor extends EventEmitter {
  private static instance: LiveAudioProcessor;
  private ffmpegProcess: ChildProcess | null = null;
  private isStreaming = false;
  private currentStreams: Map<string, AudioStream> = new Map();
  private streamQueue: AudioStream[] = [];
  private config: LiveMixConfig;
  private outputPath: string;
  private tempDir: string;
  private metadata: StreamMetadata;

  constructor() {
    super();
    this.config = {
      masterVolume: 1.0,
      crossfadeDuration: 3,
      ttsVolume: 0.8,
      musicVolume: 0.9,
      adVolume: 0.85,
      autoFade: true,
      normalizeAudio: true,
    };
    
    this.tempDir = path.join(process.cwd(), 'temp');
    this.outputPath = path.join(this.tempDir, `live-stream-${uuidv4()}.mp3`);
    
    this.metadata = {
      currentTrack: '',
      nextTrack: '',
      timeRemaining: 0,
      totalListeners: 0,
      peakListeners: 0,
      uptime: 0,
    };

    this.ensureTempDir();
  }

  static getInstance(): LiveAudioProcessor {
    if (!LiveAudioProcessor.instance) {
      LiveAudioProcessor.instance = new LiveAudioProcessor();
    }
    return LiveAudioProcessor.instance;
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Start live audio streaming
   */
  async startStreaming(outputUrl: string): Promise<void> {
    if (this.isStreaming) {
      throw new Error('Streaming is already active');
    }

    try {
      await this.ensureTempDir();
      
      // Create FFmpeg command for live streaming
      const ffmpegArgs = [
        '-re', // Read input at native frame rate
        '-i', this.outputPath,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',
        '-ac', '2',
        '-f', 'flv', // Flash Video format for streaming
        outputUrl
      ];

      this.ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
      
      this.ffmpegProcess.stdout?.on('data', (data) => {
        console.log('FFmpeg stdout:', data.toString());
      });

      this.ffmpegProcess.stderr?.on('data', (data) => {
        console.log('FFmpeg stderr:', data.toString());
      });

      this.ffmpegProcess.on('close', (code) => {
        console.log(`FFmpeg process exited with code ${code}`);
        this.isStreaming = false;
        this.emit('streamEnded', { code });
      });

      this.ffmpegProcess.on('error', (error) => {
        console.error('FFmpeg process error:', error);
        this.isStreaming = false;
        this.emit('streamError', error);
      });

      this.isStreaming = true;
      this.emit('streamStarted', { outputUrl });
      
      // Start the audio processing loop
      this.startAudioProcessingLoop();

    } catch (error) {
      console.error('Failed to start streaming:', error);
      throw error;
    }
  }

  /**
   * Stop live audio streaming
   */
  async stopStreaming(): Promise<void> {
    if (!this.isStreaming || !this.ffmpegProcess) {
      return;
    }

    try {
      this.ffmpegProcess.kill('SIGTERM');
      this.isStreaming = false;
      this.emit('streamStopped');
    } catch (error) {
      console.error('Failed to stop streaming:', error);
      throw error;
    }
  }

  /**
   * Add audio stream to the queue
   */
  addStream(stream: Omit<AudioStream, 'id'>): string {
    const id = uuidv4();
    const audioStream: AudioStream = {
      ...stream,
      id,
    };

    this.streamQueue.push(audioStream);
    this.emit('streamAdded', { stream: audioStream });
    
    return id;
  }

  /**
   * Remove stream from queue
   */
  removeStream(streamId: string): boolean {
    const index = this.streamQueue.findIndex(stream => stream.id === streamId);
    if (index !== -1) {
      this.streamQueue.splice(index, 1);
      this.emit('streamRemoved', { streamId });
      return true;
    }
    return false;
  }

  /**
   * Update stream configuration
   */
  updateConfig(newConfig: Partial<LiveMixConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', { config: this.config });
  }

  /**
   * Get current stream metadata
   */
  getMetadata(): StreamMetadata {
    return { ...this.metadata };
  }

  /**
   * Update listener count
   */
  updateListenerCount(count: number): void {
    this.metadata.totalListeners = count;
    if (count > this.metadata.peakListeners) {
      this.metadata.peakListeners = count;
    }
    this.emit('listenerCountUpdated', { count });
  }

  /**
   * Main audio processing loop
   */
  private async startAudioProcessingLoop(): Promise<void> {
    while (this.isStreaming) {
      try {
        await this.processNextStream();
        await this.sleep(1000); // Check every second
      } catch (error) {
        console.error('Error in audio processing loop:', error);
        this.emit('processingError', error);
      }
    }
  }

  /**
   * Process the next stream in the queue
   */
  private async processNextStream(): Promise<void> {
    if (this.streamQueue.length === 0) {
      return;
    }

    const nextStream = this.streamQueue.shift()!;
    const currentStream = this.currentStreams.get('main');

    if (currentStream) {
      // Perform crossfade between current and next stream
      await this.performCrossfade(currentStream, nextStream);
    } else {
      // Start the first stream
      await this.startStream(nextStream);
    }

    // Update metadata
    this.metadata.currentTrack = nextStream.url;
    this.metadata.timeRemaining = nextStream.duration;
    this.metadata.nextTrack = this.streamQueue[0]?.url || '';
    
    this.emit('trackChanged', { 
      current: nextStream, 
      next: this.streamQueue[0] 
    });
  }

  /**
   * Start a new audio stream
   */
  private async startStream(stream: AudioStream): Promise<void> {
    try {
      // Download and prepare the audio file
      const processedAudio = await this.prepareAudioFile(stream);
      
      // Add to current streams
      this.currentStreams.set('main', stream);
      
      // Start playing the audio
      await this.playAudio(processedAudio, stream);
      
    } catch (error) {
      console.error('Failed to start stream:', error);
      this.emit('streamError', { stream, error });
    }
  }

  /**
   * Perform crossfade between two streams
   */
  private async performCrossfade(
    currentStream: AudioStream, 
    nextStream: AudioStream
  ): Promise<void> {
    try {
      // Calculate crossfade timing
      const crossfadeStart = currentStream.duration - this.config.crossfadeDuration;
      
      // Prepare both audio files
      const [currentAudio, nextAudio] = await Promise.all([
        this.prepareAudioFile(currentStream),
        this.prepareAudioFile(nextStream),
      ]);

      // Create crossfade effect
      const crossfadeAudio = await this.createCrossfadeAudio(
        currentAudio,
        nextAudio,
        crossfadeStart,
        this.config.crossfadeDuration
      );

      // Replace current stream with crossfaded version
      this.currentStreams.set('main', {
        ...nextStream,
        duration: crossfadeAudio.duration,
      });

      // Play the crossfaded audio
      await this.playAudio(crossfadeAudio, nextStream);

    } catch (error) {
      console.error('Failed to perform crossfade:', error);
      // Fallback to simple stream switch
      await this.startStream(nextStream);
    }
  }

  /**
   * Prepare audio file for streaming
   */
  private async prepareAudioFile(stream: AudioStream): Promise<{
    path: string;
    duration: number;
  }> {
    const tempPath = path.join(this.tempDir, `stream-${stream.id}.mp3`);
    
    // Download audio file
    const response = await fetch(stream.url);
    const buffer = await response.arrayBuffer();
    await fs.writeFile(tempPath, new Uint8Array(buffer));

    // Get duration
    const duration = await this.getAudioDuration(tempPath);

    return { path: tempPath, duration };
  }

  /**
   * Create crossfade audio between two tracks
   */
  private async createCrossfadeAudio(
    audio1: { path: string; duration: number },
    audio2: { path: string; duration: number },
    crossfadeStart: number,
    crossfadeDuration: number
  ): Promise<{ path: string; duration: number }> {
    const outputPath = path.join(this.tempDir, `crossfade-${uuidv4()}.mp3`);

    // Create FFmpeg filter for crossfade
    const filterComplex = [
      // First audio with fade out
      `[0:a]afade=t=out:st=${crossfadeStart}:d=${crossfadeDuration}[fade1]`,
      // Second audio with fade in
      `[1:a]afade=t=in:st=0:d=${crossfadeDuration}[fade2]`,
      // Mix the tracks
      `[fade1][fade2]amix=inputs=2:duration=first[mixed]`
    ].join(';');

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', audio1.path,
        '-i', audio2.path,
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

    const duration = await this.getAudioDuration(outputPath);
    return { path: outputPath, duration };
  }

  /**
   * Play audio file
   */
  private async playAudio(
    audio: { path: string; duration: number },
    stream: AudioStream
  ): Promise<void> {
    // This would integrate with your actual audio playback system
    // For now, we'll simulate the playback
    console.log(`Playing audio: ${stream.url} for ${stream.duration} seconds`);
    
    // Simulate playback duration
    await this.sleep(stream.duration * 1000);
  }

  /**
   * Get audio duration using FFmpeg
   */
  private async getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', audioPath,
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

      ffmpeg.on('error', reject);
    });
  }

  /**
   * Utility function for sleeping
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up temporary files
   */
  async cleanup(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      await Promise.all(
        files.map(file => 
          fs.unlink(path.join(this.tempDir, file)).catch(() => {})
        )
      );
    } catch (error) {
      console.warn('Failed to cleanup temp files:', error);
    }
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): {
    currentStreams: AudioStream[];
    queueLength: number;
    isStreaming: boolean;
  } {
    return {
      currentStreams: Array.from(this.currentStreams.values()),
      queueLength: this.streamQueue.length,
      isStreaming: this.isStreaming,
    };
  }
}

export const liveAudioProcessor = LiveAudioProcessor.getInstance(); 