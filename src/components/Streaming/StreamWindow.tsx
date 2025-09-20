import React, { useState, useRef, useEffect } from 'react';

interface StreamWindowProps {
  userId: string;
}

export const StreamWindow: React.FC<StreamWindowProps> = ({ userId }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamData, setStreamData] = useState<{
    id: string;
    streamKey: string;
    rtmpUrl: string;
    status: string;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const createStream = async () => {
    try {
      console.log('Creating stream in backend...');
      const response = await fetch('/api/streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: 'Live Stream',
          userId: userId 
        }),
      });

      console.log('Stream creation response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Stream creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create stream');
      }

      const data = await response.json();
      console.log('Stream created successfully:', {
        id: data.id,
        hasStreamKey: !!data.streamKey,
        status: data.status
      });

      return data;
    } catch (err) {
      console.error('Error creating stream:', err);
      throw err;
    }
  };

  const startStream = async () => {
    try {
      console.log('Starting stream process...');
      setError(null);

      // First create the stream
      const streamData = await createStream();
      setStreamData(streamData);
      
      // Then request webcam access
      console.log('Requesting user media...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('User media obtained successfully');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log('Video preview set up');
      }

      setIsStreaming(true);
    } catch (err) {
      console.error('Error in startStream:', err);
      setError(err instanceof Error ? err.message : 'Failed to start stream');
      setIsStreaming(false);
    }
  };

  const stopStream = async () => {
    try {
      console.log('Stopping stream...');
      if (streamData?.id) {
        const response = await fetch(`/api/streams?id=${streamData.id}`, {
          method: 'DELETE',
        });
        console.log('Stop stream response:', {
          status: response.status,
          ok: response.ok
        });
      }

      if (videoRef.current?.srcObject) {
        const mediaStream = videoRef.current.srcObject as MediaStream;
        mediaStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
        console.log('Media tracks stopped');
      }

      setStreamData(null);
      setIsStreaming(false);
      console.log('Stream stopped successfully');
    } catch (err) {
      console.error('Error in stopStream:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop stream');
    }
  };

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const mediaStream = videoRef.current.srcObject as MediaStream;
        mediaStream.getTracks().forEach(track => track.stop());
        console.log('Cleanup: Media tracks stopped');
      }
    };
  }, []);

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <div className="space-y-4">
        <div className="aspect-video relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {error && (
          <div className="p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {streamData && (
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-gray-100 rounded">
              <p className="font-medium">RTMP URL:</p>
              <p className="font-mono text-xs break-all">{streamData.rtmpUrl}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded">
              <p className="font-medium">Stream Key:</p>
              <p className="font-mono text-xs break-all">{streamData.streamKey}</p>
            </div>
            <p className="text-sm">Status: {streamData.status}</p>
            <div className="text-xs text-gray-500">
              <p>Use these credentials in your streaming software (OBS, Streamlabs, etc.)</p>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          {!isStreaming ? (
            <button
              onClick={startStream}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Start Stream
            </button>
          ) : (
            <button
              onClick={stopStream}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Stop Stream
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 