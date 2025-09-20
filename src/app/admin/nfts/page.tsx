'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { TrashIcon, ArrowPathIcon, ClipboardIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { Tooltip } from '@/components/ui/tooltip';

interface NFT {
  id: string;
  name: string;
  price: number;
  currentOrders: number;
  createdAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  user: {
    name: string | null;
    email: string;
  };
}

export default function AdminNFTsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [nfts, setNFTs] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Function to shorten ID
  const shortenId = (id: string) => {
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
  };

  // Function to handle copy
  const handleCopy = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
  };

  const fetchNFTs = useCallback(async () => {
    try {
      console.log('Fetching NFTs, showDeleted:', showDeleted); // Debug log
      const response = await fetch(`/api/admin/nfts?showDeleted=${showDeleted}`);
      console.log('Response status:', response.status); // Debug log
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched NFTs:', data); // Debug log
        setNFTs(data);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText); // Debug log
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  }, [showDeleted]);

  useEffect(() => {
    console.log('Session status:', sessionStatus); // Debug log
    console.log('Is admin?', session?.user?.isAdmin); // Debug log
    
    if (sessionStatus === 'loading') return;
    
    if (!session?.user?.isAdmin) {
      console.log('Not admin, redirecting to home'); // Debug log
      router.push('/');
      return;
    }

    fetchNFTs();
  }, [session, sessionStatus, router, fetchNFTs]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this NFT? It will be hidden from users but can be restored later.')) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/nfts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchNFTs(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete NFT');
      }
    } catch (error) {
      console.error('Error deleting NFT:', error);
      alert('Failed to delete NFT');
    } finally {
      setDeleting(null);
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm('Are you sure you want to restore this NFT? It will become visible to users again.')) {
      return;
    }

    setDeleting(id); // Reuse the deleting state for restore operation
    try {
      const response = await fetch(`/api/admin/nfts/${id}/restore`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchNFTs(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to restore NFT');
      }
    } catch (error) {
      console.error('Error restoring NFT:', error);
      alert('Failed to restore NFT');
    } finally {
      setDeleting(null);
    }
  };

  if (sessionStatus === 'loading' || loading) {
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
        <h1 className="text-3xl font-bold">Manage NFTs</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showDeleted"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="checkbox mr-2"
            />
            <label htmlFor="showDeleted" className="text-sm">
              Show Deleted NFTs
            </label>
          </div>
          <Link href="/admin" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Creator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {nfts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-neutral-500">
                    No NFTs found
                  </td>
                </tr>
              ) : (
                nfts.map((nft) => (
                  <tr key={nft.id} className={nft.isDeleted ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        nft.isDeleted 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      }`}>
                        {nft.isDeleted ? 'Deleted' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Tooltip content={nft.id}>
                          <span className="text-sm font-mono">{shortenId(nft.id)}</span>
                        </Tooltip>
                        <button
                          onClick={() => handleCopy(nft.id)}
                          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          {copiedId === nft.id ? (
                            <ClipboardDocumentCheckIcon className="h-4 w-4" />
                          ) : (
                            <ClipboardIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{nft.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{nft.user.name || nft.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">${nft.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{nft.currentOrders}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{new Date(nft.createdAt).toLocaleDateString()}</div>
                      {nft.deletedAt && (
                        <div className="text-xs text-neutral-500">
                          Deleted: {new Date(nft.deletedAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button 
                        onClick={() => router.push(`/nft-detail/${nft.id}`)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => nft.isDeleted ? handleRestore(nft.id) : handleDelete(nft.id)}
                        disabled={deleting === nft.id}
                        className={`${
                          nft.isDeleted 
                            ? 'text-green-600 hover:text-green-900' 
                            : 'text-red-600 hover:text-red-900'
                        } ${deleting === nft.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {nft.isDeleted ? (
                          <ArrowPathIcon className="h-5 w-5 inline" title="Restore NFT" />
                        ) : (
                          <TrashIcon className="h-5 w-5 inline" title="Delete NFT" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 