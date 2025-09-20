import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { updateContactSubscriptionTier, sendTransactionalEmail, EMAIL_TEMPLATES } from '@/lib/brevo';

// Helper function to calculate subscription end date (30 days from now)
function getSubscriptionEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}

// GET current subscription status
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch vinyl sales count (only presale orders) - sum quantities, not just count orders
    // This counts albums ordered BY FANS (orders of NFTs owned by this user)
    const vinylSalesResult = await prisma.order.aggregate({
      _sum: { quantity: true },
      where: {
        nft: {
          userId: user.id, // Orders for NFTs owned by this user (fans ordering from this artist)
        },
        format: 'vinyl',
        status: { in: ['completed', 'pending', 'processing'] }, // Include pending orders that are being processed
        paymentStatus: { in: ['captured', 'processed', 'pending', 'completed'] }, // Include captured/processed/pending/completed payments
        isPresaleOrder: true,
      },
    });

    const vinylSalesCount = vinylSalesResult._sum.quantity || 0;

    // Fetch digital downloads count
    const digitalDownloadsCount = await prisma.order.count({
      where: {
        nft: {
          userId: user.id, // Orders for NFTs owned by this user
        },
        format: 'digital',
        status: { in: ['completed', 'processing'] }, // Include both completed and processing digital orders
        paymentStatus: { in: ['processed', 'captured', 'completed'] }, // Include processed/captured/completed payments
      },
    });

    // Fetch successful presales count (presales that reached their target, regardless of payment processing)
    const successfulPresalesCount = await prisma.presaleThreshold.count({
      where: {
        nft: {
          userId: user.id,
        },
        status: {
          in: ['reached', 'completed'], // Count presales that reached target, regardless of payment success
        },
      },
    });

    // Calculate presale earnings for successful presales only
    const successfulPresales = await prisma.presaleThreshold.findMany({
      where: {
        nft: {
          userId: user.id,
        },
        status: {
          in: ['reached', 'completed'], // Count presales that reached target, regardless of payment success
        },
      },
      include: {
        nft: {
          select: {
            targetOrders: true,
          },
        },
      },
    });

    // Calculate presale earnings
    let presaleEarnings = 0;
    successfulPresales.forEach(presale => {
      if (presale.nft.targetOrders === 100) presaleEarnings += 260;
      else if (presale.nft.targetOrders === 200) presaleEarnings += 750;
      else if (presale.nft.targetOrders === 500) presaleEarnings += 3000;
    });

    // Fetch digital download sales (total from completed digital orders)
    const digitalDownloadSales = await prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { 
        nft: {
          userId: user.id, // Orders for NFTs owned by this user
        },
        format: 'digital',
        status: { in: ['completed', 'processing'] }, // Include both completed and processing digital orders
        paymentStatus: { in: ['processed', 'captured', 'completed'] }, // Include processed/captured/completed payments
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate,
        aiMasteringCredits: user.aiMasteringCredits,
        promotionalCredits: user.promotionalCredits,
        vinylSalesCount,
        digitalDownloadsCount,
        successfulPresalesCount,
        digitalDownloadSales: digitalDownloadSales._sum.totalPrice || 0,
        digitalDownloadSalesPaid: user.digitalDownloadSalesPaid,
        presaleEarnings,
        presaleEarningsPaid: user.presaleEarningsPaid,
      },
    });
  } catch (error: any) {
    console.error('Error in subscription API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching subscription' },
      { status: 500 }
    );
  }
}

// POST to update subscription
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tier } = body;

    if (!tier || !['basic', 'starter', 'indie', 'plus', 'gold'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // Calculate subscription end date (30 days from now)
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

    // Update user subscription in database
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        subscriptionEndDate,
        aiMasteringCredits: (tier === 'plus' || tier === 'gold') ? 8 : 0,
        promotionalCredits: tier === 'plus' ? 20 : 0
      }
    });

    // Update contact in Brevo with proper tier list management
    const firstName = user.name?.split(' ')[0] || '';
    const lastName = user.name?.split(' ').slice(1).join(' ') || '';
    await updateContactSubscriptionTier(user.email, tier, firstName, lastName);

    // Send subscription upgrade confirmation email (Template 13)
    try {
      const emailParams = {
        USER_NAME: user.name || 'Valued Customer',
        NEW_TIER: tier.charAt(0).toUpperCase() + tier.slice(1), // Capitalize tier name
        AI_CREDITS: ((tier === 'plus' || tier === 'gold') ? 8 : 0).toString(),
        PROMOTIONAL_CREDITS: (tier === 'plus' ? 20 : 0).toString(),
        SUBSCRIPTION_END_DATE: subscriptionEndDate.toLocaleDateString('en-GB'),
      };

      console.log('Sending subscription upgrade email with params:', {
        to: user.email,
        templateId: EMAIL_TEMPLATES.SUBSCRIPTION_UPGRADE,
        params: emailParams
      });

      const emailResult = await sendTransactionalEmail(
        user.email,
        EMAIL_TEMPLATES.SUBSCRIPTION_UPGRADE,
        emailParams
      );

      if (emailResult) {
        console.log(`✅ Subscription upgrade email sent successfully to ${user.email}`);
      } else {
        console.error(`❌ Failed to send subscription upgrade email to ${user.email}`);
      }
    } catch (emailError) {
      console.error('❌ Error sending subscription upgrade email:', emailError);
      // Don't fail the API if email fails
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        subscriptionEndDate,
        aiMasteringCredits: (tier === 'plus' || tier === 'gold') ? 8 : 0,
        promotionalCredits: tier === 'plus' ? 20 : 0
      }
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// DELETE to cancel subscription
export async function DELETE() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        subscriptionStatus: 'canceled',
        // Keep the end date as is to allow access until the end of the period
      },
    });

    return NextResponse.json({ success: true, subscription: user });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { tier } = data;

    if (!tier || !['basic', 'starter', 'indie', 'plus', 'gold'].includes(tier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate,
        aiMasteringCredits: user.aiMasteringCredits,
        promotionalCredits: user.promotionalCredits,
      },
    });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating subscription' },
      { status: 500 }
    );
  }
} 