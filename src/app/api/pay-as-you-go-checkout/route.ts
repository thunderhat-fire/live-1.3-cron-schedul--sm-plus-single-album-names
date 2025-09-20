import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Pay-as-you-go price: £30 per presale upload
const PAY_AS_YOU_GO_PRICE = 3000; // £30.00 in pence

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is on starter tier
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        subscriptionTier: true,
        subscriptionStatus: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Allow pay-as-you-go for basic tier users (to upgrade to starter) or active starter tier users
    if (user.subscriptionTier !== 'basic' && (user.subscriptionTier !== 'starter' || user.subscriptionStatus !== 'active')) {
      return NextResponse.json({ 
        error: 'Pay-as-you-go is only available for basic tier users or active starter tier users',
        requiresStarterTier: true
      }, { status: 403 });
    }

    // Create a Stripe Checkout Session for pay-as-you-go
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Pay-as-You-Go Presale Upload',
              description: 'One presale upload credit for starter tier users',
            },
            unit_amount: PAY_AS_YOU_GO_PRICE,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/upload-item?pay_as_you_go=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/upload-item?pay_as_you_go=cancelled`,
      metadata: {
        type: 'pay_as_you_go',
        userId: session.user.id,
        userEmail: session.user.email,
        credits: '1',
      },
      customer_email: session.user.email,
    });

    return NextResponse.json({ 
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id
    });
  } catch (error: any) {
    console.error('Pay-as-you-go checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
