'use client';

import React, { useEffect, useState } from "react";
import CardNFTMusic from "@/components/CardNFTMusic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Pagination from "@/shared/Pagination/Pagination";

interface NFT {
  id: string;
  name: string;
  description: string;
  genre: string;
  creator: string;
  userImage: string;
  recordSize: string;
  recordLabel: string;
  price: string;
  endDate: string;
  imageUrl: string;
  sideAImage: string;
  sideBImage: string;
  sideATracks: any[];
  sideBTracks: any[];
  isLiked: boolean;
  user: {
    name: string;
    image: string;
  };
}

const AuthorPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        const response = await fetch('/api/nfts/filter?filter=recent');
        const data = await response.json();
        if (data.success) {
          setNfts(data.nfts);
        }
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10 mt-8 lg:mt-10">
        {nfts.map((nft) => (
          <CardNFTMusic 
            key={nft.id} 
            nft={nft} 
            featuredImage={nft.imageUrl}
          />
        ))}
      </div>
      <div className="flex flex-col mt-12 lg:mt-16 space-y-5 sm:space-y-0 sm:space-x-3 sm:flex-row sm:justify-between sm:items-center">
        <Pagination />
      </div>
    </div>
  );
};


export default AuthorPage;
