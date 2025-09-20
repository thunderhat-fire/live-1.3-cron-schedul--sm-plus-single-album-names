const { google } = require('googleapis');
const ffmpeg = require('fluent-ffmpeg');
const { createCanvas, loadImage } = require('canvas');
const QRCode = require('qrcode');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const TTSService = require('./tts-service');

class YouTubeStreamService {
  constructor() {
    this.prisma = new PrismaClient();
    this.youtube = null;
    this.currentStream = null;
    this.playlist = [];
    this.currentTrackIndex = 0;
    this.isStreaming = false;
    this.ttsService = new TTSService();
    
    // YouTube API setup
    this.setupYouTubeAPI();
    
    // Start monitoring
    this.startMonitoring();
  }

  async setupYouTubeAPI() {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || './youtube-credentials.json',
        scopes: [
          'https://www.googleapis.com/auth/youtube.force-ssl',
          'https://www.googleapis.com/auth/youtube'
        ]
      });

      this.youtube = google.youtube({ version: 'v3', auth });
      console.log('YouTube API initialized successfully');
    } catch (error) {
      console.error('Failed to setup YouTube API:', error);
    }
  }

  async startMonitoring() {
    // Check for new albums every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.checkForNewAlbums();
    });

    // Update playlist every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      await this.updatePlaylist();
    });

    // Start streaming if not already streaming
    if (!this.isStreaming) {
      await this.startStream();
    }
  }

  async checkForNewAlbums() {
    try {
      const newAlbums = await this.prisma.nFT.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        },
        include: {
          artist: true
        }
      });

      if (newAlbums.length > 0) {
        console.log(`Found ${newAlbums.length} new albums, updating playlist...`);
        await this.updatePlaylist();
      }
    } catch (error) {
      console.error('Error checking for new albums:', error);
    }
  }

  async updatePlaylist() {
    try {
      // Get all albums with their artists
      const albums = await this.prisma.nFT.findMany({
        include: {
          artist: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      this.playlist = [];
      
      // Add TTS intro
      this.playlist.push({
        type: 'tts',
        text: 'Welcome to VinylFunders Radio. Discover amazing new music from independent artists.',
        duration: 5000
      });

      // Add albums to playlist
      for (const album of albums) {
        // Add album intro
        this.playlist.push({
          type: 'tts',
          text: `Now playing ${album.title} by ${album.artist.name}`,
          duration: 3000,
          album: album
        });

        // Add album tracks
        if (album.tracks && album.tracks.length > 0) {
          for (const track of album.tracks) {
            this.playlist.push({
              type: 'track',
              track: track,
              album: album,
              duration: track.duration || 180000 // Default 3 minutes
            });
          }
        }

        // Add TTS ad every 3 albums
        if (this.playlist.length % 3 === 0) {
          this.playlist.push({
            type: 'tts',
            text: 'Support independent artists by purchasing their music on VinylFunders. Visit our website to discover more.',
            duration: 4000
          });
        }
      }

      console.log(`Playlist updated with ${this.playlist.length} items`);
    } catch (error) {
      console.error('Error updating playlist:', error);
    }
  }

  async startStream() {
    try {
      console.log('Starting YouTube stream...');
      
      // Create live broadcast
      const broadcast = await this.createLiveBroadcast();
      
      // Start streaming
      await this.startVideoStream(broadcast);
      
      this.isStreaming = true;
      console.log('YouTube stream started successfully');
      
      // Start playlist playback
      this.startPlaylistPlayback();
      
    } catch (error) {
      console.error('Failed to start stream:', error);
    }
  }

  async createLiveBroadcast() {
    try {
      const response = await this.youtube.liveBroadcasts.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: 'VinylFunders Radio - Independent Music Discovery',
            description: 'Live streaming of independent music from VinylFunders artists. Discover new music and support independent artists.',
            scheduledStartTime: new Date().toISOString(),
            tags: ['independent music', 'vinyl', 'new artists', 'music discovery']
          },
          status: {
            privacyStatus: 'public'
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to create live broadcast:', error);
      throw error;
    }
  }

  async startVideoStream(broadcast) {
    try {
      // Create video stream
      const streamResponse = await this.youtube.liveStreams.insert({
        part: ['snippet', 'cdn'],
        requestBody: {
          snippet: {
            title: 'VinylFunders Radio Stream'
          },
          cdn: {
            frameRate: '30fps',
            resolution: '1080p',
            ingestionType: 'rtmp'
          }
        }
      });

      const stream = streamResponse.data;
      
      // Bind stream to broadcast
      await this.youtube.liveBroadcasts.bind({
        id: broadcast.id,
        streamId: stream.id
      });

      // Start broadcast
      await this.youtube.liveBroadcasts.transition({
        id: broadcast.id,
        part: 'id',
        broadcastStatus: 'testing'
      });

      this.currentStream = {
        broadcast: broadcast,
        stream: stream,
        rtmpUrl: stream.cdn.ingestionInfo.ingestionAddress
      };

      console.log('Video stream created and bound to broadcast');
    } catch (error) {
      console.error('Failed to start video stream:', error);
      throw error;
    }
  }

  async startPlaylistPlayback() {
    if (this.playlist.length === 0) {
      await this.updatePlaylist();
    }

    this.playNextTrack();
  }

  async playNextTrack() {
    if (this.currentTrackIndex >= this.playlist.length) {
      this.currentTrackIndex = 0; // Loop playlist
    }

    const currentItem = this.playlist[this.currentTrackIndex];
    
    if (currentItem.type === 'track') {
      await this.playTrack(currentItem);
    } else if (currentItem.type === 'tts') {
      await this.playTTS(currentItem);
    }

    this.currentTrackIndex++;
    
    // Schedule next track
    setTimeout(() => {
      this.playNextTrack();
    }, currentItem.duration);
  }

  async playTrack(trackItem) {
    try {
      // Generate video with album art and QR code
      const videoPath = await this.generateTrackVideo(trackItem);
      
      // Stream video to YouTube
      await this.streamVideoToYouTube(videoPath);
      
      console.log(`Playing track: ${trackItem.track.title}`);
    } catch (error) {
      console.error('Error playing track:', error);
    }
  }

  async playTTS(ttsItem) {
    try {
      // Generate TTS audio with ElevenLabs
      const audioPath = await this.ttsService.generateTTSAudio(ttsItem.text, {
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
        stability: 0.5,
        similarityBoost: 0.75
      });
      
      // Get actual audio duration
      const audioDuration = await this.ttsService.getAudioDuration(audioPath);
      
      // Generate video with TTS and background
      const videoPath = await this.generateTTSVideo(ttsItem, audioPath);
      
      // Stream video with audio to YouTube
      await this.streamVideoWithAudioToYouTube(videoPath, audioPath, audioDuration);
      
      console.log(`Playing TTS: ${ttsItem.text}`);
    } catch (error) {
      console.error('Error playing TTS:', error);
    }
  }

  async generateTrackVideo(trackItem) {
    const canvas = createCanvas(1920, 1080);
    const ctx = canvas.getContext('2d');

    // Load album art
    const albumArt = await loadImage(trackItem.album.imageUrl);
    
    // Draw background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 1920, 1080);
    
    // Draw album art
    ctx.drawImage(albumArt, 100, 100, 800, 800);
    
    // Draw track info
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(trackItem.track.title, 950, 200);
    
    ctx.font = '36px Arial';
    ctx.fillText(trackItem.album.artist.name, 950, 260);
    ctx.fillText(trackItem.album.title, 950, 300);
    
    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(
      `${process.env.NEXT_PUBLIC_APP_URL}/nft/${trackItem.album.id}`
    );
    const qrCode = await loadImage(qrCodeDataUrl);
    ctx.drawImage(qrCode, 1600, 100, 300, 300);
    
    // Save video frame
    const framePath = `/tmp/track-frame-${Date.now()}.png`;
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(framePath, buffer);
    
    return framePath;
  }

  async generateTTSVideo(ttsItem, audioPath) {
    const canvas = createCanvas(1920, 1080);
    const ctx = canvas.getContext('2d');

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1920, 1080);
    
    // Add VinylFunders logo/branding
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VinylFunders Radio', 960, 100);
    
    // Draw text with better styling
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    
    // Split text into multiple lines if too long
    const words = ttsItem.text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > 1600) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    
    // Draw each line
    const lineHeight = 60;
    const startY = 540 - (lines.length - 1) * lineHeight / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, 960, startY + index * lineHeight);
    });
    
    // Save video frame
    const framePath = `/tmp/tts-frame-${Date.now()}.png`;
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(framePath, buffer);
    
    return framePath;
  }

  async generateTTSAudio(text) {
    // This would integrate with your TTS service
    // For now, return a placeholder
    return '/tmp/tts-audio.mp3';
  }

  async streamVideoWithAudioToYouTube(videoPath, audioPath, duration) {
    if (!this.currentStream) {
      throw new Error('No active stream');
    }

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .inputOptions(['-loop 1'])
        .input(audioPath)
        .outputOptions([
          '-c:v libx264',
          '-preset ultrafast',
          '-tune stillimage',
          '-c:a aac',
          '-b:a 128k',
          '-pix_fmt yuv420p',
          '-shortest',
          '-t', Math.ceil(duration / 1000) // Duration in seconds
        ])
        .output(this.currentStream.rtmpUrl)
        .on('end', () => {
          console.log('Video with audio streamed successfully');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });
  }

  async streamVideoToYouTube(videoPath) {
    if (!this.currentStream) {
      throw new Error('No active stream');
    }

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .inputOptions(['-loop 1', '-framerate 1'])
        .outputOptions([
          '-c:v libx264',
          '-preset ultrafast',
          '-tune stillimage',
          '-c:a aac',
          '-b:a 128k',
          '-pix_fmt yuv420p',
          '-shortest'
        ])
        .output(this.currentStream.rtmpUrl)
        .on('end', () => {
          console.log('Video streamed successfully');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });
  }

  async stopStream() {
    try {
      if (this.currentStream) {
        await this.youtube.liveBroadcasts.transition({
          id: this.currentStream.broadcast.id,
          part: 'id',
          broadcastStatus: 'complete'
        });
        
        this.isStreaming = false;
        this.currentStream = null;
        console.log('YouTube stream stopped');
      }
    } catch (error) {
      console.error('Failed to stop stream:', error);
    }
  }
}

// Start the service
const service = new YouTubeStreamService();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down YouTube streaming service...');
  await service.stopStream();
  await service.prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down YouTube streaming service...');
  await service.stopStream();
  await service.prisma.$disconnect();
  process.exit(0);
});

module.exports = YouTubeStreamService; 