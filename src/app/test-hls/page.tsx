'use client';

import React, { useState } from 'react';

const TestHLSPage = () => {
  const [hlsUrl, setHlsUrl] = useState('');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">HLS Stream Test</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">HLS URL:</label>
        <input
          type="text"
          value={hlsUrl}
          onChange={(e) => setHlsUrl(e.target.value)}
          placeholder="Enter HLS URL (e.g., https://your-livekit-server.com/hls/room-name/index.m3u8)"
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {hlsUrl && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold">HLS Stream</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{hlsUrl}</p>
          </div>
          <div className="aspect-video bg-neutral-900">
            {/* Placeholder for the removed HLSVideoPlayer */}
          </div>
        </div>
      )}

      <div className="mt-8 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Test URLs</h3>
        <div className="space-y-2">
          {/* Placeholder for the removed Mux test streams */}
        </div>
      </div>
    </div>
  );
};

export default TestHLSPage; 