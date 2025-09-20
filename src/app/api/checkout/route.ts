import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processImmediateCheckout, processPresaleCheckout } from '@/lib/payment-service';
import { z } from 'zod';

const checkoutSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().positive(),
    format: z.enum(['vinyl', 'digital']),
    imageUrl: z.string().url(),
    maxQuantity: z.number().int().positive().optional(),
  })),
  shippingAddress: z.object({
    address: z.string(),
    city: z.string(),
    postcode: z.string(),
    country: z.string(),
    phone: z.string().optional(),
  }).optional(),
  billingAddress: z.object({
    address: z.string(),
    city: z.string(),
    postcode: z.string(),
    country: z.string(),
    phone: z.string().optional(),
  }).optional(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const validatedData = checkoutSchema.parse(body);

    // Determine user information
    let userId: string | null = null;
    let userEmail: string;
    let userName: string | undefined;

    if (session?.user?.email) {
      // Authenticated user
      userId = session.user.id;
      userEmail = session.user.email;
      userName = session.user.name || undefined;
    } else {
      // Guest user - require email
      if (!validatedData.customerEmail) {
        return NextResponse.json({ error: 'Email is required for guest checkout' }, { status: 400 });
      }
      userEmail = validatedData.customerEmail;
      userName = validatedData.customerName;
    }

    // Separate items by type
    const immediateItems = validatedData.items.filter(item => 
      item.format === 'digital' || !item.format // Digital or non-presale items
    );
    
    const presaleItems = validatedData.items.filter(item => 
      item.format === 'vinyl' // Vinyl presale items
    );

    const results: {
      immediate: any;
      presale: any;
    } = {
      immediate: null,
      presale: null,
    };

    // Process immediate items (digital downloads, subscriptions, etc.)
    if (immediateItems.length > 0) {
      const immediateResult = await processImmediateCheckout({
        userId,
        userEmail,
        userName,
        checkoutData: {
          items: immediateItems,
          shippingAddress: validatedData.shippingAddress,
        },
      });

      if (!immediateResult.success) {
        return NextResponse.json(
          { error: `Immediate checkout failed: ${immediateResult.error}` },
          { status: 400 }
        );
      }

      results.immediate = immediateResult;
    }

    // Process presale items (vinyl presales)
    if (presaleItems.length > 0) {
      const presaleResult = await processPresaleCheckout({
        userId,
        userEmail,
        userName,
        checkoutData: {
          items: presaleItems,
          shippingAddress: validatedData.shippingAddress,
        },
      });

      if (!presaleResult.success) {
        return NextResponse.json(
          { error: `Presale checkout failed: ${presaleResult.error}` },
          { status: 400 }
        );
      }

      results.presale = presaleResult;
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error processing checkout:', error);
    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    );
  }
} 