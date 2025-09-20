'use client';
import Link from 'next/link';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRadio } from '@/contexts/RadioContext';
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  ForwardIcon,
  BackwardIcon,
  HeartIcon,
  ShareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';

export default function GlobalRadioPlayer() {
  const router = useRouter();
  const { radioState, togglePlayPause, toggleMute, setVolume, toggleLike, shareTrack, advanceToNextTrack, goToPreviousTrack, refreshStatus, enableAutoPlay, setCurrentTrackByIndex } = useRadio();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredTracks, setFilteredTracks] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(0); // Add key to force image refresh

  // Use playlist from radioState instead of separate state
  const playlist = radioState.playlist || [];

  // Force image refresh when current track changes
  useEffect(() => {
    if (radioState.currentTrack?.id) {
      setImageKey(prev => prev + 1);
      setImageLoadError(null);
    }
  }, [radioState.currentTrack?.id, radioState.currentTrack?.albumArt]);

  useEffect(() => {
    if (search.length > 0) {
      const lower = search.toLowerCase();
      setFilteredTracks(
        playlist.filter(track =>
          (track.name && track.name.toLowerCase().includes(lower)) ||
          (track.artist && track.artist.toLowerCase().includes(lower)) ||
          (track.genre && track.genre.toLowerCase().includes(lower))
        )
      );
      setShowDropdown(true);
    } else {
      setFilteredTracks([]);
      setShowDropdown(false);
    }
  }, [search, playlist]);

  const handleSelectTrack = async (track: any) => {
    
    // Check for nftId either as direct property or nested under nft
    const nftId = track.nftId || (track.nft && track.nft.id);
    
    if (nftId) {
      try {
        // Enable auto-play so the selected track will start playing
        enableAutoPlay();
        
        // Find the track in the current playlist
        // The radioState.playlist comes from status API where:
        // - Regular tracks have id = nft.id (which is the nftId)
        // - Ads/intros have id = track.id (but no nftId)
        // We're looking for regular tracks with nftId, so match by id
        const trackIndex = radioState.playlist.findIndex(t => t.id === nftId);
        
        if (trackIndex !== -1) {
          // Update UI immediately from playlist
          setCurrentTrackByIndex(trackIndex);
        }
        
        // Then make API call to update backend
        const response = await fetch('/api/radio/set-track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          body: JSON.stringify({
            trackId: nftId
          }),
        });

        const result = await response.json();

        if (result.success) {
          console.log('Track set successfully');
          // Don't force refresh immediately - let the UI state persist
          // The backend is updated and next natural refresh will sync
        } else {
          console.error('Failed to set track:', result.error);
          // Revert UI changes if API call failed
          await refreshStatus(true);
        }
      } catch (error) {
        console.error('Error setting track:', error);
        // Revert UI changes if API call failed
        await refreshStatus(true);
      }
    }
    
    // Close search results
    setSearch('');
    setShowDropdown(false);
  };

  const expandToFullPage = () => {
    router.push('/radio');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshStatus();
    } catch (error) {
      console.error('Failed to refresh radio status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Store previously generated URLs so we don’t recreate them every render
  const imageCacheRef = useRef<Record<string, string>>({});

  // Helper: return a stable, cache-busted image URL that only changes when the
  // *track* changes (vs. every React render). This prevents the browser from
  // redownloading the same artwork hundreds of times.
  const getCacheBustedImageUrl = useCallback(
    (url: string | undefined): string => {
      if (!url) return '/images/default-album-art.jpg';

      // Cache-buster value remains constant for the life-time of the track.
      const trackKey = radioState.currentTrack?.id || 'default';

      // Memoised per track – if we have computed it before, reuse it.
      if (imageCacheRef.current[trackKey]) {
        return imageCacheRef.current[trackKey];
      }

      const separator = url.includes('?') ? '&' : '?';
      const cacheBustedUrl = `${url}${separator}t=${trackKey}`;

      imageCacheRef.current[trackKey] = cacheBustedUrl;
      return cacheBustedUrl;
    },
    [radioState.currentTrack?.id]
  );

  // Handle image load errors
  const handleImageError = () => {
    setImageLoadError(radioState.currentTrack?.albumArt || null);
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoadError(null);
  };

  // Show demo state if no current track
  const showDemo = !radioState.currentTrack && !radioState.isLoading;

  return (
    <>
      {/* Global Radio Player */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        {/* Main Player Bar */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Track Info + Search */}
          <div className="flex items-center flex-1 min-w-0">
            <div className="flex items-center min-w-0 cursor-pointer" onClick={expandToFullPage}>
              {radioState.currentTrack?.albumArt && radioState.currentTrack?.id ? (
                <img
                  key={`album-art-${imageKey}`} // Force re-render when key changes
                  src={getCacheBustedImageUrl(radioState.currentTrack.albumArt)}
                  alt="Album Art"
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  loading="eager" // Prioritize loading
                />
              ) : showDemo ? (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg">🎵</span>
                </div>
              ) : imageLoadError ? (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg">🎵</span>
                </div>
              ) : null}
              <div className="min-w-0 flex-1 ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {radioState.currentTrack?.isAd
                    ? 'Sponsored Message'
                    : radioState.currentTrack?.name || (showDemo ? 'VinylFunders Radio Demo' : 'VinylFunders Radio')}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {radioState.currentTrack?.isAd
                    ? 'Ad'
                    : radioState.currentTrack?.artist || (showDemo ? 'Click to start listening' : 'Live Independent Music')}
                </p>
              </div>
            </div>
            {/* Desktop-only search input - now grouped left, with 15px padding */}
            <div className="relative hidden lg:block ml-4" style={{paddingLeft: '15px'}}>
              <input
                type="text"
                className="px-3 py-1 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="search by genre/title"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => search && setShowDropdown(true)}
              />
              {showDropdown && filteredTracks.length > 0 && (
                <div className="absolute left-0 bottom-full mb-1 w-64 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                  {filteredTracks.map((track, idx) => (
                    <div
                      key={track.id}
                      className="flex items-center px-3 py-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      onClick={() => handleSelectTrack(track)}
                    >
                      <img
                        src={getCacheBustedImageUrl(track.nft?.sideAImage || track.nft?.imageUrl)}
                        alt={track.nft?.name}
                        className="w-8 h-8 rounded object-cover mr-3"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/default-track-image.jpg';
                        }}
                      />
                      <div>
                        <div className="font-medium text-sm truncate">{track.nft?.name}</div>
                        <div className="text-xs text-neutral-500 truncate">{track.nft?.user?.name} • {track.nft?.genre}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* Previous Track Button */}
            <button
              onClick={goToPreviousTrack}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              disabled={radioState.isLoading}
              title="Previous Track"
            >
              <BackwardIcon className="w-5 h-5" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors"
              disabled={radioState.isLoading}
            >
              {radioState.isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : radioState.isPlaying ? (
                <PauseIcon className="w-5 h-5" />
              ) : (
                <PlayIcon className="w-5 h-5" />
              )}
            </button>

            {/* Next Track Button */}
            <button
              onClick={advanceToNextTrack}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              disabled={radioState.isLoading}
              title="Next Track"
            >
              <ForwardIcon className="w-5 h-5" />
            </button>

            {/* Volume Control */}
            <div
  className="relative"
  onMouseEnter={() => setShowVolumeSlider(true)}
  onMouseLeave={() => setShowVolumeSlider(false)}
>
  <button
    onClick={toggleMute}
    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
  >
    {radioState.isMuted || radioState.volume === 0 ? (
      <SpeakerXMarkIcon className="w-5 h-5" />
    ) : (
      <SpeakerWaveIcon className="w-5 h-5" />
    )}
  </button>
  {showVolumeSlider && (
    <div className="absolute bottom-full right-0 mb-2 p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={radioState.volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  )}
</div>

            {/* Like Button */}
            <button
              onClick={toggleLike}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
            >
              {radioState.isLiked ? (
                <HeartIcon className="w-5 h-5 text-red-500" />
              ) : (
                <HeartOutlineIcon className="w-5 h-5" />
              )}
            </button>

            {/* Share Button */}
            <button
              onClick={shareTrack}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ShareIcon className="w-5 h-5" />
            </button>

            {/* Expand Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-5 h-5" />
              ) : (
                <ChevronUpIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Player Section */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-green-600 h-1 rounded-full transition-all duration-300"
                  style={{ 
                    width: showDemo ? '0%' : 
                    radioState.totalDuration > 0 ? `${(radioState.progress / radioState.totalDuration) * 100}%` : '0%'
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                <span>{showDemo ? '0:00' : formatTime(radioState.progress)}</span>
                <span>{radioState.currentTrack ? formatTime(radioState.totalDuration) : (showDemo ? '0:00' : '0:00')}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/radio')}
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                >
                  Open Full Player
                </button>
                {showDemo && (
                  <button
                    onClick={() => router.push('/admin/radio')}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                  >
                    Setup Radio
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {showDemo ? '⚫ DEMO' : (radioState.isLive ? '🔴 LIVE' : '⚫ OFFLINE')}
                </span>
                {radioState.totalListeners > 0 && (
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {radioState.totalListeners} listeners
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add bottom padding to prevent content from being hidden behind player */}
      <div className="h-20" />
    </>
  );
} 