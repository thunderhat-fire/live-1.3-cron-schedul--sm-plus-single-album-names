import Stripe from 'stripe';
import { prisma } from './prisma';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
});

export const STRIPE_CONFIG = {
  currency: 'gbp',
  paymentMethods: ['card'],
  platformFeePercent: 0.15, // 15% platform fee
  minimumTransferAmount: 50, // Minimum £0.50 transfer
};

// ------------------------
//  SHIPPING ZONES & RATES
// ------------------------
// All amounts are in pence (GBP)
export const SHIPPING_ZONES = [
  {
    key: 'uk',
    amount: 0,
    display: 'UK – Free',
    countries: ['GB'],
  },
  {
    key: 'eu',
    amount: 900, // £9
    display: 'Europe – £9',
    countries: [
      'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'
    ],
  },
  {
    key: 'na',
    amount: 1400, // £14
    display: 'USA / Canada – £14',
    countries: ['US','CA'],
  },
  {
    key: 'row',
    amount: 1800, // £18
    display: 'Rest of World – £18',
    countries: ['AE','AF','AG','AI','AL','AM','AO','AQ','AR','AU','AW','AX','AZ',
  'BA','BB','BD','BF','BH','BI','BJ','BM','BN','BO','BQ','BR','BS','BT',
  'BW','BY','BZ','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO',
  'CR','CV','CW','DJ','DM','DO','DZ','EC','EG','EH','ER','ET','FJ',
  'FK','FO','GA','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP',
  'GQ','GS','GT','GU','GW','GY','HK','HN','HT','ID','IL','IM','IN','IQ','IS','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LY','MA',
  'MC','MD','ME','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR',
  'MS','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NO',
  'NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PM','PN','PR',
  'PS','PW','PY','QA','RE','RS','RU','RW','SA','SB','SC','SD','SG','SH',
  'SJ','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC',
  'TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW',
  'TZ','UA','UG','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS',
  'XK','YE','YT','ZA','ZM','ZW'],
  },
] as const;

// ----------------------------------------------------------------
//  Dynamically compute Rest-of-World list from Stripe-supported codes
// ----------------------------------------------------------------

// Stripe‐supported ISO-3166-1 alpha-2 codes (as of 2024-06)
export const ALL_STRIPE_COUNTRIES = [
  'AC','AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CV','CW','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MK','ML','MM','MN','MO','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SZ','TA','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','US','UY','UZ','VA','VC','VE','VG','VN','VU','WF','WS','XK','YE','YT','ZA','ZM','ZW','ZZ',
] as const;

export const EU_COUNTRIES = [
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
] as const;

export const NA_COUNTRIES = ['US','CA'] as const;

export const UK_COUNTRIES = ['GB'] as const;

export const ROW_COUNTRIES = ALL_STRIPE_COUNTRIES.filter(
  c => !EU_COUNTRIES.includes(c as any) && !NA_COUNTRIES.includes(c as any) && !UK_COUNTRIES.includes(c as any)
) as string[];

// Replace Rest-of-World zone countries dynamically
const rowZoneIndex = SHIPPING_ZONES.findIndex(z => z.key === 'row');
if (rowZoneIndex !== -1) {
  // @ts-ignore – mutate for convenience during init
  SHIPPING_ZONES[rowZoneIndex].countries = ROW_COUNTRIES;
}

export function buildShippingOptions() {
  return SHIPPING_ZONES.map<Stripe.Checkout.SessionCreateParams.ShippingOption>(z => ({
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount: z.amount, currency: 'gbp' },
      display_name: z.display,
      // delivery_estimate could be added here
    },
  }));
}

export function getZoneForCountry(countryCode: string) {
  const upper = countryCode.toUpperCase();
  return SHIPPING_ZONES.find(z => (z.countries as readonly string[]).includes(upper));
}

export function buildShippingOptionForZone(zoneKey: typeof SHIPPING_ZONES[number]['key']): Stripe.Checkout.SessionCreateParams.ShippingOption {
  const zone = SHIPPING_ZONES.find(z => z.key === zoneKey);
  if (!zone) throw new Error(`Unknown shipping zone: ${zoneKey}`);
  return {
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount: zone.amount, currency: 'gbp' },
      display_name: zone.display,
    },
  } satisfies Stripe.Checkout.SessionCreateParams.ShippingOption;
}

// Payment Intent Types
export enum PaymentIntentType {
  IMMEDIATE = 'immediate', // For subscriptions, digital downloads, one-offs
  PRESALE = 'presale',     // For vinyl presales - capture only
}

// Payment Status
export enum PaymentStatus {
  PENDING = 'pending',
  CAPTURED = 'captured',
  PROCESSED = 'processed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// Presale Threshold Status
export enum PresaleThresholdStatus {
  ACTIVE = 'active',
  REACHED = 'reached',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Create a payment intent for immediate capture
 */
export async function createImmediatePaymentIntent({
  amount,
  currency = 'gbp',
  metadata = {},
  customerId,
}: {
  amount: number; // Amount in pence
  currency?: string;
  metadata?: Record<string, string>;
  customerId?: string;
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      capture_method: 'automatic',
      payment_method_types: STRIPE_CONFIG.paymentMethods,
      metadata: {
        type: PaymentIntentType.IMMEDIATE,
        ...metadata,
      },
      customer: customerId,
      confirm: false, // We'll confirm on the client side
    });

    return {
      success: true,
      paymentIntent,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Error creating immediate payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a payment intent for presale (capture only)
 */
export async function createPresalePaymentIntent({
  amount,
  currency = 'gbp',
  metadata = {},
  customerId,
}: {
  amount: number; // Amount in pence
  currency?: string;
  metadata?: Record<string, string>;
  customerId?: string;
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      capture_method: 'automatic',
      payment_method_types: STRIPE_CONFIG.paymentMethods,
      metadata: {
        type: PaymentIntentType.PRESALE,
        ...metadata,
      },
      customer: customerId,
      confirm: false, // We'll confirm on the client side
    });

    return {
      success: true,
      paymentIntent,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Error creating presale payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Capture a presale payment intent
 */
export async function capturePresalePayment(paymentIntentId: string) {
  try {
    // Retrieve intent first to avoid error if already captured
    const current = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (current.status === 'succeeded' || current.status === 'requires_capture' === false) {
      return { success: true, paymentIntent: current };
    }

    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    
    return {
      success: true,
      paymentIntent,
    };
  } catch (error) {
    console.error('Error capturing presale payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create or get a Stripe customer
 */
export async function getOrCreateCustomer({
  email,
  name,
  userId,
}: {
  email: string;
  name?: string;
  userId: string;
}) {
  try {
    // First, try to find existing customer by email
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      
      // Update customer metadata if needed
      if (customer.metadata.userId !== userId) {
        await stripe.customers.update(customer.id, {
          metadata: { userId },
        });
      }
      
      return {
        success: true,
        customer,
      };
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    return {
      success: true,
      customer,
    };
  } catch (error) {
    console.error('Error creating/getting customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
) {
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET environment variable is not set');
      return {
        success: false,
        error: 'Webhook secret not configured',
      };
    }
    
    console.log('🔥 Attempting to verify webhook signature...');
    console.log('🔥 Webhook secret length:', process.env.STRIPE_WEBHOOK_SECRET.length);
    console.log('🔥 Webhook secret preview:', process.env.STRIPE_WEBHOOK_SECRET.substring(0, 20) + '...');
    console.log('🔥 Payload length:', payload.length);
    console.log('🔥 Signature length:', signature.length);
    console.log('🔥 Signature preview:', signature.substring(0, 50) + '...');
    
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    console.log('🔥 Webhook signature verification successful');
    return { success: true, event };
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(
  paymentIntentId: string,
  reason: 'requested_by_customer' | 'duplicate' | 'fraudulent' = 'requested_by_customer'
) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason,
    });

    return {
      success: true,
      refund,
    };
  } catch (error) {
    console.error('Error refunding payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get payment intent details
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      success: true,
      paymentIntent,
    };
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 

/**
 * Create a checkout session for presale (with Apple Pay/Google Pay support)
 */
export async function createPresaleCheckoutSession({
  items,
  customerEmail,
  customerName,
  customerId,
  shippingAddress,
  billingAddress,
  metadata = {},
  shippingZoneKey,
}: {
  items: Array<{
    id: string;
    name: string;
    price: number; // in pence
    quantity: number;
    imageUrl: string;
    format?: string; // Add format field
  }>;
  customerEmail: string;
  customerName?: string;
  customerId?: string;
  shippingAddress?: {
    address?: string;
    city?: string;
    postcode?: string;
    country?: string;
    phone?: string;
  };
  billingAddress?: {
    address?: string;
    city?: string;
    postcode?: string;
    country?: string;
    phone?: string;
  };
  metadata?: Record<string, string>;
  shippingZoneKey?: typeof SHIPPING_ZONES[number]['key'];
}) {
  try {
    // Get base URL with fallback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    console.log('Creating checkout session with:', {
      baseUrl,
      customerEmail,
      itemCount: items.length,
      hasShippingAddress: !!shippingAddress,
    });

    // Determine allowed countries & shipping options
    let allowedCountries: string[];
    let shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[];

    const zoneParam = shippingZoneKey ?? undefined;

    if (zoneParam) {
      const zone = SHIPPING_ZONES.find(z => z.key === zoneParam);
      if (!zone) throw new Error(`Invalid shipping zone ${zoneParam}`);
      allowedCountries = [...zone.countries];
      shippingOptions = [buildShippingOptionForZone(zone.key)];
    } else if (shippingAddress?.country) {
      const zone = getZoneForCountry(shippingAddress.country);
      if (zone) {
        allowedCountries = [...zone.countries];
        shippingOptions = [buildShippingOptionForZone(zone.key)];
      } else {
        // Fallback to all
        allowedCountries = Array.from(new Set(SHIPPING_ZONES.flatMap(z => z.countries)));
        shippingOptions = buildShippingOptions();
      }
    } else {
      allowedCountries = Array.from(new Set(SHIPPING_ZONES.flatMap(z => z.countries)));
      shippingOptions = buildShippingOptions();
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // This automatically enables Apple Pay/Google Pay
      mode: 'payment',
      customer_email: customerEmail, // Let Stripe create customer automatically
      
      // Line items
      line_items: items.map(item => ({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: item.name,
            images: [item.imageUrl],
            metadata: {
              nftId: item.id,
              type: item.format === 'digital' ? 'digital_download' : 'vinyl_presale',
              format: item.format || 'vinyl', // Include format in metadata
            },
          },
          unit_amount: item.price, // Already in pence
        },
        quantity: item.quantity,
      })),

      // Shipping address collection - enable for all orders
      shipping_address_collection: {
        allowed_countries: allowedCountries as any,
      },

      shipping_options: shippingOptions,

      // Payment intent options for presales
      payment_intent_data: {
        capture_method: 'automatic', // Capture immediately
        metadata: {
          type: PaymentIntentType.PRESALE,
          customerEmail,
          customerName: customerName || '',
          shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : '',
          billingAddress: billingAddress ? JSON.stringify(billingAddress) : '',
          nftId: items.length===1?items[0].id:'',
          nftIds: items.map(i=>i.id).join(','),
          quantity: items.length===1 ? items[0].quantity.toString() : items.reduce((sum, item) => sum + item.quantity, 0).toString(),
          formats: items.length===1 ? (items[0].format || 'vinyl') : items.map(i => i.format || 'vinyl').join(','),
          ...metadata,
        },
      },

      // URLs
      success_url: `${baseUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      
      // Enable automatic tax calculation if needed
      automatic_tax: { enabled: false },
      
      // Metadata
      metadata: {
        type: 'presale',
        customerEmail,
        nftId: items.length===1?items[0].id:'',
        nftIds: items.map(i=>i.id).join(','),
        quantity: items.length===1 ? items[0].quantity.toString() : items.reduce((sum, item) => sum + item.quantity, 0).toString(),
        formats: items.length===1 ? (items[0].format || 'vinyl') : items.map(i => i.format || 'vinyl').join(','),
        ...metadata,
      },
    });

    console.log('Checkout session created successfully:', {
      sessionId: session.id,
      url: session.url,
      success_url: session.success_url,
      cancel_url: session.cancel_url,
    });

    return {
      success: true,
      session,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Error creating presale checkout session:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 

/**
 * Get checkout session details
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer', 'line_items'],
    });

    return {
      success: true,
      session,
    };
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 

/**
 * Create or retrieve a Stripe Connect account for a user
 */
export async function createOrGetConnectAccount({
  userId,
  email,
  businessType = 'individual',
  country = 'GB',
}: {
  userId: string;
  email: string;
  businessType?: 'individual' | 'company';
  country?: string;
}) {
  try {
    // First check if user already has a connect account
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeConnectAccountId: true }
    });

    if (existingUser?.stripeConnectAccountId) {
      // Return existing account
      const account = await stripe.accounts.retrieve(existingUser.stripeConnectAccountId);
      return {
        success: true,
        account,
        isNewAccount: false,
      };
    }

    // Create new Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      email: email,
      business_type: businessType,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        userId: userId,
        platform: 'vinylfunders',
      },
    });

    // Save account ID to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeConnectAccountId: account.id,
        stripeOnboardingComplete: false,
        stripePayoutsEnabled: account.payouts_enabled || false,
        stripeChargesEnabled: account.charges_enabled || false,
      },
    });

    return {
      success: true,
      account,
      isNewAccount: true,
    };
  } catch (error) {
    console.error('Error creating Connect account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create onboarding link for Connect account
 */
export async function createConnectOnboardingLink({
  accountId,
  userId,
}: {
  accountId: string;
  userId: string;
}) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
              refresh_url: `https://www.vinylfunders.com/artist/onboarding/refresh?userId=${userId}`,
        return_url: `https://www.vinylfunders.com/artist/onboarding/complete?userId=${userId}`,
      type: 'account_onboarding',
    });

    // Save onboarding URL to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeOnboardingUrl: accountLink.url,
      },
    });

    return {
      success: true,
      url: accountLink.url,
    };
  } catch (error) {
    console.error('Error creating onboarding link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a payment intent with Connect transfer
 */
export async function createConnectPaymentIntent({
  amount,
  artistAccountId,
  platformFeeAmount,
  currency = 'gbp',
  metadata = {},
  customerId,
}: {
  amount: number; // Amount in pence
  artistAccountId: string;
  platformFeeAmount: number; // Platform fee in pence
  currency?: string;
  metadata?: Record<string, string>;
  customerId?: string;
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      capture_method: 'automatic',
      payment_method_types: STRIPE_CONFIG.paymentMethods,
      transfer_data: {
        destination: artistAccountId,
        amount: amount - platformFeeAmount, // Artist gets total minus platform fee
      },
      application_fee_amount: platformFeeAmount,
      metadata: {
        type: PaymentIntentType.IMMEDIATE,
        artistAccountId,
        platformFeeAmount: platformFeeAmount.toString(),
        ...metadata,
      },
      customer: customerId,
      confirm: false,
    });

    return {
      success: true,
      paymentIntent,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Error creating Connect payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a presale payment intent with Connect (authorize only)
 */
export async function createConnectPresalePaymentIntent({
  amount,
  artistAccountId,
  platformFeeAmount,
  currency = 'gbp',
  metadata = {},
  customerId,
}: {
  amount: number; // Amount in pence
  artistAccountId: string;
  platformFeeAmount: number; // Platform fee in pence
  currency?: string;
  metadata?: Record<string, string>;
  customerId?: string;
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      capture_method: 'automatic', // Capture immediately
      payment_method_types: STRIPE_CONFIG.paymentMethods,
      transfer_data: {
        destination: artistAccountId,
        amount: amount - platformFeeAmount,
      },
      application_fee_amount: platformFeeAmount,
      metadata: {
        type: PaymentIntentType.PRESALE,
        artistAccountId,
        platformFeeAmount: platformFeeAmount.toString(),
        ...metadata,
      },
      customer: customerId,
      confirm: false,
    });

    return {
      success: true,
      paymentIntent,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Error creating Connect presale payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate platform fee
 */
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * STRIPE_CONFIG.platformFeePercent);
} 