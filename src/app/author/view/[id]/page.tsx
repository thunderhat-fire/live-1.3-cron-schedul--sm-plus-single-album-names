'use client';

import React, { useEffect, useState, useCallback } from "react";
import CardNFTMusic from "@/components/CardNFTMusic";
import { useParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { NFT } from "@/types";
import { useStreamStore } from '@/store/streamStore';
import AuthorLiveStream from '@/components/LiveStream/AuthorLiveStream';

export default function AuthorViewPage() {
  const paramsRaw = useParams() || {};
  const pathnameRaw = usePathname() || '';
  const idParam = (typeof paramsRaw.id === 'string') ? paramsRaw.id : Array.isArray(paramsRaw.id) ? paramsRaw.id[0] : '';
  const params = { id: idParam };
  const pathname = pathnameRaw || '';

  const { data: session, status: sessionStatus } = useSession();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = params?.id;
  const isAuthor = session?.user?.id === params?.id;
  const { setIsStreaming } = useStreamStore();
  const [isLive, setIsLive] = useState(false);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);

  const fetchNFTs = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      // Default to 'created' tab since we removed collectibles
      const tab = 'created';
      
      const response = await fetch(`/api/nfts/user/${userId}?tab=${tab}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || 'Failed to fetch Albums');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.nfts)) {
        setNfts(data.nfts);
      } else {
        setError('Invalid response format from server');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch Albums');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  useEffect(() => {
    async function checkLiveStatus() {
      if (!userId) return;
      try {
        const res = await fetch(`/api/live-status/${userId}`);
        if (res.ok) {
        const data = await res.json();
          setIsLive(data.isLive);
          setHlsUrl(data.hlsUrl);
        }
      } catch (e) {
        console.error('Error checking live status:', e);
      }
    }
    
    checkLiveStatus();
    // Check every 15 seconds
    const interval = setInterval(checkLiveStatus, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleStartStream = useCallback(() => {
    setIsStreaming(true);
  }, [setIsStreaming]);

  if (loading) {
    return (
      <div className="container py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      {nfts.length === 0 ? (
        <div className="text-center">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            No Albums found
          </h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {pathname.includes('/created') 
              ? "This creator hasn't created any Albums yet"
              : pathname.includes('/liked')
              ? "This creator hasn't liked any Albums yet"
              : "No Albums found"}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {nfts.map((nft) => (
            <CardNFTMusic 
              key={nft.id} 
              nft={nft}
            />
          ))}
        </div>
      )}
      
      {isLive && hlsUrl && (
        <AuthorLiveStream
          authorId={userId}
          isAuthorPage={true}
          hlsUrl={hlsUrl}
        />
      )}
    </div>
  );
} 