'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import { ArrowDownTrayIcon, ClockIcon } from '@heroicons/react/24/outline';

interface MasteringRequest {
  id: string;
  originalTrackUrl: string;
  masteredTrackUrl?: string;
  status: string;
  createdAt: string;
}

export default function MasteredTracksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<MasteringRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/mastered-tracks');
      return;
    }

    if (session) {
      fetchRequests();
    }
  }, [session, router, status]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mastering-request');
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching mastering requests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  const completedTracks = requests.filter(
    (req) => req.status === 'completed' && req.masteredTrackUrl
  );

  const pendingTracks = requests.filter(
    (req) => req.status === 'pending'
  );

  return (
    <div className="container py-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">🎵 Your Mastered Tracks</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Download your professionally mastered tracks
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-500">Loading your mastered tracks...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Completed Tracks Section */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-green-600 dark:text-green-400">
              ✅ Ready for Download ({completedTracks.length})
            </h2>
            
            {completedTracks.length === 0 ? (
              <div className="text-center py-8">
                <ArrowDownTrayIcon className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-500 mb-4">No mastered tracks available yet.</p>
                <ButtonPrimary
                  onClick={() => router.push('/mastering-upload')}
                  className="text-sm"
                >
                  Upload Track for Mastering
                </ButtonPrimary>
              </div>
            ) : (
              <div className="space-y-4">
                {completedTracks.map((track) => (
                  <div 
                    key={track.id} 
                    className="border border-green-200 dark:border-green-800 rounded-lg p-6 bg-green-50 dark:bg-green-900/20"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-grow">
                        <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">
                          Mastered Track
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          <strong>Submitted:</strong> {new Date(track.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          ✓ Mastering complete - Ready to download
                        </p>
                      </div>
                      <div className="mt-4 md:mt-0 flex gap-3">
                        <a
                          href={track.originalTrackUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                        >
                          Original Track
                        </a>
                        <a
                          href={track.masteredTrackUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          Download Mastered
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Tracks Section */}
          {pendingTracks.length > 0 && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold mb-6 text-yellow-600 dark:text-yellow-400">
                ⏳ In Progress ({pendingTracks.length})
              </h2>
              
              <div className="space-y-4">
                {pendingTracks.map((track) => (
                  <div 
                    key={track.id} 
                    className="border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 bg-yellow-50 dark:bg-yellow-900/20"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-grow">
                        <h3 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                          Track in Queue
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          <strong>Submitted:</strong> {new Date(track.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          Being processed - You'll be notified when ready
                        </p>
                      </div>
                      <div className="mt-4 md:mt-0">
                        <a
                          href={track.originalTrackUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                        >
                          View Original
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload More Section */}
          <div className="text-center py-8">
            <ButtonPrimary
              onClick={() => router.push('/mastering-upload')}
              className="text-lg px-8 py-3"
            >
              Upload Another Track for Mastering
            </ButtonPrimary>
          </div>
        </div>
      )}
    </div>
  );
}
