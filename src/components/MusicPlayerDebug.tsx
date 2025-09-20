'use client';
import { useEffect, useState } from 'react';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';

export default function MusicPlayerDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [apiTest, setApiTest] = useState<any>({});
  const [buttonClickLog, setButtonClickLog] = useState<string[]>([]);
  const musicPlayer = useMusicPlayer();

  // Log button clicks
  useEffect(() => {
    const logButtonClick = (event: any) => {
      if (event.target.closest('[title="Previous track"]') || event.target.closest('[title="Next track"]')) {
        const isNext = event.target.closest('[title="Next track"]');
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp}: ${isNext ? 'NEXT' : 'PREV'} button clicked - Index: ${musicPlayer.currentTrackIndex}`;
        
        setButtonClickLog(prev => [...prev.slice(-4), logEntry]); // Keep last 5 entries
        console.log('🔘', logEntry);
      }
    };

    document.addEventListener('click', logButtonClick, true);
    return () => document.removeEventListener('click', logButtonClick, true);
  }, [musicPlayer.currentTrackIndex]);

  useEffect(() => {
    // Test the playlist API
    const testAPI = async () => {
      try {
        console.log('🐛 Testing /api/radio/playlist...');
        const response = await fetch('/api/radio/playlist');
        const data = await response.json();
        
        setApiTest({
          status: response.status,
          ok: response.ok,
          data: data,
          error: null
        });
        
        console.log('🐛 API Response:', { status: response.status, data });
      } catch (error) {
        console.error('🐛 API Error:', error);
        setApiTest({
          status: 'ERROR',
          ok: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    // Collect debug info
    setDebugInfo({
      environment: process.env.NODE_ENV,
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
      musicPlayer: {
        url: musicPlayer.url,
        trackName: musicPlayer.trackName,
        playing: musicPlayer.playing,
        playlist: musicPlayer.playlist,
        playlistLength: musicPlayer.playlist?.length || 0,
        currentTrackIndex: musicPlayer.currentTrackIndex
      }
    });

    testAPI();
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="fixed top-0 left-0 z-50 bg-red-500 text-white p-4 max-w-md max-h-96 overflow-auto text-xs">
        <h3 className="font-bold mb-2">🐛 Music Player Debug (PRODUCTION)</h3>
        
        <div className="mb-2">
          <strong>Environment:</strong> {debugInfo.environment}
        </div>
        
        <div className="mb-2">
          <strong>URL:</strong> {debugInfo.url}
        </div>
        
        <div className="mb-2">
          <strong>API Test:</strong>
          <div>Status: {apiTest.status}</div>
          <div>OK: {apiTest.ok ? 'YES' : 'NO'}</div>
          {apiTest.error && <div>Error: {apiTest.error}</div>}
          {apiTest.data && (
            <div>
              <div>Tracks: {apiTest.data.tracks?.length || 0}</div>
              <div>Name: {apiTest.data.name || 'N/A'}</div>
            </div>
          )}
        </div>
        
        <div className="mb-2">
          <strong>Music Player:</strong>
          <div>URL: {debugInfo.musicPlayer?.url || 'None'}</div>
          <div>Track: {debugInfo.musicPlayer?.trackName || 'None'}</div>
          <div>Playing: {debugInfo.musicPlayer?.playing ? 'YES' : 'NO'}</div>
          <div>Playlist: {debugInfo.musicPlayer?.playlistLength} tracks</div>
          <div>Index: {debugInfo.musicPlayer?.currentTrackIndex}</div>
        </div>
        
        <div className="mb-2">
          <strong>Button Clicks:</strong>
          {buttonClickLog.slice(-3).map((log, i) => (
            <div key={i} className="text-xs">{log.split(': ')[1]}</div>
          ))}
        </div>
        
        <button 
          onClick={() => {
            console.log('🐛 Full Debug Info:', debugInfo, apiTest, musicPlayer);
            alert('Debug info logged to console');
          }}
          className="bg-white text-red-500 px-2 py-1 rounded text-xs"
        >
          Log Full Debug
        </button>
      </div>
    );
  }

  return null; // Don't show in development
}
