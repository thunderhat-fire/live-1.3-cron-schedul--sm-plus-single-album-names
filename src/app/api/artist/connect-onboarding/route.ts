import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createOrGetConnectAccount, createConnectOnboardingLink } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch (_) {
      body = {};
    }
    const { businessType = 'individual', country = 'GB' } = body;

    // Validate business type
    if (!['individual', 'company'].includes(businessType)) {
      return NextResponse.json({ error: 'Invalid business type' }, { status: 400 });
    }

    // Create or get Connect account
    const accountResult = await createOrGetConnectAccount({
      userId: session.user.id,
      email: session.user.email,
      businessType,
      country,
    });

    if (!accountResult.success || !accountResult.account) {
      return NextResponse.json({ 
        error: `Failed to create Connect account: ${accountResult.error}` 
      }, { status: 500 });
    }

    const { account, isNewAccount } = accountResult;

    // If account already exists and onboarding has been submitted, treat as complete
    if (!isNewAccount) {
      return NextResponse.json({
        success: true,
        accountId: account.id,
        onboardingComplete: account.details_submitted || true,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      });
    }

    // Create onboarding link
    const onboardingResult = await createConnectOnboardingLink({
      accountId: account.id,
      userId: session.user.id,
    });

    if (!onboardingResult.success) {
      return NextResponse.json({ 
        error: `Failed to create onboarding link: ${onboardingResult.error}` 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      accountId: account.id,
      onboardingUrl: onboardingResult.url,
      onboardingComplete: false,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      isNewAccount,
    });

  } catch (error) {
    console.error('Error in Connect onboarding:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 