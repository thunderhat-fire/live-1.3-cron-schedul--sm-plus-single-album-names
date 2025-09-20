import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        subscriptionTier: true,
        subscriptionStatus: true,
        payAsYouGoCredits: true,
        recordLabel: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('🔍 Upload permissions check for user:', {
      email: session.user.email,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      payAsYouGoCredits: user.payAsYouGoCredits,
      hasRecordLabel: !!user.recordLabel
    });

    // Check if user can create presales
    const isPaidTier = user.subscriptionTier && 
      ['starter', 'plus', 'gold'].includes(user.subscriptionTier) &&
      user.subscriptionStatus === 'active';

    let canUpload = false;
    let reason = '';
    let requiresAction = '';

    // For starter tier users, check if they have pay-as-you-go credits
    if (user.subscriptionTier === 'starter') {
      if (user.payAsYouGoCredits > 0) {
        canUpload = true;
      } else if (user.payAsYouGoCredits <= 0) {
        reason = 'You need to purchase a pay-as-you-go credit (£30) to create presales on the starter tier.';
        requiresAction = 'pay_as_you_go';
      }
    } else if (user.subscriptionTier === 'basic') {
      // Basic tier users with pay-as-you-go credits can upload
      if (user.payAsYouGoCredits > 0) {
        canUpload = true;
      } else {
        reason = 'You need to purchase a pay-as-you-go credit (£30) to create presales.';
        requiresAction = 'pay_as_you_go';
      }
    } else if (isPaidTier) {
      // Plus/Gold tiers can upload unlimited
      canUpload = true;
    } else {
      reason = 'You must upgrade to a paid subscription tier (Starter, Plus, or Gold) to create presales.';
      requiresAction = 'subscription';
    }

    // Check if user has a record label set
    if (canUpload && !user.recordLabel) {
      canUpload = false;
      reason = 'You must set up your record label in account settings before creating an Album';
      requiresAction = 'record_label';
    }

    const result = {
      success: true,
      canUpload,
      reason,
      requiresAction,
      userData: {
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        payAsYouGoCredits: user.payAsYouGoCredits,
        hasRecordLabel: !!user.recordLabel,
      }
    };

    console.log('🔍 Upload permissions result:', result);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error checking upload permissions:', error);
    return NextResponse.json({ error: 'Failed to check permissions' }, { status: 500 });
  }
}
