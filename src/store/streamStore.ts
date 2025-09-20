import create from 'zustand';

interface StreamState {
  isStreaming: boolean;
  setIsStreaming: (isStreaming: boolean) => void;
  mediaStream: MediaStream | null;
  setMediaStream: (stream: MediaStream | null) => void;
  streamKey: string | null;
  setStreamKey: (key: string | null) => void;
  rtmpUrl: string | null;
  setRtmpUrl: (url: string | null) => void;
}

export const useStreamStore = create<StreamState>((set) => ({
  isStreaming: false,
  setIsStreaming: (isStreaming: boolean) => {
    console.log('[Zustand] setIsStreaming:', isStreaming);
    set({ isStreaming });
  },
  mediaStream: null,
  setMediaStream: (stream: MediaStream | null) => {
    console.log('[Zustand] setMediaStream:', stream);
    set({ mediaStream: stream });
  },
  streamKey: null,
  setStreamKey: (key: string | null) => {
    console.log('[Zustand] setStreamKey:', key);
    set({ streamKey: key });
  },
  rtmpUrl: null,
  setRtmpUrl: (url: string | null) => {
    console.log('[Zustand] setRtmpUrl:', url);
    set({ rtmpUrl: url });
  },
})); 