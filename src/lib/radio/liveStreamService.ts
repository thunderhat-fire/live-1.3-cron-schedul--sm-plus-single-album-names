/**
 * Live streaming service for radio system
 * Handles video generation with album artwork and QR codes
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { QRCodeSVG } from 'qrcode.react';

export interface StreamTrack {
  id: string;
  name: string;
  artist: string;
  albumArtUrl: string;
  albumUrl: string; // URL for QR code
  duration: number;
  startTime: number;
  endTime: number;
  genre: string;
  recordLabel: string;
}

export interface LiveStreamConfig {
  outputUrl: string;
  resolution: '720p' | '1080p' | '480p';
  fps: number;
  bitrate: string;
  audioBitrate: string;
  showAlbumArt: boolean;
  showQRCode: boolean;
  showTrackInfo: boolean;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  transitionDuration: number;
}

export interface StreamMetadata {
  currentTrack: StreamTrack | null;
  nextTrack: StreamTrack | null;
  timeRemaining: number;
  totalListeners: number;
  peakListeners: number;
  uptime: number;
  isLive: boolean;
}

export class LiveStreamService extends EventEmitter {
  private static instance: LiveStreamService;
  private ffmpegProcess: ChildProcess | null = null;
  private isStreaming = false;
  private currentTrack: StreamTrack | null = null;
  private trackQueue: StreamTrack[] = [];
  private config: LiveStreamConfig;
  private tempDir: string;
  private metadata: StreamMetadata;
  private videoGenerator: VideoGenerator;

  constructor() {
    super();
    this.config = {
      outputUrl: '',
      resolution: '720p',
      fps: 30,
      bitrate: '2500k',
      audioBitrate: '128k',
      showAlbumArt: true,
      showQRCode: true,
      showTrackInfo: true,
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff',
      fontSize: 24,
      transitionDuration: 2,
    };
    
    this.tempDir = path.join(process.cwd(), 'temp');
    this.videoGenerator = new VideoGenerator(this.tempDir);
    
    this.metadata = {
      currentTrack: null,
      nextTrack: null,
      timeRemaining: 0,
      totalListeners: 0,
      peakListeners: 0,
      uptime: 0,
      isLive: false,
    };

    this.ensureTempDir();
  }

  static getInstance(): LiveStreamService {
    if (!LiveStreamService.instance) {
      LiveStreamService.instance = new LiveStreamService();
    }
    return LiveStreamService.instance;
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Start live streaming with video
   */
  async startStreaming(config: LiveStreamConfig): Promise<void> {
    if (this.isStreaming) {
      throw new Error('Streaming is already active');
    }

    this.config = { ...this.config, ...config };
    this.metadata.isLive = true;
    this.metadata.uptime = Date.now();

    try {
      await this.ensureTempDir();
      
      // Generate initial video frame
      await this.generateVideoFrame();
      
      // Start FFmpeg streaming process
      await this.startFFmpegStream();
      
      this.isStreaming = true;
      this.emit('streamStarted', { config: this.config });
      
      // Start the streaming loop
      this.startStreamingLoop();

    } catch (error) {
      console.error('Failed to start streaming:', error);
      this.metadata.isLive = false;
      throw error;
    }
  }

  /**
   * Stop live streaming
   */
  async stopStreaming(): Promise<void> {
    if (!this.isStreaming || !this.ffmpegProcess) {
      return;
    }

    try {
      this.ffmpegProcess.kill('SIGTERM');
      this.isStreaming = false;
      this.metadata.isLive = false;
      this.emit('streamStopped');
    } catch (error) {
      console.error('Failed to stop streaming:', error);
      throw error;
    }
  }

  /**
   * Add track to streaming queue
   */
  addTrack(track: Omit<StreamTrack, 'id'>): string {
    const id = uuidv4();
    const streamTrack: StreamTrack = {
      ...track,
      id,
    };

    this.trackQueue.push(streamTrack);
    this.emit('trackAdded', { track: streamTrack });
    
    return id;
  }

  /**
   * Update current track
   */
  async updateCurrentTrack(track: StreamTrack): Promise<void> {
    this.currentTrack = track;
    this.metadata.currentTrack = track;
    this.metadata.nextTrack = this.trackQueue[0] || null;
    
    // Generate new video frame with updated track info
    await this.generateVideoFrame();
    
    this.emit('trackChanged', { track });
  }

  /**
   * Update stream configuration
   */
  updateConfig(newConfig: Partial<LiveStreamConfig>): void {
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
   * Start FFmpeg streaming process
   */
  private async startFFmpegStream(): Promise<void> {
    const { width, height } = this.getResolution();
    const framePath = path.join(this.tempDir, 'current-frame.png');
    
    const ffmpegArgs = [
      '-re', // Read input at native frame rate
      '-loop', '1', // Loop the image
      '-i', framePath,
      '-f', 'lavfi',
      '-i', `anullsrc=channel_layout=stereo:sample_rate=44100`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-crf', '23',
      '-maxrate', this.config.bitrate,
      '-bufsize', this.config.bitrate,
      '-pix_fmt', 'yuv420p',
      '-g', '60',
      '-c:a', 'aac',
      '-b:a', this.config.audioBitrate,
      '-ar', '44100',
      '-ac', '2',
      '-f', 'flv',
      this.config.outputUrl
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
      this.metadata.isLive = false;
      this.emit('streamEnded', { code });
    });

    this.ffmpegProcess.on('error', (error) => {
      console.error('FFmpeg process error:', error);
      this.isStreaming = false;
      this.metadata.isLive = false;
      this.emit('streamError', error);
    });
  }

  /**
   * Generate video frame with current track info
   */
  private async generateVideoFrame(): Promise<void> {
    if (!this.currentTrack) {
      // Generate default frame
      await this.videoGenerator.generateDefaultFrame(this.config);
      return;
    }

    await this.videoGenerator.generateTrackFrame(this.currentTrack, this.config);
  }

  /**
   * Main streaming loop
   */
  private async startStreamingLoop(): Promise<void> {
    while (this.isStreaming) {
      try {
        // Update uptime
        this.metadata.uptime = Date.now() - (this.metadata.uptime || Date.now());
        
        // Process next track if current one is finished
        if (this.currentTrack && this.metadata.timeRemaining <= 0) {
          await this.processNextTrack();
        }
        
        // Update time remaining
        if (this.currentTrack) {
          this.metadata.timeRemaining = Math.max(0, this.metadata.timeRemaining - 1);
        }
        
        await this.sleep(1000); // Check every second
      } catch (error) {
        console.error('Error in streaming loop:', error);
        this.emit('streamingError', error);
      }
    }
  }

  /**
   * Process next track in queue
   */
  private async processNextTrack(): Promise<void> {
    if (this.trackQueue.length === 0) {
      // No more tracks, show default frame
      this.currentTrack = null;
      this.metadata.currentTrack = null;
      await this.generateVideoFrame();
      return;
    }

    const nextTrack = this.trackQueue.shift()!;
    await this.updateCurrentTrack(nextTrack);
    this.metadata.timeRemaining = nextTrack.duration;
    
    this.emit('trackStarted', { track: nextTrack });
  }

  /**
   * Get resolution dimensions
   */
  private getResolution(): { width: number; height: number } {
    const resolutions = {
      '480p': { width: 854, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
    };
    return resolutions[this.config.resolution];
  }

  /**
   * Utility function for sleeping
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
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
}

/**
 * Video generator for creating frames with album artwork and QR codes
 */
class VideoGenerator {
  private tempDir: string;

  constructor(tempDir: string) {
    this.tempDir = tempDir;
  }

  /**
   * Generate frame with track information
   */
  async generateTrackFrame(track: StreamTrack, config: LiveStreamConfig): Promise<void> {
    const { width, height } = this.getResolution(config.resolution);
    const outputPath = path.join(this.tempDir, 'current-frame.png');
    
    try {
      // Use URLs directly in FFmpeg instead of downloading
      const albumArtUrl = this.optimizeCloudinaryUrl(track.albumArtUrl, 600); // Optimize for streaming
      const qrCodePath = await this.generateQRCode(track.albumUrl, 'qr-code');
      
      // Create FFmpeg filter for composite image using direct URLs
      const filterComplex = this.createTrackFilterComplexWithUrl(
        albumArtUrl,
        qrCodePath,
        track,
        config,
        width,
        height
      );

      await this.executeFFmpeg([
        '-i', albumArtUrl, // Use URL directly
        '-i', qrCodePath,
        '-filter_complex', filterComplex,
        '-frames:v', '1',
        outputPath
      ]);

      // Clean up only the QR code (much smaller)
      await this.cleanupFile(qrCodePath);

    } catch (error) {
      console.error('Failed to generate track frame:', error);
      // Fallback to default frame
      await this.generateDefaultFrame(config);
    }
  }

  /**
   * Generate default frame
   */
  async generateDefaultFrame(config: LiveStreamConfig): Promise<void> {
    const { width, height } = this.getResolution(config.resolution);
    const outputPath = path.join(this.tempDir, 'current-frame.png');
    
    const filterComplex = this.createDefaultFilterComplex(config, width, height);

    await this.executeFFmpeg([
      '-f', 'lavfi',
      '-i', `color=c=${config.backgroundColor}:s=${width}x${height}`,
      '-filter_complex', filterComplex,
      '-frames:v', '1',
      outputPath
    ]);
  }

  /**
   * Create filter complex for track frame
   */
  private createTrackFilterComplex(
    albumArtPath: string,
    qrCodePath: string,
    track: StreamTrack,
    config: LiveStreamConfig,
    width: number,
    height: number
  ): string {
    const albumSize = Math.min(width, height) * 0.6;
    const qrSize = albumSize * 0.3;
    const textY = height * 0.8;
    
    return [
      // Scale album artwork
      `[0:v]scale=${albumSize}:${albumSize}:force_original_aspect_ratio=decrease,pad=${albumSize}:${albumSize}:(ow-iw)/2:(oh-ih)/2:color=${config.backgroundColor}[album]`,
      // Scale QR code
      `[1:v]scale=${qrSize}:${qrSize}:force_original_aspect_ratio=decrease,pad=${qrSize}:${qrSize}:(ow-iw)/2:(oh-ih)/2:color=white[qr]`,
      // Create background
      `color=c=${config.backgroundColor}:s=${width}x${height}[bg]`,
      // Overlay album art
      `[bg][album]overlay=(W-w)/2:${(height - albumSize) / 2 - 50}[bg1]`,
      // Overlay QR code
      `[bg1][qr]overlay=${width - qrSize - 20}:${height - qrSize - 20}[bg2]`,
      // Add text overlays
      `[bg2]drawtext=text='${track.name}':fontcolor=${config.textColor}:fontsize=${config.fontSize}:x=(w-tw)/2:y=${textY}:font=Arial`,
      `[bg2]drawtext=text='${track.artist}':fontcolor=${config.textColor}:fontsize=${config.fontSize * 0.8}:x=(w-tw)/2:y=${textY + config.fontSize + 10}:font=Arial`,
      `[bg2]drawtext=text='${track.genre} • ${track.recordLabel}':fontcolor=${config.textColor}:fontsize=${config.fontSize * 0.6}:x=(w-tw)/2:y=${textY + config.fontSize * 1.8 + 10}:font=Arial`,
      `[bg2]drawtext=text='Now Playing':fontcolor=${config.textColor}:fontsize=${config.fontSize * 0.7}:x=(w-tw)/2:y=${textY - config.fontSize - 20}:font=Arial`
    ].join(',');
  }

  /**
   * Create filter complex for default frame
   */
  private createDefaultFilterComplex(config: LiveStreamConfig, width: number, height: number): string {
    const textY = height / 2;
    
    return [
      `drawtext=text='VinylFunders Radio':fontcolor=${config.textColor}:fontsize=${config.fontSize * 1.5}:x=(w-tw)/2:y=${textY - config.fontSize}:font=Arial`,
      `drawtext=text='Live Independent Music':fontcolor=${config.textColor}:fontsize=${config.fontSize}:x=(w-tw)/2:y=${textY + 20}:font=Arial`,
      `drawtext=text='Coming Soon...':fontcolor=${config.textColor}:fontsize=${config.fontSize * 0.8}:x=(w-tw)/2:y=${textY + config.fontSize + 40}:font=Arial`
    ].join(',');
  }

  /**
   * Create filter complex for track frame with URL input
   */
  private createTrackFilterComplexWithUrl(
    albumArtUrl: string,
    qrCodePath: string,
    track: StreamTrack,
    config: LiveStreamConfig,
    width: number,
    height: number
  ): string {
    const albumSize = Math.min(width, height) * 0.6;
    const qrSize = albumSize * 0.3;
    const textY = height * 0.8;
    
    return [
      // Scale album artwork from URL
      `[0:v]scale=${albumSize}:${albumSize}:force_original_aspect_ratio=decrease,pad=${albumSize}:${albumSize}:(ow-iw)/2:(oh-ih)/2:color=${config.backgroundColor}[album]`,
      // Scale QR code
      `[1:v]scale=${qrSize}:${qrSize}:force_original_aspect_ratio=decrease,pad=${qrSize}:${qrSize}:(ow-iw)/2:(oh-ih)/2:color=white[qr]`,
      // Create background
      `color=c=${config.backgroundColor}:s=${width}x${height}[bg]`,
      // Overlay album art
      `[bg][album]overlay=(W-w)/2:${(height - albumSize) / 2 - 50}[bg1]`,
      // Overlay QR code
      `[bg1][qr]overlay=${width - qrSize - 20}:${height - qrSize - 20}[bg2]`,
      // Add text overlays
      `[bg2]drawtext=text='${track.name}':fontcolor=${config.textColor}:fontsize=${config.fontSize}:x=(w-tw)/2:y=${textY}:font=Arial`,
      `[bg2]drawtext=text='${track.artist}':fontcolor=${config.textColor}:fontsize=${config.fontSize * 0.8}:x=(w-tw)/2:y=${textY + config.fontSize + 10}:font=Arial`,
      `[bg2]drawtext=text='${track.genre} • ${track.recordLabel}':fontcolor=${config.textColor}:fontsize=${config.fontSize * 0.6}:x=(w-tw)/2:y=${textY + config.fontSize * 1.8 + 10}:font=Arial`,
      `[bg2]drawtext=text='Now Playing':fontcolor=${config.textColor}:fontsize=${config.fontSize * 0.7}:x=(w-tw)/2:y=${textY - config.fontSize - 20}:font=Arial`
    ].join(',');
  }

  /**
   * Download image from URL
   */
  private async downloadImage(url: string, prefix: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const filename = `${prefix}-${uuidv4()}.jpg`;
    const filepath = path.join(this.tempDir, filename);
    
    await fs.writeFile(filepath, new Uint8Array(buffer));
    return filepath;
  }

  /**
   * Generate QR code using qrcode.react
   */
  private async generateQRCode(url: string, prefix: string): Promise<string> {
    const filename = `${prefix}-${uuidv4()}.png`;
    const filepath = path.join(this.tempDir, filename);
    
    // Since qrcode.react is for React components, we'll use a different approach
    // We'll create a simple QR code using a web service or generate it server-side
    // For now, let's use a placeholder approach
    await this.generateQRCodeServerSide(url, filepath);
    
    return filepath;
  }

  /**
   * Generate QR code server-side (placeholder implementation)
   */
  private async generateQRCodeServerSide(url: string, filepath: string): Promise<void> {
    // This would use a server-side QR code generation library
    // For now, we'll create a simple placeholder
    console.log(`Would generate QR code for ${url} at ${filepath}`);
    
    // Create a simple colored square as placeholder
    const { width, height } = { width: 300, height: 300 };
    const filterComplex = `color=c=white:s=${width}x${height},drawtext=text='QR':fontcolor=black:fontsize=48:x=(w-tw)/2:y=(h-th)/2:font=Arial`;
    
    await this.executeFFmpeg([
      '-f', 'lavfi',
      '-i', `color=c=white:s=${width}x${height}`,
      '-filter_complex', filterComplex,
      '-frames:v', '1',
      filepath
    ]);
  }

  /**
   * Execute FFmpeg command
   */
  private async executeFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg failed with code ${code}`));
        }
      });

      ffmpeg.on('error', reject);
    });
  }

  /**
   * Get resolution dimensions
   */
  private getResolution(resolution: string): { width: number; height: number } {
    const resolutions = {
      '480p': { width: 854, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
    };
    return resolutions[resolution as keyof typeof resolutions] || resolutions['720p'];
  }

  /**
   * Optimize Cloudinary URL for streaming
   */
  private optimizeCloudinaryUrl(url: string, width: number): string {
    // Check if it's a Cloudinary URL
    if (url.includes('cloudinary.com')) {
      try {
        // Extract the Cloudinary parts
        const urlParts = url.split('/upload/');
        if (urlParts.length === 2) {
          const baseUrl = urlParts[0] + '/upload/';
          const imagePath = urlParts[1];
          
          // Add optimizations: resize, format auto, quality auto
          const optimizations = [
            `w_${width}`, // Resize to specific width
            'c_scale', // Scale to fit
            'f_auto', // Auto format (WebP when supported)
            'q_auto:good', // Auto quality optimization
            'fl_progressive' // Progressive loading
          ].join(',');
          
          return `${baseUrl}${optimizations}/${imagePath}`;
        }
      } catch (error) {
        console.warn('Failed to optimize Cloudinary URL:', error);
      }
    }
    
    // Return original URL if not Cloudinary or optimization failed
    return url;
  }

  /**
   * Clean up a single file
   */
  private async cleanupFile(filepath: string): Promise<void> {
    try {
      await fs.unlink(filepath);
      console.log(`Cleaned up: ${filepath}`);
    } catch (error) {
      console.warn(`Failed to clean up file ${filepath}:`, error);
    }
  }
}

export const liveStreamService = LiveStreamService.getInstance(); 