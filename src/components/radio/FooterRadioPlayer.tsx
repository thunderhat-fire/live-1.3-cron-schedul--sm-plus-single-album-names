'use client';
import React, { useState, useEffect } from 'react';
import { useRadio } from '@/contexts/RadioContext';
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/solid';

export default function FooterRadioPlayer() {
  const { 
    radioState, 
    togglePlayPause, 
    toggleMute, 
    setVolume, 
    advanceToNextTrack, 
    goToPreviousTrack,
    setCurrentTrackByIndex
  } = useRadio();

  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(0);

  // Force image refresh when current track changes
  useEffect(() => {
    if (radioState.currentTrack?.id) {
      setImageKey(prev => prev + 1);
      setImageLoadError(null);
    }
  }, [radioState.currentTrack?.id, radioState.currentTrack?.albumArt]);

  // Helper function to get cache-busted image URL
  const getCacheBustedImageUrl = (url: string | undefined): string => {
    if (!url) return '/images/default-album-art.jpg';
    
    // Add cache-busting parameter for deployed environments
    const separator = url.includes('?') ? '&' : '?';
    const cacheBuster = `${separator}v=${Date.now()}&t=${radioState.currentTrack?.id || 'default'}`;
    
    return `${url}${cacheBuster}`;
  };

  // Handle image load errors
  const handleImageError = () => {
    setImageLoadError(radioState.currentTrack?.albumArt || null);
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoadError(null);
  };


  // Debug logging
  console.log('🎵 FooterPlayer render:', {
    hasCurrentTrack: !!radioState.currentTrack,
    trackId: radioState.currentTrack?.id,
    trackName: radioState.currentTrack?.name,
    artist: radioState.currentTrack?.artist,
    isPlaying: radioState.isPlaying,
    isLoading: radioState.isLoading,
    fullTrackObject: radioState.currentTrack,
    playlistLength: Array.isArray(radioState.playlist) ? radioState.playlist.length : 0
  });

  // Log all track names for debugging (only once)
  if (Array.isArray(radioState.playlist) && radioState.playlist.length > 0) {
    console.log('🎵 All track names in playlist:');
    radioState.playlist.forEach((track, index) => {
      console.log(`  ${index}: "${track.name}" by "${track.artist}" (ID: ${track.id})`);
    });
  }

  // Don't render if no current track
  if (!radioState.currentTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex items-center px-2 sm:px-4 py-2 sm:py-3 max-w-7xl mx-auto space-x-2 sm:space-x-4">
        {/* Thumbnail - Far Left */}
        <div className="flex-shrink-0">
          {radioState.currentTrack.albumArt ? (
            <img
              key={`footer-album-art-${imageKey}`}
              src={getCacheBustedImageUrl(radioState.currentTrack.albumArt)}
              alt="Album Art"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="eager"
            />
          ) : imageLoadError ? (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
              <span className="text-white text-sm sm:text-lg">🎵</span>
            </div>
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm sm:text-lg">🎵</span>
            </div>
          )}
        </div>

        {/* NFT Name - Next to Thumbnail (hidden on mobile for space) */}
        <div className="hidden sm:block min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {(radioState.currentTrack as any)?.nft?.name ||
             radioState.currentTrack.trackTitle ||
             'VinylFunders Radio'}
          </div>
        </div>

        {/* Spacer - Center */}
        <div className="flex-1"></div>

        {/* Controls - Right Side (simplified on mobile) */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="p-1.5 sm:p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors"
            disabled={radioState.isLoading}
          >
            {radioState.isLoading ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : radioState.isPlaying ? (
              <PauseIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>


          {/* Volume Control - simplified on mobile */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={toggleMute}
              className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {radioState.isMuted ? (
                <SpeakerXMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <SpeakerWaveIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={radioState.volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-12 sm:w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
