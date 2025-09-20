import { prisma } from '@/lib/prisma';
import { TTSCache } from './ttsCache';

export interface RadioTrack {
  id: string;
  nftId: string;
  name: string;
  artist: string;
  recordLabel: string;
  genre: string;
  previewAudioUrl: string;
  audioUrl?: string;
  sampleStart: number;
  sampleEnd: number;
  ttsAudioUrl?: string;
  totalDuration: number;
  /** Only Gold-tier creator uploads should receive TTS intros */
  isGoldArtist?: boolean;
}

export interface PlaylistConfig {
  maxDuration: number; // in seconds
  includeTTS: boolean;
  voiceId: string;
  shuffleTracks: boolean;
}

export class RadioService {
  private static instance: RadioService;
  private isProcessing = false;

  static getInstance(): RadioService {
    if (!RadioService.instance) {
      RadioService.instance = new RadioService();
    }
    return RadioService.instance;
  }

  /**
   * Clean up old playlists to prevent database bloat
   */
  async cleanupOldPlaylists(): Promise<void> {
    try {
      // Keep only the last 3 playlists, delete older ones
      const playlistsToKeep = await prisma.playlist.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true }
      });

      const keepIds = playlistsToKeep.map(p => p.id);

      // Delete old playlists and their tracks (cascade will handle PlaylistTrack deletion)
      const deletedCount = await prisma.playlist.deleteMany({
        where: {
          id: { notIn: keepIds },
          status: { not: 'active' } // Don't delete currently active playlists
        }
      });

      console.log(`RadioService: Cleaned up ${deletedCount.count} old playlists`);
    } catch (error) {
      console.error('RadioService: Error cleaning up old playlists:', error);
    }
  }

  /**
   * Check if we can reuse an existing playlist instead of creating a new one
   */
  async findReusablePlaylist(maxDuration: number, includeTTS: boolean): Promise<string | null> {
    try {
      // Look for a recent playlist with similar configuration
      const recentPlaylist = await prisma.playlist.findFirst({
        where: {
          totalDuration: { gte: maxDuration * 0.8, lte: maxDuration * 1.2 }, // Within 20% of target duration
          createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) }, // Created within last 6 hours
          status: 'active'
        },
        include: {
          tracks: {
            take: 1,
            select: { ttsAudioUrl: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Check if TTS configuration matches
      if (recentPlaylist) {
        const hasTTS = recentPlaylist.tracks.some(track => track.ttsAudioUrl);
        if (hasTTS === includeTTS) {
          return recentPlaylist.id;
        }
      }

      return null;
    } catch (error) {
      console.error('RadioService: Error finding reusable playlist:', error);
      return null;
    }
  }

  /**
   * Generate a new playlist with available tracks (with cleanup and reuse)
   */
  async generatePlaylist(config: PlaylistConfig): Promise<string> {
    if (this.isProcessing) {
      throw new Error('Radio service is currently processing another request');
    }

    this.isProcessing = true;

    try {
      // First, try to find a reusable playlist
      const reusablePlaylistId = await this.findReusablePlaylist(config.maxDuration, config.includeTTS);
      if (reusablePlaylistId) {
        console.log(`RadioService: Reusing existing playlist: ${reusablePlaylistId}`);
        return reusablePlaylistId;
      }

      // Clean up old playlists before creating new ones
      await this.cleanupOldPlaylists();

      // Get eligible tracks
      const eligibleTracks = await this.getEligibleTracks();
      
      if (eligibleTracks.length === 0) {
        throw new Error('No eligible tracks found for playlist generation');
      }

      // Shuffle tracks if requested
      const tracks = config.shuffleTracks 
        ? this.shuffleArray([...eligibleTracks])
        : eligibleTracks;

      // Create playlist
      const playlist = await prisma.playlist.create({
        data: {
          name: `Auto-generated Playlist ${new Date().toISOString()}`,
          status: 'draft',
          trackCount: 0,
          totalDuration: 0,
        },
      });

      // ...existing code above...

let currentDuration = 0;
const playlistTracks: any[] = [];
let trackCount = 0;
const adInterval = 5; // Ad every 5 tracks after the first ad
const adDuration = 30; // Estimated ad duration

// 1. Insert an ad as the very first track (only if TTS is enabled)
if (config.includeTTS) {
  try {
    console.log('Getting cached TTS ad...');
    const ttsCache = TTSCache.getInstance();
    const firstAdUrl = await ttsCache.getRandomGenericAd(config.voiceId);
    playlistTracks.push({
      playlistId: playlist.id,
      nftId: null,
      position: playlistTracks.length,
      ttsAudioId: null,
      sampleStart: 0,
      sampleEnd: adDuration,
      duration: adDuration,
      isAd: true,
      isIntro: false,
      ttsAudioUrl: firstAdUrl,
    });
    currentDuration += adDuration;
    console.log('First TTS ad retrieved from cache successfully');
  } catch (error) {
    console.error('Failed to get cached TTS ad:', error instanceof Error ? error.message : String(error));
    
    // Check if it's a quota exceeded error
    if (error instanceof Error && error.message.includes('quota_exceeded')) {
      console.log('TTS quota exceeded - continuing without TTS ads. Please add credits to your ElevenLabs account.');
    } else {
      console.log('Continuing without TTS ads due to missing ELEVENLABS_API_KEY or TTS service issues');
    }
    // Continue without the first ad if TTS fails
  }
}

// 2. Now add music tracks, inserting an ad every 5 tracks (only if TTS is enabled)
for (const track of tracks) {
  // (Dynamic track intros disabled to avoid per-play ElevenLabs calls)

  // Add the actual music track
  playlistTracks.push({
    playlistId: playlist.id,
    nftId: track.nftId,
    position: playlistTracks.length,
    ttsAudioId: null,
    sampleStart: 0,
    sampleEnd: track.totalDuration,
    duration: track.totalDuration,
    isAd: false,
    isIntro: false,
    ttsAudioUrl: null,
    trackTitle: track.name,
    // Store the actual track URL if available; fallback to preview
    audioUrl: (track as any).audioUrl || (track as any).previewAudioUrl,
  });
  currentDuration += track.totalDuration;
  trackCount++;

  // Insert TTS ad every 5 tracks (after the first ad) - only if TTS is enabled
  if (config.includeTTS && trackCount % adInterval === 0) {
    try {
      console.log(`Getting cached periodic TTS ad after track ${trackCount}...`);
      const ttsCache = TTSCache.getInstance();
      const ttsAudioUrl = await ttsCache.getRandomGenericAd(config.voiceId);
      playlistTracks.push({
        playlistId: playlist.id,
        nftId: null,
        position: playlistTracks.length,
        ttsAudioId: null,
        sampleStart: 0,
        sampleEnd: adDuration,
        duration: adDuration,
        isAd: true,
        isIntro: false,
        ttsAudioUrl: ttsAudioUrl,
      });
      currentDuration += adDuration;
      console.log(`Periodic TTS ad retrieved from cache successfully after track ${trackCount}`);
    } catch (error) {
      console.error(`Failed to get cached periodic TTS ad after track ${trackCount}:`, error);
      // Continue without the ad if TTS fails
    }
  }

  if (currentDuration >= config.maxDuration) {
    break;
  }
}

      // Create playlist tracks
      await prisma.playlistTrack.createMany({
        data: playlistTracks,
      });

      // Update playlist with final stats
      await prisma.playlist.update({
        where: { id: playlist.id },
        data: {
          trackCount: playlistTracks.length,
          totalDuration: currentDuration,
          status: 'active',
        },
      });

      return playlist.id;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get all eligible tracks for radio play
   */
  async getEligibleTracks(): Promise<RadioTrack[]> {
    const nfts = await prisma.nFT.findMany({
      where: {
        isRadioEligible: true,
        isDeleted: false,
        previewAudioUrl: { not: null },
        user: {
          subscriptionStatus: 'active',
        },
      },
      include: {
        user: {
          select: {
            name: true,
            subscriptionTier: true,
          },
        },
        sideATracks: true,
        sideBTracks: true,
      },
      orderBy: {
        lastRadioPlay: 'asc', // Play least recently played tracks first
      },
    });

    const radioTracks: RadioTrack[] = [];

    for (const nft of nfts) {
      // Get all tracks from both sides
      const allTracks = [...(nft.sideATracks || []), ...(nft.sideBTracks || [])];

      if (allTracks.length === 0) {
        console.log(`No tracks found for NFT: ${nft.name}`);
        continue;
      }

      // Treat tier comparison case-insensitively and guard against null
      const subTier = (nft.user as any).subscriptionTier || '';
      const isGold = subTier.toString().toLowerCase() === 'gold';

      for (const track of allTracks) {
        if (!track.url) continue;

        radioTracks.push({
          id: track.id, // Track itself acts as unique id
          nftId: nft.id,
          name: track.name || nft.name,
          artist: nft.user.name || 'Unknown Artist',
          recordLabel: nft.recordLabel || 'Independent',
          genre: nft.genre || 'Unknown',
          previewAudioUrl: track.url,
          audioUrl: track.url,
          sampleStart: 0,
          sampleEnd: track.duration,
          totalDuration: track.duration,
          isGoldArtist: isGold,
        });
      }

      console.log(`Added ${allTracks.length} radio tracks from NFT: ${nft.name}`);
    }

    console.log(`Total radio tracks prepared: ${radioTracks.length}`);
    return radioTracks;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Update radio play count for a track
   */
  async updatePlayCount(nftId: string): Promise<void> {
    await prisma.nFT.update({
      where: { id: nftId },
      data: {
        radioPlayCount: { increment: 1 },
        lastRadioPlay: new Date(),
      },
    });
  }

  /**
   * Get current active playlist
   */
  async getCurrentPlaylist(): Promise<any> {
    const radioStream = await prisma.radioStream.findFirst({
      where: { status: 'active' },
      include: {
        currentPlaylist: {
          include: {
            tracks: {
              include: {
                nft: {
                  include: {
                    user: {
                      select: { name: true },
                    },
                  },
                },
                ttsAudio: true,
              },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    return radioStream?.currentPlaylist;
  }

  /**
   * Get current track with progress information
   */
  async getCurrentTrack(): Promise<any> {
    try {
      // Use a simpler approach to avoid TypeScript issues
      const radioStream = await prisma.radioStream.findFirst({
        where: { status: 'active' },
        select: {
          id: true,
          currentPlaylistId: true,
          currentTrackIndex: true,
          currentTrackStartTime: true,
          totalListeners: true,
          peakListeners: true,
          totalPlayTime: true,
        },
      });

      if (!radioStream || !radioStream.currentPlaylistId) {
        console.log('No active radio stream found');
        return null;
      }

      // Get playlist tracks
      const tracks = await prisma.playlistTrack.findMany({
        where: { playlistId: radioStream.currentPlaylistId },
        include: {
          nft: {
            include: {
              user: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { position: 'asc' },
      });

      if (!tracks.length) {
        console.log('No tracks found in playlist');
        return null;
      }

      const currentTrackIndex = radioStream.currentTrackIndex || 0;
      const currentTrack = tracks[currentTrackIndex];
      
      if (!currentTrack) {
        console.log('Current track not found at index:', currentTrackIndex);
        return null;
      }

      // Calculate progress
      let progress = 0;
      if (radioStream.currentTrackStartTime) {
        const elapsed = Math.floor((Date.now() - radioStream.currentTrackStartTime.getTime()) / 1000);
        progress = Math.min(elapsed, currentTrack.duration);
      }

      console.log('Current track found:', currentTrack.isAd ? 'Ad track' : `${currentTrack.nft?.name} by ${currentTrack.nft?.user?.name}`);

      return {
        track: currentTrack,
        progress,
        totalDuration: currentTrack.duration,
        isComplete: progress >= currentTrack.duration,
        nextTrack: tracks[currentTrackIndex + 1] || null,
        streamStats: {
          totalListeners: radioStream.totalListeners || 0,
          peakListeners: radioStream.peakListeners || 0,
          totalPlayTime: radioStream.totalPlayTime || 0,
        },
      };
    } catch (error) {
      console.error('Error in getCurrentTrack:', error);
      return null;
    }
  }

  /**
   * Advance to next track
   */
  async advanceToNextTrack(): Promise<boolean> {
    try {
      // Get current radio stream
      const radioStream = await prisma.radioStream.findFirst({
        where: { status: 'active' },
        select: {
          id: true,
          currentPlaylistId: true,
          currentTrackIndex: true,
        },
      });

      if (!radioStream || !radioStream.currentPlaylistId) {
        return false;
      }
      
      // Get playlist tracks
      const tracks = await prisma.playlistTrack.findMany({
        where: { playlistId: radioStream.currentPlaylistId },
        orderBy: { position: 'asc' },
      });

      if (!tracks.length) {
        return false;
      }

      const currentIndex = radioStream.currentTrackIndex || 0;
      const totalTracks = tracks.length;

      // Update play count for current track (only for non-ad tracks)
      const nftId = tracks[currentIndex]?.nftId;
      if (typeof nftId === 'string' && nftId) {
        await this.updatePlayCount(nftId);
      }

      // Check if we should loop back to the beginning
      const nextIndex = (currentIndex + 1) % totalTracks;

      // Update radio stream
      await prisma.radioStream.update({
        where: { id: radioStream.id },
        data: {
          currentTrackIndex: nextIndex,
          currentTrackStartTime: new Date(),
          totalPlayTime: { increment: tracks[currentIndex]?.duration || 0 },
        },
      });

      console.log(`Advanced from track ${currentIndex} to ${nextIndex}`);
      return true;
    } catch (error) {
      console.error('Error advancing track:', error);
      return false;
    }
  }

  /**
   * Go to previous track
   */
  async goToPreviousTrack(): Promise<boolean> {
    try {
      // Get current radio stream
      const radioStream = await prisma.radioStream.findFirst({
        where: { status: 'active' },
        select: {
          id: true,
          currentPlaylistId: true,
          currentTrackIndex: true,
        },
      });

      if (!radioStream || !radioStream.currentPlaylistId) {
        return false;
      }
      
      // Get playlist tracks
      const tracks = await prisma.playlistTrack.findMany({
        where: { playlistId: radioStream.currentPlaylistId },
        orderBy: { position: 'asc' },
      });

      if (!tracks.length) {
        return false;
      }

      const currentIndex = radioStream.currentTrackIndex || 0;
      const totalTracks = tracks.length;

      // Calculate previous index (with wraparound to end if at beginning)
      const previousIndex = currentIndex === 0 ? totalTracks - 1 : currentIndex - 1;

      // Update radio stream
      await prisma.radioStream.update({
        where: { id: radioStream.id },
        data: {
          currentTrackIndex: previousIndex,
          currentTrackStartTime: new Date(),
        },
      });

      console.log(`Went back from track ${currentIndex} to ${previousIndex}`);
      return true;
    } catch (error) {
      console.error('Error going to previous track:', error);
      return false;
    }
  }

  /**
   * Update listener count
   */
  async updateListenerCount(count: number): Promise<void> {
    try {
      const radioStream = await prisma.radioStream.findFirst({
        where: { status: 'active' },
        select: {
          id: true,
          peakListeners: true,
        },
      });

      if (!radioStream) {
        return;
      }

      const newPeak = Math.max(radioStream.peakListeners || 0, count);

      await prisma.radioStream.update({
        where: { id: radioStream.id },
        data: {
          totalListeners: count,
          peakListeners: newPeak,
          lastUpdated: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating listener count:', error);
    }
  }

  /**
   * Check if current track should auto-advance
   */
  async checkAutoAdvance(): Promise<boolean> {
    const currentTrack = await this.getCurrentTrack();
    
    if (!currentTrack || !currentTrack.isComplete) {
      return false;
    }

    // Auto-advance to next track
    return await this.advanceToNextTrack();
  }

  /**
   * Get radio service status
   */
  async getStatus(): Promise<{ isActive: boolean; currentTrack?: any; totalListeners?: number }> {
    try {
      const radioStream = await prisma.radioStream.findFirst({
        where: { status: 'active' },
        select: {
          id: true,
          currentPlaylistId: true,
          currentTrackIndex: true,
          totalListeners: true,
        },
      });

      if (!radioStream) {
        return { isActive: false };
      }

      const currentTrack = await this.getCurrentTrack();
      
      return {
        isActive: true,
        currentTrack: currentTrack?.track || null,
        totalListeners: radioStream.totalListeners || 0,
      };
    } catch (error) {
      console.error('Error getting radio status:', error);
      return { isActive: false };
    }
  }

  /**
   * Trigger playlist regeneration when new content is added
   */
  async onNewContentAdded(): Promise<void> {
    // This will be called when a new NFT is uploaded
    // Regenerate playlist with new content
    const config: PlaylistConfig = {
      maxDuration: 3600, // 1 hour
      includeTTS: true, // Enable TTS for proper radio experience
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Use the default voice ID
      shuffleTracks: true,
    };

    try {
      console.log('Starting playlist regeneration for new content...');
      
      // Get eligible tracks first to verify we have content
      const eligibleTracks = await this.getEligibleTracks();
      console.log(`Found ${eligibleTracks.length} eligible tracks for playlist generation`);
      
      if (eligibleTracks.length === 0) {
        console.log('No eligible tracks found, skipping playlist generation');
        return;
      }

      // Generate new playlist with TTS enabled
      const newPlaylistId = await this.generatePlaylist(config);
      
      // Update current radio stream to use the new playlist
      await prisma.radioStream.updateMany({
        where: { status: 'active' },
        data: { 
          currentPlaylistId: newPlaylistId,
          currentTrackIndex: 0, // Reset to start of new playlist
          currentTrackStartTime: new Date(), // Reset timing
        },
      });

      console.log('Playlist regenerated with new content:', newPlaylistId);
      console.log(`New playlist includes ${eligibleTracks.length} tracks with TTS intros and ads`);
    } catch (error) {
      console.error('Failed to regenerate playlist:', error);
      
      // If TTS generation fails, try without TTS as fallback
      console.log('Trying fallback playlist generation without TTS...');
      try {
        const fallbackConfig: PlaylistConfig = {
          maxDuration: 3600,
          includeTTS: false,
          voiceId: 'default',
          shuffleTracks: true,
        };
        
        const fallbackPlaylistId = await this.generatePlaylist(fallbackConfig);
        
        await prisma.radioStream.updateMany({
          where: { status: 'active' },
          data: { 
            currentPlaylistId: fallbackPlaylistId,
            currentTrackIndex: 0,
            currentTrackStartTime: new Date(),
          },
        });
        
        console.log('Fallback playlist generated successfully:', fallbackPlaylistId);
      } catch (fallbackError) {
        console.error('Fallback playlist generation also failed:', fallbackError);
        throw error; // Re-throw original error
      }
    }
  }

  /**
   * Set a specific track as current
   */
  async setCurrentTrack(trackId: string): Promise<boolean> {
    try {
      // Get current radio stream
      const radioStream = await prisma.radioStream.findFirst({
        where: { status: 'active' },
        select: {
          id: true,
          currentPlaylistId: true,
        },
      });

      if (!radioStream || !radioStream.currentPlaylistId) {
        return false;
      }
      
      // Get playlist tracks
      const tracks = await prisma.playlistTrack.findMany({
        where: { playlistId: radioStream.currentPlaylistId },
        orderBy: { position: 'asc' },
      });

      if (!tracks.length) {
        return false;
      }

      // Find the track index by nftId
      const trackIndex = tracks.findIndex((track: any) => track.nftId === trackId);
      
      if (trackIndex === -1) {
        console.log(`Track with nftId ${trackId} not found in current playlist`);
        return false;
      }

      // Update radio stream to point to this track
      await prisma.radioStream.update({
        where: { id: radioStream.id },
        data: {
          currentTrackIndex: trackIndex,
          currentTrackStartTime: new Date(),
        },
      });

      console.log(`Set current track to index ${trackIndex} (trackId: ${trackId})`);
      return true;
    } catch (error) {
      console.error('Error setting current track:', error);
      return false;
    }
  }

  // Stub: Stop the radio service
  async stop(): Promise<void> {
    // No-op stub
    console.log('RadioService.stop() called (stub)');
  }

  // Stub: Update radio service config
  async updateConfig(config: any): Promise<void> {
    // No-op stub
    console.log('RadioService.updateConfig() called (stub)', config);
  }
}

export const radioService = RadioService.getInstance(); 