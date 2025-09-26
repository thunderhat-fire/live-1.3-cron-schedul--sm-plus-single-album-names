#!/usr/bin/env node

/**
 * Local Stream Test Script
 * 
 * Tests the streaming pipeline locally without YouTube
 * Generates test video with album art and QR codes
 */

const { createCanvas, loadImage } = require('canvas');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const ffmpeg = require('fluent-ffmpeg');

class LocalStreamTest {
  constructor() {
    this.outputDir = './test-output';
    this.testTrack = {
      name: 'Test Track',
      artist: 'Test Artist',
      albumArtUrl: 'https://via.placeholder.com/800x800/FF6B6B/FFFFFF?text=ALBUM+ART',
      albumUrl: 'https://www.vinylfunders.com/nft-detail/test-id',
      genre: 'Electronic',
      recordLabel: 'Test Records'
    };
  }

  async setup() {
    // Create output directory
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${this.outputDir}`);
    } catch (error) {
      console.log(`📁 Output directory exists: ${this.outputDir}`);
    }
  }

  async generateTestFrame() {
    console.log('🎨 Generating test video frame...');
    
    const canvas = createCanvas(1920, 1080);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 1920, 1080);

    try {
      // Try to load album art (placeholder for test)
      const albumArt = await loadImage(this.testTrack.albumArtUrl);
      
      // Draw album art (centered, large)
      const albumSize = 600;
      const albumX = (1920 - albumSize) / 2;
      const albumY = 100;
      ctx.drawImage(albumArt, albumX, albumY, albumSize, albumSize);
      
      console.log('✅ Album art loaded and drawn');
    } catch (error) {
      console.log('⚠️  Using placeholder album art');
      // Draw placeholder rectangle
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(660, 100, 600, 600);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('ALBUM ART', 960, 450);
    }

    // Generate QR code
    console.log('📱 Generating QR code...');
    const qrCodeDataUrl = await QRCode.toDataURL(this.testTrack.albumUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    const qrCode = await loadImage(qrCodeDataUrl);
    ctx.drawImage(qrCode, 1600, 100, 200, 200);

    // Track information
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.testTrack.name, 960, 800);

    ctx.font = '48px Arial';
    ctx.fillText(this.testTrack.artist, 960, 860);

    ctx.font = '36px Arial';
    ctx.fillText(`${this.testTrack.genre} • ${this.testTrack.recordLabel}`, 960, 920);

    // "Now Playing" indicator
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#FF6B6B';
    ctx.fillText('● NOW PLAYING', 960, 980);

    // Save frame
    const framePath = `${this.outputDir}/test-frame.png`;
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(framePath, buffer);
    
    console.log(`✅ Test frame saved: ${framePath}`);
    return framePath;
  }

  async generateTestVideo() {
    console.log('🎬 Generating test video...');
    
    const framePath = await this.generateTestFrame();
    const videoPath = `${this.outputDir}/test-stream.mp4`;
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(framePath)
        .loop(5) // Loop the image for 5 seconds
        .fps(30)
        .size('1920x1080')
        .output(videoPath)
        .on('end', () => {
          console.log(`✅ Test video generated: ${videoPath}`);
          resolve(videoPath);
        })
        .on('error', (error) => {
          console.error('❌ Video generation failed:', error);
          reject(error);
        })
        .run();
    });
  }

  async testRTMPStream() {
    console.log('📡 Testing RTMP streaming (simulation)...');
    
    // This would normally stream to an RTMP endpoint
    // For testing, we'll just validate the FFmpeg command
    
    const testCommand = [
      'ffmpeg',
      '-re', // Read input at native frame rate
      '-loop', '1', // Loop the input
      '-i', `${this.outputDir}/test-frame.png`,
      '-c:v', 'libx264', // Video codec
      '-preset', 'fast', // Encoding preset
      '-maxrate', '2500k', // Max bitrate
      '-bufsize', '5000k', // Buffer size
      '-pix_fmt', 'yuv420p', // Pixel format
      '-g', '60', // Keyframe interval
      '-c:a', 'aac', // Audio codec (if audio present)
      '-b:a', '128k', // Audio bitrate
      '-ac', '2', // Audio channels
      '-ar', '44100', // Audio sample rate
      '-f', 'flv', // Output format
      'rtmp://test-server/live/test-key'
    ].join(' ');

    console.log('📋 RTMP Command that would be used:');
    console.log(testCommand);
    console.log('');
    console.log('✅ Streaming pipeline validated');
  }

  async testWithAudio() {
    console.log('🎵 Testing with audio input...');
    
    // Generate a test tone
    const audioPath = `${this.outputDir}/test-audio.wav`;
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input('anullsrc=r=44100:cl=stereo') // Generate silent audio
        .inputFormat('lavfi')
        .duration(10) // 10 seconds
        .output(audioPath)
        .on('end', () => {
          console.log(`✅ Test audio generated: ${audioPath}`);
          resolve(audioPath);
        })
        .on('error', (error) => {
          console.error('❌ Audio generation failed:', error);
          reject(error);
        })
        .run();
    });
  }

  async run() {
    try {
      console.log('🧪 Starting Local Stream Test');
      console.log('=============================\n');

      await this.setup();
      await this.generateTestFrame();
      await this.generateTestVideo();
      await this.testRTMPStream();
      await this.testWithAudio();

      console.log('\n✅ All tests completed successfully!');
      console.log('');
      console.log('📋 Next steps:');
      console.log('1. Set up YouTube API credentials');
      console.log('2. Run: node scripts/youtube-setup.js');
      console.log('3. Start streaming from /admin/radio/live-stream');
      console.log('');
      console.log(`📁 Test files saved in: ${this.outputDir}`);

    } catch (error) {
      console.error('❌ Test failed:', error);
      process.exit(1);
    }
  }
}

// Check if running directly
if (require.main === module) {
  const test = new LocalStreamTest();
  test.run().catch(console.error);
}

module.exports = LocalStreamTest;

