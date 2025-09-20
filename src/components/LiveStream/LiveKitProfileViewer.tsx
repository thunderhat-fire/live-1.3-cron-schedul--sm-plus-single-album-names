import React, { useEffect, useState } from 'react';
import { LiveKitRoom, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useStreamPlaceholder } from '@/hooks/useStreamPlaceholder';

interface LiveKitProfileViewerProps {
  roomName: string;
}

const LiveKitProfileViewer: React.FC<LiveKitProfileViewerProps> = ({ roomName }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchToken() {
      setLoading(true);
      const res = await fetch(`/api/livekit/viewer-token/${roomName}`);
      const data = await res.json();
      setToken(data.token);
      setLoading(false);
    }
    fetchToken();
  }, [roomName]);

  useEffect(() => {
    if (token) {
      console.log('LiveKitProfileViewer: Connecting with', {
        roomName,
        tokenPrefix: token.substring(0, 10),
        serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL
      });
    }
  }, [token, roomName]);

  // Only render the viewer if we have a token and are not loading
  if (loading || !token) {
    return null;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
      video={true}
      audio={true}
      style={{ width: '100%' }}
    >
      <RemoteVideoGrid />
    </LiveKitRoom>
  );
};

function RemoteVideoGrid() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);
  const { placeholderVideo } = useStreamPlaceholder();

  // Debug: log all received tracks and their types
  useEffect(() => {
    console.log('LiveKitProfileViewer: Tracks received:', tracks.map(t => ({
      sid: t.publication.trackSid,
      kind: t.publication.kind,
      source: t.source,
      participant: t.participant.identity,
      isSubscribed: t.publication.isSubscribed,
      isMuted: t.publication.isMuted,
      track: t.publication.track
    })));
  }, [tracks]);

  // Find video and audio tracks
  const videoTrack = tracks.find(track => track.publication.kind === 'video' && track.publication.track);
  const audioTrack = tracks.find(track => track.publication.kind === 'audio' && track.publication.track);

  return (
    <div className="w-full max-w-xs aspect-[16/9] min-h-[68px] bg-black rounded-2xl relative flex items-center justify-center mx-auto border-2 border-blue-500">
      {tracks.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-600 rounded-lg">
          <div className="text-center text-white">
            <h4 className="text-lg font-semibold mb-1">Stream Starting Soon</h4>
            <p className="text-xs opacity-75">The Artist may choose to stream shortly</p>
          </div>
        </div>
      ) : (
        <>
          {/* Video Element */}
          {videoTrack ? (
            <video
              key={videoTrack.publication.trackSid}
              ref={el => {
                if (el && videoTrack.publication.track) {
                  videoTrack.publication.track.attach(el);
                }
              }}
              autoPlay
              muted={false} // Allow audio playback
              className="absolute inset-0 w-full h-full object-cover"
              style={{ background: 'black' }}
            />
          ) : (
            <span className="text-white">No video track found.</span>
          )}
          
          {/* Audio Element - separate for better control */}
          {audioTrack && (
            <audio
              key={audioTrack.publication.trackSid}
              ref={el => {
                if (el && audioTrack.publication.track) {
                  audioTrack.publication.track.attach(el);
                }
              }}
              autoPlay
              style={{ display: 'none' }} // Hidden but functional
            />
          )}
        </>
      )}
    </div>
  );
}

export default LiveKitProfileViewer; 