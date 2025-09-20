"use client";

import { createGlobalState } from "react-hooks-global-state";

const initialState: {
  playing: boolean;
  volume: number;
  muted: boolean;
  played: number;
  playedSeconds: number;
  loaded: number;
  duration: number;
  loadedSeconds: number;
  playbackRate: number;
  url: string;
  trackName: string;
  imageUrl: string;
  nftId: string;
  playlist: any[];
  currentTrackIndex: number;
} = {
  playing: false,
  volume: 0.8,
  muted: false,
  played: 0,
  playedSeconds: 0,
  loaded: 0,
  duration: 0,
  loadedSeconds: 0,
  playbackRate: 1.0,
  url: "",
  trackName: "",
  imageUrl: "",
  nftId: "",
  playlist: [],
  currentTrackIndex: 0,
};

const { useGlobalState } = createGlobalState(initialState);

export const useMusicPlayer = () => {
  const [playbackRate, setplaybackRate] = useGlobalState("playbackRate");
  const [duration, setDuration] = useGlobalState("duration");
  const [loaded, setLoaded] = useGlobalState("loaded");
  const [played, setPlayed] = useGlobalState("played");
  const [muted, setMuted] = useGlobalState("muted");
  const [volume, setVolume] = useGlobalState("volume");
  const [playing, setPlaying] = useGlobalState("playing");
  const [url, setUrl] = useGlobalState("url");
  const [loadedSeconds, setLoadedSeconds] = useGlobalState("loadedSeconds");
  const [playedSeconds, setPlayedSeconds] = useGlobalState("playedSeconds");
  const [trackName, setTrackName] = useGlobalState("trackName");
  const [imageUrl, setImageUrl] = useGlobalState("imageUrl");
  const [nftId, setNftId] = useGlobalState("nftId");
  const [playlist, setPlaylist] = useGlobalState("playlist");
  const [currentTrackIndex, setCurrentTrackIndex] = useGlobalState("currentTrackIndex");

  // Helper function to switch tracks with all state updates at once
  const switchToTrack = (trackIndex: number, trackData: any) => {
    if (!trackData || !trackData.previewAudioUrl || !trackData.name) {
      console.error('🎵 switchToTrack: Invalid track data', trackData);
      return false;
    }

    console.log('🎵 switchToTrack: Switching to track:', trackData.name, 'at index:', trackIndex);
    console.log('🎵 switchToTrack: Environment:', process.env.NODE_ENV);
    console.log('🎵 switchToTrack: User Agent:', typeof window !== 'undefined' ? navigator.userAgent : 'SSR');
    
    try {
      // Calculate all values first
      const imageUrl = trackData.nft?.sideAImage || trackData.nft?.imageUrl || '/images/default-track-image.jpg';
      const nftId = trackData.nft?.id || trackData.nftId || '';
      
      console.log('🎵 switchToTrack: Values calculated:', {
        trackIndex,
        url: trackData.previewAudioUrl,
        trackName: trackData.name,
        imageUrl,
        nftId
      });
      
      // In production, add small delays between state updates to prevent batching issues
      if (process.env.NODE_ENV === 'production') {
        console.log('🎵 switchToTrack: Production mode - using sequential updates');
        
        // Update index first
        setCurrentTrackIndex(trackIndex);
        
        // Wait a tick then update media info
        setTimeout(() => {
          setUrl(trackData.previewAudioUrl);
          setTrackName(trackData.name);
          setImageUrl(imageUrl);
          setNftId(nftId);
          
          // Wait another tick then reset player state
          setTimeout(() => {
            setPlayed(0);
            setPlayedSeconds(0);
            setLoaded(0);
            setLoadedSeconds(0);
            setPlaying(true);
            
            console.log('🎵 switchToTrack: Production sequential update completed');
          }, 0);
        }, 0);
      } else {
        console.log('🎵 switchToTrack: Development mode - using batch updates');
        
        // Update all states in sequence (development)
        setCurrentTrackIndex(trackIndex);
        setUrl(trackData.previewAudioUrl);
        setTrackName(trackData.name);
        setImageUrl(imageUrl);
        setNftId(nftId);
        
        // Reset player state
        setPlayed(0);
        setPlayedSeconds(0);
        setLoaded(0);
        setLoadedSeconds(0);
        setPlaying(true);
      }
      
      console.log('🎵 switchToTrack: Successfully initiated switch to:', trackData.name);
      return true;
    } catch (error) {
      console.error('🎵 switchToTrack: Error switching track:', error);
      return false;
    }
  };

  // Navigation functions
  const playNextTrack = () => {
    console.log('🎵 playNextTrack called - playlist length:', playlist.length, 'currentIndex:', currentTrackIndex);
    
    if (!playlist || playlist.length === 0) {
      console.log('🎵 playNextTrack: No playlist available');
      return;
    }
    
    // Ensure currentTrackIndex is a valid number
    const safeCurrentIndex = typeof currentTrackIndex === 'number' ? currentTrackIndex : 0;
    const nextIndex = (safeCurrentIndex + 1) % playlist.length;
    const nextTrack = playlist[nextIndex];
    
    console.log('🎵 playNextTrack: Moving from index', safeCurrentIndex, 'to', nextIndex);
    console.log('🎵 playNextTrack: Next track data:', {
      hasTrack: !!nextTrack,
      name: nextTrack?.name,
      hasPreviewUrl: !!nextTrack?.previewAudioUrl,
      hasNft: !!nextTrack?.nft,
      nftId: nextTrack?.nft?.id || nextTrack?.nftId
    });
    
    // Use helper function for consistent state updates
    const success = switchToTrack(nextIndex, nextTrack);
    if (!success) {
      console.error('🎵 playNextTrack: Failed to switch to next track');
    }
  };

  const playPreviousTrack = () => {
    console.log('🎵 playPreviousTrack called - playlist length:', playlist.length, 'currentIndex:', currentTrackIndex);
    
    if (!playlist || playlist.length === 0) {
      console.log('🎵 playPreviousTrack: No playlist available');
      return;
    }
    
    // Ensure currentTrackIndex is a valid number
    const safeCurrentIndex = typeof currentTrackIndex === 'number' ? currentTrackIndex : 0;
    const prevIndex = safeCurrentIndex === 0 ? playlist.length - 1 : safeCurrentIndex - 1;
    const prevTrack = playlist[prevIndex];
    
    console.log('🎵 playPreviousTrack: Moving from index', safeCurrentIndex, 'to', prevIndex);
    console.log('🎵 playPreviousTrack: Previous track data:', {
      hasTrack: !!prevTrack,
      name: prevTrack?.name,
      hasPreviewUrl: !!prevTrack?.previewAudioUrl,
      hasNft: !!prevTrack?.nft,
      nftId: prevTrack?.nft?.id || prevTrack?.nftId
    });
    
    // Use helper function for consistent state updates
    const success = switchToTrack(prevIndex, prevTrack);
    if (!success) {
      console.error('🎵 playPreviousTrack: Failed to switch to previous track');
    }
  };

  return {
    duration,
    playedSeconds,
    setPlayedSeconds,
    loadedSeconds,
    setLoadedSeconds,
    setDuration,
    loaded,
    setLoaded,
    played,
    setPlayed,
    muted,
    setMuted,
    volume,
    setVolume,
    playing,
    setPlaying,
    playbackRate,
    setplaybackRate,
    url,
    setUrl,
    trackName,
    setTrackName,
    imageUrl,
    setImageUrl,
    nftId,
    setNftId,
    playlist,
    setPlaylist,
    currentTrackIndex,
    setCurrentTrackIndex,
    playNextTrack,
    playPreviousTrack,
  };
};
