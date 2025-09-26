'use client';

import React, { useState, useEffect } from 'react';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import ButtonSecondary from '@/shared/Button/ButtonSecondary';
import { StreamTrack, LiveStreamConfig } from '@/lib/radio/liveStreamService';

interface StreamMetadata {
  currentTrack: StreamTrack | null;
  nextTrack: StreamTrack | null;
  timeRemaining: number;
  totalListeners: number;
  peakListeners: number;
  uptime: number;
  isLive: boolean;
}

interface YouTubeStream {
  id: string;
  title: string;
  description: string;
  status: 'created' | 'ready' | 'live' | 'ended';
  streamUrl: string;
  chatUrl: string;
  viewerCount: number;
  startTime: Date;
  endTime?: Date;
}

interface YouTubeAnalytics {
  totalViews: number;
  totalWatchTime: number;
  averageViewDuration: number;
  peakConcurrentViewers: number;
  chatMessages: number;
  likes: number;
  dislikes: number;
}

export default function LiveStreamAdminPage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<StreamMetadata | null>(null);
  const [youtubeStream, setYoutubeStream] = useState<YouTubeStream | null>(null);
  const [youtubeAnalytics, setYoutubeAnalytics] = useState<YouTubeAnalytics | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [availableTracks, setAvailableTracks] = useState<any[]>([]);
  const [streamConfig, setStreamConfig] = useState<LiveStreamConfig>({
    outputUrl: './test-output/live-stream.flv', // Local file output for testing
    resolution: '720p',
    fps: 30,
    bitrate: '2500k',
    audioBitrate: '128k',
    showAlbumArt: true,
    showQRCode: true,
    showTrackInfo: true,
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    fontSize: 24,
    transitionDuration: 2,
  });
  const [youtubeEnabled, setYoutubeEnabled] = useState(false); // Disabled by default until YouTube live streaming is enabled
  const [streamTitle, setStreamTitle] = useState('VinylFunders Radio - Live Independent Music');
  const [streamDescription, setStreamDescription] = useState('24/7 streaming of independent music from VinylFunders. Discover new artists and support the vinyl revival!');

  useEffect(() => {
    fetchAvailableTracks();
    const interval = setInterval(fetchStreamStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAvailableTracks = async () => {
    try {
      console.log('📡 fetchAvailableTracks: Making API call...');
      const response = await fetch('/api/nfts?limit=50&isRadioEligible=true&showAll=true');
      console.log('📡 fetchAvailableTracks: Response status:', response.status);
      
      const data = await response.json();
      console.log('📡 fetchAvailableTracks: Response data:', data);
      
      if (data.success) {
        console.log(`📡 fetchAvailableTracks: Setting ${data.nfts.length} tracks`);
        setAvailableTracks(data.nfts);
        console.log(`📡 fetchAvailableTracks: Fetched ${data.nfts.length} radio eligible tracks`);
      } else {
        console.error('📡 fetchAvailableTracks: Error in response:', data.error);
      }
    } catch (error) {
      console.error('📡 fetchAvailableTracks: Exception:', error);
    }
  };

  const fetchStreamStatus = async () => {
    try {
      const response = await fetch('/api/radio/live-stream?action=status');
      const data = await response.json();
      if (data.success) {
        setMetadata(data.metadata);
        setYoutubeStream(data.youtubeStream);
        setIsStreaming(data.metadata?.isLive || false);
      }
    } catch (error) {
      console.error('Error fetching stream status:', error);
    }
  };

  const fetchYouTubeAnalytics = async () => {
    if (!youtubeStream?.id) return;
    
    try {
      const response = await fetch(`/api/radio/live-stream?action=youtube-analytics&streamId=${youtubeStream.id}`);
      const data = await response.json();
      if (data.success) {
        setYoutubeAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching YouTube analytics:', error);
    }
  };

  const startStream = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/radio/live-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          config: streamConfig,
          youtubeEnabled,
          title: streamTitle,
          description: streamDescription,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsStreaming(true);
        alert('Live stream started successfully!');
        if (youtubeEnabled && data.chatUrl) {
          alert(`YouTube stream started! Chat URL: ${data.chatUrl}`);
        }
      } else {
        alert('Failed to start live stream');
      }
    } catch (error) {
      console.error('Error starting stream:', error);
      alert('Failed to start live stream');
    } finally {
      setIsLoading(false);
    }
  };

  const stopStream = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/radio/live-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });

      const data = await response.json();
      if (data.success) {
        setIsStreaming(false);
        alert('Live stream stopped successfully!');
      } else {
        alert('Failed to stop live stream');
      }
    } catch (error) {
      console.error('Error stopping stream:', error);
      alert('Failed to stop live stream');
    } finally {
      setIsLoading(false);
    }
  };

  const addTrackToQueue = async (trackId: string) => {
    try {
      const response = await fetch('/api/radio/live-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-track',
          trackId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Track added to streaming queue!');
        setSelectedTracks(prev => [...prev, trackId]);
      } else {
        alert('Failed to add track to queue');
      }
    } catch (error) {
      console.error('Error adding track:', error);
      alert('Failed to add track to queue');
    }
  };

  const updateCurrentTrack = async (trackId: string) => {
    try {
      const response = await fetch('/api/radio/live-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-track',
          trackId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Current track updated!');
      } else {
        alert('Failed to update current track');
      }
    } catch (error) {
      console.error('Error updating track:', error);
      alert('Failed to update current track');
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🎥 Live Stream Management</h1>

        {/* 24/7 Radio System */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4">🎵 24/7 Automated Radio System</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start the automated 24/7 radio stream that continuously plays your tracks with AI-generated introductions and ads.
            The system will automatically loop and integrate new tracks as they're uploaded.
          </p>
          <div className="flex space-x-4">
            <ButtonPrimary
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const response = await fetch('/api/admin/initialize-radio', { method: 'POST' });
                  const data = await response.json();
                  if (data.success) {
                    alert(`✅ 24/7 Radio Started!\n\n${data.data.trackCount} tracks in ${data.data.totalDuration}h playlist\n${data.data.eligibleTracks} tracks made radio eligible\n\nStatus: ${data.data.status}`);
                    fetchStreamStatus();
                    fetchAvailableTracks();
                  } else {
                    alert(`❌ Failed to start radio: ${data.error}`);
                  }
                } catch (error) {
                  alert('❌ Error starting 24/7 radio system');
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              sizeClass="px-6 py-3"
            >
              {isLoading ? '🔄 Starting...' : '🚀 Start 24/7 Radio System'}
            </ButtonPrimary>
            <ButtonSecondary
              onClick={() => window.open('/api/radio/status', '_blank')}
              sizeClass="px-4 py-3"
            >
              📊 Check Radio Status
            </ButtonSecondary>
          </div>
        </div>

        {/* Stream Controls */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Stream Controls</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Stream Title</label>
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800"
                placeholder="Enter stream title..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Resolution</label>
              <select
                value={streamConfig.resolution}
                onChange={(e) => setStreamConfig({
                  ...streamConfig,
                  resolution: e.target.value as any
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800"
              >
                <option value="480p">480p</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Stream Description</label>
            <textarea
              value={streamDescription}
              onChange={(e) => setStreamDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800"
              placeholder="Enter stream description..."
            />
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={youtubeEnabled}
                onChange={(e) => setYoutubeEnabled(e.target.checked)}
                className="mr-2"
              />
              Enable YouTube Live Streaming
              <span className="ml-2 text-xs text-red-500">
                (⚠️ YouTube live streaming not yet enabled on channel)
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={streamConfig.showAlbumArt}
                onChange={(e) => setStreamConfig({
                  ...streamConfig,
                  showAlbumArt: e.target.checked
                })}
                className="mr-2"
              />
              Show Album Artwork
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={streamConfig.showQRCode}
                onChange={(e) => setStreamConfig({
                  ...streamConfig,
                  showQRCode: e.target.checked
                })}
                className="mr-2"
              />
              Show QR Codes
            </label>
          </div>

          <div className="flex space-x-4">
            {!isStreaming ? (
              <ButtonPrimary
                onClick={startStream}
                disabled={isLoading}
                sizeClass="px-6 py-2"
              >
                {isLoading ? 'Starting...' : 'Start Live Stream'}
              </ButtonPrimary>
            ) : (
              <ButtonSecondary
                onClick={stopStream}
                disabled={isLoading}
                sizeClass="px-6 py-2"
              >
                {isLoading ? 'Stopping...' : 'Stop Live Stream'}
              </ButtonSecondary>
            )}
          </div>
        </div>

        {/* Current Stream Status */}
        {metadata && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg mb-8">
            <h2 className="text-xl font-bold mb-4">Current Stream Status</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metadata.isLive ? '🔴 LIVE' : '⚫ OFFLINE'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Stream Status
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {metadata.totalListeners}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Current Listeners
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatTime(metadata.uptime)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Uptime
                </div>
              </div>
            </div>

            {metadata.currentTrack && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <h3 className="font-semibold mb-2">Now Playing</h3>
                <div className="flex items-center space-x-4">
                  <img
                    src={metadata.currentTrack.albumArtUrl}
                    alt="Album Art"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <div className="font-medium">{metadata.currentTrack.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {metadata.currentTrack.artist} • {metadata.currentTrack.genre}
                    </div>
                    <div className="text-sm text-gray-500">
                      Time remaining: {formatTime(metadata.timeRemaining)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* YouTube Integration */}
        {youtubeEnabled && youtubeStream && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg mb-8">
            <h2 className="text-xl font-bold mb-4">YouTube Live Stream</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Stream Info</h3>
                <div className="space-y-2">
                  <div><strong>Status:</strong> {youtubeStream.status}</div>
                  <div><strong>Viewers:</strong> {youtubeStream.viewerCount}</div>
                  <div><strong>Started:</strong> {new Date(youtubeStream.startTime).toLocaleString()}</div>
                  <a
                    href={youtubeStream.chatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Open Chat →
                  </a>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Analytics</h3>
                <ButtonSecondary
                  onClick={fetchYouTubeAnalytics}
                  sizeClass="px-4 py-1 text-sm"
                >
                  Refresh Analytics
                </ButtonSecondary>
                
                {youtubeAnalytics && (
                  <div className="mt-4 space-y-2 text-sm">
                    <div><strong>Total Views:</strong> {youtubeAnalytics.totalViews}</div>
                    <div><strong>Peak Viewers:</strong> {youtubeAnalytics.peakConcurrentViewers}</div>
                    <div><strong>Chat Messages:</strong> {youtubeAnalytics.chatMessages}</div>
                    <div><strong>Likes:</strong> {youtubeAnalytics.likes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Track Management */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Track Management</h2>
          
          {/* Debug Information */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">📊 Track Status</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Radio Eligible Tracks:</strong> {availableTracks.length}</p>
                <p><strong>Stream Status:</strong> {isStreaming ? '🔴 Live' : '⚫ Offline'}</p>
                <p><strong>YouTube Enabled:</strong> {youtubeEnabled ? '✅ Yes' : '❌ No'}</p>
              </div>
              <div>
                <p><strong>Current Track:</strong> {metadata?.currentTrack?.name || 'None'}</p>
                <p><strong>Total Listeners:</strong> {metadata?.totalListeners || 0}</p>
                <p><strong>Peak Listeners:</strong> {metadata?.peakListeners || 0}</p>
              </div>
            </div>
            {availableTracks.length === 0 && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-yellow-800 dark:text-yellow-400 text-sm">
                  <strong>⚠️ No tracks available:</strong> Tracks need to be marked as "Radio Eligible" and have preview audio.
                  <br />
                  Check the <a href="/api/radio/debug" target="_blank" className="underline">debug endpoint</a> for more details.
                  <br />
                  <button 
                    onClick={async () => {
                      try {
                        console.log('🔧 Starting Make All Tracks Radio Eligible...');
                        console.log('🔧 Current availableTracks count:', availableTracks.length);
                        
                        const response = await fetch('/api/admin/make-radio-eligible', { method: 'POST' });
                        const data = await response.json();
                        console.log('🔧 Make radio eligible response:', data);
                        
                        if (data.success) {
                          alert(`✅ Success! Made ${data.count} tracks radio eligible!\n\nTracks updated:\n${data.preview.slice(0, 3).map((t: any) => `• ${t.name} by ${t.artist}`).join('\n')}`);
                          
                          console.log('🔧 About to refresh available tracks...');
                          
                          // Force refresh the available tracks
                          await fetchAvailableTracks();
                          console.log('🔧 After first fetchAvailableTracks, count:', availableTracks.length);
                          
                          // Also refresh stream status
                          await fetchStreamStatus();
                          
                          // Force a small delay and refresh again to ensure UI updates
                          setTimeout(async () => {
                            console.log('🔧 Doing delayed refresh...');
                            await fetchAvailableTracks();
                            console.log('🔧 After delayed fetchAvailableTracks, count:', availableTracks.length);
                          }, 1000);
                          
                        } else {
                          alert(`❌ Failed: ${data.error}`);
                        }
                      } catch (error) {
                        console.error('Error updating tracks:', error);
                        alert('❌ Error updating tracks - check console for details');
                      }
                    }}
                    className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                  >
                    🔧 Make All Tracks Radio Eligible
                  </button>
                </p>
              </div>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Available Tracks</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {availableTracks.length > 0 ? (
                  availableTracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={track.imageUrl}
                          alt="Album Art"
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div>
                          <div className="font-medium">{track.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {track.user.name} • {track.genre}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <ButtonSecondary
                          onClick={() => addTrackToQueue(track.id)}
                          sizeClass="px-3 py-1 text-xs"
                        >
                          Add to Queue
                        </ButtonSecondary>
                        <ButtonPrimary
                          onClick={() => updateCurrentTrack(track.id)}
                          sizeClass="px-3 py-1 text-xs"
                        >
                          Play Now
                        </ButtonPrimary>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">🎵</div>
                    <p>No radio-eligible tracks found</p>
                    <p className="text-sm mt-2">
                      Tracks need preview audio and radio eligibility enabled
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Stream Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Background Color</label>
                  <input
                    type="color"
                    value={streamConfig.backgroundColor}
                    onChange={(e) => setStreamConfig({
                      ...streamConfig,
                      backgroundColor: e.target.value
                    })}
                    className="w-full h-10 rounded border"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Text Color</label>
                  <input
                    type="color"
                    value={streamConfig.textColor}
                    onChange={(e) => setStreamConfig({
                      ...streamConfig,
                      textColor: e.target.value
                    })}
                    className="w-full h-10 rounded border"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Font Size</label>
                  <input
                    type="range"
                    min="12"
                    max="48"
                    value={streamConfig.fontSize}
                    onChange={(e) => setStreamConfig({
                      ...streamConfig,
                      fontSize: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600">{streamConfig.fontSize}px</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 