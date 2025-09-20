'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/shared/Button/Button';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import ButtonSecondary from '@/shared/Button/ButtonSecondary';
import { useRadio } from '@/contexts/RadioContext';

interface RadioPlayerProps {
  className?: string;
}

export default function RadioPlayer({ className }: RadioPlayerProps) {
  const { radioState, togglePlayPause, toggleMute, setVolume } = useRadio();
  const [isLoading, setIsLoading] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [playlist, setPlaylist] = useState<any>(null);
  const [playlistSearch, setPlaylistSearch] = useState('');

  // Fetch current playlist
  const fetchCurrentPlaylist = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching playlist from /api/radio/playlist...');
      const response = await fetch('/api/radio/playlist');
      console.log('Playlist response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw playlist data:', data);
        
        // Ensure data has the expected structure
        const playlistData = {
          ...data,
          tracks: data.tracks || [],
          trackCount: data.trackCount || data.tracks?.length || 0
        };
        
        console.log('Processed playlist data:', playlistData);
        console.log('Tracks array length:', playlistData.tracks?.length);
        console.log('Track count:', playlistData.trackCount);
        
        setPlaylist(playlistData);
        
        if (playlistData.tracks && playlistData.tracks.length > 0) {
          console.log('First track:', playlistData.tracks[0]);
          console.log('First track details:', {
            id: playlistData.tracks[0].id,
            isAd: playlistData.tracks[0].isAd,
            ttsAudioUrl: playlistData.tracks[0].ttsAudioUrl,
            ttsAudio: playlistData.tracks[0].ttsAudio,
            nft: playlistData.tracks[0].nft,
            isIntro: playlistData.tracks[0].isIntro
          });
        } else {
          console.log('No tracks found in playlist data');
          console.log('Data structure:', Object.keys(data));
        }
      } else {
        console.error('Failed to fetch playlist:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setPlaylist({ tracks: [], trackCount: 0, name: 'Error loading playlist' });
      }
    } catch (error) {
      console.error('Failed to fetch playlist:', error);
      setPlaylist({ tracks: [], trackCount: 0, name: 'Error loading playlist' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentPlaylist();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            radioState.isPlaying ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
          }`}>
            {radioState.isPlaying ? "LIVE" : "OFFLINE"}
          </span>
        </div>

        {/* Current Track Info */}
        {radioState.currentTrack && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">
                  {radioState.currentTrack.albumName ? `${radioState.currentTrack.albumName} – ${radioState.currentTrack.trackTitle}` : radioState.currentTrack.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  by {radioState.currentTrack.artist}
                </p>
              </div>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded ml-2">
                {radioState.currentTrack.genre}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${(radioState.progress / radioState.totalDuration) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatTime(radioState.progress)}</span>
                <span>{formatTime(radioState.totalDuration)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              onClick={togglePlayPause}
              disabled={isLoading || !playlist}
              sizeClass="px-4 py-2 text-sm"
            >
              {radioState.isPlaying ? "⏸️ Pause" : "▶️ Play"}
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleMute}
              sizeClass="px-2 py-2 text-sm"
            >
              {radioState.isMuted ? "🔇" : "🔊"}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={radioState.volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>
        </div>

        {/* Playlist Toggle */}
        {playlist && (
          <ButtonSecondary
            onClick={() => setShowPlaylist(!showPlaylist)}
            sizeClass="w-full mt-4 py-2 text-sm"
          >
            {showPlaylist ? "Hide" : "Show"} Playlist ({playlist.tracks?.length || playlist.trackCount || 0} tracks)
          </ButtonSecondary>
        )}
      </div>

      {/* Playlist */}
      {showPlaylist && playlist && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4">Current Playlist</h3>
          {/* Search within playlist */}
          <input
            type="search"
            value={playlistSearch}
            onChange={(e) => setPlaylistSearch(e.target.value)}
            placeholder="Search track or artist"
            className="w-full mb-4 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(playlist.playlistLimited || playlist.tracks)
              .filter((track:any) => {
                if (!playlistSearch) return true;
                const q = playlistSearch.toLowerCase();
                return (
                  (track.albumName && track.albumName.toLowerCase().includes(q)) ||
                  (track.trackTitle && track.trackTitle.toLowerCase().includes(q)) ||
                  (track.name && track.name.toLowerCase().includes(q)) ||
                  (track.artist && track.artist.toLowerCase().includes(q))
                );
              })
              .map((track:any, index:number) => (
                <div
                  key={track.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === radioState.currentTrackIndex ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.albumName ? `${track.albumName} – ${track.trackTitle}` : track.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {track.isAd ? 'Ad' : track.isIntro ? (track.nft?.user.name || 'Intro') : `${track.nft?.user.name} • ${track.nft?.genre}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {track.isIntro && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                        INTRO
                      </span>
                    )}
                    {track.isAd && (
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded">
                        AD
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTime(track.duration)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
} 