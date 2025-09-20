'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CardNFTMusic from '@/components/CardNFTMusic';

interface NFT {
  id: string;
  name: string;
  price: string;
  stock?: number;
}

const ITEMS_PER_PAGE = 1;

export default function NFTDetailPage() {
  const router = useRouter();
  const { status } = useSession();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated') {
      router.replace('/nft-detail/my-nfts');
    } else {
      router.replace('/collection');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchUserNFTs = async () => {
      try {
        const response = await fetch('/api/user/nfts');
        const data = await response.json();
        
        if (data.nfts) {
          const transformedNFTs = data.nfts.map((nft: any) => ({
            id: nft.id,
            name: nft.name,
            price: nft.price.toString(),
            stock: nft.currentOrders || 0
          }));
          setNfts(transformedNFTs);
          const pages = Math.ceil(transformedNFTs.length / ITEMS_PER_PAGE);
          console.log('Total NFTs:', transformedNFTs.length);
          console.log('Total Pages:', pages);
          setTotalPages(pages);
        }
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserNFTs();
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getCurrentPageNFTs = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return nfts.slice(startIndex, endIndex);
  };

  if (loading) {
    return <div className="container py-10">Loading...</div>;
  }

  if (nfts.length === 0) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-8">My Albums</h1>
        <p className="text-center text-gray-500">No Albums found</p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">My NFTs</h1>
      <div className="max-w-2xl mx-auto">
        {getCurrentPageNFTs().map((nft) => (
          <CardNFTMusic key={nft.id} nft={nft} />
        ))}
      </div>

      {/* Pagination Controls */}
      {nfts.length > 0 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg ${
              currentPage === 1
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === pageNum
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg ${
              currentPage === totalPages
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}