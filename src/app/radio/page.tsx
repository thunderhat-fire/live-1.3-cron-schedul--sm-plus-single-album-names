'use client';

import React, { useState, useEffect } from 'react';
import RadioPlayer from '@/components/radio/RadioPlayer';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import { useRadio } from '@/contexts/RadioContext';
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  HeartIcon,
  ShareIcon,
  ClockIcon,
  UsersIcon,
  ChartBarIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';

export default function RadioPage() {
  const { radioState, togglePlayPause, toggleMute, setVolume, toggleLike, shareTrack, refreshStatus } = useRadio();
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

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6 max-w-3xl mx-auto">
              Discover amazing independent music from our community of artists. 
              Our AI-powered radio plays full tracks with dynamic TTS introductions.
            </p>
            
            {/* Live Status Badge */}
            <div className="flex justify-center items-center space-x-4 mb-6">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                radioState.isLive 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  radioState.isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'
                }`} />
                <span className="font-medium">
                  {radioState.isLive ? '🔴 LIVE' : '⚫ OFFLINE'}
                </span>
              </div>
              
              {radioState.totalListeners > 0 && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                  <UsersIcon className="w-4 h-4" />
                  <span className="font-medium">{radioState.totalListeners} listeners</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Radio Player Section */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Current Track Display */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl p-8">
                <h2 className="text-2xl font-bold mb-6">Now Playing</h2>
                
                {radioState.isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : radioState.currentTrack ? (
                  <div className="text-center">
                    {/* Album Art */}
                    <div className="mb-6">
                      {imageLoadError ? (
                        <div className="w-64 h-64 mx-auto rounded-2xl shadow-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                          <span className="text-white text-4xl">🎵</span>
                        </div>
                      ) : (
                        <img
                          key={`radio-album-art-${imageKey}`}
                          src={getCacheBustedImageUrl(radioState.currentTrack.albumArt)}
                          alt="Album Art"
                          className="w-64 h-64 mx-auto rounded-2xl shadow-lg object-cover"
                          onError={handleImageError}
                          onLoad={handleImageLoad}
                          loading="eager"
                        />
                      )}
                    </div>

                    {/* Track Info */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-2">{radioState.currentTrack.name}</h3>
                      <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                        {radioState.currentTrack.artist}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {radioState.currentTrack.genre} • {radioState.currentTrack.recordLabel}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${radioState.totalDuration > 0 ? (radioState.progress / radioState.totalDuration) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <span>{formatDuration(radioState.progress)}</span>
                        <span>{formatDuration(radioState.totalDuration)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={toggleLike}
                        className={`p-3 rounded-full transition-colors ${
                          radioState.isLiked 
                            ? 'text-red-500 hover:text-red-600' 
                            : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
                        }`}
                      >
                        {radioState.isLiked ? (
                          <HeartIcon className="w-6 h-6" />
                        ) : (
                          <HeartOutlineIcon className="w-6 h-6" />
                        )}
                      </button>

                      <button
                        onClick={shareTrack}
                        className="p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors"
                      >
                        <ShareIcon className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MusicalNoteIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No track currently playing</p>
                  </div>
                )}
              </div>
            </div>

            {/* Radio Stats & Controls */}
            <div className="space-y-6">
              {/* Radio Stats */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4">Radio Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Current Listeners</span>
                    <span className="font-semibold">{radioState.totalListeners}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Peak Listeners</span>
                    <span className="font-semibold">{radioState.peakListeners}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Uptime</span>
                    <span className="font-semibold">{formatTime(radioState.uptime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status</span>
                    <span className="font-semibold">{radioState.isLive ? 'Live' : 'Offline'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions removed – YouTube live stream buttons deprecated */}

              {/* Next Track */}
              {radioState.nextTrack && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold mb-4">Coming Up Next</h3>
                  <div className="flex items-center space-x-3">
                    <img
                      src={radioState.nextTrack.albumArt || '/images/default-album-art.jpg'}
                      alt="Next Track"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{radioState.nextTrack.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {radioState.nextTrack.artist}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Radio Player */}
          <div className="mb-12">
            <RadioPlayer />
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-lg">
              <div className="text-4xl mb-4">🎵</div>
              <h3 className="text-xl font-bold mb-2">Full Tracks</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Listen to complete songs, not just 30-second samples. 
                Experience the full artistic vision.
              </p>
            </div>

            <div className="text-center p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-lg">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold mb-2">Auto-Updating</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Playlists automatically update with new content. 
                Fresh music added daily from our community.
              </p>
            </div>
          </div>

          {/* How It Works section removed */}

          {/* Benefits for Artists */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Benefits for Artists</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">🎯 Exposure</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get your music heard by a global audience of vinyl enthusiasts 
                  and music collectors.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">💰 Revenue</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Drive vinyl presales and digital downloads through 
                  radio play and TTS announcements.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">📊 Analytics</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Track radio play counts and see how your music performs 
                  in the rotation.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">🤝 Community</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Connect with other independent artists and build 
                  your fanbase through radio exposure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 