/**
 * Admin service for radio system management and analytics
 * Handles system monitoring, performance tracking, and administrative controls
 */

import { prisma } from '@/lib/prisma';
import { radioService } from './radioService';
import { playlistManager } from './playlistManager';
import { liveStreamService } from './liveStreamService';
import { youtubeService } from './youtubeService';

export interface SystemMetrics {
  uptime: number;
  totalTracks: number;
  totalPlaylists: number;
  activeStreams: number;
  totalListeners: number;
  peakListeners: number;
  averageSessionDuration: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
}

export interface RadioAnalytics {
  totalPlays: number;
  uniqueListeners: number;
  averageListenTime: number;
  peakConcurrentListeners: number;
  topGenres: Array<{ genre: string; plays: number; percentage: number }>;
  topArtists: Array<{ artist: string; plays: number; revenue: number }>;
  topTracks: Array<{ track: string; artist: string; plays: number; likes: number }>;
  listenerRetention: number;
  revenueGenerated: number;
  adImpressions: number;
  adRevenue: number;
}

export interface StreamHealth {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
  lastCheck: Date;
  uptime: number;
  errorCount: number;
  warningCount: number;
}

export interface AdminAction {
  id: string;
  type: 'playlist_update' | 'stream_control' | 'system_config' | 'emergency_stop';
  description: string;
  timestamp: Date;
  userId: string;
  userName: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: any;
}

export class AdminService {
  private static instance: AdminService;
  private systemStartTime: Date;
  private adminActions: AdminAction[] = [];
  private healthChecks: StreamHealth[] = [];

  constructor() {
    this.systemStartTime = new Date();
  }

  static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const now = Date.now();
    const uptime = now - this.systemStartTime.getTime();

    // Get database metrics
    const [totalTracks, totalPlaylists, activeStreams] = await Promise.all([
      prisma.track.count({
        where: {
          OR: [
            {
              nftA: {
                isRadioEligible: true,
                isDeleted: false,
              },
            },
            {
              nftB: {
                isRadioEligible: true,
                isDeleted: false,
              },
            },
          ],
        },
      }),
      prisma.playlist.count(),
      this.getActiveStreamCount(),
    ]);

    // Get listener metrics
    const listenerMetrics = await this.getListenerMetrics();

    // Get system performance metrics
    const systemMetrics = await this.getSystemPerformanceMetrics();

    return {
      uptime,
      totalTracks,
      totalPlaylists,
      activeStreams,
      totalListeners: listenerMetrics.totalListeners,
      peakListeners: listenerMetrics.peakListeners,
      averageSessionDuration: listenerMetrics.averageSessionDuration,
      systemLoad: systemMetrics.systemLoad,
      memoryUsage: systemMetrics.memoryUsage,
      diskUsage: systemMetrics.diskUsage,
    };
  }

  /**
   * Get detailed radio analytics
   */
  async getRadioAnalytics(timeRange: '24h' | '7d' | '30d' = '7d'): Promise<RadioAnalytics> {
    const startDate = this.getStartDate(timeRange);

    // Get play statistics
    const playStats = await this.getPlayStatistics(startDate);
    
    // Get listener statistics
    const listenerStats = await this.getListenerStatistics(startDate);
    
    // Get genre and artist analytics
    const genreStats = await this.getGenreAnalytics(startDate);
    const artistStats = await this.getArtistAnalytics(startDate);
    const trackStats = await this.getTrackAnalytics(startDate);
    
    // Get revenue and ad metrics
    const revenueStats = await this.getRevenueAnalytics(startDate);

    return {
      totalPlays: playStats.totalPlays,
      uniqueListeners: listenerStats.uniqueListeners,
      averageListenTime: listenerStats.averageListenTime,
      peakConcurrentListeners: listenerStats.peakConcurrentListeners,
      topGenres: genreStats,
      topArtists: artistStats,
      topTracks: trackStats,
      listenerRetention: listenerStats.retentionRate,
      revenueGenerated: revenueStats.totalRevenue,
      adImpressions: revenueStats.adImpressions,
      adRevenue: revenueStats.adRevenue,
    };
  }

  /**
   * Check system health and performance
   */
  async checkSystemHealth(): Promise<StreamHealth> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let isHealthy = true;

    // Check radio service health
    try {
      const radioStatus = await radioService.getStatus();
      if (!radioStatus.isActive) {
        issues.push('Radio service is not active');
        isHealthy = false;
      }
    } catch (error) {
      issues.push(`Radio service error: ${error}`);
      isHealthy = false;
    }

    // Check playlist manager health
    try {
      const playlistStatus = await playlistManager.getStatus();
      if (!playlistStatus.isHealthy) {
        issues.push('Playlist manager has issues');
        isHealthy = false;
      }
    } catch (error) {
      issues.push(`Playlist manager error: ${error}`);
      isHealthy = false;
    }

    // Check live stream health
    try {
      const streamMetadata = liveStreamService.getMetadata();
      if (streamMetadata.isLive) {
        // Check if stream is healthy
        const streamHealth = await this.checkStreamHealth();
        if (!streamHealth.isHealthy) {
          issues.push(...streamHealth.issues);
          isHealthy = false;
        }
      }
    } catch (error) {
      issues.push(`Live stream error: ${error}`);
      isHealthy = false;
    }

    // Check YouTube integration health
    try {
      const youtubeStream = youtubeService.getCurrentStream();
      if (youtubeStream && youtubeStream.status === 'live') {
        const youtubeHealth = await this.checkYouTubeHealth();
        if (!youtubeHealth.isHealthy) {
          issues.push(...youtubeHealth.issues);
          isHealthy = false;
        }
      }
    } catch (error) {
      issues.push(`YouTube API error: ${error instanceof Error ? error.message : String(error)}`);
      isHealthy = false;
    }

    // Generate recommendations
    if (issues.length === 0) {
      recommendations.push('System is running optimally');
    } else {
      recommendations.push('Review system logs for detailed error information');
      recommendations.push('Consider restarting affected services');
      recommendations.push('Check network connectivity and external service status');
    }

    const health: StreamHealth = {
      isHealthy,
      issues,
      recommendations,
      lastCheck: new Date(),
      uptime: Date.now() - this.systemStartTime.getTime(),
      errorCount: issues.length,
      warningCount: recommendations.length,
    };

    this.healthChecks.push(health);
    
    // Keep only last 100 health checks
    if (this.healthChecks.length > 100) {
      this.healthChecks = this.healthChecks.slice(-100);
    }

    return health;
  }

  /**
   * Perform administrative actions
   */
  async performAdminAction(
    action: Omit<AdminAction, 'id' | 'timestamp' | 'status'>
  ): Promise<AdminAction> {
    const adminAction: AdminAction = {
      ...action,
      id: this.generateId(),
      timestamp: new Date(),
      status: 'pending',
    };

    try {
      switch (action.type) {
        case 'playlist_update':
          await this.updatePlaylist(action.metadata);
          break;
        case 'stream_control':
          await this.controlStream(action.metadata);
          break;
        case 'system_config':
          await this.updateSystemConfig(action.metadata);
          break;
        case 'emergency_stop':
          await this.emergencyStop();
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      adminAction.status = 'completed';
    } catch (error) {
      adminAction.status = 'failed';
      adminAction.metadata = { error: error instanceof Error ? error.message : String(error) };
    }

    this.adminActions.push(adminAction);
    
    // Keep only last 1000 actions
    if (this.adminActions.length > 1000) {
      this.adminActions = this.adminActions.slice(-1000);
    }

    return adminAction;
  }

  /**
   * Get admin action history
   */
  getAdminActions(limit: number = 50): AdminAction[] {
    return this.adminActions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get health check history
   */
  getHealthHistory(limit: number = 50): StreamHealth[] {
    return this.healthChecks
      .sort((a, b) => b.lastCheck.getTime() - a.lastCheck.getTime())
      .slice(0, limit);
  }

  /**
   * Emergency stop all radio services
   */
  private async emergencyStop(): Promise<void> {
    try {
      // Stop live streaming
      await liveStreamService.stopStreaming();
      
      // Stop YouTube stream
      const youtubeStream = youtubeService.getCurrentStream();
      if (youtubeStream) {
        await youtubeService.endLiveStream(youtubeStream.id);
      }
      
      // Stop radio service
      await radioService.stop();
      
      console.log('Emergency stop completed');
    } catch (error) {
      console.error('Emergency stop failed:', error);
      throw error;
    }
  }

  /**
   * Update playlist configuration
   */
  private async updatePlaylist(metadata: any): Promise<void> {
    const { playlistId, updates, regenerateAll } = metadata || {};

    // If explicit flag or no specific playlist/update provided, regenerate all
    if (regenerateAll || (!playlistId && !updates)) {
      console.log('AdminService: Regenerating all playlists on admin request');

      // Build default config – could be extended via updates param
      const config = {
        maxDuration: 3600,
        includeTTS: false,
        voiceId: 'EXAVITQu4vr4xnSDxMaL',
        shuffleTracks: true,
      };

      // Generate playlist via RadioService (will pull all eligible tracks)
      const newPlaylistId = await radioService.generatePlaylist(config);

      // Point any active radio stream to the new playlist

      const activeStream = await prisma.radioStream.findFirst({ where: { status: 'active' } });

      if (activeStream) {
        await prisma.radioStream.update({
          where: { id: activeStream.id },
          data: {
            currentPlaylistId: newPlaylistId,
            currentTrackIndex: 0,
            currentTrackStartTime: new Date(),
          },
        });
      } else {
        // Create a new radio stream row
        await prisma.radioStream.create({
          data: {
            name: `Auto Stream ${new Date().toISOString()}`,
            status: 'active',
            currentPlaylistId: newPlaylistId,
            currentTrackIndex: 0,
            currentTrackStartTime: new Date(),
            totalListeners: 0,
            peakListeners: 0,
            totalPlayTime: 0,
          },
        });
      }

      console.log('AdminService: New playlist generated and activated:', newPlaylistId);
      return;
    }

    // Fallback: update specific playlist/global config
    if (playlistId) {
      await playlistManager.updatePlaylist(playlistId, updates);
    } else {
      await playlistManager.updateGlobalConfig(updates);
    }
  }

  /**
   * Control stream operations
   */
  private async controlStream(metadata: any): Promise<void> {
    const { action, config } = metadata;
    
    switch (action) {
      case 'start':
        await liveStreamService.startStreaming(config);
        break;
      case 'stop':
        await liveStreamService.stopStreaming();
        break;
      case 'pause':
        // Implement pause functionality
        break;
      case 'resume':
        // Implement resume functionality
        break;
      default:
        throw new Error(`Unknown stream action: ${action}`);
    }
  }

  /**
   * Update system configuration
   */
  private async updateSystemConfig(metadata: any): Promise<void> {
    // Update various system configurations
    const { radioConfig, playlistConfig, streamConfig } = metadata;
    
    if (radioConfig) {
      await radioService.updateConfig(radioConfig);
    }
    
    if (playlistConfig) {
      await playlistManager.updateGlobalConfig(playlistConfig);
    }
    
    if (streamConfig) {
      liveStreamService.updateConfig(streamConfig);
    }
  }

  /**
   * Check stream health
   */
  private async checkStreamHealth(): Promise<StreamHealth> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let isHealthy = true;

    const metadata = liveStreamService.getMetadata();
    
    if (metadata.isLive) {
      // Check if current track is valid
      if (!metadata.currentTrack) {
        issues.push('No current track playing');
        isHealthy = false;
      }
      
      // Check listener count
      if (metadata.totalListeners === 0) {
        recommendations.push('No active listeners - consider promotional activities');
      }
      
      // Check uptime
      if (metadata.uptime > 24 * 60 * 60 * 1000) { // 24 hours
        recommendations.push('Stream has been running for over 24 hours - consider restart');
      }
    }

    return {
      isHealthy,
      issues,
      recommendations,
      lastCheck: new Date(),
      uptime: metadata.uptime,
      errorCount: issues.length,
      warningCount: recommendations.length,
    };
  }

  /**
   * Check YouTube integration health
   */
  private async checkYouTubeHealth(): Promise<StreamHealth> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let isHealthy = true;

    try {
      const stream = youtubeService.getCurrentStream();
      if (stream) {
        const status = await youtubeService.getStreamStatus(stream.id);
        if (status && status.status !== 'live') {
          issues.push(`YouTube stream status: ${status.status}`);
          isHealthy = false;
        }
      }
    } catch (error) {
      issues.push(`YouTube API error: ${error instanceof Error ? error.message : String(error)}`);
      isHealthy = false;
    }

    return {
      isHealthy,
      issues,
      recommendations,
      lastCheck: new Date(),
      uptime: 0,
      errorCount: issues.length,
      warningCount: recommendations.length,
    };
  }

  /**
   * Get active stream count
   */
  private async getActiveStreamCount(): Promise<number> {
    const metadata = liveStreamService.getMetadata();
    return metadata.isLive ? 1 : 0;
  }

  /**
   * Get listener metrics
   */
  private async getListenerMetrics(): Promise<{
    totalListeners: number;
    peakListeners: number;
    averageSessionDuration: number;
  }> {
    const metadata = liveStreamService.getMetadata();
    
    return {
      totalListeners: metadata.totalListeners,
      peakListeners: metadata.peakListeners,
      averageSessionDuration: 0, // Would need to track individual sessions
    };
  }

  /**
   * Get system performance metrics
   */
  private async getSystemPerformanceMetrics(): Promise<{
    systemLoad: number;
    memoryUsage: number;
    diskUsage: number;
  }> {
    // This would integrate with system monitoring tools
    // For now, return placeholder values
    return {
      systemLoad: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100,
    };
  }

  /**
   * Get play statistics
   */
  private async getPlayStatistics(startDate: Date): Promise<{ totalPlays: number }> {
    // This would query play history from database
    // For now, return placeholder
    return { totalPlays: Math.floor(Math.random() * 10000) };
  }

  /**
   * Get listener statistics
   */
  private async getListenerStatistics(startDate: Date): Promise<{
    uniqueListeners: number;
    averageListenTime: number;
    peakConcurrentListeners: number;
    retentionRate: number;
  }> {
    // This would query listener analytics from database
    // For now, return placeholder values
    return {
      uniqueListeners: Math.floor(Math.random() * 1000),
      averageListenTime: Math.floor(Math.random() * 3600),
      peakConcurrentListeners: Math.floor(Math.random() * 100),
      retentionRate: Math.random() * 100,
    };
  }

  /**
   * Get genre analytics
   */
  private async getGenreAnalytics(startDate: Date): Promise<Array<{ genre: string; plays: number; percentage: number }>> {
    // This would query genre play statistics from database
    // For now, return placeholder data
    return [
      { genre: 'Rock', plays: 1500, percentage: 30 },
      { genre: 'Electronic', plays: 1200, percentage: 24 },
      { genre: 'Hip Hop', plays: 1000, percentage: 20 },
      { genre: 'Jazz', plays: 800, percentage: 16 },
      { genre: 'Classical', plays: 500, percentage: 10 },
    ];
  }

  /**
   * Get artist analytics
   */
  private async getArtistAnalytics(startDate: Date): Promise<Array<{ artist: string; plays: number; revenue: number }>> {
    // This would query artist play statistics from database
    // For now, return placeholder data
    return [
      { artist: 'Artist A', plays: 500, revenue: 250 },
      { artist: 'Artist B', plays: 400, revenue: 200 },
      { artist: 'Artist C', plays: 300, revenue: 150 },
      { artist: 'Artist D', plays: 250, revenue: 125 },
      { artist: 'Artist E', plays: 200, revenue: 100 },
    ];
  }

  /**
   * Get track analytics
   */
  private async getTrackAnalytics(startDate: Date): Promise<Array<{ track: string; artist: string; plays: number; likes: number }>> {
    // This would query track play statistics from database
    // For now, return placeholder data
    return [
      { track: 'Track 1', artist: 'Artist A', plays: 200, likes: 50 },
      { track: 'Track 2', artist: 'Artist B', plays: 180, likes: 45 },
      { track: 'Track 3', artist: 'Artist C', plays: 160, likes: 40 },
      { track: 'Track 4', artist: 'Artist D', plays: 140, likes: 35 },
      { track: 'Track 5', artist: 'Artist E', plays: 120, likes: 30 },
    ];
  }

  /**
   * Get revenue analytics
   */
  private async getRevenueAnalytics(startDate: Date): Promise<{
    totalRevenue: number;
    adImpressions: number;
    adRevenue: number;
  }> {
    // This would query revenue data from database
    // For now, return placeholder values
    return {
      totalRevenue: Math.random() * 10000,
      adImpressions: Math.floor(Math.random() * 50000),
      adRevenue: Math.random() * 5000,
    };
  }

  /**
   * Get start date for time range
   */
  private getStartDate(timeRange: '24h' | '7d' | '30d'): Date {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const adminService = AdminService.getInstance(); 