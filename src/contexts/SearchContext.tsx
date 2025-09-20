"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface SearchContextType {
  searchQuery: string;
  formatType: string[];
  releaseType: string[];
  priceRange: [number, number];
  setSearchQuery: (query: string) => void;
  setFormatType: (types: string[]) => void;
  setReleaseType: (types: string[]) => void;
  setPriceRange: (range: [number, number]) => void;
  handleSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [formatType, setFormatType] = useState<string[]>([]);
  const [releaseType, setReleaseType] = useState<string[]>(['Pre-order', 'Limited Edition']);
  const [priceRange, setPriceRange] = useState<[number, number]>([10, 100]);

  const handleSearch = async () => {
    // First, check for an exact NFT title match using the new endpoint
    if (searchQuery) {
      try {
        const res = await fetch(`/api/nfts/exact?name=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.nft && data.nft.id) {
            router.push(`/nft-detail/${data.nft.id}`);
            return;
          }
        }
      } catch (err) {
        // fallback to normal search
        console.error('Error checking for exact NFT match:', err);
      }
    }
    // Fallback: go to search page as before
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (formatType.length) params.set('formatType', formatType[0]);
    if (releaseType.length) params.set('type', releaseType.join(','));
    params.set('minPrice', priceRange[0].toString());
    params.set('maxPrice', priceRange[1].toString());
    router.push(`/search?${params.toString()}`);
  };

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        formatType,
        releaseType,
        priceRange,
        setSearchQuery,
        setFormatType,
        setReleaseType,
        setPriceRange,
        handleSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
} 