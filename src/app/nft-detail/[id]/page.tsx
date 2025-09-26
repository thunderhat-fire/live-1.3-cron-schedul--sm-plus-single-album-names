"use client";

import React, { useEffect, useState, useRef } from "react";
import ItemTypeVideoIcon from "@/components/ItemTypeVideoIcon";
import LikeButton from "@/components/LikeButton";
import NcImage from "@/shared/NcImage/NcImage";
import Badge from "@/shared/Badge/Badge";
import LikeSaveBtns from "../LikeSaveBtns";
import Avatar from "@/shared/Avatar/Avatar";
import VerifyIcon from "@/components/VerifyIcon";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import ButtonSecondary from "@/shared/Button/ButtonSecondary";
import TabDetail from "../TabDetail";
import TimeCountDown from "../TimeCountDown";
import { useParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Tab } from "@headlessui/react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { FaRecordVinyl, FaTag } from "react-icons/fa";
import { Metadata } from 'next';
import { useSession } from "next-auth/react";
import { QRCodeSVG } from 'qrcode.react';
import { useCart } from "@/contexts/CartContext";
import NFTLikerAvatars from '@/components/NFTLikerAvatars';
import ShareEmailModal from '@/components/ShareEmailModal';
import { toast } from 'react-hot-toast';
import Link from "next/link";
import { useRadio } from "@/contexts/RadioContext";
import { useLikes } from "@/contexts/LikesContext";
import AlbumStructuredData from '@/components/StructuredData/AlbumStructuredData';
import ProductStructuredData from '@/components/StructuredData/ProductStructuredData';

interface NFT {
  id: string;
  name: string;
  description?: string;
  externalLink?: string;
  genre?: string;
  creator: string;
  userImage: string;
  creatorSubscriptionTier?: string;
  recordSize: '7 inch' | '12 inch';
  recordLabel?: string;
  price: number;
  digitalPrice?: number;
  endDate?: string;
  imageUrl: string;
  sideAImage?: string;
  sideBImage?: string;
  sideATracks?: Array<{
    id: string;
    name: string;
    url: string;
    duration: number;
    side: string;
    isrc?: string;
  }>;
  sideBTracks?: Array<{
    id: string;
    name: string;
    url: string;
    duration: number;
    side: string;
    isrc?: string;
  }>;
  currentOrders: number;
  targetOrders: number;
  isVinylPresale: boolean;
  isPresaleCompleted?: boolean; // Add this property from API
  showAsDigital?: boolean; // Add this property from API
  isLiked?: boolean;
  viewCount?: number;
  recentLikers?: Array<{
    id: string;
    name: string;
    image: string;
  }>;
  isDeleted: boolean;
  orders: Order[];
  digitalNotificationSent: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    name?: string;
    image?: string;
    id: string;
  };
}

interface Order {
  id: string;
  userId: string;
  nftId: string;
  format: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  nft: NFT;
}

interface User {
  id: string;
  email: string;
}

// Note: generateMetadata moved to layout.tsx for server-side generation

const NftDetailPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [nft, setNft] = useState<NFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [allNfts, setAllNfts] = useState<NFT[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: session } = useSession();
  const { addToCart, getItemQuantity } = useCart();
  const { toggleLike } = useLikes();
  const [selectedFormat, setSelectedFormat] = useState<'vinyl' | 'digital'>('vinyl');
  const [vinylQuantity, setVinylQuantity] = useState(1);
  const [digitalQuantity, setDigitalQuantity] = useState(1);
  const [maxVinylQuantity, setMaxVinylQuantity] = useState(10); // Default max quantity
  const [viewCount, setViewCount] = useState<number>(0);
  const viewIncrementedRef = useRef(false);
  const isNavigatingRef = useRef(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [previewTrackUrl, setPreviewTrackUrl] = useState<string>('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const formatPrice = (price: number | string | undefined): string => {
    if (typeof price === 'undefined') return '0.00';
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2);
  };

  // Function to get digital price
  const getDigitalPrice = (price: number | string | undefined): number => {
    if (typeof price === 'undefined') return 0;
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numericPrice) ? 0 : numericPrice / 2;
  };

  // Function to check if presale time has ended
  const isPresaleTimeEnded = () => {
    if (!nft?.endDate || !nft?.isVinylPresale) return false;
    const endDate = new Date(nft.endDate);
    return endDate.getTime() < Date.now();
  };
  
  // Use API data for presale completion status instead of calculating locally
  const isVinylPresaleComplete = nft?.isPresaleCompleted || nft?.showAsDigital || false;
  
  // Determine if digital copies are available - use API data
  const isDigitalAvailable = nft?.showAsDigital || !nft?.isVinylPresale || isVinylPresaleComplete;

  // Function to get current price based on presale status
  const getCurrentPrice = () => {
    // If presale is completed, only digital is available at £13
    if (isVinylPresaleComplete) return 13;
    
    // If not a presale, always digital price
    if (!nft?.isVinylPresale) return 13;
    
    // Check record size for pricing
    if (nft.recordSize === '7 inch') {
      return 13; // Fixed price for 7-inch records
    }
    
    // 12-inch tiered pricing based on target orders
    if (nft.targetOrders === 100) return 26;
    if (nft.targetOrders === 200) return 22;
    if (nft.targetOrders === 500) return 20;
    return 26; // Default to 26 if not matched
  };

  // Get presale status message
  const getPresaleStatusMessage = () => {
    if (!nft?.isVinylPresale) return "Not a presale item";
    
    if (isVinylPresaleComplete) {
      return "Presale completed! Now available as digital download.";
    }
    
    const remainingOrders = Math.max(0, (nft?.targetOrders || 100) - (nft?.currentOrders || 0));
    if (remainingOrders <= 0) {
      return "Target orders reached! Digital copies now available.";
    }
    if (isPresaleTimeEnded()) {
      return "Presale time ended. Digital copies now available.";
    }
    const endDate = nft?.endDate ? new Date(nft.endDate).toLocaleDateString() : '';
    return `${remainingOrders} more orders needed before ${endDate}`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Update maxVinylQuantity based on NFT data
  useEffect(() => {
    if (nft && nft.isVinylPresale) {
      const available = Math.max(0, (nft.targetOrders || 100) - (nft.currentOrders || 0));
      setMaxVinylQuantity(Math.min(10, available)); // Cap at 10 for UI, but use actual available quantity
    }
  }, [nft]);

  useEffect(() => {
    const fetchAllNFTs = async () => {
      try {
        console.log('Fetching all NFTs...'); // Debug log
        const response = await fetch('/api/nfts?showAll=true', {
          cache: 'no-store' // Ensure we get fresh data
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
        if (data.nfts && Array.isArray(data.nfts)) {
          const activeNfts = data.nfts.filter((nft: NFT) => !nft.isDeleted);
          console.log('Active NFTs found:', activeNfts.length, activeNfts); // Debug log
          
          setAllNfts(activeNfts);
          
          const currentNftIndex = activeNfts.findIndex(
            (nft: NFT) => nft.id === params?.id
          );
          console.log('Current NFT index:', currentNftIndex, 'for ID:', params?.id); // Debug log
          
          if (currentNftIndex !== -1) {
            setCurrentIndex(currentNftIndex);
          }
        } else {
          console.error('Invalid data format from API:', data);
        }
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      } finally {
        setInitialLoadComplete(true);
        setLoading(false);
      }
    };

    fetchAllNFTs();
  }, [params?.id]);

  // Check inventory limits when NFT changes
  useEffect(() => {
    const checkInventoryLimits = async () => {
      if (!nft || !nft.isVinylPresale) return;

      try {
        const response = await fetch('/api/inventory/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nftId: nft.id,
            requestedQuantity: 1, // Just checking limits
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const maxAllowed = Math.min(data.availableQuantity, data.maxQuantityPerOrder);
            setMaxVinylQuantity(maxAllowed);
            
            // Adjust current quantity if it exceeds the limit
            if (vinylQuantity > maxAllowed) {
              setVinylQuantity(Math.max(1, maxAllowed));
            }
          }
        }
      } catch (error) {
        console.error('Error checking inventory limits:', error);
      }
    };

    checkInventoryLimits();
  }, [nft, vinylQuantity]);

  useEffect(() => {
    const fetchNFTData = async () => {
      if (!params?.id || isNavigatingRef.current) return;
      
      setLoading(true);
      try {
        const [nftResponse, likeResponse] = await Promise.all([
          fetch(`/api/nfts/${params.id}`),
          session ? fetch(`/api/nfts/${params.id}/like-status`) : Promise.resolve(null)
        ]);

        if (!nftResponse.ok) throw new Error('Failed to fetch NFT');
        const nftData = await nftResponse.json();
        
        let isLiked = false;
        if (likeResponse) {
          const likeData = await likeResponse.json();
          isLiked = likeData.isLiked;
          // Update the LikesContext with the fetched like status
          toggleLike(params.id as string, isLiked);
        }

        // Add debug logging
        console.log('NFT Data:', {
          id: nftData.id,
          name: nftData.name,
          isVinylPresale: nftData.isVinylPresale,
          endDate: nftData.endDate,
          currentOrders: nftData.currentOrders,
          targetOrders: nftData.targetOrders
        });

        setNft({ ...nftData, isLiked });
        
        // Update meta tags when NFT data is loaded
        if (nftData) {
          const absoluteImageUrl = new URL(nftData.imageUrl, window.location.origin).toString();
          const absolutePageUrl = window.location.href;
          
          // Update Open Graph meta tags
          document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${nftData.name} - Pre-sale Vinyl`);
          document.querySelector('meta[property="og:description"]')?.setAttribute('content', `${nftData.description || ''}\nGenre: ${nftData.genre || 'N/A'}\nRecord Size: ${nftData.recordSize}\nPrice: £${!nftData.isVinylPresale ? '24.99 (Pre-sale)' : '13.00 (Digital)'}`);
          document.querySelector('meta[property="og:image"]')?.setAttribute('content', absoluteImageUrl);
          document.querySelector('meta[property="og:url"]')?.setAttribute('content', absolutePageUrl);
          document.querySelector('meta[property="og:type"]')?.setAttribute('content', 'music.album');
          
          // Update Twitter meta tags
          document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', `${nftData.name} - Pre-sale Vinyl`);
          document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', `${nftData.description || ''}\nGenre: ${nftData.genre || 'N/A'}\nRecord Size: ${nftData.recordSize}\nPrice: £${!nftData.isVinylPresale ? '24.99 (Pre-sale)' : '13.00 (Digital)'}`);
          document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', absoluteImageUrl);
        }
      } catch (error) {
        console.error('Error fetching NFT:', error);
      } finally {
        setLoading(false);
        isNavigatingRef.current = false;
      }
    };

    fetchNFTData();
  }, [params?.id, session]);

  // Add this useEffect for view counter
  useEffect(() => {
    const incrementViewCount = async () => {
      if (!params?.id || viewIncrementedRef.current) return;
      
      try {
        viewIncrementedRef.current = true;
        const response = await fetch('/api/nfts/increment-views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nftId: params.id }),
        });
        
        const data = await response.json();
        if (data.success) {
          setViewCount(data.viewCount);
        }
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
    };

    incrementViewCount();
  }, [params?.id]);

  const handlePrevious = async () => {
    if (currentIndex > 0 && allNfts.length > 0) {
      const prevNft = allNfts[currentIndex - 1];
      console.log('Navigating to previous NFT:', prevNft.id); // Debug log
      isNavigatingRef.current = true;
      setLoading(true);
      await router.push(`/nft-detail/${prevNft.id}`);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex < allNfts.length - 1 && allNfts.length > 0) {
      const nextNft = allNfts[currentIndex + 1];
      console.log('Navigating to next NFT:', nextNft.id); // Debug log
      isNavigatingRef.current = true;
      setLoading(true);
      await router.push(`/nft-detail/${nextNft.id}`);
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Update the initial format selection to always start with vinyl during presale
  useEffect(() => {
    // Force vinyl selection during presale
    setSelectedFormat(isVinylPresaleComplete ? 'digital' : 'vinyl');
  }, [isVinylPresaleComplete]);

  // Add function to refresh track URL
  const refreshTrackUrl = async (trackId: string) => {
    try {
      const response = await fetch(`/api/tracks/${trackId}/refresh-url`);
      if (!response.ok) throw new Error('Failed to refresh track URL');
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error refreshing track URL:', error);
      return null;
    }
  };

  // Add effect to handle preview track URL
  useEffect(() => {
    if (nft?.sideATracks?.[0]) {
      const track = nft.sideATracks[0];
      // Check if URL is a signed URL (contains signature parameter)
      if (track.url.includes('Signature=')) {
        refreshTrackUrl(track.id).then(url => {
          if (url) setPreviewTrackUrl(url);
        });
      } else {
        setPreviewTrackUrl(track.url);
      }
    }
  }, [nft]);

  const handleShareEmail = async (recipientEmail: string, shareMessage: string) => {
    if (!session?.user?.name) {
      router.push('/login');
      return;
    }

    if (!nft) {
      toast.error('NFT data not available');
      return;
    }

    setIsSharing(true);
    try {
      const response = await fetch('/api/share/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nftId: nft.id,
          recipientEmail,
          shareMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to share');
      }

      toast.success('Shared successfully!');
      setIsShareModalOpen(false);
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  // Note: Metadata is now handled server-side via generateMetadata function
  // Client-side metadata updates removed for better SEO performance

  // Update the Facebook share function
  const handleFacebookShare = () => {
    if (!nft) return;

    try {
      const shareUrl = getFacebookShareUrl();
      window.open(shareUrl, '_blank', 'width=600,height=400');
    } catch (error) {
      console.error('Error opening share dialog:', error);
    }
  };

  // Add this helper function
  const getPriceDisplayText = () => {
    if (!nft) return 'Price: £0';
    
    if (!isVinylPresaleComplete && nft.isVinylPresale) {
      return `Vinyl Pre-sale Price: £${formatPrice(getCurrentPrice())}`;
    } else if (isDigitalAvailable) {
      const digitalPrice = 13; // Always £13 for digital
      return `Digital Edition Price: £${formatPrice(digitalPrice)}`;
    }
    return `Price: £${formatPrice(getCurrentPrice())}`;
  };

  // Update pagination display
  const getPaginationText = () => {
    console.log('Pagination state:', {
      loading,
      initialLoadComplete,
      allNftsLength: allNfts.length,
      currentIndex
    }); // Debug log
    
    if (!initialLoadComplete || loading) return "Loading...";
    if (!allNfts || allNfts.length === 0) return "No NFTs available";
    return `${currentIndex + 1} of ${allNfts.length}`;
  };

  // Add this helper function at the top level of the component
  const formatExternalLink = (link: string): string => {
    if (!link) return '';
    // Check if the link already has a protocol
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }
    // Add https:// if no protocol is present
    return `https://${link}`;
  };

  // Add this helper function near the top of the component
  const removeFileExtension = (filename: string) => {
    return filename.replace(/\.[^/.]+$/, '');
  };

  // Add this function near the top of the component
  const getFacebookShareUrl = () => {
    if (!nft) return '';
    const shareText = `${nft.name} - ${nft.genre || ''} ${nft.recordSize} vinyl on VinylFunders`;
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&t=${encodeURIComponent(shareText)}`;
  };

  if (loading) {
    return <div className="container py-10">Loading...</div>;
  }

  if (!nft) {
    return <div className="container py-10">NFT not found</div>;
  }

  const handleAddToCart = async () => {
    if (!nft) return;

    const quantity = selectedFormat === 'vinyl' ? vinylQuantity : digitalQuantity;
    let maxQuantity = selectedFormat === 'vinyl' ? (nft.currentOrders || 0) : undefined;
    const price = selectedFormat === 'vinyl' ? getCurrentPrice() : 13.00;

    // For vinyl presale items, check real-time inventory first
    if (selectedFormat === 'vinyl' && nft.isVinylPresale) {
      try {
        const response = await fetch('/api/inventory/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nftId: nft.id,
            requestedQuantity: quantity,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            maxQuantity = data.maxQuantityPerOrder;
            
            // Show warning if not enough inventory
            if (!data.isAvailable) {
              alert(`Only ${data.availableQuantity} items available. Adding ${data.adjustedQuantity} to cart.`);
            }
          }
        }
      } catch (error) {
        console.error('Error checking inventory:', error);
      }
    }

    await addToCart({
      id: nft.id,
      name: `${nft.name} (${selectedFormat.toUpperCase()})`,
      price: price,
      imageUrl: nft.imageUrl,
      format: selectedFormat,
      quantity,
      maxQuantity
    });

    router.push('/cart');
  };

  return (
    <div className={`nc-NftDetailPage`}>
      {nft && (
        <>
          <AlbumStructuredData nft={nft} />
          <ProductStructuredData nft={nft} />
        </>
      )}
      <div className="container">
        <div className="my-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <h2 className="text-3xl font-semibold">{nft?.name}</h2>
              <span className="text-sm text-neutral-500">
                {viewCount} views
              </span>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row">
            {/* LEFT */}
            <div className="w-full lg:w-[55%] p-6">
              {/* Album Artwork Container */}
              <div className="relative mb-6">
                {/* Simple album artwork display - no flip effects */}
                <div className="relative w-full aspect-square">
                  <img
                    src={nft.sideAImage || nft.imageUrl}
                    alt={nft.name}
                    className="object-cover w-full h-full rounded-3xl border border-gray-300 p-[3px]"
                    onError={(e) => {
                      console.error('Album artwork failed to load:', nft.sideAImage || nft.imageUrl);
                      e.currentTarget.src = '/images/placeholder-small.png';
                    }}
                  />
                </div>
                
                {/* NFT Likers display - positioned at bottom left */}
                <div className="absolute bottom-4 left-4">
                  <NFTLikerAvatars 
                    likers={nft.recentLikers || []} 
                    className="drop-shadow-lg"
                  />
                </div>
              </div>
              
              {/* Format Selection and Purchase Section */}
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Available Formats</h3>
                  {isVinylPresaleComplete ? (
                    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">
                      Presale Completed - Digital Available
                    </span>
                  ) : nft?.isVinylPresale && (
                    <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full dark:bg-green-900 dark:text-green-300">
                      Vinyl Pre-sale Active
                    </span>
                  )}
                </div>
                
                <div className="space-y-4">
                  {/* Format Selection Buttons */}
                  <div className="flex space-x-2">
                    {/* Vinyl Button */}
                    <button
                      onClick={() => setSelectedFormat('vinyl')}
                      disabled={isVinylPresaleComplete}
                      className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                        selectedFormat === 'vinyl' && !isVinylPresaleComplete
                          ? 'bg-primary-500 text-white border-primary-500'
                          : isVinylPresaleComplete
                          ? 'bg-neutral-200 text-neutral-400 border-neutral-200 cursor-not-allowed'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold">Vinyl Pre-sale</div>
                        <div className="text-xs mt-1 bg-green-100/50 rounded px-2 py-1">
                          {isVinylPresaleComplete ? (
                            <span className="text-neutral-600">(Completed)</span>
                          ) : (
                            <>
                              £{nft.recordSize === '7 inch' ? 13 : (nft.targetOrders === 100 ? 26 : nft.targetOrders === 200 ? 22 : nft.targetOrders === 500 ? 20 : 26)}
                            </>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Digital Button */}
                    <button
                      onClick={() => setSelectedFormat('digital')}
                      disabled={!isDigitalAvailable}
                      className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                        selectedFormat === 'digital' && isDigitalAvailable
                          ? 'bg-primary-500 text-white border-primary-500'
                          : !isDigitalAvailable
                          ? 'bg-neutral-200 text-neutral-400 border-neutral-200 cursor-not-allowed'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold">Digital Download</div>
                        <div className="text-xs mt-1 bg-green-100/50 rounded px-2 py-1">
                          £13.00
                          {!isDigitalAvailable && <span className="ml-1">(Not Yet Available)</span>}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Format Details */}
                  <div className="p-3 bg-white dark:bg-neutral-700 rounded-lg">
                    {selectedFormat === 'vinyl' ? (
                      <div>
                        <div className="font-medium mb-2">Vinyl Pre-sale Edition</div>
                        <p className="text-sm text-neutral-500 mb-3">
                          {isVinylPresaleComplete ? (
                            <>
                              Presale completed with {nft?.targetOrders || 100} orders
                              <br />
                              {getPresaleStatusMessage()}
                            </>
                          ) : (
                            <>
                              {nft?.currentOrders || 0} of {nft?.targetOrders || 100} pre-sale orders completed
                              <br />
                              {getPresaleStatusMessage()}
                            </>
                          )}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600 mb-3">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isVinylPresaleComplete ? 'bg-green-500' : 'bg-primary-500'
                            }`}
                            style={{ 
                              width: `${isVinylPresaleComplete ? 100 : Math.min(100, Math.max(0, ((nft?.currentOrders || 0) / (nft?.targetOrders || 100)) * 100))}%` 
                            }}
                          />
                        </div>
                        
                        {/* Vinyl Quantity Selector */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Quantity:</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setVinylQuantity(Math.max(1, vinylQuantity - 1))}
                              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700"
                              disabled={vinylQuantity <= 1}
                            >
                              -
                            </button>
                            <span className="w-12 text-center">{vinylQuantity}</span>
                            <button
                              onClick={() => setVinylQuantity(Math.min(maxVinylQuantity, vinylQuantity + 1))}
                              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700"
                              disabled={vinylQuantity >= maxVinylQuantity}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        {/* Availability Indicator */}
                        {nft.isVinylPresale && (
                          <div className="text-xs text-neutral-500 mt-2">
                            {(() => {
                              const available = Math.max(0, (nft.targetOrders || 100) - (nft.currentOrders || 0));
                              return available > 0 
                                ? `${available} available`
                                : 'Sold out'
                            })()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium mb-2">Digital Download</div>
                        <p className="text-sm text-neutral-500 mb-3">
                          {isVinylPresaleComplete 
                            ? "Available for immediate download after purchase"
                            : "Available after Pre-sale time ends"}
                        </p>
                        
                        {/* Digital Quantity Selector */}
                        {isDigitalAvailable && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Quantity:</span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setDigitalQuantity(Math.max(1, digitalQuantity - 1))}
                                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700"
                              >
                                -
                              </button>
                              <span className="w-12 text-center">{digitalQuantity}</span>
                              <button
                                onClick={() => setDigitalQuantity(Math.min(10, digitalQuantity + 1))}
                                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Price:</span>
                      <span className="text-lg font-bold bg-green-100/50 rounded px-2 py-1">
                        £{(
                          selectedFormat === 'vinyl' 
                            ? getCurrentPrice() * vinylQuantity 
                            : 13.00 * digitalQuantity
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {selectedFormat === 'vinyl' && vinylQuantity > 1 && <span className="bg-green-100/50 rounded px-2 py-1">{vinylQuantity} × £{getCurrentPrice()}</span>}
                      {selectedFormat === 'digital' && digitalQuantity > 1 && <span className="bg-green-100/50 rounded px-2 py-1">{digitalQuantity} × £13.00</span>}
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={
                      (selectedFormat === 'vinyl' && isVinylPresaleComplete) ||
                      (selectedFormat === 'digital' && !isDigitalAvailable)
                    }
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                      (selectedFormat === 'vinyl' && isVinylPresaleComplete) ||
                      (selectedFormat === 'digital' && !isDigitalAvailable)
                        ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    {selectedFormat === 'vinyl' && isVinylPresaleComplete
                      ? 'Vinyl Pre-sale Completed'
                      : selectedFormat === 'digital' && !isDigitalAvailable
                      ? 'Digital Not Yet Available'
                      : 'Add to Cart'
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="w-full lg:w-[45%] pt-10 lg:pt-0 lg:pl-7 xl:pl-9 2xl:pl-10">
              <div className="space-y-8">
                {/* ---------- 1 ----------  */}
                <div className="space-y-2">
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">Album Title</div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold">
                    {nft.name}
                  </h2>

                  <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-8">
                    <div className="flex items-center">
                      <Link href={nft.user?.id ? `/author/${nft.user.id}` : '#'} className="flex items-center group cursor-pointer">
                        <div className="flex-shrink-0 w-[35px] h-[35px]">
                          <Image
                            alt="Creator"
                            src={nft.userImage}
                            className="rounded-full w-[35px] h-[35px] object-cover group-hover:ring-2 group-hover:ring-primary-500 transition"
                            width={35}
                            height={35}
                            priority
                          />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-semibold flex items-center group-hover:text-primary-600 transition-colors">
                            {nft.creator}
                            <VerifyIcon 
                              className="ml-1" 
                              iconClass="w-4 h-4" 
                              subscriptionTier={nft.creatorSubscriptionTier}
                            />
                          </div>
                        </div>
                      </Link>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-full">
                        <FaRecordVinyl className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-semibold">{nft.recordSize}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-full">
                        <FaTag className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-semibold">{nft.recordLabel}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="w-full border-b border-neutral-200 dark:border-neutral-700 my-6"></div>

                {/* ---------- 2 ----------  */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-2xl font-semibold bg-green-100/50 rounded px-2 py-1 inline-block">
                      {!isVinylPresaleComplete
                        ? `Pre-sale Price: £${getCurrentPrice()}`
                        : `Digital Price: £13.00`
                      }
                    </div>
                    <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      <span>
                        {!isVinylPresaleComplete
                          ? "Pre-sale price for vinyl pressing"
                          : "Fixed price for digital download"
                        }
                      </span>
                    </div>
                  </div>
                  
                  {/* QR Code */}
                  <div className="mx-4 bg-white p-2 rounded-lg">
                    <QRCodeSVG
                      value={`${window.location.origin}${pathname}`}
                      size={80}
                      level="H"
                      includeMargin={true}
                      className="qr-code"
                    />
                  </div>

                  <LikeButton className="!h-10 !w-10" nftId={nft.id} />
                </div>

                {/* ---------- 3 ----------  */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-8">
                  <div className="flex-1">
                    <TimeCountDown endDate={nft?.endDate || ''} />
                  </div>
                </div>

                {/* ---------- 4 ----------  */}
                <div className="w-full border-b-2 border-neutral-100 dark:border-neutral-700"></div>

                {/* Social Share Section */}
                <div className="flex flex-col space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      Share this vinyl
                    </span>
                    <div className="flex items-center space-x-3">
                      {/* Share via Email */}
                      <button
                        onClick={() => {
                          if (!session?.user?.name) {
                            router.push('/login');
                            return;
                          }
                          setIsShareModalOpen(true);
                        }}
                        className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        title="Share via Email"
                      >
                        <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      {/* Twitter/X Share */}
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this vinyl: ${nft.name}${nft.description ? '\n\n' + nft.description : ''}\n\nPrice: £${getCurrentPrice()}\nGenre: ${nft.genre || 'N/A'}\nRecord Size: ${nft.recordSize}\n\n`)}&url=${encodeURIComponent(window.location.href)}&hashtags=VinylFunders,Vinyl,Music`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        title="Share on Twitter/X"
                      >
                        <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 4C22 4 21.3 6.1 20 7.4C21.6 17.4 10.6 24.7 2 19C4.2 19.1 6.4 18.4 8 17C3 15.5 0.5 9.6 3 5C5.2 7.6 8.6 9.1 12 9C11.1 4.8 16 2.4 19 5.2C20.1 5.2 22 4 22 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>

                      {/* Facebook Share */}
                      <button
                        onClick={handleFacebookShare}
                        className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        title="Share on Facebook"
                        type="button"
                      >
                        <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      {/* LinkedIn Share */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('LinkedIn share button clicked');
                          
                          if (!nft) {
                            console.log('No NFT data available for LinkedIn share');
                            return;
                          }

                          // Construct a detailed description
                          const description = `${nft.description || ''}

🎵 Genre: ${nft.genre || 'N/A'}
💿 Record Size: ${nft.recordSize}
${nft.isVinylPresale ? `💰 Pre-sale Price: £${getCurrentPrice()}` : `💰 Digital Price: £13.00`}
${nft.isVinylPresale ? `🎯 Target Orders: ${nft.targetOrders}` : ''}
${nft.isVinylPresale ? `📊 Current Orders: ${nft.currentOrders}` : ''}

#VinylFunders #Vinyl #Music ${nft.genre ? `#${nft.genre.replace(/\s+/g, '')}` : ''}`;

                          // Construct the LinkedIn share URL
                          const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(`Check out "${nft.name}" on VinylFunders`)}&summary=${encodeURIComponent(description)}`;
                          
                          console.log('LinkedIn share URL:', shareUrl);
                          
                          // Open the share dialog
                          try {
                            const shareWindow = window.open(
                              shareUrl,
                              'linkedin-share-dialog',
                              'width=626,height=436'
                            );
                            
                            if (shareWindow) {
                              console.log('LinkedIn share dialog opened successfully');
                            } else {
                              console.log('LinkedIn share window was blocked by popup blocker');
                            }
                          } catch (error) {
                            console.error('Error opening LinkedIn share dialog:', error);
                          }
                        }}
                        className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        title="Share on LinkedIn"
                        type="button"
                      >
                        <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 9H2V21H6V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      {/* Copy Link */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          // You can add a toast notification here
                        }}
                        className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        title="Copy Link"
                      >
                        <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.828 10.172C13.0722 9.41626 12.0523 8.99875 10.9877 9.00007C9.92305 9.00138 8.90456 9.42141 8.151 10.179L4.151 14.179C3.39814 14.9326 2.99858 15.9535 3.00002 17.0183C3.00146 18.0831 3.40381 19.1027 4.15897 19.8543C4.91413 20.6059 5.93527 21.0035 7.00007 20.9999C8.06487 20.9964 9.08347 20.5921 9.834 19.836L11.248 18.414M10.172 13.828C10.9278 14.5837 11.9477 15.0013 13.0123 14.9999C14.077 14.9986 15.0954 14.5786 15.849 13.821L19.849 9.82102C20.6019 9.06742 21.0014 8.04649 21 6.98169C20.9986 5.91689 20.5962 4.89729 19.841 4.14569C19.0859 3.39408 18.0647 2.99646 16.9999 3.00002C15.9351 3.00358 14.9165 3.40789 14.166 4.16402L12.752 5.58602" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio Preview */}
              {nft?.sideATracks && nft.sideATracks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                    {nft.genre}
                  </div>
                  <h3 className="text-lg font-semibold">Preview Track</h3>
                  <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{nft.sideATracks[0].name}</span>
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        {formatDuration(Math.min(nft.sideATracks[0].duration || 0, 30))}
                      </span>
                    </div>
                    {previewTrackUrl ? (
                      <audio
                        controls
                        controlsList="nodownload noplaybackrate"
                        preload="metadata"
                        className="w-full"
                        src={previewTrackUrl}
                        key={previewTrackUrl} // Force audio element to re-render when URL changes
                      >
                        Your browser does not support the audio element.
                      </audio>
                    ) : (
                      <div className="text-sm text-neutral-500">Loading preview...</div>
                    )}
                  </div>
                </div>
              )}

              {/* Track listings */}
              {/* {nft?.sideATracks && nft.sideATracks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Side A</h3>
                  <div className="space-y-3">
                    {nft.sideATracks.map((track, index) => (
                      <div key={track.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-neutral-500 dark:text-neutral-400">{index + 1}.</span>
                          <span className="font-medium">{track.name}</span>
                        </div>
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}

              {/* {nft?.sideBTracks && nft.sideBTracks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Side B</h3>
                  <div className="space-y-3">
                    {nft.sideBTracks.map((track, index) => (
                      <div key={track.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-neutral-500 dark:text-neutral-400">{index + 1}.</span>
                          <span className="font-medium">{track.name}</span>
                        </div>
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}

              {/* ---------- 5 ----------  */}
              <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl p-1 bg-neutral-100 dark:bg-neutral-800">
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-neutral-700 dark:text-neutral-300
                      ${
                        selected
                          ? "bg-white dark:bg-neutral-900 shadow"
                          : "hover:bg-white/[0.12] hover:text-neutral-800 dark:hover:text-neutral-100"
                      }
                      `
                    }
                  >
                    Details
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-neutral-700 dark:text-neutral-300
                      ${
                        selected
                          ? "bg-white dark:bg-neutral-900 shadow"
                          : "hover:bg-white/[0.12] hover:text-neutral-800 dark:hover:text-neutral-100"
                      }
                      `
                    }
                  >
                    Track Listing
                  </Tab>
                </Tab.List>
                <Tab.Panels className="mt-4">
                  <Tab.Panel className="rounded-xl">
                    <div className="text-neutral-6000 dark:text-neutral-300">
                      <span>{nft.description}</span>
                    </div>
                  </Tab.Panel>
                  <Tab.Panel className="rounded-xl">
                    <div className="space-y-6">
                      {nft?.sideATracks && nft.sideATracks.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Side A</h3>
                          <div className="space-y-3">
                            {nft.sideATracks.map((track, index) => (
                              <div key={track.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <span className="text-neutral-500 dark:text-neutral-400">{index + 1}.</span>
                                  <span className="font-medium">{removeFileExtension(track.name)}</span>
                                </div>
                                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {formatDuration(track.duration)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {nft?.sideBTracks && nft.sideBTracks.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Side B</h3>
                          <div className="space-y-3">
                            {nft.sideBTracks.map((track, index) => (
                              <div key={track.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <span className="text-neutral-500 dark:text-neutral-400">{index + 1}.</span>
                                  <span className="font-medium">{removeFileExtension(track.name)}</span>
                                </div>
                                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {formatDuration(track.duration)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-8 space-x-3">
            <ButtonSecondary 
              onClick={handlePrevious}
              disabled={currentIndex <= 0 || loading || !allNfts || allNfts.length === 0}
            >
              Previous
            </ButtonSecondary>
            
            <span className="text-neutral-500">
              {getPaginationText()}
            </span>
            
            <ButtonSecondary 
              onClick={handleNext}
              disabled={!allNfts || currentIndex >= allNfts.length - 1 || loading}
            >
              Next
            </ButtonSecondary>
          </div>

          {/* Separator line */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 my-8"></div>

          {/* Presale Information Text */}
          <div className="text-sm text-neutral-600 dark:text-neutral-400 text-center max-w-2xl mx-auto mb-8">
            <p>
              Pre-Sale orders are stored and subsequently processed for record Pressing and Postage once the target has been reached - please be aware that postage is included in the purchase price for United Kingdom only - additional postage fees are charged for customers at checkout if you are overseas.
            </p>
          </div>

          {/* Add external link below the image */}
          {nft?.externalLink && (
            <div className="mt-4 flex items-center justify-center">
              <a
                href={formatExternalLink(nft.externalLink)}
                onClick={(e) => {
                  e.preventDefault();
                  window.open(formatExternalLink(nft.externalLink!), '_blank');
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                Visit External Link
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Share Email Modal */}
      <ShareEmailModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSubmit={handleShareEmail}
        nftName={nft?.name || ''}
        isLoading={isSharing}
      />
    </div>
  );
};

export default NftDetailPage; 