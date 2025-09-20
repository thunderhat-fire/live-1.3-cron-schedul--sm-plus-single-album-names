import { prisma } from '@/lib/prisma';
import { radioService, RadioTrack, PlaylistConfig } from './radioService';
import { mixAudioWithTTS } from './audioService';

export interface PlaylistAlgorithm {
  name: string;
  description: string;
  weightFactors: {
    genre: number;
    artist: number;
    popularity: number;
    recency: number;
    diversity: number;
  };
}

export interface PlaylistRotation {
  id: string;
  name: string;
  algorithm: PlaylistAlgorithm;
  schedule: {
    startTime: string; // HH:MM format
    endTime: string;
    days: number[]; // 0-6 (Sunday-Saturday)
  };
  isActive: boolean;
}

export interface ContentCurator {
  id: string;
  name: string;
  preferences: {
    genres: string[];
    artists: string[];
    excludeGenres: string[];
    excludeArtists: string[];
  };
  weight: number; // 0-1, how much influence this curator has
}

// Predefined playlist algorithms
export const PLAYLIST_ALGORITHMS: Record<string, PlaylistAlgorithm> = {
  balanced: {
    name: 'Balanced Mix',
    description: 'Balanced mix of genres and artists',
    weightFactors: {
      genre: 0.3,
      artist: 0.2,
      popularity: 0.2,
      recency: 0.2,
      diversity: 0.1,
    },
  },
  discovery: {
    name: 'Discovery Focus',
    description: 'Focus on new and undiscovered artists',
    weightFactors: {
      genre: 0.2,
      artist: 0.1,
      popularity: 0.1,
      recency: 0.4,
      diversity: 0.2,
    },
  },
  popular: {
    name: 'Popular Hits',
    description: 'Focus on popular and trending tracks',
    weightFactors: {
      genre: 0.2,
      artist: 0.1,
      popularity: 0.5,
      recency: 0.1,
      diversity: 0.1,
    },
  },
  genreSpecific: {
    name: 'Genre Specific',
    description: 'Focus on specific genres',
    weightFactors: {
      genre: 0.6,
      artist: 0.2,
      popularity: 0.1,
      recency: 0.1,
      diversity: 0.0,
    },
  },
};

export class PlaylistManager {
  private static instance: PlaylistManager;

  static getInstance(): PlaylistManager {
    if (!PlaylistManager.instance) {
      PlaylistManager.instance = new PlaylistManager();
    }
    return PlaylistManager.instance;
  }

  /**
   * Clean up old playlists to prevent database bloat
   */
  async cleanupOldPlaylists(): Promise<void> {
    try {
      // Keep only the last 5 playlists, delete older ones
      const playlistsToKeep = await prisma.playlist.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
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

      console.log(`Cleaned up ${deletedCount.count} old playlists`);
    } catch (error) {
      console.error('Error cleaning up old playlists:', error);
    }
  }

  /**
   * Check if we can reuse an existing playlist instead of creating a new one
   */
  async findReusablePlaylist(algorithm: string, maxDuration: number): Promise<string | null> {
    try {
      // Look for a recent playlist with similar configuration
      const recentPlaylist = await prisma.playlist.findFirst({
        where: {
          name: { contains: algorithm },
          totalDuration: { gte: maxDuration * 0.8, lte: maxDuration * 1.2 }, // Within 20% of target duration
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Created within last 24 hours
          status: 'active'
        },
        orderBy: { createdAt: 'desc' }
      });

      return recentPlaylist?.id || null;
    } catch (error) {
      console.error('Error finding reusable playlist:', error);
      return null;
    }
  }

  /**
   * Generate playlist using advanced algorithm with cleanup and reuse
   */
  async generateAdvancedPlaylist(
    config: PlaylistConfig & { algorithm: string; curatorId?: string }
  ): Promise<string> {
    // First, try to find a reusable playlist
    const reusablePlaylistId = await this.findReusablePlaylist(config.algorithm, config.maxDuration);
    if (reusablePlaylistId) {
      console.log(`Reusing existing playlist: ${reusablePlaylistId}`);
      return reusablePlaylistId;
    }

    // Clean up old playlists before creating new ones
    await this.cleanupOldPlaylists();

    const algorithm = PLAYLIST_ALGORITHMS[config.algorithm] || PLAYLIST_ALGORITHMS.balanced;
    
    // Get eligible tracks
    const eligibleTracks = await this.getEligibleTracksWithScores(algorithm, config.curatorId);
    
    if (eligibleTracks.length === 0) {
      throw new Error('No eligible tracks found for playlist generation');
    }

    // Apply algorithm scoring
    const scoredTracks = this.scoreTracks(eligibleTracks, algorithm);
    
    // Sort by score and apply diversity rules
    const selectedTracks = this.selectDiverseTracks(scoredTracks, config.maxDuration);

    // Create playlist
    const playlist = await prisma.playlist.create({
      data: {
        name: `${algorithm.name} Playlist - ${new Date().toLocaleDateString()}`,
        status: 'draft',
        trackCount: 0,
        totalDuration: 0,
      },
    });

    let currentDuration = 0;
    const playlistTracks = [];

    for (const track of selectedTracks) {
      if (currentDuration >= config.maxDuration) {
        break;
      }

      // Generate TTS if enabled
      let ttsAudioId: string | undefined;
      if (config.includeTTS) {
        const ttsText = this.generateTTScript(track);
        const { generateTTS } = await import('./ttsService');
        const ttsAudio = await generateTTS(ttsText, config.voiceId);
        ttsAudioId = ttsAudio.id;
      }

      // Calculate track duration
      const trackDuration = track.totalDuration;
      const ttsDuration = ttsAudioId ? 30 : 0;
      const totalDuration = trackDuration + ttsDuration;

      if (currentDuration + totalDuration <= config.maxDuration) {
        playlistTracks.push({
          playlistId: playlist.id,
          nftId: track.nftId,
          position: playlistTracks.length,
          ttsAudioId,
          sampleStart: 0,
          sampleEnd: trackDuration,
          duration: totalDuration,
        });

        currentDuration += totalDuration;
      }
    }

    // Create playlist tracks in a single batch
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

    console.log(`Created new playlist: ${playlist.id} with ${playlistTracks.length} tracks`);
    return playlist.id;
  }

  /**
   * Get eligible tracks with scoring data
   */
  private async getEligibleTracksWithScores(
    algorithm: PlaylistAlgorithm,
    curatorId?: string
  ): Promise<(RadioTrack & { score: number; popularityScore: number; recencyScore: number; likeCount: number; radioPlayCount: number })[]> {
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
          select: { name: true },
        },
        sideATracks: true,
        sideBTracks: true,
        likes: true,
      },
      orderBy: {
        lastRadioPlay: 'asc',
      },
    });

    return nfts.map((nft: any) => {
      const allTracks = [...(nft.sideATracks || []), ...(nft.sideBTracks || [])];
      const totalDuration = allTracks.reduce((sum, track) => sum + track.duration, 0);
      
      // Calculate popularity score
      const popularityScore = Math.min(nft.likes.length / 10, 1); // Normalize to 0-1
      
      // Calculate recency score (newer tracks get higher scores)
      const daysSinceCreation = (Date.now() - nft.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 1 - (daysSinceCreation / 30)); // Decay over 30 days
      
      return {
        id: nft.id,
        nftId: nft.id,
        name: nft.name,
        artist: nft.user.name || 'Unknown Artist',
        recordLabel: nft.recordLabel || 'Independent',
        genre: nft.genre || 'Unknown',
        previewAudioUrl: nft.previewAudioUrl!,
        sampleStart: 0,
        sampleEnd: totalDuration,
        totalDuration: totalDuration,
        score: 0, // Will be calculated later
        popularityScore,
        recencyScore,
        likeCount: nft.likes.length,
        radioPlayCount: nft.radioPlayCount,
      };
    });
  }

  /**
   * Score tracks based on algorithm weights
   */
  private scoreTracks(
    tracks: (RadioTrack & { score: number; popularityScore: number; recencyScore: number; likeCount: number; radioPlayCount: number })[],
    algorithm: PlaylistAlgorithm
  ): (RadioTrack & { score: number })[] {
    return tracks.map(track => {
      // Genre diversity score (higher for less common genres)
      const genreCount = tracks.filter(t => t.genre === track.genre).length;
      const genreDiversityScore = 1 - (genreCount / tracks.length);
      
      // Artist diversity score
      const artistCount = tracks.filter(t => t.artist === track.artist).length;
      const artistDiversityScore = 1 - (artistCount / tracks.length);
      
      // Calculate weighted score
      const score = 
        algorithm.weightFactors.genre * genreDiversityScore +
        algorithm.weightFactors.artist * artistDiversityScore +
        algorithm.weightFactors.popularity * track.popularityScore +
        algorithm.weightFactors.recency * track.recencyScore +
        algorithm.weightFactors.diversity * (genreDiversityScore + artistDiversityScore) / 2;

      return {
        ...track,
        score,
      };
    });
  }

  /**
   * Select diverse tracks while respecting duration constraints
   */
  private selectDiverseTracks(
    scoredTracks: (RadioTrack & { score: number })[],
    maxDuration: number
  ): RadioTrack[] {
    const sortedTracks = [...scoredTracks].sort((a, b) => b.score - a.score);
    const selected: RadioTrack[] = [];
    const usedGenres = new Set<string>();
    const usedArtists = new Set<string>();
    let currentDuration = 0;

    for (const track of sortedTracks) {
      if (currentDuration >= maxDuration) break;

      // Check diversity constraints
      const genreAlreadyUsed = usedGenres.has(track.genre);
      const artistAlreadyUsed = usedArtists.has(track.artist);
      
      // Allow some repetition but prefer diversity
      const diversityPenalty = (genreAlreadyUsed ? 0.5 : 0) + (artistAlreadyUsed ? 0.3 : 0);
      const adjustedScore = track.score * (1 - diversityPenalty);

      // Only add if score is still high enough
      if (adjustedScore > 0.3) {
        selected.push(track);
        usedGenres.add(track.genre);
        usedArtists.add(track.artist);
        currentDuration += track.totalDuration;
      }
    }

    return selected;
  }

  /**
   * Generate TTS script for a track
   */
  private generateTTScript(track: RadioTrack): string {
    const templates = [
      `Now featuring ${track.name} by ${track.artist}. This incredible ${track.genre} album from ${track.recordLabel} is available for presale now. Get this on VinylFunders and support independent artists!`,
      `Coming up next, ${track.name} from ${track.artist}. This ${track.genre} masterpiece is ready for vinyl pressing. Support the artist and get your copy on VinylFunders today!`,
      `You're listening to ${track.name} by ${track.artist}. This ${track.genre} album from ${track.recordLabel} is available for presale. Visit VinylFunders to secure your vinyl copy now!`,
      `Up next, ${track.name} by ${track.artist}. This ${track.genre} track is part of our vinyl presale collection. Support independent music on VinylFunders!`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Create playlist rotation schedule
   */
  async createPlaylistRotation(rotation: Omit<PlaylistRotation, 'id'>): Promise<string> {
    // This would be implemented with a new database model
    // For now, return a placeholder
    console.log('Creating playlist rotation:', rotation);
    return 'rotation-id';
  }

  /**
   * Get current playlist based on rotation schedule
   */
  async getCurrentPlaylistByRotation(): Promise<any> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // This would check rotation schedules and return appropriate playlist
    // For now, return the current active playlist
    return radioService.getCurrentPlaylist();
  }

  /**
   * Analyze playlist performance
   */
  async analyzePlaylistPerformance(playlistId: string): Promise<{
    totalPlays: number;
    averageListenTime: number;
    skipRate: number;
    popularTracks: string[];
    unpopularTracks: string[];
  }> {
    // This would analyze actual listening data
    // For now, return placeholder data
    return {
      totalPlays: 0,
      averageListenTime: 0,
      skipRate: 0,
      popularTracks: [],
      unpopularTracks: [],
    };
  }

  /**
   * Get playlist manager status
   */
  async getStatus(): Promise<{ isHealthy: boolean; currentPlaylist?: any; totalPlaylists?: number }> {
    try {
      // Check if there's an active playlist
      const activePlaylist = await prisma.playlist.findFirst({
        where: { status: 'active' },
        select: {
          id: true,
          name: true,
          trackCount: true,
          totalDuration: true,
        },
      });

      const totalPlaylists = await prisma.playlist.count();

      return {
        isHealthy: true,
        currentPlaylist: activePlaylist || null,
        totalPlaylists,
      };
    } catch (error) {
      console.error('Error getting playlist manager status:', error);
      return { isHealthy: false };
    }
  }

  /**
   * Auto-optimize playlist based on performance data
   */
  async autoOptimizePlaylist(playlistId: string): Promise<string> {
    // This would analyze performance and regenerate with optimizations
    // For now, just regenerate with balanced algorithm
    return this.generateAdvancedPlaylist({
      maxDuration: 3600,
      includeTTS: true,
      voiceId: 'default',
      shuffleTracks: true,
      algorithm: 'balanced',
    });
  }

  // Stub: Update a specific playlist
  async updatePlaylist(playlistId: string, updates: any): Promise<void> {
    // No-op stub
    console.log('PlaylistManager.updatePlaylist() called (stub)', playlistId, updates);
  }

  // Stub: Update global playlist config
  async updateGlobalConfig(config: any): Promise<void> {
    // No-op stub
    console.log('PlaylistManager.updateGlobalConfig() called (stub)', config);
  }
}

export const playlistManager = PlaylistManager.getInstance(); 