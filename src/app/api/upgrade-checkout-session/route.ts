import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Define prices for each tier
const TIER_PRICES: Record<string, number> = {
  starter: 3000,  // £30.00 (pay-as-you-go)
  plus: 14500,    // £145.00
  gold: 19900,    // £199.00
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier } = body;
    if (!tier || !TIER_PRICES[tier]) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Handle starter tier as pay-as-you-go credit purchase
    if (tier === 'starter') {
      const starterPrice = TIER_PRICES[tier];
      console.log('Creating starter tier checkout session with price:', starterPrice, 'pence (£' + (starterPrice / 100) + ')');
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: 'Starter Tier - Pay-as-You-Go Credit',
                description: 'One presale upload credit (£30) for starter tier users',
              },
              unit_amount: TIER_PRICES[tier], // This is now 3000 (£30.00)
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `https://www.vinylfunders.com/subscription?success=true&tier=${tier}`,
        cancel_url: `https://www.vinylfunders.com/subscription?canceled=true`,
        metadata: {
          type: 'pay_as_you_go',
          userId: session.user.id,
          userEmail: session.user.email,
          credits: '1',
        },
        customer_email: session.user.email,
      });
      
      return NextResponse.json({ url: checkoutSession.url });
    }

    // Create a Stripe Checkout Session for Plus/Gold tiers
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier Subscription`,
              description: `Upgrade to ${tier.charAt(0).toUpperCase() + tier.slice(1)} tier`,
            },
            unit_amount: TIER_PRICES[tier],
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://www.vinylfunders.com/subscription?success=true&tier=${tier}`,
      cancel_url: `https://www.vinylfunders.com/subscription?canceled=true`,
      metadata: {
        upgradeTier: tier,
        userId: session.user.id,
        type: 'subscription_upgrade',
      },
      customer_email: session.user.email,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Upgrade Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 