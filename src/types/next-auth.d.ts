import NextAuth from "next-auth";
import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"
import { User } from '@prisma/client';

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    bio?: string | null;
    website?: string | null;
    facebook?: string | null;
    twitter?: string | null;
    tiktok?: string | null;
    walletAddress?: string | null;
    recordLabel?: string | null;
    recordLabelImage?: string | null;
    isAdmin: boolean;
    subscriptionTier?: string | null;
    subscriptionStatus?: string | null;
    aiMasteringCredits?: number | null;
    payAsYouGoCredits?: number | null;
  }

  interface Session {
    user: User & {
      id: string;
      isAdmin: boolean;
      isPlusMember: boolean;
      currentPresaleId?: string;
      bio?: string | null;
      website?: string | null;
      facebook?: string | null;
      twitter?: string | null;
      tiktok?: string | null;
      walletAddress?: string | null;
      recordLabel?: string | null;
      recordLabelImage?: string | null;
      subscriptionTier?: string | null;
      subscriptionStatus?: string | null;
      aiMasteringCredits?: number | null;
      payAsYouGoCredits?: number | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    bio?: string | null;
    website?: string | null;
    facebook?: string | null;
    twitter?: string | null;
    tiktok?: string | null;
    walletAddress?: string | null;
    recordLabel?: string | null;
    recordLabelImage?: string | null;
    isAdmin: boolean;
    subscriptionTier?: string | null;
    subscriptionStatus?: string | null;
    aiMasteringCredits?: number | null;
    payAsYouGoCredits?: number | null;
  }
} 