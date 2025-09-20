import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPresaleCheckoutSession } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const { items, customerEmail, customerName, shippingAddress, billingAddress, shippingZone } = body;

    console.log('Checkout session request received:', {
      customerEmail,
      customerName,
      itemCount: items?.length || 0,
      hasShippingAddress: !!shippingAddress,
      hasBillingAddress: !!billingAddress,
    });

    if (!customerEmail) {
      console.error('Missing customer email');
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    if (!items || items.length === 0) {
      console.error('No items provided');
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    // Create checkout session
    const result = await createPresaleCheckoutSession({
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Math.round(item.price * 100), // Convert to pence
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        format: item.format, // Include format information
      })),
      customerEmail,
      customerName,
      shippingAddress,
      billingAddress,
      shippingZoneKey: shippingZone,
      metadata: {
        userId: session?.user?.id || 'guest',
        orderType: 'presale',
        // Add formats to metadata for webhook processing
        formats: items.map((item: any) => item.format).join(','),
      },
    });

    console.log('Checkout session result:', {
      success: result.success,
      sessionId: result.sessionId,
      hasUrl: !!result.url,
      error: result.error,
    });

    if (!result.success) {
      console.error('Failed to create checkout session:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (!result.url) {
      console.error('No URL returned from checkout session');
      return NextResponse.json({ error: 'No checkout URL generated' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      url: result.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : undefined);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 