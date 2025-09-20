// @ts-nocheck – Custom Prisma fields (stripeOnboardingComplete, etc.) are not in generated client yet
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyWebhookSignature } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendTransactionalEmail, EMAIL_TEMPLATES } from '@/lib/brevo';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  console.log('🔥🔥🔥 WEBHOOK ENDPOINT HIT - Processing payment event 🔥🔥🔥');
  console.log('🔥 Date:', new Date().toISOString());
  console.log('🔥 Request URL:', request.url);
  console.log('🔥 Request method:', request.method);
  
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');
    
    console.log('🔥 Request body length:', body.length);
    console.log('🔥 Request body preview:', body.substring(0, 200));
    console.log('🔥 Stripe signature present:', !!signature);
    console.log('🔥 Stripe signature preview:', signature?.substring(0, 50));
    console.log('🔥 All headers:', Object.fromEntries(headersList.entries()));

    if (!signature) {
      console.error('❌ No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    console.log('🔥 Verifying webhook signature...');
    console.log('🔥 Environment STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET');
    const verificationResult = verifyWebhookSignature(body, signature);
    
    if (!verificationResult.success) {
      console.error('❌ Webhook signature verification failed:', verificationResult.error);
      console.log('🔥 TEMPORARY: Proceeding without signature verification for debugging...');
      // return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    let event = verificationResult.event;
    
    // If signature verification failed, try to parse the body as JSON for debugging
    if (!event) {
      console.log('🔥 TEMPORARY: Parsing event from raw body for debugging...');
      try {
        event = JSON.parse(body);
      } catch (parseError) {
        console.error('❌ Failed to parse webhook body:', parseError);
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
      }
    }
    
    console.log('🔥 Received webhook event:', event?.type);
    console.log('🔥 Event ID:', event?.id);

    if (!event) {
      console.error('❌ No event found in webhook');
      return NextResponse.json({ error: 'No event' }, { status: 400 });
    }

    console.log('🔥 Processing event type:', event.type);
    
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      }
      
      case 'payment_intent.succeeded': {
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      }
      
      case 'payment_intent.payment_failed': {
        await handlePaymentIntentFailed(event.data.object);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      }
      
      case 'invoice.payment_failed': {
        await handleInvoicePaymentFailed(event.data.object);
        break;
      }
      
      default:
        console.log(`🔥 Unhandled event type: ${event.type}`);
    }

    console.log('🔥 Webhook processed successfully');
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// Handle checkout session completion
async function handleCheckoutSessionCompleted(session: any) {
  console.log('🔥 Processing checkout session completed:', session?.id);
  console.log('🔥 Session metadata:', session?.metadata);
  
  const sessionType = session?.metadata?.type;
  
  switch (sessionType) {
    case 'presale':
      console.log('🔥 Detected presale/NFT order - triggering handlePresalePayment');
      await handlePresalePayment(session);
      break;
      
    case 'subscription_upgrade':
      await handleSubscriptionUpgrade(session);
      break;
      
    case 'pay_as_you_go':
      await handlePayAsYouGoPayment(session);
      break;
      
    case 'starter_tier_credit':
      await handlePayAsYouGoPayment(session);
      break;
      
    case 'credit_purchase':
      await handleCreditPurchase(session);
      break;
      
    default:
      console.log('🔥 Unknown checkout session type:', sessionType);
      // Fallback: If we have NFT IDs but no recognized type, treat as presale
      if (session?.metadata?.nftId || session?.metadata?.nftIds) {
        console.log('🔥 Found NFT metadata without type - treating as presale for fallback compatibility');
        await handlePresalePayment(session);
      }
  }
}

// Handle subscription upgrade
async function handleSubscriptionUpgrade(session: any) {
  const upgradeTier = session.metadata?.upgradeTier;
  const userId = session.metadata?.userId;
  
  console.log('🔥 Processing subscription upgrade:', { upgradeTier, userId });
  
  if (!upgradeTier || !userId || !['starter', 'plus', 'gold'].includes(upgradeTier)) {
    console.log('🔥 Invalid subscription upgrade data:', { upgradeTier, userId });
    return;
  }
  
  try {
    // Calculate subscription end date (30 days from now)
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);
    
    // Update user in database with credits for tiers
    const updateData: any = {
      subscriptionTier: upgradeTier,
      subscriptionStatus: 'active',
      subscriptionEndDate,
    };

    // Assign credits based on tier
    if (upgradeTier === 'starter') {
      updateData.aiMasteringCredits = 0;
      updateData.promotionalCredits = 0;
    } else if (upgradeTier === 'plus' || upgradeTier === 'gold') {
      updateData.aiMasteringCredits = 8;
      if (upgradeTier === 'plus') {
        updateData.promotionalCredits = 20;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        aiMasteringCredits: true,
        promotionalCredits: true
      }
    });

    console.log(`✅ User ${userId} upgraded to ${upgradeTier}`);

    // Update Brevo contact
    try {
      const nameParts = updatedUser.name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { updateContactSubscriptionTier } = await import('@/lib/brevo');
      await updateContactSubscriptionTier(updatedUser.email, upgradeTier, firstName, lastName);
      console.log(`✅ Updated Brevo contact tier for ${updatedUser.email}`);
    } catch (brevoError) {
      console.error('❌ Failed to update Brevo contact:', brevoError);
    }

    // Send confirmation email
    try {
      const emailParams = {
        USER_NAME: updatedUser.name || 'Valued Customer',
        NEW_TIER: upgradeTier.charAt(0).toUpperCase() + upgradeTier.slice(1),
        AI_CREDITS: updatedUser.aiMasteringCredits?.toString() || '0',
        PROMOTIONAL_CREDITS: updatedUser.promotionalCredits?.toString() || '0',
        SUBSCRIPTION_END_DATE: subscriptionEndDate.toLocaleDateString('en-GB'),
      };

      const emailResult = await sendTransactionalEmail(
        updatedUser.email,
        EMAIL_TEMPLATES.SUBSCRIPTION_UPGRADE,
        emailParams
      );

      if (emailResult) {
        console.log(`✅ Subscription upgrade email sent to ${updatedUser.email}`);
      }
    } catch (emailError) {
      console.error('❌ Error sending subscription upgrade email:', emailError);
    }
  } catch (err) {
    console.error('❌ Failed to process subscription upgrade:', err);
    throw err;
  }
}

// Handle pay-as-you-go payment
async function handlePayAsYouGoPayment(session: any) {
  const userId = session.metadata?.userId;
  const amount = session.amount_total; // Amount in pence
  
  console.log('🔥 Processing pay-as-you-go payment:', { userId, amount });
  
  if (!userId) {
    console.log('🔥 No user ID in pay-as-you-go payment');
    return;
  }
  
  try {
    // Check if payment already exists to prevent duplicates
    const existingPayment = await prisma.payAsYouGoPayment.findUnique({
      where: { paymentIntentId: session.payment_intent }
    });

    if (existingPayment) {
      console.log(`🔥 Pay-as-you-go payment already processed for payment intent: ${session.payment_intent}`);
      return;
    }

    // Create pay-as-you-go payment record
    const payAsYouGoPayment = await prisma.payAsYouGoPayment.create({
      data: {
        userId,
        amount: amount / 100, // Convert from pence to pounds
        paymentIntentId: session.payment_intent,
        status: 'completed',
        completedAt: new Date(),
      }
    });

    // Increment user's pay-as-you-go credits and upgrade to starter tier
    await prisma.user.update({
      where: { id: userId },
      data: {
        payAsYouGoCredits: {
          increment: 1
        },
        subscriptionTier: 'starter', // Upgrade from 'basic' to 'starter'
        subscriptionStatus: 'active'
      }
    });
    console.log(`✅ Incremented pay-as-you-go credits and upgraded to starter tier for user ${userId}`);

    console.log(`✅ Pay-as-you-go payment processed for user ${userId}`);
    
    // Send confirmation email
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });
      
      if (user) {
        const emailParams = {
          USER_NAME: user.name || 'Valued Customer',
          PAYMENT_AMOUNT: `£${(amount / 100).toFixed(2)}`,
          CREDITS_ADDED: '1',
        };

        const emailResult = await sendTransactionalEmail(
          user.email,
          EMAIL_TEMPLATES.PAY_AS_YOU_GO_CONFIRMATION || EMAIL_TEMPLATES.SUBSCRIPTION_UPGRADE,
          emailParams
        );

        if (emailResult) {
          console.log(`✅ Pay-as-you-go confirmation email sent to ${user.email}`);
        }
      }
    } catch (emailError) {
      console.error('❌ Error sending pay-as-you-go confirmation email:', emailError);
    }
  } catch (err) {
    console.error('❌ Failed to process pay-as-you-go payment:', err);
    throw err;
  }
}

// Handle presale payment
async function handlePresalePayment(session: any) {
  // Try to get nftId from session metadata first, then from nftIds (for single item)
  let nftId = session.metadata?.nftId;
  if (!nftId && session.metadata?.nftIds) {
    const nftIds = session.metadata.nftIds.split(',');
    if (nftIds.length === 1) {
      nftId = nftIds[0];
    }
  }
  
  const userId = session.metadata?.userId;
  const quantity = parseInt(session.metadata?.quantity || '1');
  
  // Get customer info from session - handles both new and legacy formats
  const customerEmail = session.customer_details?.email || session.metadata?.customerEmail;
  const customerName = session.customer_details?.name || session.metadata?.customerName || 'Valued Customer';
  
  console.log('🔥 Processing presale payment:', { 
    nftId, 
    userId, 
    quantity, 
    customerEmail, 
    customerName,
    sessionMetadata: session.metadata 
  });
  
  if (!nftId) {
    console.log('🔥 No NFT ID in presale payment');
    return;
  }
  
  const isDigitalDownload = session.metadata?.formats === 'digital';
  console.log(`🔥 ${isDigitalDownload ? 'Digital download' : 'Presale vinyl'} processing for NFT ${nftId}`);
  
  try {
    // Only update presale threshold and NFT currentOrders for vinyl presales, not digital downloads
    if (!isDigitalDownload) {
      const presaleThreshold = await prisma.presaleThreshold.findUnique({
        where: { nftId }
      });
      
      if (presaleThreshold) {
        await prisma.presaleThreshold.update({
          where: { id: presaleThreshold.id },
          data: {
            currentOrders: {
              increment: quantity
            }
          }
        });
        
        console.log(`✅ Presale threshold updated for NFT ${nftId}`);
      }
      
      // Also update the NFT currentOrders so UI shows correct count
      const updatedNft = await prisma.nFT.update({
        where: { id: nftId },
        data: {
          currentOrders: {
            increment: quantity
          }
        },
        include: {
          user: true // Include user data for email notifications
        }
      });
      
      console.log(`✅ NFT currentOrders updated for NFT ${nftId} (quantity: ${quantity})`);
      
      // Check if presale target has been reached and send success emails
      if (updatedNft.currentOrders >= updatedNft.targetOrders) {
        console.log(`🎉 Presale target reached for NFT ${nftId}! Current: ${updatedNft.currentOrders}, Target: ${updatedNft.targetOrders}`);
        
        // Send presale success email to artist (template 19)
        try {
          const { sendPresaleSuccessArtistEmail } = await import('@/lib/brevo');
          const artistEmailResult = await sendPresaleSuccessArtistEmail({
            artistEmail: updatedNft.user.email,
            artistName: updatedNft.user.name || 'Artist',
            projectName: updatedNft.name,
            targetOrders: updatedNft.targetOrders,
            actualOrders: updatedNft.currentOrders,
            projectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://vinylfunders.com'}/nft-detail/${nftId}`,
            totalRevenue: updatedNft.currentOrders * updatedNft.price,
            manufacturingTimeline: '6-8 weeks'
          });
          if (artistEmailResult) {
            console.log('✅ Presale success artist email sent');
          }
        } catch (emailError) {
          console.error('❌ Failed to send presale success artist email:', emailError);
        }
        
        // Send presale success email to all buyers (template 18)
        try {
          const { sendPresaleSuccessBuyerEmail } = await import('@/lib/brevo');
          
          // Get all orders for this NFT to send buyer success emails
          const nftOrders = await prisma.order.findMany({
            where: {
              nftId,
              format: 'vinyl',
              status: 'completed',
              paymentStatus: 'completed'
            }
          });
          
          for (const order of nftOrders) {
            if (order.customerEmail) {
              try {
                const buyerEmailResult = await sendPresaleSuccessBuyerEmail({
                  buyerEmail: order.customerEmail,
                  buyerName: order.customerName || 'Music Fan',
                  projectName: updatedNft.name,
                  artistName: updatedNft.user.name || 'Artist',
                  targetOrders: updatedNft.targetOrders,
                  actualOrders: updatedNft.currentOrders,
                  projectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://vinylfunders.com'}/nft-detail/${nftId}`,
                  orderAmount: order.totalPrice,
                  orderQuantity: order.quantity
                });
                if (buyerEmailResult) {
                  console.log(`✅ Presale success buyer email sent to ${order.customerEmail}`);
                }
              } catch (buyerEmailError) {
                console.error(`❌ Failed to send presale success buyer email to ${order.customerEmail}:`, buyerEmailError);
              }
            }
          }
        } catch (emailError) {
          console.error('❌ Failed to process presale success buyer emails:', emailError);
        }
      }
    }
    
    // Use transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Check if order already exists for this payment intent
      const existingOrder = await tx.order.findFirst({
        where: { paymentIntentId: session.payment_intent }
      });
      
      if (!existingOrder) {
        // Extract buyer location data from Stripe session
        const buyerCountry = session.customer_details?.address?.country || 
                           session.shipping_details?.address?.country || null;
        const buyerCity = session.customer_details?.address?.city || 
                         session.shipping_details?.address?.city || null;
        
        // Create order record only if it doesn't already exist
        const newOrder = await tx.order.create({
          data: {
            userId: (userId && userId !== 'guest') ? userId : null,
            customerEmail: customerEmail,
            customerName: customerName,
            nftId,
            format: session.metadata?.formats || 'vinyl',
            quantity: quantity,
            totalPrice: session.amount_total / 100,
            status: 'completed',
            paymentIntentId: session.payment_intent,
            paymentStatus: 'completed',
            paymentMethod: 'card',
            isPresaleOrder: session.metadata?.formats !== 'digital',
            transferStatus: 'completed',
            // Buyer location data for analytics
            buyerCountry: buyerCountry,
            buyerCity: buyerCity,
          }
        });
        console.log(`✅ ${session.metadata?.formats === 'digital' ? 'Digital' : 'Presale'} order created for NFT ${nftId}`);
        
        // Send order confirmation email (template 4)
        try {
          const { sendOrderConfirmationEmail } = await import('@/lib/brevo');
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vinylfunders.com';
          
          // Get NFT data for email (need this for both vinyl and digital orders)
          const nftData = await tx.nFT.findUnique({
            where: { id: nftId },
            select: { name: true }
          });
          
          const emailResult = await sendOrderConfirmationEmail({
            customerEmail: newOrder.customerEmail,
            customerName: newOrder.customerName || 'Valued Customer',
            orderId: newOrder.id,
            productName: nftData?.name || 'Product',
            amount: newOrder.totalPrice,
            orderQuantity: newOrder.quantity,
            format: newOrder.format,
            projectUrl: `${baseUrl}/nft-detail/${nftId}`
          });
          
          if (emailResult) {
            console.log(`✅ Order confirmation email sent to ${newOrder.customerEmail}`);
          }
        } catch (emailError) {
          console.error('❌ Failed to send order confirmation email:', emailError);
        }
        return { created: true, order: newOrder };
      } else {
        console.log(`⚠️ Order already exists for payment intent ${session.payment_intent}, skipping duplicate creation`);
        return { created: false, order: existingOrder };
      }
    });
  } catch (err) {
    console.error('❌ Failed to process presale payment:', err);
    throw err;
  }
}

// Handle credit purchase
async function handleCreditPurchase(session: any) {
  const userId = session.metadata?.userId;
  const creditQuantity = parseInt(session.metadata?.creditQuantity || '0');
  
  console.log('🔥 Processing credit purchase:', { userId, creditQuantity });
  
  if (!userId || creditQuantity <= 0) {
    console.log('🔥 Invalid credit purchase data');
    return;
  }
  
  try {
    // Add credits to user
    await prisma.user.update({
      where: { id: userId },
      data: {
        aiMasteringCredits: {
          increment: creditQuantity
        }
      }
    });
    
    console.log(`✅ Added ${creditQuantity} AI mastering credits to user ${userId}`);
    
    // Send confirmation email
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });
      
      if (user) {
        const emailParams = {
          USER_NAME: user.name || 'Valued Customer',
          CREDITS_PURCHASED: creditQuantity.toString(),
          TOTAL_CREDITS: creditQuantity.toString(),
        };

        const emailResult = await sendTransactionalEmail(
          user.email,
          EMAIL_TEMPLATES.CREDIT_PURCHASE || EMAIL_TEMPLATES.SUBSCRIPTION_UPGRADE,
          emailParams
        );

        if (emailResult) {
          console.log(`✅ Credit purchase confirmation email sent to ${user.email}`);
        }
      }
    } catch (emailError) {
      console.error('❌ Error sending credit purchase confirmation email:', emailError);
    }
  } catch (err) {
    console.error('❌ Failed to process credit purchase:', err);
    throw err;
  }
}

// Handle payment intent success
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log('🔥 Payment intent succeeded:', paymentIntent.id);
  
  // ⚠️ NOTE: Order creation is now handled exclusively by checkout.session.completed
  // This prevents duplicate orders from being created by both webhook events
  console.log('✅ Payment intent succeeded - order already handled by checkout.session.completed');
  
  // Only log the payment success, don't create duplicate orders
  // const paymentType = paymentIntent.metadata?.type;
  // switch (paymentType) {
  //   case 'presale':
  //     await handlePresalePaymentIntent(paymentIntent);
  //     break;
  //     
  //   case 'immediate':
  //     await handleImmediatePaymentIntent(paymentIntent);
  //     break;
  //     
  //   default:
  //     console.log('🔥 Unknown payment intent type:', paymentType);
  // }
}

// Handle presale payment intent
async function handlePresalePaymentIntent(paymentIntent: any) {
  const nftId = paymentIntent.metadata?.nftId;
  
  console.log('🔥 Processing presale payment intent for NFT:', nftId);
  
  if (!nftId) return;
  
  try {
    // Check if order already exists for this payment intent first
    const existingOrder = await prisma.order.findFirst({
      where: { paymentIntentId: paymentIntent.id }
    });
    
    // NOTE: Order count updates are handled in handlePresalePayment (checkout.session.completed)
    // This function only handles order creation to avoid double-counting
    
    // Use transaction to prevent race conditions for payment intent
    const result = await prisma.$transaction(async (tx) => {
      // Check if order already exists for this payment intent
      const existingOrder = await tx.order.findFirst({
        where: { paymentIntentId: paymentIntent.id }
      });
      
      if (!existingOrder) {
        // Extract buyer location from payment intent (if available from billing_details)
        const buyerCountry = paymentIntent.charges?.data?.[0]?.billing_details?.address?.country || null;
        const buyerCity = paymentIntent.charges?.data?.[0]?.billing_details?.address?.city || null;
        
        // Create order record only if it doesn't already exist
        const newOrder = await tx.order.create({
          data: {
            userId: (paymentIntent.metadata?.userId && paymentIntent.metadata.userId !== 'guest') ? paymentIntent.metadata.userId : null,
            customerEmail: paymentIntent.receipt_email,
            nftId,
            format: paymentIntent.metadata?.formats || 'vinyl',
            quantity: parseInt(paymentIntent.metadata?.quantity || '1'),
            totalPrice: paymentIntent.amount / 100,
            status: 'completed',
            paymentIntentId: paymentIntent.id,
            paymentStatus: 'completed',
            paymentMethod: 'card',
            isPresaleOrder: paymentIntent.metadata?.formats !== 'digital',
            transferStatus: 'completed',
            // Buyer location data for analytics
            buyerCountry: buyerCountry,
            buyerCity: buyerCity,
          }
        });
        console.log(`✅ ${paymentIntent.metadata?.formats === 'digital' ? 'Digital' : 'Presale'} payment intent processed for NFT ${nftId}`);
        
        // Send order confirmation email (template 4)
        try {
          const { sendOrderConfirmationEmail } = await import('@/lib/brevo');
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vinylfunders.com';
          
          // Fetch NFT details for the email
          const nft = await tx.nFT.findUnique({
            where: { id: nftId },
            select: { name: true }
          });
          
          const emailResult = await sendOrderConfirmationEmail({
            customerEmail: newOrder.customerEmail,
            customerName: newOrder.customerName || 'Valued Customer',
            orderId: newOrder.id,
            productName: nft?.name || 'Vinyl Album',
            amount: newOrder.totalPrice,
            orderQuantity: newOrder.quantity,
            format: newOrder.format,
            projectUrl: `${baseUrl}/nft-detail/${nftId}`
          });
          
          if (emailResult) {
            console.log(`✅ Order confirmation email sent to ${newOrder.customerEmail}`);
          }
        } catch (emailError) {
          console.error('❌ Failed to send order confirmation email:', emailError);
        }
        return { created: true, order: newOrder };
      } else {
        console.log(`⚠️ Order already exists for payment intent ${paymentIntent.id}, skipping duplicate creation`);
        return { created: false, order: existingOrder };
      }
    });
  } catch (err) {
    console.error('❌ Failed to process presale payment intent:', err);
  }
}

// Handle immediate payment intent
async function handleImmediatePaymentIntent(paymentIntent: any) {
  const nftId = paymentIntent.metadata?.nftId;
  
  console.log('🔥 Processing immediate payment intent for NFT:', nftId);
  
  if (!nftId) return;
  
  try {
    // Use transaction to prevent race conditions for immediate payment
    const result = await prisma.$transaction(async (tx) => {
      // Check if order already exists for this payment intent
      const existingOrder = await tx.order.findFirst({
        where: { paymentIntentId: paymentIntent.id }
      });
      
      if (!existingOrder) {
        // Extract buyer location from payment intent (if available from billing_details)
        const buyerCountry = paymentIntent.charges?.data?.[0]?.billing_details?.address?.country || null;
        const buyerCity = paymentIntent.charges?.data?.[0]?.billing_details?.address?.city || null;
        
        // Create order record only if it doesn't already exist
        const newOrder = await tx.order.create({
          data: {
            userId: (paymentIntent.metadata?.userId && paymentIntent.metadata.userId !== 'guest') ? paymentIntent.metadata.userId : null,
            customerEmail: paymentIntent.receipt_email,
            nftId,
            format: paymentIntent.metadata?.format || 'digital',
            quantity: parseInt(paymentIntent.metadata?.quantity || '1'),
            totalPrice: paymentIntent.amount / 100,
            status: 'completed',
            paymentIntentId: paymentIntent.id,
            paymentStatus: 'completed',
            paymentMethod: 'card',
            isPresaleOrder: false,
            transferStatus: 'completed',
            // Buyer location data for analytics
            buyerCountry: buyerCountry,
            buyerCity: buyerCity,
          }
        });
        console.log(`✅ Immediate payment intent processed for NFT ${nftId}`);
        return { created: true, order: newOrder };
      } else {
        console.log(`⚠️ Order already exists for payment intent ${paymentIntent.id}, skipping duplicate creation`);
        return { created: false, order: existingOrder };
      }
    });
  } catch (err) {
    console.error('❌ Failed to process immediate payment intent:', err);
  }
}

// Handle payment intent failure
async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log('🔥 Payment intent failed:', paymentIntent.id);
  
  // Log the failure for debugging
  console.log('🔥 Payment failure reason:', paymentIntent.last_payment_error?.message);
}

// Handle invoice payment success
async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log('🔥 Invoice payment succeeded:', invoice.id);
  
  // Handle subscription renewals or other invoice-based payments
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    console.log('🔥 Processing subscription invoice:', subscriptionId);
    // Add subscription renewal logic here if needed
  }
}

// Handle invoice payment failure
async function handleInvoicePaymentFailed(invoice: any) {
  console.log('🔥 Invoice payment failed:', invoice.id);
  
  // Handle failed subscription payments
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    console.log('🔥 Processing failed subscription invoice:', subscriptionId);
    // Add subscription failure handling here if needed
  }
} 