// src/app/downloads/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface Track {
  id: string;
  name: string;
  url: string;
}

interface NFT {
  id: string;
  name: string;
  sideATracks: Track[];
  sideBTracks: Track[];
}

interface Order {
  id: string;
  format: 'vinyl' | 'digital';
  nft: NFT;
  status: 'pending' | 'completed' | 'processing' | 'cancelled';
  paymentStatus: 'pending' | 'processed' | 'captured' | 'failed';
}

export default function DownloadsPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        
        if (data.success) {
          // Filter for digital orders that are ready for download
          const digitalOrders = data.orders.filter(
            (order: Order) => 
              order.format === 'digital' && 
              ['completed', 'processing'].includes(order.status) &&
              ['processed', 'captured', 'completed'].includes(order.paymentStatus)
          );
          setOrders(digitalOrders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchOrders();
    }
  }, [session]);

  const handleDownload = async (orderId: string, trackUrl: string) => {
    try {
      // Get signed download URL
      const response = await fetch('/api/orders/digital-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, trackUrl }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to get download URL');
      }

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = ''; // This will force download instead of navigation
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading track:', error);
      alert('Failed to download track. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <div className="my-12 sm:lg:my-16 lg:my-24 max-w-4xl mx-auto space-y-8 sm:space-y-10">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-semibold">
            My Digital Downloads
          </h2>
          <span className="block mt-3 text-neutral-500 dark:text-neutral-400">
            Access and download your purchased digital tracks.
          </span>
        </div>
        
        <div className="w-full border-b-2 border-neutral-100 dark:border-neutral-700"></div>
        
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500">No digital downloads available yet.</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4">{order.nft.name}</h3>
                <div className="space-y-6">
                  {/* Side A */}
                  <div>
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">Side A</h4>
                    <div className="space-y-2">
                      {order.nft.sideATracks.map(track => (
                        <div key={track.id} className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700">
                          <span className="text-neutral-700 dark:text-neutral-300">{track.name}</span>
                          <button
                            onClick={() => handleDownload(order.id, track.url)}
                            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
                          >
                            <span>Download</span>
                            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L10 11.586V3a1 1 0 112 0v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Side B */}
                  <div>
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">Side B</h4>
                    <div className="space-y-2">
                      {order.nft.sideBTracks.map(track => (
                        <div key={track.id} className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700">
                          <span className="text-neutral-700 dark:text-neutral-300">{track.name}</span>
                          <button
                            onClick={() => handleDownload(order.id, track.url)}
                            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
                          >
                            <span>Download</span>
                            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L10 11.586V3a1 1 0 112 0v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}