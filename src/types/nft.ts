export interface NFT {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  creator?: string;
  userImage?: string;
  creatorSubscriptionTier?: string;
  recordSize?: string;
  recordLabel?: string;
  price: string | number;
  endDate?: string;
  imageUrl?: string;
  sideAImage: string;
  sideBImage?: string;
  sideATracks?: string[];
  sideBTracks?: string[];
  currentOrders?: number;
  targetOrders?: number;
  isVinylPresale: boolean;
  showAsDigital?: boolean;
  isLiked?: boolean;
  viewCount?: number;
  isDeleted?: boolean;
  user: {
    id: string;
    name: string;
    image: string;
    subscriptionTier?: string;
  };
} 