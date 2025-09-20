'use client';

import { LiveKitRoom, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';

const LIVEKIT_URL = 'wss://vinylfunders-gdqiiai0.livekit.cloud';
// User 1 token
const TOKEN_USER1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTAyMDg0MzUsImlzcyI6IkFQSWR6ZjR1YlVHVGlYdCIsIm5iZiI6MTc1MDIwNzUzNSwic3ViIjoidXNlciAxIiwidmlkZW8iOnsiY2FuUHVibGlzaCI6dHJ1ZSwiY2FuUHVibGlzaERhdGEiOnRydWUsImNhblN1YnNjcmliZSI6dHJ1ZSwicm9vbSI6InRlc3Qgcm9vbTIiLCJyb29tSm9pbiI6dHJ1ZX19.XYCasK2Zc-fObBL415VUbL6hWptf-pAn_BAL8YyULqM';
// User 2 token
// Toggle this to switch users for testing
const TOKEN = TOKEN_USER1; // Change to TOKEN_USER2 in your second window

function VideoGrid() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {tracks.map(track => (
        <video
          key={track.publication.trackSid}
          ref={el => {
            if (el && track.publication.track) {
              track.publication.track.attach(el);
            }
          }}
          autoPlay
          style={{ width: 320, height: 240, background: '#000' }}
        />
      ))}
    </div>
  );
}

export default function TestLiveKit() {
  return (
    <LiveKitRoom
      serverUrl={LIVEKIT_URL}
      token={TOKEN}
      connect={true}
      video={true}
      audio={true}
      style={{ height: '100vh' }}
    >
      <h1>LiveKit Minimal Test</h1>
      <VideoGrid />
    </LiveKitRoom>
  );
} 