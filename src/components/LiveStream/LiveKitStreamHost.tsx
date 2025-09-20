import { Room } from 'livekit-client';
import { useEffect, useState, useRef } from 'react';
import { LiveKitRoom, VideoConference, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';

interface LiveKitStreamHostProps {
  token: string;
  roomName: string;
  onStreamStarted?: () => void;
  onStreamEnded?: () => void;
}

interface LiveKitError extends Error {
  code?: number;
}

function PublisherVideo({ publisherIdentity }: { publisherIdentity: string }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);
  const publisherVideoTrack = tracks.find(
    (track) => track.participant.identity === publisherIdentity && track.source === Track.Source.Camera
  );
  const publisherAudioTrack = tracks.find(
    (track) => track.participant.identity === publisherIdentity && track.source === Track.Source.Microphone
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach/detach the video track reliably
  useEffect(() => {
    const videoEl = videoRef.current as HTMLMediaElement | null;
    const mediaTrack = publisherVideoTrack?.publication.track;
    if (mediaTrack && videoEl) {
      mediaTrack.attach(videoEl);
      return () => {
        mediaTrack.detach(videoEl);
      };
    }
  }, [publisherVideoTrack]);

  // Attach/detach the audio track reliably
  useEffect(() => {
    const videoEl = videoRef.current as HTMLMediaElement | null;
    const audioTrack = publisherAudioTrack?.publication.track;
    if (audioTrack && videoEl) {
      audioTrack.attach(videoEl);
      return () => {
        audioTrack.detach(videoEl);
      };
    }
  }, [publisherAudioTrack]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {publisherVideoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          controls
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ textAlign: 'center' }}>
          <img
            src="/no-stream-placeholder.png"
            alt="No live stream available"
            style={{ width: 240, height: 135, objectFit: 'cover', borderRadius: 12, margin: '0 auto 16px auto', background: '#222' }}
          />
          <button
            style={{
              background: '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 16,
              cursor: 'not-allowed',
              opacity: 0.8
            }}
            disabled
          >
            No live stream available
          </button>
        </div>
      )}
    </div>
  );
}

export default function LiveKitStreamHost({
  token,
  roomName,
  onStreamStarted,
  onStreamEnded,
}: LiveKitStreamHostProps) {
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  console.log('LiveKitStreamHost: Component rendered with:', {
    hasToken: !!token,
    tokenLength: token?.length,
    roomName,
    serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    isConnecting,
    isConnected
  });

  if (!token || typeof token !== 'string' || token.length < 10) {
    console.error('Invalid LiveKit token:', { 
      hasToken: !!token,
      tokenType: typeof token,
      tokenLength: token?.length
    });
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Invalid LiveKit token</p>
        <p className="text-sm text-red-500 mt-2">
          Debug Info:
          <br />
          Server URL: {process.env.NEXT_PUBLIC_LIVEKIT_URL || 'NOT SET'}
          <br />
          Room: {roomName}
          <br />
          Has Token: {token ? 'Yes' : 'No'}
        </p>
      </div>
    );
  }

  if (!process.env.NEXT_PUBLIC_LIVEKIT_URL) {
    console.error('LiveKitStreamHost: NEXT_PUBLIC_LIVEKIT_URL not configured');
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">LiveKit server URL not configured</p>
        <p className="text-sm text-red-500 mt-2">
          NEXT_PUBLIC_LIVEKIT_URL environment variable is missing
        </p>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Connecting to LiveKit...</span>
      </div>
    );
  }

  console.log('LiveKitStreamHost: Connecting with', {
    roomName,
    tokenPrefix: token?.substring(0, 10),
    serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL
  });

  return (
    <div 
      className="w-full bg-neutral-900 rounded-lg overflow-hidden" 
      style={{
        aspectRatio: '16/9'
      }}
    >
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        video={true}
        audio={true}
        onConnected={() => {
          console.log('LiveKitStreamHost: Connected to LiveKit room:', {
            roomName,
            serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
            hasToken: true,
            tokenLength: token.length
          });
          setIsConnecting(false);
          setIsConnected(true);
          onStreamStarted?.();
        }}
        onDisconnected={() => {
          console.log('LiveKitStreamHost: Disconnected from LiveKit room');
          setIsConnected(false);
          setTimeout(() => {
            console.log('LiveKitStreamHost: Calling onStreamEnded after delay');
          onStreamEnded?.();
          }, 1000);
        }}
        onError={(err: LiveKitError) => {
          console.error('LiveKitStreamHost: LiveKit error:', {
            message: err.message,
            code: err.code,
            serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
            roomName,
            hasToken: !!token,
            tokenLength: token?.length
          });
          setError(err.message);
          setIsConnecting(false);
          setIsConnected(false);
        }}
        style={{
          height: '100%',
          width: '100%'
        }}
      >
        <style>
          {`
            .lk-video-conference {
              position: relative;
              width: 100%;
              height: 100%;
            }
            .lk-participant-tile {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
            }
            .lk-participant-media {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
            }
            .lk-control-bar {
              position: absolute;
              bottom: 0;
              left: 50%;
              transform: translateX(-50%) scale(0.65);
              transform-origin: bottom center;
              background: rgba(0, 0, 0, 0.6);
              border-radius: 8px;
              padding: 4px;
              margin-bottom: 4px;
              z-index: 10;
              display: flex;
              gap: 8px;
            }
            .lk-button-group {
              display: flex !important;
              gap: 8px;
            }
            .lk-participant-metadata {
              display: none;
            }
            .lk-control-bar button {
              color: white !important;
            }
            .lk-control-bar button span {
              color: white !important;
            }
            .lk-control-bar svg {
              fill: white !important;
            }
            .lk-chat-toggle {
              display: none !important;
            }
          `}
        </style>
        <PublisherVideo publisherIdentity={roomName} />
      </LiveKitRoom>
    </div>
  );
} 