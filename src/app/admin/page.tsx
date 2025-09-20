'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminStats {
  totalUsers: number;
  totalNFTs: number;
  totalSales: number;
  activeUsers: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Enhanced debug logs
    console.log('=== Admin Page Debug Info ===');
    console.log('Session status:', status);
    console.log('Full session object:', JSON.stringify(session, null, 2));
    console.log('User object:', JSON.stringify(session?.user, null, 2));
    console.log('Is admin?', session?.user?.isAdmin);
    console.log('Session keys:', session ? Object.keys(session) : 'No session');
    console.log('User keys:', session?.user ? Object.keys(session.user) : 'No user');
    console.log('==========================');

    if (status === 'loading') return;

    if (!session?.user?.isAdmin) {
      console.log('Admin check failed - Redirecting to home');
      console.log('Session exists?', !!session);
      console.log('User exists?', !!session?.user);
      console.log('isAdmin value:', session?.user?.isAdmin);
      router.push('/');
      return;
    }

    const fetchStats = async () => {
      try {
        console.log('Admin Dashboard: About to fetch stats from /api/admin/stats');
        const response = await fetch('/api/admin/stats');
        console.log('Admin Dashboard: Stats API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Admin Dashboard: Stats data received:', data);
          setStats(data);
        } else {
          const errorText = await response.text();
          console.error('Admin Dashboard: Failed to fetch stats:', response.status, errorText);
        }
      } catch (error) {
        console.error('Admin Dashboard: Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session, router, status]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  const handleNavigation = (path: string) => {
    router.push(path as any);
  };

  return (
    <div className="container py-16">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-primary-500">{stats?.totalUsers || 0}</p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Total NFTs</h3>
          <p className="text-3xl font-bold text-primary-500">{stats?.totalNFTs || 0}</p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Total Sales</h3>
          <p className="text-3xl font-bold text-primary-500">£{stats?.totalSales?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Active Users</h3>
          <p className="text-3xl font-bold text-primary-500">{stats?.activeUsers || 0}</p>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => handleNavigation('/admin/users')}
            className="p-4 bg-white dark:bg-neutral-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            Manage Users
          </button>
          <button
            onClick={() => handleNavigation('/admin/nfts')}
            className="p-4 bg-white dark:bg-neutral-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            Manage NFTs
          </button>
          <button
            onClick={() => handleNavigation('/admin/notifications')}
            className="p-4 bg-white dark:bg-neutral-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            Manage Notifications
          </button>
          <button
            onClick={() => handleNavigation('/admin/mastering-requests')}
            className="p-4 bg-white dark:bg-neutral-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            Mastering Requests
          </button>
          <button
            onClick={() => handleNavigation('/admin/abuse-reports')}
            className="p-4 bg-white dark:bg-neutral-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            Abuse Reports
          </button>
          <button
            onClick={() => handleNavigation('/admin/radio/dashboard')}
            className="p-4 bg-white dark:bg-neutral-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            🎛️ Radio Dashboard
          </button>
          <button
            onClick={() => handleNavigation('/admin/radio/live-stream')}
            className="p-4 bg-white dark:bg-neutral-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            📡 Live Stream Control
          </button>
        </div>
      </div>
    </div>
  );
} 