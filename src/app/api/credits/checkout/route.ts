import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

const CREDIT_PRICE = 500; // £5.00 in pence

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 1 || quantity > 50) {
      return NextResponse.json({ error: 'Invalid quantity. Must be between 1 and 50 credits.' }, { status: 400 });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: session.user.email,
      
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `AI Mastering Credits (${quantity} ${quantity === 1 ? 'credit' : 'credits'})`,
              description: 'Credits for AI mastering services - £5 per credit',
              metadata: {
                type: 'ai_mastering_credits',
                creditQuantity: quantity.toString(),
              },
            },
            unit_amount: CREDIT_PRICE, // £5.00 per credit
          },
          quantity: quantity,
        },
      ],

      success_url: `https://www.vinylfunders.com/mastering-upload?purchase=success`,
      cancel_url: `https://www.vinylfunders.com/mastering-upload?purchase=cancelled`,
      
      metadata: {
        type: 'credit_purchase',
        userId: session.user.id,
        userEmail: session.user.email,
        creditQuantity: quantity.toString(),
        creditType: 'ai_mastering',
      },
    });

    return NextResponse.json({ 
      success: true, 
      url: checkoutSession.url,
      sessionId: checkoutSession.id 
    });
  } catch (error: any) {
    console.error('Credit checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 