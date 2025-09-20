'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';

interface User {
  id: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  subscriptionTier: string;
  aiMasteringCredits: number;
}

interface MasteringRequest {
  id: string;
  originalTrackUrl: string;
  masteredTrackUrl?: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    subscriptionTier: string;
  };
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'mastering'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [masteringRequests, setMasteringRequests] = useState<MasteringRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [masteringLoading, setMasteringLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.isAdmin) {
      router.push('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    const fetchMasteringRequests = async () => {
      try {
        const response = await fetch('/api/admin/mastering-requests');
        if (response.ok) {
          const data = await response.json();
          setMasteringRequests(data.requests || []);
        }
      } catch (error) {
        console.error('Error fetching mastering requests:', error);
        toast.error('Failed to fetch mastering requests');
      } finally {
        setMasteringLoading(false);
      }
    };

    fetchUsers();
    fetchMasteringRequests();
  }, [session, router]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setDeleting(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const handleMasteredUpload = async (e: React.FormEvent, requestId: string, file: File) => {
    e.preventDefault();
    setUploadingId(requestId);
    
    try {
      const formData = new FormData();
      formData.append('track', file);
      
      const response = await fetch(`/api/admin/mastering-request/${requestId}/complete`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      // Refresh mastering requests
      const updatedResponse = await fetch('/api/admin/mastering-requests');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setMasteringRequests(updatedData.requests || []);
      }
      
      toast.success('Mastered track uploaded successfully!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingId(null);
    }
  };

  if (loading && masteringLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="container py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Link href="/admin" className="btn-primary">
          Back to Main Admin
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-8 border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Manage Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('mastering')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'mastering'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Mastering Requests ({masteringRequests.length})
          </button>
        </nav>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">AI Credits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{user.name || 'No name'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.subscriptionTier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                        user.subscriptionTier === 'plus' ? 'bg-blue-100 text-blue-800' :
                        'bg-neutral-100 text-neutral-800'
                      }`}>
                        {user.subscriptionTier || 'starter'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{user.aiMasteringCredits || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isAdmin ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'}`}>
                        {user.isAdmin ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-4">
                      <button 
                        onClick={() => router.push(`/author/view/${user.id}`)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View Profile
                      </button>
                      {!user.isAdmin && (
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleting === user.id}
                          className={`text-red-600 hover:text-red-900 ${deleting === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {deleting === user.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mastering Requests Tab */}
      {activeTab === 'mastering' && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">📍 Track Storage Locations</h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p><strong>Original Tracks:</strong> Stored in Cloudinary under folder <code>master/user-[userId]</code></p>
              <p><strong>Mastered Tracks:</strong> Stored in Cloudinary under folder <code>mastering-complete/mastering-[requestId]</code></p>
              <p><strong>Access:</strong> All URLs are publicly accessible via the links below</p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tracks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {masteringRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium">{request.user.name || 'No name'}</div>
                          <div className="text-sm text-neutral-500">{request.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.user.subscriptionTier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                          request.user.subscriptionTier === 'plus' ? 'bg-blue-100 text-blue-800' :
                          'bg-neutral-100 text-neutral-800'
                        }`}>
                          {request.user.subscriptionTier || 'starter'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{new Date(request.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-neutral-500">{new Date(request.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          request.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-neutral-100 text-neutral-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <a
                            href={request.originalTrackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 text-sm underline"
                          >
                            Original
                          </a>
                          {request.status === 'completed' && request.masteredTrackUrl && (
                            <a
                              href={request.masteredTrackUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-900 text-sm underline font-medium"
                            >
                              Mastered
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.status === 'pending' && (
                          <form
                            className="flex items-center gap-2"
                            onSubmit={e => {
                              const input = (e.target as HTMLFormElement).elements.namedItem('track') as HTMLInputElement;
                              if (input && input.files && input.files[0]) {
                                handleMasteredUpload(e, request.id, input.files[0]);
                              } else {
                                e.preventDefault();
                              }
                            }}
                          >
                            <input 
                              type="file" 
                              name="track" 
                              accept="audio/*" 
                              required 
                              disabled={uploadingId === request.id}
                              className="text-xs"
                            />
                            <ButtonPrimary 
                              type="submit" 
                              disabled={uploadingId === request.id}
                              className="text-xs px-3 py-1"
                            >
                              {uploadingId === request.id ? 'Uploading...' : 'Upload'}
                            </ButtonPrimary>
                          </form>
                        )}
                        {request.status === 'completed' && (
                          <span className="text-green-600 text-sm font-medium">✅ Complete</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {masteringRequests.length === 0 && !masteringLoading && (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No mastering requests found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 