'use client';

import React, { useEffect, useState } from "react";
import BackgroundSection from "@/components/BackgroundSection/BackgroundSection";
import CardNFTMusic from "@/components/CardNFTMusic";
import SectionBecomeAnAuthor from "@/components/SectionBecomeAnAuthor/SectionBecomeAnAuthor";
import SectionSliderCollections from "@/components/SectionSliderCollections";
import ButtonCircle from "@/shared/Button/ButtonCircle";
import Input from "@/shared/Input/Input";
import Pagination from "@/shared/Pagination/Pagination";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface NFT {
  id: string;
  name: string;
  description: string;
  genre: string;
  sideAImage: string;
  sideBImage: string;
  recordSize: '7inch' | '12inch';
  recordLabel: string;
  stock: number;
  price: string | number;
  currentOrders?: number;
  targetOrders?: number;
  user: {
    name: string;
    image: string;
  };
}

const GENRES = [
  'Ambient',
  'Classical',
  'Country',
  'Dub',
  'Drum & Bass',
  'Folk',
  'Hip Hop',
  'House',
  'Jazz',
  'Metal',
  'Pop',
  'Punk',
  'R&B',
  'Reggae',
  'Rock',
  'Soul',
  'Techno'
].sort();

const PageSearch = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const query = searchParams?.get('q') || '';
    setSearchQuery(query);
    const genre = searchParams?.get('genre') || '';
    setSelectedGenre(genre);
    if (query || genre) {
      fetchNFTs({ page: 1, query, genre });
    } else {
      fetchAllNFTs(1);
    }
  }, [searchParams]);

  const fetchNFTs = async (params: { page: number; query?: string; genre?: string }, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.set(key, value.toString());
        }
      });
      
      // Add showAll=true to ensure we get all NFTs regardless of subscription status
      searchParams.set('showAll', 'true');
      
      console.log('Fetching NFTs with params:', params);
      console.log('Search params string:', searchParams.toString());
      console.log('Full URL:', `/api/nfts?${searchParams.toString()}`);
      
      const response = await fetch(`/api/nfts?${searchParams.toString()}`, { signal });
      if (!response.ok) throw new Error('Failed to fetch Albums');
      const data = await response.json();
      console.log('API response:', data);
      console.log('Number of NFTs returned:', data.nfts.length);
      if (data.nfts.length > 0) {
        console.log('Sample NFT genres:', data.nfts.map((nft: any) => nft.genre));
      }
      setNfts(data.nfts);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      if (signal?.aborted) return;
      console.error('Error fetching NFTs:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllNFTs = async (page: number = 1) => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.set('showAll', 'true');
      searchParams.set('limit', '20');
      searchParams.set('page', page.toString());
      
      console.log('Fetching all NFTs with params:', { page, limit: 20 });
      console.log('Search params string:', searchParams.toString());
      
      const response = await fetch(`/api/nfts?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch Albums');
      const data = await response.json();
      console.log('All NFTs API response:', data);
      console.log('Number of NFTs returned:', data.nfts.length);
      setNfts(data.nfts);
      setTotalPages(data.totalPages || Math.ceil(data.total / 20));
      setCurrentPage(data.currentPage || page);
    } catch (error) {
      console.error('Error fetching all NFTs:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams?.toString() || '');
    if (searchQuery) {
      newParams.set('q', searchQuery);
    } else {
      newParams.delete('q');
    }
    newParams.set('page', '1');
    router.push(`${pathname}?${newParams.toString()}`);
    if (searchQuery) {
      fetchNFTs({ page: 1, query: searchQuery });
    } else {
      fetchAllNFTs(1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (searchQuery || selectedGenre) {
      fetchNFTs({ page, query: searchQuery, genre: selectedGenre });
    } else {
      fetchAllNFTs(page);
    }
  };

  const handleGenreTabClick = (genre: string) => {
    console.log('Genre clicked:', genre);
    setSelectedGenre(genre);
    const newParams = new URLSearchParams(searchParams?.toString() || '');
    if (genre) {
      newParams.set('genre', genre);
    } else {
      newParams.delete('genre');
    }
    newParams.set('page', '1');
    console.log('New URL params:', newParams.toString());
    router.push(`${pathname}?${newParams.toString()}`);
    
    // Actually fetch the filtered results
    if (genre) {
      console.log('Fetching NFTs for genre:', genre);
      fetchNFTs({ page: 1, genre });
    } else {
      console.log('Fetching all NFTs');
      fetchAllNFTs(1);
    }
  };

  return (
    <div className={`nc-PageSearch`}>
      <div className={`nc-HeadBackgroundCommon h-24 2xl:h-28 top-0 left-0 right-0 w-full bg-primary-50 dark:bg-neutral-800/20`} />
      <div className="container">
        <header className="max-w-2xl mx-auto -mt-10 flex flex-col lg:-mt-7">
          <form className="relative w-full" onSubmit={handleSearch}>
            <label htmlFor="search-input" className="text-neutral-500 dark:text-neutral-300">
              <span className="sr-only">Search all icons</span>
              <Input
                className="shadow-lg border-0 bg-white dark:!bg-neutral-800"
                id="search-input"
                name="search"
                type="search"
                placeholder="Type your keywords"
                sizeClass="pl-14 py-5 pr-5 md:pl-16"
                rounded="rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-2xl md:left-6">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 22L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <ButtonCircle className="absolute right-2.5 top-1/2 transform -translate-y-1/2" size="w-11 h-11" type="submit">
                <ArrowRightIcon className="w-5 h-5" />
              </ButtonCircle>
            </label>
          </form>
        </header>
      </div>

      <div className="container py-16 lg:pb-28 lg:pt-20 space-y-16 lg:space-y-28">
        <main>
          {/* Genre Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              className={`px-4 py-2 rounded-full border ${selectedGenre === '' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700'}`}
              onClick={() => handleGenreTabClick('')}
            >
              All Genres
            </button>
            {GENRES.map((genre) => (
              <button
                key={genre}
                className={`px-4 py-2 rounded-full border ${selectedGenre === genre ? 'bg-primary-500 text-white' : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700'}`}
                onClick={() => handleGenreTabClick(genre)}
              >
                {genre}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10 mt-8 lg:mt-10">
            {loading ? (
              Array(8).fill(null).map((_, index) => (
                <div key={index} className="animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-2xl h-[400px]" />
              ))
            ) : error ? (
              <div className="col-span-full text-center text-red-500">{error}</div>
            ) : nfts.length === 0 ? (
              <div className="col-span-full text-center">No Albums Found</div>
            ) : (
              nfts.map((nft) => (
                <CardNFTMusic 
                  key={nft.id} 
                  nft={nft}
                />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-12 lg:mt-16">
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </main>

        {/* === SECTION 5 === */}
        <div className="relative py-16 lg:py-28">
          <BackgroundSection />
          <SectionSliderCollections />
        </div>

        {/* SUBCRIBES */}
        <SectionBecomeAnAuthor />
      </div>
    </div>
  );
};

export default PageSearch;
