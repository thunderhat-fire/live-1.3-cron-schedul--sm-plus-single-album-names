'use client';

import React, { useState, useEffect } from 'react';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import ButtonSecondary from '@/shared/Button/ButtonSecondary';

interface PlaylistAlgorithm {
  name: string;
  description: string;
  weightFactors: {
    genre: number;
    artist: number;
    popularity: number;
    recency: number;
    diversity: number;
  };
}

interface PlaylistPerformance {
  totalPlays: number;
  averageListenTime: number;
  skipRate: number;
  popularTracks: string[];
  unpopularTracks: string[];
}

export default function AdvancedRadioAdminPage() {
  const [algorithms, setAlgorithms] = useState<Record<string, PlaylistAlgorithm>>({});
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('balanced');
  const [isLoading, setIsLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState<PlaylistPerformance | null>(null);
  const [playlistConfig, setPlaylistConfig] = useState({
    maxDuration: 3600,
    includeTTS: true,
    voiceId: 'default',
    shuffleTracks: true,
    algorithm: 'balanced',
  });

  useEffect(() => {
    fetchAlgorithms();
  }, []);

  const fetchAlgorithms = async () => {
    try {
      const response = await fetch('/api/radio/playlist/advanced?algorithms=true');
      const data = await response.json();

      if (data.success) {
        setAlgorithms(data.algorithms);
      }
    } catch (error) {
      console.error('Error fetching algorithms:', error);
      alert('Failed to fetch algorithms');
    }
  };

  const generateAdvancedPlaylist = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/radio/playlist/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playlistConfig),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Advanced playlist generated successfully using ${data.algorithm} algorithm!`);
      } else {
        alert('Failed to generate advanced playlist');
      }
    } catch (error) {
      console.error('Error generating playlist:', error);
      alert('Failed to generate advanced playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzePerformance = async (playlistId: string) => {
    try {
      const response = await fetch(`/api/radio/playlist/advanced?performance=true&playlistId=${playlistId}`);
      const data = await response.json();

      if (data.success) {
        setPerformanceData(data.performance);
      } else {
        alert('Failed to analyze performance');
      }
    } catch (error) {
      console.error('Error analyzing performance:', error);
      alert('Failed to analyze performance');
    }
  };

  const getAlgorithmColor = (algorithmKey: string) => {
    const colors = {
      balanced: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      discovery: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      popular: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      genreSpecific: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return colors[algorithmKey as keyof typeof colors] || colors.balanced;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🎵 Advanced Radio Management</h1>

        {/* Algorithm Selection */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Intelligent Playlist Algorithms</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {Object.entries(algorithms).map(([key, algorithm]) => (
              <div
                key={key}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedAlgorithm === key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedAlgorithm(key);
                  setPlaylistConfig(prev => ({ ...prev, algorithm: key }));
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{algorithm.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${getAlgorithmColor(key)}`}>
                    {key}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {algorithm.description}
                </p>
                
                {/* Weight Factors Visualization */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Genre Diversity</span>
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${algorithm.weightFactors.genre * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Artist Diversity</span>
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${algorithm.weightFactors.artist * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Popularity</span>
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${algorithm.weightFactors.popularity * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Recency</span>
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${algorithm.weightFactors.recency * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Configuration */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Advanced Playlist Configuration</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Max Duration (seconds)</label>
              <input
                type="number"
                value={playlistConfig.maxDuration}
                onChange={(e) => setPlaylistConfig({
                  ...playlistConfig,
                  maxDuration: parseInt(e.target.value)
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Voice ID</label>
              <select
                value={playlistConfig.voiceId}
                onChange={(e) => setPlaylistConfig({
                  ...playlistConfig,
                  voiceId: e.target.value
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800"
              >
                <option value="default">Default (Rachel)</option>
                <option value="male">Male (Dom)</option>
                <option value="female">Female (Bella)</option>
                <option value="british">British (Arnold)</option>
                <option value="australian">Australian (Adam)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={playlistConfig.includeTTS}
                onChange={(e) => setPlaylistConfig({
                  ...playlistConfig,
                  includeTTS: e.target.checked
                })}
                className="mr-2"
              />
              Include TTS Introductions
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={playlistConfig.shuffleTracks}
                onChange={(e) => setPlaylistConfig({
                  ...playlistConfig,
                  shuffleTracks: e.target.checked
                })}
                className="mr-2"
              />
              Shuffle Tracks
            </label>
          </div>

          <ButtonPrimary
            onClick={generateAdvancedPlaylist}
            disabled={isLoading}
            sizeClass="px-6 py-2"
          >
            {isLoading ? 'Generating...' : 'Generate Advanced Playlist'}
          </ButtonPrimary>
        </div>

        {/* Performance Analysis */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Performance Analytics</h2>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Enter playlist ID to analyze..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const playlistId = (e.target as HTMLInputElement).value;
                  if (playlistId) {
                    analyzePerformance(playlistId);
                  }
                }
              }}
            />
          </div>

          {performanceData && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Listening Statistics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Plays:</span>
                    <span className="font-medium">{performanceData.totalPlays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Listen Time:</span>
                    <span className="font-medium">{performanceData.averageListenTime.toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Skip Rate:</span>
                    <span className="font-medium">{(performanceData.skipRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Track Performance</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-green-600">Popular Tracks:</span>
                    <ul className="text-sm text-gray-600 dark:text-gray-400">
                      {performanceData.popularTracks.map((track, index) => (
                        <li key={index}>• {track}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-red-600">Unpopular Tracks:</span>
                    <ul className="text-sm text-gray-600 dark:text-gray-400">
                      {performanceData.unpopularTracks.map((track, index) => (
                        <li key={index}>• {track}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Algorithm Comparison */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Algorithm Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2">Algorithm</th>
                  <th className="text-left py-2">Genre Weight</th>
                  <th className="text-left py-2">Artist Weight</th>
                  <th className="text-left py-2">Popularity Weight</th>
                  <th className="text-left py-2">Recency Weight</th>
                  <th className="text-left py-2">Diversity Weight</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(algorithms).map(([key, algorithm]) => (
                  <tr key={key} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 font-medium">{algorithm.name}</td>
                    <td className="py-2">{(algorithm.weightFactors.genre * 100).toFixed(0)}%</td>
                    <td className="py-2">{(algorithm.weightFactors.artist * 100).toFixed(0)}%</td>
                    <td className="py-2">{(algorithm.weightFactors.popularity * 100).toFixed(0)}%</td>
                    <td className="py-2">{(algorithm.weightFactors.recency * 100).toFixed(0)}%</td>
                    <td className="py-2">{(algorithm.weightFactors.diversity * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 