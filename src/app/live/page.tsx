'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { StreamProvider } from '@/contexts/StreamContext';
import { isPlusMember } from '@/utils/membership';
import LiveKitStreamHost from '@/components/LiveStream/LiveKitStreamHost';
import { useRouter } from 'next/navigation';

const LivePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isPlusMember, setIsPlusMember] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [isStartingStream, setIsStartingStream] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [endedByTimer, setEndedByTimer] = useState(false);

  // Check Plus membership status
  useEffect(() => {
    const checkPlusMembership = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/membership/check/${session.user.id}`);
          if (!response.ok) throw new Error('Failed to check membership');
          const data = await response.json();
          setIsPlusMember(data.isPlusMember);
        } catch (error) {
          console.error('Error checking Plus membership:', error);
          setIsPlusMember(false);
        }
      }
    };
    checkPlusMembership();
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === 'loading') return;
    const tier = session?.user?.subscriptionTier;
    if (tier !== 'plus' && tier !== 'gold') {
      router.replace('/live-upsell');
    }
  }, [session, status, router]);

  // Fetch LiveKit token when user wants to start streaming
  const fetchLiveKitToken = async () => {
    if (!session?.user?.id) return null;
    
    try {
      const response = await fetch('/api/livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          room: session.user.id, 
          identity: session.user.id 
        }),
      });
      
      if (response.ok) {
      const data = await response.json();
        setLiveKitToken(data.token);
        return data.token;
      } else {
        console.error('Failed to fetch LiveKit token');
        return null;
      }
    } catch (error) {
      console.error('Error fetching LiveKit token:', error);
      return null;
    }
  };

  const testEgressAPI = async () => {
    if (!session?.user?.id) return;
    
    setTestResult('Testing egress API...');
    console.log('=== TESTING EGRESS API ===');
    
    try {
      const response = await fetch('/api/egress/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: session.user.id }),
      });

      console.log('Egress API Response Status:', response.status);
      console.log('Egress API Response Headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Egress API Response Data:', data);

      if (response.ok) {
        setTestResult(`✅ Egress API Success! Egress ID: ${data.egressId}`);
      } else {
        setTestResult(`❌ Egress API Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Egress API Test Error:', error);
      setTestResult(`❌ Egress API Test Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Timer effect
  useEffect(() => {
    if (isStreaming && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else if (!isStreaming) {
      setTimer(600);
      if (timerInterval) clearInterval(timerInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  // End stream when timer hits 0
  useEffect(() => {
    if (isStreaming && timer === 0) {
      setEndedByTimer(true);
      handleEndStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, isStreaming]);

  const handleStartStream = async () => {
    if (!isPlusMember || !session?.user?.id) return;
    
    setIsStartingStream(true);
    setError(null);
    console.log('Attempting to start stream...');
    try {
      console.log('1. Fetching LiveKit token...');
      const token = await fetchLiveKitToken();
       if (!token) {
        throw new Error("Failed to get LiveKit token");
      }
      console.log('1. Fetched LiveKit token successfully.');

      // Set the token and streaming state FIRST to create the room
      console.log('2. Setting up LiveKit room...');
      setLiveKitToken(token);
      setIsStreaming(true);
      setEndedByTimer(false);
      setTimer(600);
      console.log('2. LiveKit room setup initiated.');

      // Wait a moment for the room to be created
      console.log('3. Waiting for room to be created...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      // Check if room exists and HLS is available
      console.log('3.5. Checking if room exists...');
      try {
        const roomCheckResponse = await fetch(`/api/live-status/${session.user.id}`);
        const roomCheckData = await roomCheckResponse.json();
        console.log('3.5. Room check result:', roomCheckData);
        
        if (roomCheckData.isLive && roomCheckData.hlsUrl) {
          console.log('3.5. HLS is already available:', roomCheckData.hlsUrl);
          console.log('4. Stream is now live!');
          return; // Exit early since HLS is already available
        } else {
          console.log('3.5. Room exists but HLS not ready yet, waiting...');
          // Wait a bit more for HLS to become available
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.log('3.5. Room check failed:', error);
      }

      // LiveKit Cloud automatically starts HLS when a room is live
      // No manual egress control needed
      console.log('4. LiveKit Cloud will automatically start HLS when stream begins');
      console.log('5. Stream is now live!');
    } catch (error: any) {
      console.error('Error starting stream:', error);
      setError(error.message || 'An unknown error occurred.');
      // Reset state on error
      setIsStreaming(false);
      setLiveKitToken(null);
      setEgressId(null);
    } finally {
      setIsStartingStream(false);
    }
  };

  const handleEndStream = async () => {
    console.log('Attempting to end stream...');
    if (egressId) {
      console.log('1. Stopping egress with ID:', egressId);
      try {
        await fetch('/api/egress/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ egressId }),
        });
        console.log('1. Egress stopped successfully.');
      } catch (error) {
        console.error('Error stopping egress:', error);
      }
    }
    setIsStreaming(false);
    setLiveKitToken(null);
    setEgressId(null);
    setError(null);
    setTimer(600);
    if (timerInterval) clearInterval(timerInterval);
    setEndedByTimer(false);
    console.log('2. Stream ended and state cleaned up.');
  };

  // Broadcast to followers
  const sendBroadcast = async () => {
    if (!broadcastMsg.trim() || !session?.user?.id) return;
    setBroadcastStatus('Sending...');
    try {
      const res = await fetch(`/api/user/${session.user.id}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: broadcastMsg }),
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcastStatus(`Message sent to ${data.sent} follower${data.sent === 1 ? '' : 's'}!`);
        setBroadcastMsg('');
      } else {
        const data = await res.json();
        setBroadcastStatus(data.error || 'Failed to send message.');
      }
    } catch (err) {
      setBroadcastStatus('Failed to send message.');
    }
  };

  return (
    <StreamProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Live Stream</h1>
          {isPlusMember && (
            <div className="flex items-center gap-4">
              <p className="text-neutral-600 dark:text-neutral-400">
                As a Plus member, you can create live streams and interact with your audience.
              </p>
              {isStreaming ? (
              <button
                  onClick={handleEndStream}
                  className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
                  disabled={timer === 0}
              >
                  End Stream
              </button>
              ) : null}
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
          {testResult && (
            <div className="mt-4 p-3 bg-blue-100 border-blue-400 text-blue-700 rounded">
              <strong>Test Result:</strong> {testResult}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Show stream creation interface if user is streaming */}
            {isStreaming && liveKitToken ? (
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Your Live Stream</h2>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        You&apos;re live now! Share your stream with your audience.
                          </p>
                        </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>LIVE</span>
                      </div>
                      <button
                        onClick={handleEndStream}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                        disabled={timer === 0}
                      >
                        End Stream
                      </button>
                    </div>
                  </div>
                </div>
                <div className="aspect-video bg-neutral-900 relative">
                  <LiveKitStreamHost
                    token={liveKitToken}
                    roomName={session?.user?.id || ''}
                    onStreamStarted={() => {
                      console.log('LiveKit Component: Stream started successfully.');
                    }}
                    onStreamEnded={() => {
                      console.log('LiveKit Component: Stream ended.');
                      handleEndStream();
                    }}
                  />
                  {/* Timer overlay always visible while streaming */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-lg font-mono shadow-lg pointer-events-none select-none">
                    Time left: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                {/* Show end message below video if ended by timer */}
                {endedByTimer && (
                  <div className="p-4 text-center text-red-600 font-semibold">
                    Stream ended: Maximum duration (10 minutes) reached.
                  </div>
                )}
                {/* Broadcast to followers UI */}
                {isPlusMember && (
                  <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
                    <h3 className="text-lg font-semibold mb-2">Broadcast a message to all your followers</h3>
                    <textarea
                      className="w-full rounded border dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 mb-2"
                      rows={3}
                      placeholder="Type your message to all followers..."
                      value={broadcastMsg}
                      onChange={e => setBroadcastMsg(e.target.value)}
                      disabled={broadcastStatus === 'Sending...'}
                    />
                    <button
                      onClick={sendBroadcast}
                      disabled={!broadcastMsg.trim() || broadcastStatus === 'Sending...' || !session?.user?.id}
                      className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {broadcastStatus === 'Sending...' ? 'Sending...' : 'Send to All Followers'}
                    </button>
                    {broadcastStatus && (
                      <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{broadcastStatus}</div>
                    )}
          </div>
        )}
              </div>
            ) : (
              /* Show viewer interface or start stream prompt */
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Ready to Go Live?</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    Start your live stream and connect with your audience in real-time.
                  </p>
                  {isPlusMember ? (
                    <button
                      onClick={handleStartStream}
                      disabled={isStartingStream}
                      className="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {isStartingStream ? 'Starting...' : 'Start Your Stream'}
                  </button>
                  ) : (
                    <div className="text-sm text-neutral-500">
                      Upgrade to Plus or Gold to start streaming
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StreamProvider>
  );
};

export default LivePage; 