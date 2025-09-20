'use client';

import React, { useEffect, useState } from "react";
import CardNFTMusic from "@/components/CardNFTMusic";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Pagination from "@/shared/Pagination/Pagination";
import { NFT } from "@/types";
import { isPlusMember } from '@/utils/membership';

// Export generateMetadata for Next.js
export { generateMetadata } from './metadata';

export default function AuthorPage() {
  const paramsRaw = useParams() || {};
  const pathnameRaw = usePathname() || '';
  const router = useRouter();
  // Ensure params.id is always a string
  const idParam = (typeof paramsRaw.id === 'string') ? paramsRaw.id : Array.isArray(paramsRaw.id) ? paramsRaw.id[0] : '';
  const params = { id: idParam };
  const pathname = pathnameRaw || '';

  const { data: session, status: sessionStatus } = useSession();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = params?.id;
  const [isPlus, setIsPlus] = useState(false);
  const isAuthor = session?.user?.id === params?.id;
  const [stream, setStream] = useState<any>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Redirect from base author page to created page
  useEffect(() => {
    if (userId && pathname === `/author/${userId}`) {
      router.replace(`/author/${userId}/created`);
    }
  }, [userId, pathname, router]);

  useEffect(() => {
    const checkPlusMembership = async () => {
      if (!session?.user?.id) {
        console.log("No session user ID available for Plus membership check");
        return;
      }
      try {
        const isPlusMemberResult = await isPlusMember(session.user.id);
        console.log('Plus membership check result:', { userId: session.user.id, isPlusMemberResult });
        setIsPlus(isPlusMemberResult);
      } catch (error) {
        console.error('Error checking Plus membership:', error);
        setIsPlus(false);
      }
    };
    checkPlusMembership();
  }, [session]);

  useEffect(() => {
    console.log('Session state:', {
      status: sessionStatus,
      userId: session?.user?.id,
      isPlus,
      isAuthor,
      pageUserId: userId,
      pathname
    });
  }, [session, sessionStatus, isPlus, isAuthor, userId, pathname]);

  const fetchNFTs = async () => {
    try {
      console.log('Starting to fetch NFTs...');
      setLoading(true);
      // Default to 'created' tab since we removed collectibles
      const tab = 'created';
      
      console.log('Making API request with:', {
        url: `/api/nfts/user/${userId}?tab=${tab}`,
        params,
        pathname,
        tab
      });
      
      const response = await fetch(`/api/nfts/user/${userId}?tab=${tab}`);
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch Albums');
      }
      
      const data = await response.json();
      console.log('API response data:', {
        success: data.success,
        nftCount: data.nfts?.length,
        firstNft: data.nfts?.[0]
      });
      
      if (data.success) {
        setNfts(data.nfts);
      } else {
        setError(data.error || 'Failed to fetch Albums');
      }
    } catch (error) {
      console.error('Error in fetchNFTs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch Albums');
    } finally {
      console.log('Fetch completed, setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      console.log('Params or pathname changed, fetching NFTs...', pathname);
      fetchNFTs();
    }
  }, [userId, pathname]);

  const fetchStream = async () => {
    if (isPlus && isAuthor && params?.id) {
      try {
        const response = await fetch(`/api/streams/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch stream');
        }
        const activeStream = await response.json();
        setStream(activeStream);
      } catch (error) {
        console.error('Error fetching stream:', error);
      }
    }
  };

  useEffect(() => {
    fetchStream();
  }, [isPlus, isAuthor, params?.id]);

  const handleStopStream = async () => {
    if (!stream?.streamId) return;
    setIsStopping(true);
    try {
      const response = await fetch(`/api/streams/${stream.streamId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to stop stream');
      }
      setStream(null);
    } catch (error) {
      alert('Failed to stop stream.');
      console.error(error);
    } finally {
      setIsStopping(false);
    }
  };

  const handleFilterChange = (filteredNFTs: NFT[]) => {
    console.log('Filter changed, updating NFTs:', filteredNFTs.length);
    setNfts(filteredNFTs);
  };

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

  console.log('Rendering NFTs:', nfts.length, 'for pathname:', pathname);

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
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10">
            {nfts.map((nft) => (
              <CardNFTMusic 
                key={nft.id} 
                nft={nft}
                featuredImage={nft.sideAImage}
              />
            ))}
          </div>
          {nfts.length > 0 && (
            <div className="flex justify-center mt-10">
              <Pagination />
            </div>
          )}
        </>
      )}
    </div>
  );
} 