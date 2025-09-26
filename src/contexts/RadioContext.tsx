'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { createPlayerTracker } from '@/lib/playerTracking';

interface RadioTrack {
  id: string;
  albumName?: string;
  trackTitle?: string;
  audioUrl?: string;
  name: string;
  artist: string;
  albumArt: string;
  duration: number;
  genre: string;
  recordLabel: string;
  progress?: number;
  isComplete?: boolean;
  isAd?: boolean;
  isIntro?: boolean;
}

interface RadioState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTrack: RadioTrack | null;
  nextTrack: RadioTrack | null;
  isLiked: boolean;
  totalListeners: number;
  peakListeners: number;
  uptime: number;
  isLive: boolean;
  isLoading: boolean;
  progress: number;
  totalDuration: number;
  currentTrackIndex: number;
  playlist: RadioTrack[];
  playlistId: string | null;
}

interface RadioContextType {
  radioState: RadioState;
  togglePlayPause: () => Promise<void>;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  toggleLike: () => Promise<void>;
  shareTrack: () => Promise<void>;
  refreshStatus: (force?: boolean) => Promise<void>;
  advanceToNextTrack: () => Promise<void>;
  goToPreviousTrack: () => Promise<void>;
  enableAutoPlay: () => void;
  setCurrentTrackByIndex: (trackIndex: number) => Promise<void>;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export function RadioProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [radioState, setRadioState] = useState<RadioState>({
    isPlaying: false,
    isMuted: false,
    volume: 0.8,
    currentTrack: null,
    nextTrack: null,
    isLiked: false,
    totalListeners: 0,
    peakListeners: 0,
    uptime: 0,
    isLive: false,
    isLoading: false,
    progress: 0,
    totalDuration: 0,
    currentTrackIndex: 0,
    playlist: [],
    playlistId: null,
  });

  const audioElement = useRef<HTMLAudioElement | null>(null);
  const shouldAutoPlay = useRef(false);
  const isFetchingRef = useRef(false); // Add ref to prevent multiple simultaneous calls
  const lastFetchTime = useRef(0); // Add ref to track last fetch time
  const lastManualTrackChangeTime = useRef(0); // Add ref to track manual track changes
  const trackerRef = useRef<any>(null); // Player analytics tracker
  const currentTrackIdRef = useRef<string | null>(null); // Current track ID for event handlers

  // Initialize audio element
  useEffect(() => {
    console.log('RadioProvider: Initializing...');
    console.log('RadioProvider: Setting up audio element...');
    audioElement.current = new Audio();
    audioElement.current.crossOrigin = 'anonymous';
    audioElement.current.preload = 'metadata';
    
    return () => {
      if (audioElement.current) {
        audioElement.current.pause();
        audioElement.current.src = '';
      }
    };
  }, []);

  // Initialize player tracker when track changes
  useEffect(() => {
    if (radioState.currentTrack?.id && radioState.currentTrack.duration) {
      console.log('🎵 Radio: Initializing tracker for NFT:', radioState.currentTrack.id, 'duration:', radioState.currentTrack.duration);
      trackerRef.current = createPlayerTracker(radioState.currentTrack.id, radioState.currentTrack.duration);
      currentTrackIdRef.current = radioState.currentTrack.id; // Store current track ID
      console.log('🎵 Radio: Tracker initialized successfully');
    } else {
      console.log('🎵 Radio: Not initializing tracker - missing track ID or duration:', {
        id: radioState.currentTrack?.id,
        duration: radioState.currentTrack?.duration
      });
      trackerRef.current = null;
      currentTrackIdRef.current = null;
    }
  }, [radioState.currentTrack?.id, radioState.currentTrack?.duration]);

  // Handle audio element events
  useEffect(() => {
    if (!audioElement.current) return;

    const handlePlay = () => {
      console.log('🎵 Radio: Track started playing');
      setRadioState(prev => ({ ...prev, isPlaying: true }));
      
      // Track play start
      if (trackerRef.current && currentTrackIdRef.current) {
        console.log('🎵 Radio: Tracking play start for NFT:', currentTrackIdRef.current);
        trackerRef.current.trackPlayStart(audioElement.current?.currentTime || 0);
      }
    };
    
    const handlePause = () => {
      console.log('🎵 Radio: Track paused');
      setRadioState(prev => ({ ...prev, isPlaying: false }));
      
      // Track pause
      if (trackerRef.current && currentTrackIdRef.current) {
        console.log('🎵 Radio: Tracking pause for NFT:', currentTrackIdRef.current);
        trackerRef.current.trackPause(audioElement.current?.currentTime || 0);
      }
    };
    const handleTimeUpdate = () => {
      if (audioElement.current && !audioElement.current.paused) {
        const currentTime = audioElement.current.currentTime;
        setRadioState(prev => ({ 
          ...prev, 
          progress: currentTime,
          totalDuration: audioElement.current!.duration || prev.totalDuration
        }));
        
        // Track progress
        if (trackerRef.current && currentTrackIdRef.current) {
          trackerRef.current.trackProgress(currentTime);
        }
      }
    };
    
    const handleEnded = async () => {
      console.log('RadioContext: Track ended, advancing to next track...');
      
      // Track play end
      if (trackerRef.current && currentTrackIdRef.current) {
        console.log('🎵 Radio: Tracking play end for NFT:', currentTrackIdRef.current);
        trackerRef.current.trackPlayEnd(audioElement.current?.currentTime || audioElement.current?.duration || 0);
      }
      
      setRadioState(prev => ({ ...prev, isPlaying: false }));
      shouldAutoPlay.current = true; // Mark that we should auto-play the next track
      // Auto-advance to next track
      try {
        await advanceToNextTrack();
      } catch (error) {
        console.error('Failed to auto-advance track:', error);
      }
    };
    const handleError = async (e: Event) => {
      console.error('Audio error:', e);
      setRadioState(prev => ({ ...prev, isPlaying: false }));

      // Try to recover by advancing to the next track.
      // We wrap it in a small timeout so the browser has time to finish
      // propagating the error event.
      try {
        await new Promise((res) => setTimeout(res, 300));
        await advanceToNextTrack();
      } catch (advanceErr) {
        console.error('Failed to auto-skip after audio error:', advanceErr);
      }
    };

    console.log('🎵 Radio: Setting up audio event listeners');
    audioElement.current.addEventListener('play', handlePlay);
    audioElement.current.addEventListener('pause', handlePause);
    audioElement.current.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.current.addEventListener('ended', handleEnded);
    audioElement.current.addEventListener('error', handleError);

    return () => {
      console.log('🎵 Radio: Cleaning up audio event listeners');
      audioElement.current?.removeEventListener('play', handlePlay);
      audioElement.current?.removeEventListener('pause', handlePause);
      audioElement.current?.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.current?.removeEventListener('ended', handleEnded);
      audioElement.current?.removeEventListener('error', handleError);
    };
  }, []); // Empty dependency array

  // Fetch radio status with debouncing and rate limiting
  const fetchRadioStatus = async (force: boolean = false) => {
    // Prevent multiple simultaneous calls
    if (isFetchingRef.current) {
      console.log('RadioProvider: Skipping fetch - already in progress');
      return;
    }

    // Rate limiting - don't fetch more than once every 2 seconds (unless forced)
    if (!force) {
      const now = Date.now();
      if (now - lastFetchTime.current < 2000) {
        console.log('RadioProvider: Skipping fetch - rate limited');
        return;
      }
    }

    console.log('RadioProvider: fetchRadioStatus called');
    try {
      isFetchingRef.current = true;
      const now = Date.now();
      lastFetchTime.current = now;
      
      setRadioState(prev => ({ ...prev, isLoading: true }));
      
      console.log('RadioProvider: Making API call to /api/radio/status');
      const response = await fetch('/api/radio/status', {
        cache: 'no-store', // Prevent caching in deployment
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      console.log('RadioProvider: API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('RadioProvider: API data received:', data);
        
        // Check if we should preserve the current track and index due to recent manual change
        const now = Date.now();
        const shouldPreserveTrackState = !force && (now - lastManualTrackChangeTime.current < 2000); // Only 2 seconds for better sync
        
        // Filter out ads from the playlist for footer player
        const musicOnlyPlaylist = (data.playlist || []).filter((track: any) => !track.isAd);
        
        // Find current track in music-only playlist if main track is an ad
        let currentTrack = data.currentTrack;
        let nextTrack = data.nextTrack;
        
        if (currentTrack?.isAd) {
          // If current track is an ad, find the next music track
          currentTrack = musicOnlyPlaylist[0] || null;
        }
        
        if (nextTrack?.isAd) {
          // If next track is an ad, find the next music track after current
          const currentIndex = musicOnlyPlaylist.findIndex((t: any) => t.id === currentTrack?.id);
          nextTrack = musicOnlyPlaylist[currentIndex + 1] || musicOnlyPlaylist[0] || null;
        }

        setRadioState(prev => ({
          ...prev,
          isPlaying: data.isActive,
          // Preserve current track and next track if we recently made a manual change
          currentTrack: shouldPreserveTrackState ? prev.currentTrack : currentTrack,
          nextTrack: shouldPreserveTrackState ? prev.nextTrack : nextTrack,
          totalListeners: data.totalListeners || 0,
          peakListeners: data.peakListeners || 0,
          uptime: data.uptime || 0,
          isLive: data.isLive || false,
          progress: shouldPreserveTrackState ? prev.progress : (data.progress || 0),
          totalDuration: data.totalDuration || 0,
          currentTrackIndex: shouldPreserveTrackState ? prev.currentTrackIndex : (data.currentTrackIndex || 0),
          playlist: musicOnlyPlaylist, // Use filtered playlist without ads
          playlistId: data.playlistId || null,
          isLoading: false,
        }));

        // Check if current track is liked
        if (data.currentTrack && session?.user) {
          checkLikeStatus(data.currentTrack.id);
        }
      }
    } catch (error) {
      console.error('RadioProvider: Failed to fetch radio status:', error);
      setRadioState(prev => ({ ...prev, isLoading: false }));
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Check if current track is liked
  const checkLikeStatus = async (trackId: string) => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/radio/like/check?trackId=${trackId}`);
      if (response.ok) {
        const data = await response.json();
        setRadioState(prev => ({ ...prev, isLiked: data.isLiked }));
      }
    } catch (error) {
      console.error('Failed to check like status:', error);
    }
  };

  // Initialize radio on mount with less frequent polling
  useEffect(() => {
    console.log('RadioProvider: useEffect triggered - calling fetchRadioStatus');
    fetchRadioStatus();
    
    // Set up polling for status updates - poll every 30 seconds for better responsiveness
    const interval = setInterval(fetchRadioStatus, 30000); // 30 seconds = 30000 ms
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array to prevent infinite loops

  // Progress update interval - reduce frequency to 500ms
  useEffect(() => {
    if (!audioElement.current || !radioState.isPlaying) return;

    const progressInterval = setInterval(() => {
      if (audioElement.current && !audioElement.current.paused) {
        setRadioState(prev => ({ 
          ...prev, 
          progress: audioElement.current!.currentTime,
          totalDuration: audioElement.current!.duration || prev.totalDuration
        }));
      }
    }, 500); // Update every 500ms instead of 100ms for better performance

    return () => clearInterval(progressInterval);
  }, [radioState.isPlaying]); // Remove audioElement from dependencies

  // Handle session changes separately - add debouncing
  useEffect(() => {
    if (session?.user) {
      // Add a small delay to prevent immediate fetch on session change
      const timeoutId = setTimeout(() => {
        fetchRadioStatus();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [session?.user?.id]); // Use session.user.id instead of session.user to prevent unnecessary re-renders

  // Toggle play/pause
  const togglePlayPause = async () => {
    try {
      if (radioState.isPlaying) {
        // Pause
        if (audioElement.current) {
          audioElement.current.pause();
        }
        setRadioState(prev => ({ ...prev, isPlaying: false }));
        shouldAutoPlay.current = false; // Don't auto-play when manually paused
      } else {
        // Play
        if (!radioState.currentTrack) {
          await fetchRadioStatus();
        }
        
        if (audioElement.current && radioState.currentTrack) {
          try {
            console.log('RadioContext: About to set audio src to /api/radio/audio-stream');
            console.log('RadioContext: Current track:', radioState.currentTrack);
            // Reset progress when starting a new track
            setRadioState(prev => ({ ...prev, progress: 0 }));
            // For normal tracks we hit the audio-stream endpoint which handles NFT previews etc.
            // For ads or intros we already have a direct MP3 URL in the playlist so we can
            // skip an extra redirect and set it directly.
            if (radioState.currentTrack.isAd || radioState.currentTrack.isIntro) {
              audioElement.current.src = radioState.currentTrack.audioUrl || (radioState.currentTrack as any).ttsAudioUrl || '/api/radio/audio-stream';
            } else {
              audioElement.current.src = '/api/radio/audio-stream';
            }
            console.log('RadioContext: Audio src set, about to play');
            audioElement.current.volume = radioState.volume;
            audioElement.current.load(); // Reload audio element to clear previous state
            try { await audioElement.current.play(); } catch {}
            console.log('RadioContext: Audio play successful');
          } catch (playError) {
            console.error('Failed to play audio:', playError);
            // Fallback: try using the track's preview URL directly
            if (radioState.currentTrack.id) {
              try {
                const trackResponse = await fetch(`/api/radio/track/${radioState.currentTrack.id}`);
                if (trackResponse.ok) {
                  const trackData = await trackResponse.json();
                  if (trackData.previewAudioUrl) {
                    audioElement.current!.src = trackData.previewAudioUrl;
                    audioElement.current!.load(); // Reload audio element to clear previous state
                    try { await audioElement.current!.play(); } catch {}
                  }
                }
              } catch (fallbackError) {
                console.error('Fallback audio failed:', fallbackError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to toggle play/pause:', error);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (audioElement.current) {
      audioElement.current.muted = !radioState.isMuted;
    }
    setRadioState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  // Set volume
  const setVolume = (volume: number) => {
    if (audioElement.current) {
      audioElement.current.volume = volume;
    }
    setRadioState(prev => ({ 
      ...prev, 
      volume,
      isMuted: volume === 0 
    }));
  };

  // Toggle like
  const toggleLike = async () => {
    if (!session?.user || !radioState.currentTrack) return;

    try {
      const response = await fetch('/api/radio/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: radioState.currentTrack.id,
          action: radioState.isLiked ? 'unlike' : 'like'
        }),
      });

      if (response.ok) {
        setRadioState(prev => ({ ...prev, isLiked: !prev.isLiked }));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  // Share track
  const shareTrack = async () => {
    if (!radioState.currentTrack) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${radioState.currentTrack.name} by ${radioState.currentTrack.artist}`,
          text: `Listen to ${radioState.currentTrack.name} on VinylFunders Radio!`,
          url: `${window.location.origin}/radio?track=${radioState.currentTrack.id}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareUrl = `${window.location.origin}/radio?track=${radioState.currentTrack.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Share URL copied to clipboard!');
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Share URL copied to clipboard!');
      });
    }
  };

  // Debounced refresh status to prevent excessive API calls
  const refreshStatus = async (force: boolean = false) => {
    // Only apply rate limiting if not forced
    if (!force) {
      const now = Date.now();
      if (now - lastFetchTime.current < 5000) {
        console.log('RadioProvider: Skipping refresh - rate limited');
        return;
      }
    }
    
    await fetchRadioStatus(force);
  };

  // Helper function to update current track from playlist
  const updateCurrentTrackFromPlaylist = (trackIndex: number) => {
    console.log(`🎵 RadioContext: Updating current track to index ${trackIndex}`);
    setRadioState(prev => {
      if (!prev.playlist || trackIndex < 0 || trackIndex >= prev.playlist.length) {
        console.log(`🎵 RadioContext: Invalid track index ${trackIndex}, playlist length: ${prev.playlist?.length || 0}`);
        return prev;
      }
      
      const currentTrack = prev.playlist[trackIndex];
      const nextTrack = trackIndex + 1 < prev.playlist.length ? prev.playlist[trackIndex + 1] : prev.playlist[0];
      
      console.log(`🎵 RadioContext: Setting current track:`, currentTrack);
      console.log(`🎵 RadioContext: Setting next track:`, nextTrack);
      
      return {
        ...prev,
        currentTrack,
        nextTrack,
        currentTrackIndex: trackIndex,
        progress: 0, // Reset progress for new track
      };
    });
  };

  // Advance to next track
  const advanceToNextTrack = async () => {
    try {
      console.log('🎵 ADVANCE: Starting track advance...');
      console.log('🎵 ADVANCE Current state:', {
        currentTrackIndex: radioState.currentTrackIndex,
        playlistLength: radioState.playlist.length,
        hasPlaylist: radioState.playlist.length > 0,
        playlist: radioState.playlist.slice(0, 3).map(t => ({ id: t.id, name: t.name }))
      });
      
      shouldAutoPlay.current = true; // Set to true for manual track changes
      
      // Record the timestamp of this manual track change
      lastManualTrackChangeTime.current = Date.now();
      
      // If we have a local playlist, navigate locally for immediate UI update
      if (radioState.playlist && radioState.playlist.length > 0) {
        const nextIndex = (radioState.currentTrackIndex + 1) % radioState.playlist.length;
        console.log(`🎵 Local navigation: Moving from index ${radioState.currentTrackIndex} to ${nextIndex}`);
        
        updateCurrentTrackFromPlaylist(nextIndex);
        
        // Update the audio source immediately
        setTimeout(() => {
          setRadioState(currentState => {
            const track = currentState.currentTrack;
            if (!audioElement.current || !track) return currentState;

            const directUrl = track.audioUrl;
            if (directUrl) {
              audioElement.current!.src = directUrl;
            } else {
              audioElement.current!.src = '/api/radio/audio-stream';
            }

            audioElement.current!.load();
            if (shouldAutoPlay.current) {
              audioElement.current!.play().catch(console.error);
            }
            
            return currentState;
          });
        }, 50);
        
        // Update backend in the background
        fetch('/api/radio/advance', {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        }).catch(error => {
          console.error('Background advance API call failed:', error);
        });
      } else {
        // Fallback to API-driven navigation if no local playlist
        console.log('🎵 No local playlist, using API navigation');
        const response = await fetch('/api/radio/advance', {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });

        if (response.ok) {
          console.log('RadioContext: Advance successful, refreshing status');
          await fetchRadioStatus(true);
        }
      }
    } catch (error) {
      console.error('RadioContext: Error advancing track:', error);
      await fetchRadioStatus(true);
    }
  };

  // Go to previous track
  const goToPreviousTrack = async () => {
    try {
      console.log('🎵 PREVIOUS: Starting track previous...');
      console.log('🎵 PREVIOUS Current state:', {
        currentTrackIndex: radioState.currentTrackIndex,
        playlistLength: radioState.playlist.length,
        hasPlaylist: radioState.playlist.length > 0,
        playlist: radioState.playlist.slice(0, 3).map(t => ({ id: t.id, name: t.name }))
      });
      
      shouldAutoPlay.current = true; // Set to true for manual track changes
      
      // Record the timestamp of this manual track change
      lastManualTrackChangeTime.current = Date.now();
      
      // If we have a local playlist, navigate locally for immediate UI update
      if (radioState.playlist && radioState.playlist.length > 0) {
        const prevIndex = radioState.currentTrackIndex === 0 
          ? radioState.playlist.length - 1 
          : radioState.currentTrackIndex - 1;
        console.log(`🎵 Local navigation: Moving from index ${radioState.currentTrackIndex} to ${prevIndex}`);
        
        updateCurrentTrackFromPlaylist(prevIndex);
        
        // Update the audio source immediately
        setTimeout(() => {
          setRadioState(currentState => {
            const track = currentState.currentTrack;
            if (!audioElement.current || !track) return currentState;

            const directUrl = track.audioUrl;
            if (directUrl) {
              audioElement.current!.src = directUrl;
            } else {
              audioElement.current!.src = '/api/radio/audio-stream';
            }

            audioElement.current!.load();
            if (shouldAutoPlay.current) {
              audioElement.current!.play().catch(console.error);
            }
            
            return currentState;
          });
        }, 50);
        
        // Update backend in the background
        fetch('/api/radio/previous', {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        }).catch(error => {
          console.error('Background previous API call failed:', error);
        });
      } else {
        // Fallback to API-driven navigation if no local playlist
        console.log('🎵 No local playlist, using API navigation');
        const response = await fetch('/api/radio/previous', {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });

        if (response.ok) {
          console.log('RadioContext: Previous track successful, refreshing status');
          await fetchRadioStatus(true);
          if (audioElement.current) {
            audioElement.current.src = '/api/radio/audio-stream';
            audioElement.current.load();
            try { await audioElement.current.play(); } catch {}
          }
        }
      }
    } catch (error) {
      console.error('RadioContext: Error going to previous track:', error);
      await fetchRadioStatus(true);
    }
  };

  const contextValue: RadioContextType = {
    radioState,
    togglePlayPause,
    toggleMute,
    setVolume,
    toggleLike,
    shareTrack,
    refreshStatus,
    advanceToNextTrack,
    goToPreviousTrack,
    enableAutoPlay: () => {
      shouldAutoPlay.current = true;
    },
    setCurrentTrackByIndex: async (trackIndex: number) => {
      // Record the timestamp of this manual track change
      lastManualTrackChangeTime.current = Date.now();
      console.log(`🎵 Manual track change to index ${trackIndex}`);
      
      // Update local state immediately
      updateCurrentTrackFromPlaylist(trackIndex);
      
      // Get the track for API call
      const track = radioState.playlist[trackIndex];
      if (track?.id) {
        try {
          // Make API call to sync backend
          console.log(`🔄 Syncing track ${track.id} with backend`);
          const response = await fetch('/api/radio/set-track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              trackId: track.id
            }),
          });
          
          if (response.ok) {
            console.log(`✅ Backend synced for track ${track.id}`);
          } else {
            console.log(`⚠️ Backend sync failed for track ${track.id}`);
          }
        } catch (error) {
          console.error('Backend sync error:', error);
        }
      }
      
      // Update audio element to match the new track
      setTimeout(() => {
        setRadioState(prev => {
          const track = prev.currentTrack;
          if (!audioElement.current || !track) return prev;

          // Check if track has a direct audio URL (for ads/intros) or use the stream
          const directUrl = track.audioUrl;
          if (directUrl && !track.isAd) {
            // Only use direct URL for non-ad tracks
            audioElement.current.src = directUrl;
          } else {
            audioElement.current.src = '/api/radio/audio-stream';
          }

          audioElement.current.load();
          
          // Auto-play if we're in an active session
          if (shouldAutoPlay.current || prev.isPlaying) {
            audioElement.current.play().catch(console.error);
          }
          
          return prev;
        });
      }, 50); // Small delay to ensure state is updated
    },
  };

  return (
    <RadioContext.Provider value={contextValue}>
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
} 