import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function getUserNFTs(sessionUserId: string) {
  // Fetch user's NFTs from the database
  return prisma.user.findUnique({
    where: { id: sessionUserId },
    include: { nfts: true }, // Assuming you have a relation between User and NFT
  });
}

export async function getFirstUserNFT(sessionUserId: string) {
  // Get the first NFT for the user
  return prisma.nFT.findFirst({
    where: { userId: sessionUserId },
  });
} 