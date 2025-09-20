import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('🔍 Debug - Session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      subscriptionTier: session?.user?.subscriptionTier,
      aiMasteringCredits: session?.user?.aiMasteringCredits
    });

    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'No session found',
        session: null
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        aiMasteringCredits: true,
        subscriptionStatus: true
      }
    });

    console.log('🔍 Debug - User from DB:', user);

    const masteringRequests = await prisma.masteringRequest.findMany({
      where: { userId: user?.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            subscriptionTier: true
          }
        }
      }
    });

    console.log('🔍 Debug - Mastering requests for user:', masteringRequests);

    const allMasteringRequests = await prisma.masteringRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            subscriptionTier: true
          }
        }
      }
    });

    console.log('🔍 Debug - All mastering requests:', allMasteringRequests);

    return NextResponse.json({
      session: {
        hasSession: !!session,
        userEmail: session?.user?.email,
        subscriptionTier: session?.user?.subscriptionTier,
        aiMasteringCredits: session?.user?.aiMasteringCredits
      },
      userFromDB: user,
      userMasteringRequests: masteringRequests,
      allMasteringRequests: allMasteringRequests,
      totalRequestsCount: allMasteringRequests.length
    });

  } catch (error) {
    console.error('🔍 Debug error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
} 