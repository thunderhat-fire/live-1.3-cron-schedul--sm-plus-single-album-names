import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User, NFT } from '@prisma/client';

interface UserWithRelations extends User {
  nfts: NFT[];
  User_A: User[];  // Users that this user follows
  User_B: User[];  // Users that follow this user
  _count?: {
    nfts: number;
    User_A: number;  // Following count
    User_B: number;  // Followers count
  };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
      include: {
        nfts: {
          where: {
            isDeleted: false
          }
        },
        User_A: {
          select: {
            id: true
          }
        },
        User_B: {
          select: {
            id: true
          }
        },
        _count: {
          select: {
            nfts: true,
            User_A: true,
            User_B: true
          }
        }
      }
    }) as UserWithRelations | null;

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the expected format
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio,
      website: user.website,
      facebook: user.facebook,
      twitter: user.twitter,
      tiktok: user.tiktok,
      nftsCount: user._count?.nfts || 0,
      followersCount: user._count?.User_B || 0,
      followingCount: user._count?.User_A || 0,
      subscriptionTier: user.subscriptionTier,
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
} 