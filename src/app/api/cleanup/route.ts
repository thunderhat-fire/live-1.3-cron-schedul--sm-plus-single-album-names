import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Delete in the correct order to respect foreign key constraints
    console.log('Starting cleanup...');

    // 1. Delete all likes first (they reference both users and NFTs)
    await prisma.like.deleteMany();
    console.log('Deleted all likes');

    // 2. Delete all tracks (they reference NFTs)
    await prisma.track.deleteMany();
    console.log('Deleted all tracks');

    // 3. Delete all NFTs
    await prisma.nFT.deleteMany();
    console.log('Deleted all NFTs');

    // 4. Delete all sessions
    await prisma.session.deleteMany();
    console.log('Deleted all sessions');

    // 5. Delete all accounts
    await prisma.account.deleteMany();
    console.log('Deleted all accounts');

    // 6. Delete all verification tokens
    await prisma.verificationToken.deleteMany();
    console.log('Deleted all verification tokens');

    // 7. Finally, delete all users
    await prisma.user.deleteMany();
    console.log('Deleted all users');

    return NextResponse.json({
      success: true,
      message: 'All data cleaned up successfully'
    });
  } catch (error: any) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: error.message || 'Error during cleanup' },
      { status: 500 }
    );
  }
} 