'use client';

import React, { useEffect, useState, FC } from "react";
import NcImage from "@/shared/NcImage/NcImage";
import ButtonDropDownShare from "@/components/ButtonDropDownShare";
import NftMoreDropdown from "@/components/NftMoreDropdown";
import BackgroundSection from "@/components/BackgroundSection/BackgroundSection";
import SectionSliderCollections from "@/components/SectionSliderCollections";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import Pagination from "@/shared/Pagination/Pagination";

// Since this is a client component, we'll add metadata via head.tsx or layout.tsx
import CardNFTMusic from "@/components/CardNFTMusic";
import authorBanner from "@/images/nfts/authorBanner.png";
import { Metadata } from "next";
import CollectionCard from "@/components/CollectionCard";
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

let AccountActions = [
  {
    id: "copylink",
    name: "Copy link",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
  </svg>`,
  },
  {
    id: "report",
    name: "Report abuse",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
  </svg>
  `,
  },
];

interface NFT {
  id: string;
  name: string;
  description: string;
  genre: string;
  creator: string;
  userImage: string;
  recordSize: '7inch' | '12inch' | '7 inch' | '12 inch';
  recordLabel: string;
  price: number;
  endDate: string;
  imageUrl: string;
  sideAImage: string;
  sideBImage: string;
  currentOrders?: number;
  targetOrders?: number;
  stock: number;
  user: {
    name: string;
    image: string;
  };
  creatorSubscriptionTier?: string;
  isVinylPresale?: boolean; // Current presale status (false when completed)
  wasVinylPresale?: boolean; // Original presale status (for volume calculations)
  showAsDigital?: boolean; // Indicates if this item is shown as a digital release
}

const PageCollection: FC = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [digitalSalesData, setDigitalSalesData] = useState<{[nftId: string]: number}>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.ceil(nfts.length / pageSize);
  const pagedNfts = nfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const fetchNFTs = async () => {
    try {
      if (!isInitialLoad) {
        setLoading(true);
      }
      setError(null);
      
      const queryParams = new URLSearchParams();
      // Add showAll=true by default to show all albums regardless of creation date
      queryParams.set('showAll', 'true');
      // Add a higher limit to show more albums
      queryParams.set('limit', '100');

      const [nftResponse, digitalSalesResponse] = await Promise.all([
        fetch(`/api/nfts?${queryParams.toString()}`),
        fetch('/api/analytics/digital-sales') // New endpoint for digital sales data
      ]);

      if (!nftResponse.ok) {
        const errorData = await nftResponse.json();
        throw new Error(errorData.error || 'Failed to fetch NFTs');
      }
      
      const data = await nftResponse.json();
      if (data.success) {
        setNfts(data.nfts);
        setTotalItems(data.total);
      } else {
        throw new Error(data.error || 'Failed to fetch NFTs');
      }

      // Fetch digital sales data (optional - won't fail if endpoint doesn't exist)
      if (digitalSalesResponse.ok) {
        const digitalData = await digitalSalesResponse.json();
        if (digitalData.success) {
          setDigitalSalesData(digitalData.salesByNft || {});
        }
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch NFTs');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, []);

  // Calculate dynamic stats - show standard pricing structure
  const has7InchVinyl = nfts.some(nft => 
    (nft.recordSize === '7inch' || nft.recordSize === '7 inch') && nft.wasVinylPresale
  );
  const has12InchVinyl = nfts.some(nft => 
    (nft.recordSize === '12inch' || nft.recordSize === '12 inch') && nft.wasVinylPresale
  );
  
  // Standard vinyl pricing
  const floorPrice7 = has7InchVinyl ? 13.00 : Infinity;
  const floorPrice12 = has12InchVinyl ? 26.00 : Infinity;
  
  // Digital pricing - check if we have digital items
  const hasDigitalItems = nfts.some(nft => nft.showAsDigital || !nft.wasVinylPresale);
  const has7InchDigital = nfts.some(nft => 
    (nft.recordSize === '7inch' || nft.recordSize === '7 inch') && (nft.showAsDigital || !nft.wasVinylPresale)
  );
  const has12InchDigital = nfts.some(nft => 
    (nft.recordSize === '12inch' || nft.recordSize === '12 inch') && (nft.showAsDigital || !nft.wasVinylPresale)
  );
  
  const digitalSinglePrice = has7InchDigital ? 4.00 : null;
  const digitalAlbumPrice = has12InchDigital ? 13.00 : null;
  
  // Fix volume calculation: use ORIGINAL presale prices, not current displayed prices
  const volume = nfts.reduce((sum, nft) => {
    let nftRevenue = 0;
    
    // 1. Add presale vinyl revenue (using original vinyl prices)
    if (nft.wasVinylPresale && nft.targetOrders && nft.currentOrders !== undefined) {
      // Calculate sold quantity: currentOrders represents actual orders sold (same as admin dashboard)
      const soldQuantity = Math.max(0, nft.currentOrders);
      // Use ORIGINAL vinyl price when the presale orders were sold
      const originalVinylPrice = nft.targetOrders === 100 ? 26 : nft.targetOrders === 200 ? 22 : nft.targetOrders === 500 ? 20 : 26;
      nftRevenue += (soldQuantity * originalVinylPrice);
    }
    
    // 2. Add actual digital download revenue
    const digitalSalesCount = digitalSalesData[nft.id] || 0;
    if (digitalSalesCount > 0) {
      // Use appropriate digital price based on record size
      const digitalPrice = nft.recordSize === '7 inch' ? 4.00 : 13.00;
      nftRevenue += (digitalSalesCount * digitalPrice);
    }
    
    return sum + nftRevenue;
  }, 0);
  
  const latestPrice = nfts.length > 0 ? Number(nfts[0].price) : 0;

  if (loading && isInitialLoad) {
    return (
      <div className="container py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10">
          {Array(8).fill(null).map((_, index) => (
            <div key={index} className="animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-2xl h-[400px]" />
          ))}
        </div>
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
    <div className={`nc-PageCollection`}>
      {/* HEADER */}
      <div className="w-full">
        <div className="relative w-full h-40 md:h-60 2xl:h-72">
          <NcImage
            containerClassName="absolute inset-0"
            src={authorBanner.src}
            className="object-cover"
            alt="Collection Banner"
          />
        </div>
        <div className="relative container -mt-14 lg:-mt-20">
          <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-700 p-5 lg:p-8 rounded-3xl md:rounded-[40px] shadow-xl flex flex-col md:flex-row lg:items-center">
            <div className="flex flex-col sm:flex-row md:block sm:items-start sm:justify-between">
              <div className="w-40 sm:w-48 md:w-56 xl:w-60">
                <NcImage
                  src="/LP.jpg"
                  containerClassName="aspect-w-1 aspect-h-1 relative rounded-3xl overflow-hidden z-0"
                  alt="Collection Logo"
                />
              </div>
              <div className="mt-4 flex items-center sm:justify-center space-x-3">
                <div className="flex space-x-1.5 text-neutral-700 dark:text-neutral-300">
                  <a
                    href="##"
                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 dark:bg-neutral-800 cursor-pointer"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_17_61)">
                        <path
                          d="M48 24C48 10.7452 37.2548 0 24 0C10.7452 0 0 10.7452 0 24C0 35.9789 8.77641 45.908 20.25 47.7084V30.9375H14.1562V24H20.25V18.7125C20.25 12.6975 23.8331 9.375 29.3152 9.375C31.9402 9.375 34.6875 9.84375 34.6875 9.84375V15.75H31.6613C28.68 15.75 27.75 17.6002 27.75 19.5V24H34.4062L33.3422 30.9375H27.75V47.7084C39.2236 45.908 48 35.9789 48 24Z"
                          fill="currentColor"
                        ></path>
                      </g>
                    </svg>
                  </a>
                  <a
                    href="##"
                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 dark:bg-neutral-800 cursor-pointer"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_17_80)">
                        <path
                          d="M15.1003 43.5C33.2091 43.5 43.1166 28.4935 43.1166 15.4838C43.1166 15.0619 43.1072 14.6307 43.0884 14.2088C45.0158 12.815 46.679 11.0886 48 9.11066C46.205 9.90926 44.2993 10.4308 42.3478 10.6575C44.4026 9.42588 45.9411 7.491 46.6781 5.21159C44.7451 6.35718 42.6312 7.16528 40.4269 7.60128C38.9417 6.02318 36.978 4.97829 34.8394 4.62816C32.7008 4.27803 30.5064 4.64216 28.5955 5.66425C26.6846 6.68635 25.1636 8.30947 24.2677 10.2827C23.3718 12.2559 23.1509 14.4693 23.6391 16.5807C19.725 16.3842 15.8959 15.3675 12.4 13.5963C8.90405 11.825 5.81939 9.33893 3.34594 6.29909C2.0888 8.46655 1.70411 11.0314 2.27006 13.4722C2.83601 15.9131 4.31013 18.047 6.39281 19.44C4.82926 19.3904 3.29995 18.9694 1.93125 18.2119V18.3338C1.92985 20.6084 2.7162 22.8132 4.15662 24.5736C5.59704 26.334 7.60265 27.5412 9.8325 27.99C8.38411 28.3863 6.86396 28.4441 5.38969 28.1588C6.01891 30.1149 7.24315 31.8258 8.89154 33.0527C10.5399 34.2796 12.5302 34.9613 14.5847 35.0025C11.0968 37.7423 6.78835 39.2283 2.35313 39.2213C1.56657 39.2201 0.780798 39.1719 0 39.0769C4.50571 41.9676 9.74706 43.5028 15.1003 43.5Z"
                          fill="currentColor"
                        ></path>
                      </g>
                    </svg>
                  </a>
                </div>
                <div className="h-5 border-l border-neutral-200 dark:border-neutral-700"></div>
                <div className="flex space-x-1.5">
                  <ButtonDropDownShare
                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 dark:bg-neutral-800 cursor-pointer "
                    panelMenusClass="origin-top-right !-right-5 !w-40 sm:!w-52"
                  />
                  <NftMoreDropdown
                    actions={AccountActions}
                    containerClassName="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 dark:bg-neutral-800 cursor-pointer"
                    nftId="collection-nft"
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 md:mt-0 md:ml-8 xl:ml-14 flex-grow">
              <div className="max-w-screen-sm ">
                <h2 className="inline-block text-2xl sm:text-3xl lg:text-4xl font-semibold">
                  Pre-sale Albums Collection
                </h2>
                <span className="block mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                  Browse through our collection of pre-sale albums. Each album is available for pre-order before being pressed to vinyl.
                </span>
              </div>
              <div className="mt-6 xl:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 xl:gap-6">
                {/* ----- Floor Price ----- */}
                <div className="dark:bg-neutral-800 bg-green-50 rounded-2xl flex flex-col items-center justify-center p-5 lg:p-6">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    Floor Price
                  </span>
                  <div className="font-medium text-sm mt-4 sm:text-base sm:mt-6 text-center space-y-1">
                    {/* Vinyl Prices */}
                    {floorPrice7 !== Infinity && (
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium">£{floorPrice7.toFixed(2)}</span>
                        <span className="text-xs text-green-500 ml-2">7" Vinyl</span>
                      </div>
                    )}
                    {floorPrice12 !== Infinity && (
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium">£{floorPrice12.toFixed(2)}</span>
                        <span className="text-xs text-green-500 ml-2">12" Vinyl</span>
                      </div>
                    )}
                    {/* Digital Prices */}
                    {digitalSinglePrice && (
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium">£{digitalSinglePrice.toFixed(2)}</span>
                        <span className="text-xs text-blue-500 ml-2">Digital Single/EP</span>
                      </div>
                    )}
                    {digitalAlbumPrice && (
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium">£{digitalAlbumPrice.toFixed(2)}</span>
                        <span className="text-xs text-blue-500 ml-2">Digital Album</span>
                      </div>
                    )}
                    {/* Fallback if no prices available */}
                    {floorPrice7 === Infinity && floorPrice12 === Infinity && !digitalSinglePrice && !digitalAlbumPrice && (
                      <div className="text-neutral-400">--</div>
                    )}
                  </div>
                </div>

                {/* ----- Volume ----- */}
                <div className="dark:bg-neutral-800 bg-fuchsia-50 rounded-2xl flex flex-col items-center justify-center p-5 lg:p-6">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    Volume
                  </span>
                  <span className="font-medium text-base mt-4 sm:text-xl sm:mt-6">
                    £{volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    total sales
                  </span>
                </div>
                {/* ----- Latest Price ----- */}
                <div className="dark:bg-neutral-800 bg-sky-50 rounded-2xl flex flex-col items-center justify-center p-5 lg:p-6">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    Latest Price
                  </span>
                  <span className="font-medium text-base mt-4 sm:text-xl sm:mt-6">
                    £{latestPrice}
                  </span>
                  <span className="text-xs text-green-500 mt-1">most recent</span>
                </div>

                {/* -----Items ----- */}
                <div className="dark:bg-neutral-800 bg-yellow-50 rounded-2xl flex flex-col items-center justify-center p-5 lg:p-6">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    Items
                  </span>
                  <span className="font-medium text-base mt-4 sm:text-xl sm:mt-6">
                    {totalItems}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    total
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ====================== END HEADER ====================== */}

      <div className="container py-16 lg:pb-28 lg:pt-20 space-y-20 lg:space-y-28">
        <main>
          {loading && isInitialLoad ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10 mt-8 lg:mt-10">
              {Array(8).fill(null).map((_, index) => (
                <div key={index} className="animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-2xl h-[400px]" />
              ))}
            </div>
          ) : loading ? (
            <div className="mt-8 lg:mt-10">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center mt-10">
              <div className="text-red-500">{error}</div>
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center mt-10">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                No Albums found
              </h3>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                No Albums available in the collection
              </p>
            </div>
          ) : (
            <div className="w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10 mt-8 lg:mt-10">
                {pagedNfts.map((nft) => (
                  <CardNFTMusic 
                    key={nft.id} 
                    nft={nft}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xl ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                  >
                    <FaArrowLeft />
                  </button>
                  <span className="text-lg font-medium">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xl ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                  >
                    <FaArrowRight />
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        <div className="relative py-20 lg:py-28">
          <BackgroundSection />
          <SectionSliderCollections />
        </div>
      </div>
    </div>
  );
};

export default PageCollection;
