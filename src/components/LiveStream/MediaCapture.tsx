import React, { useEffect, useRef, useState } from 'react';

interface MediaCaptureProps {
  onStreamReady: (stream: MediaStream) => void;
  onStreamError: (error: Error) => void;
}

const MediaCapture: React.FC<MediaCaptureProps> = ({ onStreamReady, onStreamError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const startCapture = async () => {
      try {
        if (!mounted) return;
        setIsLoading(true);
        setError(null);

        // Request both video and audio
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 2
          }
        });

        // Debug: log audio track settings and events
        const audioTracks = stream.getAudioTracks();
        audioTracks.forEach(track => {
          console.log('[MediaCapture] Audio track settings:', track.getSettings());
          track.onmute = () => console.log('[MediaCapture] Audio track muted');
          track.onunmute = () => console.log('[MediaCapture] Audio track unmuted');
          track.onended = () => console.log('[MediaCapture] Audio track ended');
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        // Set the stream to the video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Notify parent component that stream is ready
        onStreamReady(stream);
        setIsLoading(false);
      } catch (err) {
        if (!mounted) return;
        const error = err instanceof Error ? err : new Error('Failed to access media devices');
        setError(error.message);
        onStreamError(error);
        setIsLoading(false);
      }
    };

    startCapture();

    // Cleanup function
    return () => {
      mounted = false;
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onStreamReady, onStreamError]);

  if (error) {
    return (
      <div className="w-full h-48 rounded mb-2 bg-red-100 flex items-center justify-center text-red-500 p-4 text-center">
        <p>Error accessing camera/microphone: {error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-48 rounded mb-2 bg-gray-100 flex items-center justify-center text-gray-500">
        <p>Initializing camera and microphone...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 rounded mb-2 overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        Live Preview
      </div>
    </div>
  );
};

export default MediaCapture; 