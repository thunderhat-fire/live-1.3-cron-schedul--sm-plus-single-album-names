'use client';
import React, { useState, useRef, useEffect } from 'react';
import MediaCapture from './MediaCapture';
import { StreamManager } from '@/utils/StreamManager';
import { useStreamStore } from '@/store/streamStore';

interface StreamInitResult {
  id: string;
  creatorId: string;
  title: string;
  status: string;
  startedAt: string;
  streamKey: string;
  playbackId: string;
  rtmpUrl: string;
}

interface FloatingLiveStreamWindowProps {
  isPlusUser: boolean;
  isAuthor: boolean;
  streamKey?: string;
  playbackId?: string;
  onStartStream?: () => Promise<StreamInitResult>;
  onStopStream?: () => Promise<void>;
  isLive?: boolean;
}

const FloatingLiveStreamWindow: React.FC<FloatingLiveStreamWindowProps> = ({
  isPlusUser,
  isAuthor,
  streamKey: propStreamKey,
  playbackId,
  onStartStream,
  onStopStream,
  isLive,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const streamManagerRef = useRef<StreamManager | null>(null);
  const mountedRef = useRef(true);

  // Zustand global state
  const mediaStream = useStreamStore((s) => s.mediaStream);
  const setMediaStream = useStreamStore((s) => s.setMediaStream);
  const isStreaming = useStreamStore((s) => s.isStreaming);
  const setIsStreaming = useStreamStore((s) => s.setIsStreaming);
  const streamKey = useStreamStore((s) => s.streamKey);
  const setStreamKey = useStreamStore((s) => s.setStreamKey);
  const rtmpUrl = useStreamStore((s) => s.rtmpUrl);
  const setRtmpUrl = useStreamStore((s) => s.setRtmpUrl);

  useEffect(() => {
    mountedRef.current = true;
    // Add beforeunload cleanup
    const handleBeforeUnload = () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
      setIsStreaming(false);
      setStreamKey(null);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      mountedRef.current = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Do NOT stop stream on unmount, only on explicit end or tab close
    };
  }, [mediaStream, setMediaStream, setIsStreaming, setStreamKey]);

  if (!isPlusUser || !isAuthor) {
    return null;
  }

  const initializeStream = async () => {
    if (!onStartStream || !mountedRef.current) return;
    setIsInitializing(true);
    setError(null);
    try {
      const result = await onStartStream();
      if (!mountedRef.current) return;
      if (!result?.streamKey || !result?.rtmpUrl) {
        throw new Error('Failed to get stream key or RTMP URL');
      }
      setStreamKey(result.streamKey);
      setRtmpUrl(result.rtmpUrl);
      if (mediaStream) {
        streamManagerRef.current = new StreamManager(result.streamKey, result.rtmpUrl);
        await streamManagerRef.current.startStreaming(mediaStream);
        if (mountedRef.current) {
          setIsStreaming(true);
        }
      } else {
        throw new Error('Media stream not available');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize stream';
      setError(errorMessage);
      console.error('Streaming error:', err);
    } finally {
      if (mountedRef.current) {
        setIsInitializing(false);
      }
    }
  };

  const handleStreamReady = async (stream: MediaStream) => {
    if (!mountedRef.current) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    setMediaStream(stream);
    if ((!streamKey && !propStreamKey) || !rtmpUrl) {
      await initializeStream();
    } else {
      try {
        const key = streamKey || propStreamKey;
        const url = rtmpUrl;
        streamManagerRef.current = new StreamManager(key!, url!);
        await streamManagerRef.current.startStreaming(stream);
        if (mountedRef.current) {
          setIsStreaming(true);
        }
      } catch (err) {
        if (!mountedRef.current) return;
        const errorMessage = err instanceof Error ? err.message : 'Failed to start streaming';
        setError(errorMessage);
        console.error('Streaming error:', err);
      }
    }
  };

  const handleStreamError = (error: Error) => {
    if (!mountedRef.current) return;
    setError(error.message);
    console.error('Media capture error:', error);
  };

  const handleStopStream = () => {
    if (streamManagerRef.current) {
      streamManagerRef.current.stopStreaming();
      streamManagerRef.current = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsStreaming(false);
    setStreamKey(null);
    setError(null);
    onStopStream?.();
  };

  const handleStartStream = async () => {
    if (!mediaStream) {
      setError('No media stream available');
      return;
    }
    await initializeStream();
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 bg-white shadow-lg rounded-lg transition-all duration-300 ${expanded ? 'w-96 h-[480px]' : 'w-64 h-20'} flex flex-col`}
      style={{ minHeight: expanded ? 320 : 56 }}
    >
      <div className="flex items-center justify-between p-2 border-b cursor-pointer" onClick={() => setExpanded((e) => !e)}>
        <span className="font-semibold text-sm">Your Livestream</span>
        <button className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">{expanded ? 'Collapse' : 'Expand'}</button>
      </div>
      {expanded && (
        <div className="flex-1 flex flex-col p-3">
          {error ? (
            <div className="w-full h-48 rounded mb-2 bg-red-100 flex items-center justify-center text-red-500 p-4 text-center">
              <p>{error}</p>
              <button 
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => setError(null)}
              >
                Dismiss
              </button>
            </div>
          ) : (
            <>
              <MediaCapture
                onStreamReady={handleStreamReady}
                onStreamError={handleStreamError}
              />
              <div className="flex gap-2 mt-auto">
                {isStreaming ? (
                  <button
                    className="flex-1 bg-red-500 text-white rounded px-3 py-1 hover:bg-red-600"
                    onClick={handleStopStream}
                  >
                    Stop Stream
                  </button>
                ) : (
                  <button
                    className={`flex-1 bg-green-500 text-white rounded px-3 py-1 hover:bg-green-600 ${isInitializing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleStartStream}
                    disabled={isInitializing}
                  >
                    {isInitializing ? 'Initializing...' : 'Start Stream'}
                  </button>
                )}
              </div>
            </>
          )}
          {isStreaming && streamKey && (
            <div className="mt-2 text-xs text-gray-500">
              <div><b>Stream Key:</b> <span className="font-mono">{streamKey}</span></div>
              <div className="mt-1">Streaming directly from your browser.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingLiveStreamWindow; 