import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTransactionalEmail, EMAIL_TEMPLATES } from '@/lib/brevo';

/**
 * POST /api/admin/shipping-update
 * Body: {
 *   nftId: string;                 // ID of the presale (NFT)
 *   shippingStatus: string;        // e.g. "Shipped", "Dispatched", "In transit"
 *   trackingNumber: string;        // Carrier tracking reference
 *   estimatedDelivery?: string;    // Optional: e.g. "5-7 business days"
 * }
 *
 * Sends the Brevo SHIPPING_UPDATE template (ID #5) to every buyer whose payment was captured
 * for that presale.  Requires admin privileges – hook into your auth middleware if needed.
 */
export async function POST(request: Request) {
  try {
    const { nftId, shippingStatus, trackingNumber, estimatedDelivery } = await request.json();

    if (!nftId || !shippingStatus || !trackingNumber) {
      return NextResponse.json({ error: 'Missing nftId, shippingStatus or trackingNumber' }, { status: 400 });
    }

    // 1. Grab all successfully processed vinyl orders for this NFT
    const orders = await prisma.order.findMany({
      where: {
        nftId,
        format: 'vinyl',
        paymentStatus: 'processed', // payment captured via manual Stripe dashboard capture
      },
      include: {
        user: true,
      },
    });

    // 2. Loop through each order and fire the transactional email
    let sentCount = 0;
    for (const order of orders) {
      const recipientEmail = order.user?.email || order.customerEmail;
      if (!recipientEmail) continue; // skip if no email (shouldn’t happen)

      const params: Record<string, string> = {
        ORDER_ID: order.id,
        SHIPPING_STATUS: shippingStatus,
        TRACKING_NUMBER: trackingNumber,
      };
      if (estimatedDelivery) {
        params.ESTIMATED_DELIVERY = estimatedDelivery;
      }

      await sendTransactionalEmail(recipientEmail, EMAIL_TEMPLATES.SHIPPING_UPDATE, params);
      sentCount += 1;
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error('Error sending shipping-update emails:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
} 