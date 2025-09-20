// Player tracking utility for analytics
import { v4 as uuidv4 } from 'uuid';

export type PlayerEventType = 'play_start' | 'play_pause' | 'play_resume' | 'play_end' | 'skip' | 'progress';

interface PlayerTrackingConfig {
  nftId: string;
  trackDuration: number;
  progressInterval?: number; // How often to send progress events (seconds)
}

export class PlayerTracker {
  private nftId: string;
  private trackDuration: number;
  private sessionId: string;
  private progressInterval: number;
  private lastProgressTime: number = 0;
  private isTracking: boolean = false;

  constructor(config: PlayerTrackingConfig) {
    this.nftId = config.nftId;
    this.trackDuration = config.trackDuration;
    this.progressInterval = config.progressInterval || 10; // Default: every 10 seconds
    this.sessionId = uuidv4(); // Unique session ID
  }

  // Track when playback starts
  async trackPlayStart(position: number = 0) {
    this.isTracking = true;
    await this.sendEvent('play_start', position);
  }

  // Track when playback pauses
  async trackPause(position: number) {
    if (!this.isTracking) return;
    await this.sendEvent('play_pause', position);
  }

  // Track when playback resumes
  async trackResume(position: number) {
    if (!this.isTracking) return;
    await this.sendEvent('play_resume', position);
  }

  // Track when playback ends naturally
  async trackPlayEnd(position: number) {
    if (!this.isTracking) return;
    this.isTracking = false;
    await this.sendEvent('play_end', position);
  }

  // Track when user skips the track
  async trackSkip(position: number) {
    if (!this.isTracking) return;
    this.isTracking = false;
    await this.sendEvent('skip', position);
  }

  // Track progress during playback (call this regularly)
  async trackProgress(position: number) {
    if (!this.isTracking) return;
    
    // Only send progress events at specified intervals
    if (position - this.lastProgressTime >= this.progressInterval) {
      this.lastProgressTime = position;
      await this.sendEvent('progress', position);
    }
  }

  // Send event to the API
  private async sendEvent(eventType: PlayerEventType, position: number) {
    try {
      console.log('🎵 Sending player event:', {
        eventType,
        position,
        nftId: this.nftId,
        trackDuration: this.trackDuration,
        sessionId: this.sessionId
      });

      const response = await fetch('/api/player-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nftId: this.nftId,
          eventType,
          playPosition: Math.floor(position),
          trackDuration: this.trackDuration,
          sessionId: this.sessionId,
        }),
      });

      console.log('🎵 Player event response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🎵 Player event success:', result);
      } else {
        const error = await response.text();
        console.warn('🎵 Failed to track player event:', eventType, 'Error:', error);
      }
    } catch (error) {
      // Silently fail - don't disrupt user experience
      console.warn('🎵 Player tracking error:', error);
    }
  }

  // Get session ID for debugging
  getSessionId(): string {
    return this.sessionId;
  }

  // Stop tracking (cleanup)
  stopTracking() {
    this.isTracking = false;
  }
}

// Utility function to create a tracker instance
export function createPlayerTracker(nftId: string, trackDuration: number): PlayerTracker {
  return new PlayerTracker({
    nftId,
    trackDuration,
    progressInterval: 10, // Track progress every 10 seconds
  });
}

// React hook for player tracking (optional)
export function usePlayerTracking(nftId: string, trackDuration: number) {
  const tracker = new PlayerTracker({
    nftId,
    trackDuration,
  });

  return {
    trackPlayStart: (position: number = 0) => tracker.trackPlayStart(position),
    trackPause: (position: number) => tracker.trackPause(position),
    trackResume: (position: number) => tracker.trackResume(position),
    trackPlayEnd: (position: number) => tracker.trackPlayEnd(position),
    trackSkip: (position: number) => tracker.trackSkip(position),
    trackProgress: (position: number) => tracker.trackProgress(position),
    sessionId: tracker.getSessionId(),
    stopTracking: () => tracker.stopTracking(),
  };
} 