import { NextResponse } from 'next/server';
import { createImmediatePaymentIntent } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount provided' },
        { status: 400 }
      );
    }

    // Create a test payment intent
    const result = await createImmediatePaymentIntent({
      amount: amount, // Amount in pence
      customerId: undefined, // No customer for test
      metadata: {
        orderType: 'test',
        testMode: 'true',
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    if (!result.paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent creation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating test payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
} 