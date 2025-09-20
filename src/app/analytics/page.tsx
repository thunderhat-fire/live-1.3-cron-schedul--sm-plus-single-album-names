'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import {
  ChartBarIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  UsersIcon,
  PlayIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  views: number;
  sales: number;
  revenue: number;
  uniqueVisitors: number;
  topLocations: { location: string; count: number }[];
  recentSales: { date: string; amount: number }[];
  hasFullAccess: boolean;
  subscriptionTier: string;
  breakdown?: {
    vinylUnitsOrdered: number;
    successfulPresales: number;
    digitalDownloads: number;
    presaleEarnings: number;
    digitalSales: number;
  };
  playerCounts?: {
    totalPlays: number;
    averagePlayDuration: number;
    skipRate: number;
    completionRate: number;
  };
}

function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d'); // 24h, 7d, 30d

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/analytics?timeframe=${timeframe}`);
        const data = await response.json();
        if (data.success) {
          setAnalyticsData(data.analytics);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user) {
      fetchAnalytics();
    }
  }, [session, status, timeframe, router]);

  // Show loading spinner while checking authentication status
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  // This should not be reached due to redirect in useEffect, but just in case
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="container py-16">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          {!analyticsData?.hasFullAccess && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
              ⚠️ Upgrade to Gold for full analytics including buyer locations, player counts, and demographics
            </p>
          )}
        </div>
        <div className="flex space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-2"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          {!analyticsData?.hasFullAccess && (
            <ButtonPrimary onClick={() => router.push('/subscription')}>
              Upgrade to Gold
            </ButtonPrimary>
          )}
          <ButtonPrimary onClick={() => router.push('/account/subscription')}>
            Subscription Status
          </ButtonPrimary>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 mb-1">Total Views</p>
              <h3 className="text-2xl font-bold">{analyticsData?.views || 0}</h3>
            </div>
            <ChartBarIcon className="h-8 w-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 mb-1">Total Units Pre-Sold</p>
              <h3 className="text-2xl font-bold">{analyticsData?.sales || 0}</h3>
              {analyticsData?.breakdown && (
                <p className="text-xs text-neutral-400 mt-1">
                  {analyticsData.breakdown.vinylUnitsOrdered || 0} vinyl + {analyticsData.breakdown.digitalDownloads || 0} digital
                </p>
              )}
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 mb-1">Total Revenue</p>
              <h3 className="text-2xl font-bold">£{analyticsData?.revenue || 0}</h3>
              {analyticsData?.breakdown && (
                <p className="text-xs text-neutral-400 mt-1">
                  £{analyticsData.breakdown.presaleEarnings} presales + £{analyticsData.breakdown.digitalSales.toFixed(2)} digital
                </p>
              )}
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 mb-1">Unique Visitors</p>
              <h3 className="text-2xl font-bold">{analyticsData?.uniqueVisitors || 0}</h3>
            </div>
            <UsersIcon className="h-8 w-8 text-primary-500" />
          </div>
        </div>
      </div>

      {/* Sales & Revenue Breakdown */}
      {analyticsData?.breakdown && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-400">📊 Sales & Revenue Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-blue-700 dark:text-blue-300">Sales Composition</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Vinyl Units Ordered:</span>
                  <span className="font-medium">{analyticsData.breakdown.vinylUnitsOrdered || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Digital Downloads:</span>
                  <span className="font-medium">{analyticsData.breakdown.digitalDownloads}</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center font-semibold">
                  <span>Total Units Pre-Sold:</span>
                  <span>{analyticsData.sales}</span>
                </div>
                <div className="text-xs text-neutral-500 mt-2">
                  <span>Successful Campaigns: {analyticsData.breakdown.successfulPresales}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-blue-700 dark:text-blue-300">Revenue Composition</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Presale Earnings:</span>
                  <span className="font-medium">£{analyticsData.breakdown.presaleEarnings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Digital Sales:</span>
                  <span className="font-medium">£{analyticsData.breakdown.digitalSales.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center font-semibold">
                  <span>Total Revenue:</span>
                  <span>£{analyticsData.revenue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Analytics - Gold Only */}
      {analyticsData?.hasFullAccess && analyticsData?.playerCounts && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-6 shadow-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 dark:text-yellow-400 mb-1 text-sm font-medium">🎵 Total Plays</p>
                <h3 className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{analyticsData.playerCounts.totalPlays}</h3>
              </div>
              <PlayIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-6 shadow-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 dark:text-yellow-400 mb-1 text-sm font-medium">⏱️ Avg Duration</p>
                <h3 className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{Math.floor(analyticsData.playerCounts.averagePlayDuration / 60)}m {analyticsData.playerCounts.averagePlayDuration % 60}s</h3>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-6 shadow-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 dark:text-yellow-400 mb-1 text-sm font-medium">📊 Completion Rate</p>
                <h3 className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{(analyticsData.playerCounts.completionRate * 100).toFixed(1)}%</h3>
              </div>
              <ChartBarIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-6 shadow-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 dark:text-yellow-400 mb-1 text-sm font-medium">⏭️ Skip Rate</p>
                <h3 className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{(analyticsData.playerCounts.skipRate * 100).toFixed(1)}%</h3>
              </div>
              <UsersIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
      )}

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Locations */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">
            {analyticsData?.hasFullAccess ? '🌍 Buyer Locations' : '🔒 Buyer Locations (Gold Feature)'}
          </h3>
          <div className="space-y-4">
            {analyticsData?.topLocations?.map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <GlobeAltIcon className="h-5 w-5 text-neutral-500 mr-2" />
                  <span className={!analyticsData?.hasFullAccess ? 'text-neutral-400' : ''}>{location.location}</span>
                </div>
                <span className={`font-medium ${!analyticsData?.hasFullAccess ? 'text-neutral-400' : ''}`}>{location.count}</span>
              </div>
            ))}
          </div>
          {!analyticsData?.hasFullAccess && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Upgrade to Gold to see detailed buyer location data and demographics.
              </p>
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Recent Sales</h3>
          <div className="space-y-4">
            {analyticsData?.recentSales?.map((sale, index) => (
              <div key={index} className="flex items-center justify-between">
                <span>{new Date(sale.date).toLocaleDateString()}</span>
                <span className="font-medium">£{sale.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage; 