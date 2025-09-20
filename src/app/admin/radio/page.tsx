'use client';

import React, { useState, useEffect } from 'react';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import ButtonSecondary from '@/shared/Button/ButtonSecondary';

interface RadioStream {
  id: string;
  name: string;
  status: string;
  isLive: boolean;
  currentPlaylistId?: string;
  lastUpdated: string;
  createdAt: string;
}

interface Playlist {
  id: string;
  name: string;
  status: string;
  totalDuration: number;
  trackCount: number;
  createdAt: string;
}

export default function AdminRadioPage() {
  const [streams, setStreams] = useState<RadioStream[]>([]);
  const [currentStream, setCurrentStream] = useState<RadioStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newStreamName, setNewStreamName] = useState('');
  const [playlistConfig, setPlaylistConfig] = useState({
    maxDuration: 3600,
    includeTTS: true,
    voiceId: 'default',
    shuffleTracks: true,
  });

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/radio/stream?admin=1');
      const data = await response.json();

      if (data.success) {
        setStreams(data.radioStreams);
        const activeStream = data.radioStreams.find((s: RadioStream) => s.status === 'active');
        setCurrentStream(activeStream || null);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
      alert('Failed to fetch radio streams');
    } finally {
      setIsLoading(false);
    }
  };

  const createStream = async () => {
    if (!newStreamName.trim()) {
      alert('Please enter a stream name');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/radio/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStreamName }),
      });

      const data = await response.json();

      if (data.success) {
        setNewStreamName('');
        fetchStreams();
        alert('Radio stream created successfully');
      } else {
        alert('Failed to create radio stream');
      }
    } catch (error) {
      console.error('Error creating stream:', error);
      alert('Failed to create radio stream');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePlaylist = async () => {
    if (!currentStream) {
      alert('Please select a radio stream first');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/radio/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playlistConfig),
      });

      const data = await response.json();

      if (data.success) {
        // Update the stream with the new playlist
        await updateStream(currentStream.id, { currentPlaylistId: data.playlistId });
        fetchStreams();
        alert('Playlist generated successfully');
      } else {
        alert('Failed to generate playlist');
      }
    } catch (error) {
      console.error('Error generating playlist:', error);
      alert('Failed to generate playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStream = async (streamId: string, updates: any) => {
    try {
      const response = await fetch('/api/radio/stream', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: streamId, ...updates }),
      });

      const data = await response.json();

      if (data.success) {
        fetchStreams();
      } else {
        alert('Failed to update stream');
      }
    } catch (error) {
      console.error('Error updating stream:', error);
      alert('Failed to update stream');
    }
  };

  const toggleStreamStatus = async (stream: RadioStream) => {
    const newStatus = stream.status === 'active' ? 'inactive' : 'active';
    await updateStream(stream.id, { status: newStatus });
  };

  const toggleLiveStatus = async (stream: RadioStream) => {
    await updateStream(stream.id, { isLive: !stream.isLive });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🎵 Radio System Admin</h1>

        {/* Create New Stream */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Create New Radio Stream</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Enter stream name..."
              value={newStreamName}
              onChange={(e) => setNewStreamName(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800"
            />
            <ButtonPrimary
              onClick={createStream}
              disabled={isLoading}
              sizeClass="px-6 py-2"
            >
              Create Stream
            </ButtonPrimary>
          </div>
        </div>

        {/* Current Stream Status */}
        {currentStream && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg mb-8">
            <h2 className="text-xl font-bold mb-4">Current Active Stream</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">{currentStream.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Created: {new Date(currentStream.createdAt).toLocaleDateString()}
                </p>
                <div className="flex space-x-2">
                  <ButtonSecondary
                    onClick={() => toggleStreamStatus(currentStream)}
                    sizeClass="px-4 py-2"
                  >
                    {currentStream.status === 'active' ? 'Deactivate' : 'Activate'}
                  </ButtonSecondary>
                  <ButtonSecondary
                    onClick={() => toggleLiveStatus(currentStream)}
                    sizeClass="px-4 py-2"
                  >
                    {currentStream.isLive ? 'Stop Live' : 'Go Live'}
                  </ButtonSecondary>
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${
                    currentStream.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></span>
                  <span className="text-sm">
                    Status: {currentStream.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${
                    currentStream.isLive ? 'bg-red-500' : 'bg-gray-400'
                  }`}></span>
                  <span className="text-sm">
                    Live: {currentStream.isLive ? 'Yes' : 'No'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Last Updated: {new Date(currentStream.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Playlist Generation */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Generate Playlist</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Max Duration (seconds)</label>
              <input
                type="number"
                value={playlistConfig.maxDuration}
                onChange={(e) => setPlaylistConfig({
                  ...playlistConfig,
                  maxDuration: parseInt(e.target.value)
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Voice ID</label>
              <select
                value={playlistConfig.voiceId}
                onChange={(e) => setPlaylistConfig({
                  ...playlistConfig,
                  voiceId: e.target.value
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800"
              >
                <option value="default">Default (Rachel)</option>
                <option value="male">Male (Dom)</option>
                <option value="female">Female (Bella)</option>
                <option value="british">British (Arnold)</option>
                <option value="australian">Australian (Adam)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={playlistConfig.includeTTS}
                onChange={(e) => setPlaylistConfig({
                  ...playlistConfig,
                  includeTTS: e.target.checked
                })}
                className="mr-2"
              />
              Include TTS Introductions
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={playlistConfig.shuffleTracks}
                onChange={(e) => setPlaylistConfig({
                  ...playlistConfig,
                  shuffleTracks: e.target.checked
                })}
                className="mr-2"
              />
              Shuffle Tracks
            </label>
          </div>

          <ButtonPrimary
            onClick={generatePlaylist}
            disabled={isLoading || !currentStream}
            sizeClass="px-6 py-2"
          >
            Generate New Playlist
          </ButtonPrimary>
        </div>

        {/* All Streams */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">All Radio Streams</h2>
          
          {streams.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No radio streams found.</p>
          ) : (
            <div className="space-y-4">
              {streams.map((stream) => (
                <div
                  key={stream.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold">{stream.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Created: {new Date(stream.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      stream.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {stream.status}
                    </span>
                    
                    <span className={`px-2 py-1 rounded text-xs ${
                      stream.isLive 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {stream.isLive ? 'LIVE' : 'OFFLINE'}
                    </span>
                    
                    <ButtonSecondary
                      onClick={() => toggleStreamStatus(stream)}
                      sizeClass="px-3 py-1 text-xs"
                    >
                      {stream.status === 'active' ? 'Deactivate' : 'Activate'}
                    </ButtonSecondary>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 