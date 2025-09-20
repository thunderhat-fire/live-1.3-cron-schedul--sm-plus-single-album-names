const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const TTSService = require('./tts-service');

class RadioStreamService {
  constructor() {
    this.prisma = new PrismaClient();
    this.playlist = [];
    this.currentTrackIndex = 0;
    this.isStreaming = false;
    this.ttsService = new TTSService();
    this.currentAudio = null;
    
    // YouTube stream key
    this.streamKey = process.env.YOUTUBE_STREAM_KEY || 'b5pm-5a36-7c3g-tfze-f791';
    this.rtmpUrl = `rtmp://a.rtmp.youtube.com/live2/${this.streamKey}`;
    
    console.log(`📻 Radio Stream URL: ${this.rtmpUrl}`);
    
    // Start monitoring
    this.startMonitoring();
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

    // Start streaming
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
          user: true
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
      // Get all albums with their users
      const albums = await this.prisma.nFT.findMany({
        include: {
          user: true
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
          text: `Now playing ${album.name} by ${album.user.name}`,
          duration: 3000,
          album: album
        });

        // Add album tracks
        if (album.sideATracks && album.sideATracks.length > 0) {
          for (const track of album.sideATracks) {
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

      console.log(`📻 Playlist updated with ${this.playlist.length} items`);
    } catch (error) {
      console.error('Error updating playlist:', error);
    }
  }

  async startStream() {
    try {
      console.log('📻 Starting radio stream...');
      console.log(`📡 Stream URL: ${this.rtmpUrl}`);
      
      this.isStreaming = true;
      console.log('✅ Radio stream started successfully');
      
      // Start playlist playback
      this.startPlaylistPlayback();
      
    } catch (error) {
      console.error('❌ Failed to start stream:', error);
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
      console.log(`🎵 Playing track: ${trackItem.track.name} by ${trackItem.album.user.name}`);
      console.log(`📱 QR Code: ${process.env.NEXT_PUBLIC_APP_URL}/nft/${trackItem.album.id}`);
      
      // For now, just log the track info
      // In a real implementation, you'd stream the actual audio file
      console.log(`🎵 Track audio file: ${trackItem.track.url || 'No audio file'}`);
      
    } catch (error) {
      console.error('Error playing track:', error);
    }
  }

  async playTTS(ttsItem) {
    try {
      console.log(`🗣️  Playing TTS: ${ttsItem.text}`);
      
      // Generate TTS audio with ElevenLabs
      const audioPath = await this.ttsService.generateTTSAudio(ttsItem.text, {
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
        stability: 0.5,
        similarityBoost: 0.75
      });
      
      console.log(`✅ TTS audio generated: ${audioPath}`);
      
      // In a real implementation, you'd stream this audio file
      
    } catch (error) {
      console.error('Error playing TTS:', error);
    }
  }

  async stopStream() {
    try {
      this.isStreaming = false;
      console.log('🛑 Radio stream stopped');
    } catch (error) {
      console.error('Failed to stop stream:', error);
    }
  }

  // Get current playing info for API
  getCurrentTrack() {
    if (this.playlist.length === 0 || this.currentTrackIndex >= this.playlist.length) {
      return null;
    }
    
    const currentItem = this.playlist[this.currentTrackIndex];
    return {
      type: currentItem.type,
      title: currentItem.type === 'track' ? currentItem.track.name : currentItem.text,
      artist: currentItem.type === 'track' ? currentItem.album.user.name : null,
      album: currentItem.type === 'track' ? currentItem.album.name : null,
      nftUrl: currentItem.type === 'track' ? `${process.env.NEXT_PUBLIC_APP_URL}/nft/${currentItem.album.id}` : null
    };
  }

  // Get playlist info for API
  getPlaylist() {
    return this.playlist.map(item => ({
      type: item.type,
      title: item.type === 'track' ? item.track.name : item.text,
      artist: item.type === 'track' ? item.album.user.name : null,
      album: item.type === 'track' ? item.album.name : null,
      duration: item.duration
    }));
  }
}

// Start the service
const service = new RadioStreamService();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down radio streaming service...');
  await service.stopStream();
  await service.prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down radio streaming service...');
  await service.stopStream();
  await service.prisma.$disconnect();
  process.exit(0);
});

module.exports = RadioStreamService; 