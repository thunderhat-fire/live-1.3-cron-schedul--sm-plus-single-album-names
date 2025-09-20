export interface NFT {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  sideAImage?: string;
  endDate?: string;
  recordSize?: string;
  viewCount: number;
  currentOrders?: number;
  sideATracks?: Array<{
    id: string;
    name: string;
    url: string;
    duration: number;
  }>;
  likesCount: number;
  isLiked: boolean;
  author: {
    name: string;
    image: string;
  };
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  nftsCount: number;
  followersCount: number;
  isFollowing?: boolean;
} 