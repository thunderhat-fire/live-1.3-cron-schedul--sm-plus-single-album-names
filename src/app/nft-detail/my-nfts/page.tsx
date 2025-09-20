// src/app/nft-detail/my-nfts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MyNFTsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserNFTs = async () => {
      try {
        const response = await fetch('/api/user/nfts');
        const data = await response.json();
        
        if (data.success && data.nfts.length > 0) {
          // Redirect to the first NFT's detail page
          router.push(`/nft-detail/${data.nfts[0].id}`);
        } else {
          // If no NFTs found, redirect to all NFTs page
          router.push('/nft-detail/all');
        }
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        router.push('/nft-detail/all');
      } finally {
        setLoading(false);
      }
    };

    fetchUserNFTs();
  }, [router]);

  if (loading) {
    return <div className="container py-10">Loading...</div>;
  }

  return null;
}