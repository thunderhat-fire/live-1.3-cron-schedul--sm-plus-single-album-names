'use client';

import React, { useState, useEffect } from 'react';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import ButtonSecondary from '@/shared/Button/ButtonSecondary';
import { SystemMetrics, RadioAnalytics, StreamHealth, AdminAction } from '@/lib/radio/adminService';

export default function RadioAdminDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [analytics, setAnalytics] = useState<RadioAnalytics | null>(null);
  const [health, setHealth] = useState<StreamHealth | null>(null);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [healthHistory, setHealthHistory] = useState<StreamHealth[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'health' | 'actions'>('overview');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [metricsRes, analyticsRes, healthRes, actionsRes, healthHistoryRes] = await Promise.all([
        fetch('/api/radio/admin?action=metrics'),
        fetch(`/api/radio/admin?action=analytics&timeRange=${timeRange}`),
        fetch('/api/radio/admin?action=health'),
        fetch('/api/radio/admin?action=actions&limit=20'),
        fetch('/api/radio/admin?action=health-history&limit=10'),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics);
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data.analytics);
      }

      if (healthRes.ok) {
        const data = await healthRes.json();
        setHealth(data.health);
      }

      if (actionsRes.ok) {
        const data = await actionsRes.json();
        setActions(data.actions);
      }

      if (healthHistoryRes.ok) {
        const data = await healthHistoryRes.json();
        setHealthHistory(data.healthHistory);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performAdminAction = async (type: string, description: string, metadata?: any) => {
    try {
      const response = await fetch('/api/radio/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'perform',
          type,
          description,
          metadata,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Admin action performed successfully!');
        fetchDashboardData(); // Refresh data
      } else {
        alert('Failed to perform admin action');
      }
    } catch (error) {
      console.error('Error performing admin action:', error);
      alert('Failed to perform admin action');
    }
  };

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">🎛️ Radio System Dashboard</h1>
          <div className="flex space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <ButtonSecondary
              onClick={fetchDashboardData}
              disabled={isLoading}
              sizeClass="px-4 py-2"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </ButtonSecondary>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-neutral-800 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
            { id: 'health', label: 'System Health', icon: '🏥' },
            { id: 'actions', label: 'Admin Actions', icon: '⚙️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Metrics */}
            {metrics && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <span className="text-2xl">⏱️</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
                      <p className="text-2xl font-bold">{formatUptime(metrics.uptime)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <span className="text-2xl">🎵</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Tracks</p>
                      <p className="text-2xl font-bold">{formatNumber(metrics.totalTracks)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active Listeners</p>
                      <p className="text-2xl font-bold">{formatNumber(metrics.totalListeners)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <span className="text-2xl">📡</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active Streams</p>
                      <p className="text-2xl font-bold">{metrics.activeStreams}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Health Status */}
            {health && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold mb-4">System Health</h2>
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    health.isHealthy 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {health.isHealthy ? '🟢 Healthy' : '🔴 Issues Detected'}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Last checked: {new Date(health.lastCheck).toLocaleString()}
                  </span>
                </div>
                
                {health.issues.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">Issues:</h3>
                    <ul className="space-y-1">
                      {health.issues.map((issue, index) => (
                        <li key={index} className="text-sm text-red-600 dark:text-red-400">
                          • {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {health.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Recommendations:</h3>
                    <ul className="space-y-1">
                      {health.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-blue-600 dark:text-blue-400">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <ButtonPrimary
                  onClick={() => performAdminAction('stream_control', 'Emergency stop all streams', { action: 'stop' })}
                  sizeClass="px-4 py-2"
                >
                  🛑 Emergency Stop
                </ButtonPrimary>
                <ButtonSecondary
                  onClick={() => performAdminAction('system_config', 'Refresh system configuration')}
                  sizeClass="px-4 py-2"
                >
                  🔄 Refresh Config
                </ButtonSecondary>
                <ButtonSecondary
                  onClick={() => performAdminAction('playlist_update', 'Regenerate all playlists')}
                  sizeClass="px-4 py-2"
                >
                  🎵 Regenerate Playlists
                </ButtonSecondary>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Plays</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalPlays)}</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Unique Listeners</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.uniqueListeners)}</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenue Generated</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.revenueGenerated)}</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Ad Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.adRevenue)}</p>
              </div>
            </div>

            {/* Top Genres */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-4">Top Genres</h3>
              <div className="space-y-3">
                {analytics.topGenres.map((genre, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">{genre.genre}</span>
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${genre.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatNumber(genre.plays)} plays ({genre.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Artists */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-4">Top Artists</h3>
              <div className="space-y-3">
                {analytics.topArtists.map((artist, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                    <div>
                      <p className="font-medium">{artist.artist}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatNumber(artist.plays)} plays
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(artist.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            {/* Current Health Status */}
            {health && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold mb-4">Current System Health</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Status</h3>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      health.isHealthy 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {health.isHealthy ? '🟢 Healthy' : '🔴 Issues Detected'}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Uptime</h3>
                    <p className="text-lg">{formatUptime(health.uptime)}</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <ButtonPrimary
                    onClick={() => fetchDashboardData()}
                    sizeClass="px-4 py-2"
                  >
                    🔍 Run Health Check
                  </ButtonPrimary>
                </div>
              </div>
            )}

            {/* Health History */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">Health History</h2>
              <div className="space-y-3">
                {healthHistory.map((check, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        check.isHealthy ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm">
                        {new Date(check.lastCheck).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {check.errorCount} errors, {check.warningCount} warnings
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="space-y-6">
            {/* Recent Admin Actions */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">Recent Admin Actions</h2>
              <div className="space-y-3">
                {actions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                    <div>
                      <p className="font-medium">{action.description}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {action.userName} • {new Date(action.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      action.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : action.status === 'failed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {action.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Logs */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">System Logs</h2>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                <div>🕐 {new Date().toLocaleString()} - System dashboard loaded</div>
                <div>📊 {new Date().toLocaleString()} - Metrics updated</div>
                <div>🏥 {new Date().toLocaleString()} - Health check completed</div>
                <div>📈 {new Date().toLocaleString()} - Analytics refreshed</div>
                {/* Add more log entries as needed */}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 