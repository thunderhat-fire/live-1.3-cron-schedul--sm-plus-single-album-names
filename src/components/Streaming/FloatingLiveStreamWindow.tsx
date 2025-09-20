'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useStreamStore } from '@/store/streamStore';
import dynamic from 'next/dynamic';

console.log('FloatingLiveStreamWindow mounted');

interface StreamInfo {
  id: string;
  streamKey: string;
  playbackId: string;
  status: string;
}

const FloatingLiveStreamWindow: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { 
    mediaStream, 
    setMediaStream,
    streamKey,
    setStreamKey,
    rtmpUrl,
    setRtmpUrl
  } = useStreamStore();

  useEffect(() => {
    let localStream: MediaStream | null = null;
    let cancelled = false;

    // Only initialize if we don't already have a stream
    if (!mediaStream) {
      setLoading(true);
      setError(null);
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (cancelled) return;
          localStream = stream;
          setMediaStream(stream);
          setLoading(false);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          console.log('MediaStream obtained');
        })
        .catch((err) => {
          if (cancelled) return;
          setError("Could not access camera or microphone. Please check your permissions.");
          setLoading(false);
          console.error('getUserMedia error:', err);
        });
    } else {
      // If we already have a stream, just assign it to the video
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setLoading(false);
    }

    return () => {
      cancelled = true;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      setMediaStream(null);
    };
    // Only run on mount/unmount
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    let isMounted = true;
    const startStreaming = async () => {
      setStatus('connecting');
      setError(null);
      try {
        // 1. Get user media
        let localStream: MediaStream | null = null;
        setLoading(true);
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!isMounted) return;
        setMediaStream(localStream);
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }
        setLoading(false);
        console.log('Step 1: MediaStream ready');

        // 2. Create Mux WebRTC stream
        console.log('Step 2: Creating Mux stream...');
        const res = await fetch('/api/webrtc-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Author Live Stream' })
        });
        const muxData = await res.json();
        console.log('Mux stream creation response:', muxData);
        
        if (!res.ok) throw new Error(muxData.error || 'Failed to create Mux stream');
        setStreamInfo(muxData);
        setStreamKey(muxData.streamKey);
        setRtmpUrl(muxData.rtmpUrl);
        console.log('Step 2: Mux stream created', {
          id: muxData.id,
          status: muxData.status,
          webrtc: muxData.webrtc
        });

        // Wait for stream provisioning and check status
        console.log('Waiting for Mux stream provisioning...');
        let streamReady = false;
        let attempts = 0;
        const maxAttempts = 15;
        
        while (!streamReady && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds between checks
          attempts++;
          
          try {
            const statusRes = await fetch(`/api/webrtc-stream/${muxData.id}/status`);
            const statusData = await statusRes.json();
            console.log('Stream status check:', statusData);
            
            // Check if stream is ready for WebRTC
            if (statusData.webrtc?.enabled) {
              // Accept either 'active' or 'idle' status as long as WebRTC is enabled
              if (statusData.status === 'active' || statusData.status === 'idle') {
                streamReady = true;
                console.log('Stream is ready for WebRTC connection:', {
                  status: statusData.status,
                  webrtc: statusData.webrtc
                });
              } else {
                console.log(`Stream status not ready (attempt ${attempts}/${maxAttempts}):`, {
                  status: statusData.status,
                  webrtc: statusData.webrtc
                });
              }
            } else {
              console.log(`WebRTC not enabled yet (attempt ${attempts}/${maxAttempts}):`, {
                status: statusData.status,
                webrtc: statusData.webrtc
              });
            }
          } catch (err) {
            console.error('Error checking stream status:', err);
          }
        }

        if (!streamReady) {
          throw new Error('Stream failed to provision within timeout period. Please try again.');
        }

        // 3. Set up PeerConnection
        console.log('Step 3: Setting up PeerConnection...');
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        });
        pcRef.current = pc;
        
        // Add tracks
        localStream?.getTracks().forEach(track => {
          console.log('Adding track to PeerConnection:', track.kind);
          pc.addTrack(track, localStream!);
        });
        console.log('Step 3: PeerConnection set up, tracks added');

        // 4. Handle ICE candidates
        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            console.log('ICE candidate generated:', {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex
            });
            try {
              const iceRes = await fetch(`/api/webrtc-stream/${muxData.id}/ice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  candidate: event.candidate.candidate,
                  sdpMid: event.candidate.sdpMid,
                  sdpMLineIndex: event.candidate.sdpMLineIndex
                })
              });
              const iceData = await iceRes.json();
              if (!iceRes.ok) {
                console.error('Failed to send ICE candidate:', iceData);
              } else {
                console.log('ICE candidate sent successfully');
              }
            } catch (err) {
              console.error('Error sending ICE candidate:', err);
            }
          }
        };

        // 5. Create offer and set local description
        console.log('Step 5: Creating offer...');
        const offer = await pc.createOffer();
        console.log('Offer created:', offer);
        await pc.setLocalDescription(offer);
        console.log('Local description set');

        // 6. Send offer to backend, get answer
        console.log('Step 6: Sending offer to Mux...');
        const sdpRes = await fetch(`/api/webrtc-stream/${muxData.id}/sdp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sdp: offer.sdp })
        });
        const sdpData = await sdpRes.json();
        console.log('SDP response:', sdpData);
        
        if (!sdpRes.ok) {
          console.error('SDP exchange failed:', sdpData);
          throw new Error(typeof sdpData.error === 'string' ? sdpData.error : JSON.stringify(sdpData.error) || 'Failed to exchange SDP');
        }
        
        await pc.setRemoteDescription({ type: 'answer', sdp: sdpData.sdp });
        console.log('Remote description set with answer');

        setStatus('live');
        console.log('Step 7: Status set to live');
      } catch (err: any) {
        console.error('Streaming error:', err);
        setError(err.message || 'Unknown error');
        setStatus('error');
        // Stop capturing if connection fails
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop());
          setMediaStream(null);
        }
      }
    };
    startStreaming();
    return () => {
      isMounted = false;
      // Cleanup
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
    };
  }, []);

  if (!streamInfo) {
    return (
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 360,
        background: '#222',
        color: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        zIndex: 1000,
        padding: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Live Stream</strong>
          <button onClick={onClose} style={{ background: 'none', color: '#fff', border: 'none', fontSize: 20, cursor: 'pointer' }}>&times;</button>
        </div>
        <div style={{ 
          width: '100%', 
          height: 200, 
          borderRadius: 8, 
          marginTop: 12, 
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {loading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : (
            <span>Initializing camera and microphone...</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      width: 360,
      background: '#222',
      color: '#fff',
      borderRadius: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      zIndex: 1000,
      padding: 16
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Live Stream</strong>
        <button onClick={onClose} style={{ background: 'none', color: '#fff', border: 'none', fontSize: 20, cursor: 'pointer' }}>&times;</button>
      </div>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: 8, marginTop: 12, background: '#000' }} />
      <div style={{ marginTop: 12 }}>
        <div>Status: <b>{status}</b></div>
        {streamInfo && (
          <>
            <div>Stream ID: <code>{streamInfo.id}</code></div>
            <div>Playback ID: <code>{streamInfo.playbackId}</code></div>
          </>
        )}
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      </div>
    </div>
  );
};

// Export as a dynamic component with no SSR
export default dynamic(() => Promise.resolve(FloatingLiveStreamWindow), {
  ssr: false
}); 