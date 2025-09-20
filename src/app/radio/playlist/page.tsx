'use client';

import React from 'react';
import RadioPlayer from '@/components/radio/RadioPlayer';

export default function RadioPlaylistPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🎵 VinylFunders Radio Playlist
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Current playlist with TTS ads and NFT tracks
            </p>
          </div>

          {/* Radio Player */}
          <RadioPlayer className="mb-8" />

          {/* Info */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg text-center">
            <h2 className="text-xl font-bold mb-4">About This Playlist</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This playlist includes sponsored messages (ads) and NFT tracks from our community artists.
              Each track may have a TTS introduction that announces the artist and vinyl presale details.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="font-semibold text-blue-600 dark:text-blue-400">🎵 NFT Tracks</div>
                <div className="text-gray-600 dark:text-gray-400">Full-length music from artists</div>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="font-semibold text-orange-600 dark:text-orange-400">📢 TTS Ads</div>
                <div className="text-gray-600 dark:text-gray-400">AI-generated sponsored messages</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="font-semibold text-green-600 dark:text-green-400">🤖 TTS Intros</div>
                <div className="text-gray-600 dark:text-gray-400">Track introductions with artist info</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 