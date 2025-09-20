import { prisma } from '@/lib/prisma';
import { 
  createImmediatePaymentIntent, 
  createPresalePaymentIntent, 
  capturePresalePayment,
  getOrCreateCustomer,
  refundPayment,
  PaymentIntentType,
  PaymentStatus,
  PresaleThresholdStatus,
  stripe,
  // New Connect imports
  createConnectPaymentIntent,
  createConnectPresalePaymentIntent,
  calculatePlatformFee,
  createOrGetConnectAccount,
} from '@/lib/stripe';
import { z } from 'zod';
import { headers } from 'next/headers';

// Validation schemas
const checkoutItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  format: z.enum(['vinyl', 'digital']),
  imageUrl: z.string().url(),
  maxQuantity: z.number().int().positive().optional(),
});

const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema),
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
});

export type CheckoutItem = z.infer<typeof checkoutItemSchema>;
export type CheckoutData = z.infer<typeof checkoutSchema>;

/**
 * Process immediate checkout (subscriptions, digital downloads, one-offs)
 */
export async function processImmediateCheckout({
  userId,
  userEmail,
  userName,
  checkoutData,
}: {
  userId: string | null;
  userEmail: string;
  userName?: string;
  checkoutData: CheckoutData;
}) {
  try {
    // Validate checkout data
    const validatedData = checkoutSchema.parse(checkoutData);
    
    // Get or create Stripe customer
    const customerResult = await getOrCreateCustomer({
      email: userEmail,
      name: userName,
      userId: userId || 'guest', // Use 'guest' for guest users
    });

    if (!customerResult.success || !customerResult.customer) {
      throw new Error(`Failed to create customer: ${customerResult.error}`);
    }

    const customer = customerResult.customer;

    // Get NFT details and validate all items have Connect accounts
    const nftDetails = await Promise.all(
      validatedData.items.map(async (item) => {
        const nft = await prisma.nFT.findUnique({
          where: { id: item.id },
          include: {
            user: {
              select: {
                id: true,
                stripeConnectAccountId: true,
                stripeOnboardingComplete: true,
                stripeChargesEnabled: true,
                subscriptionTier: true,
                subscriptionStatus: true,
              }
            }
          }
        });

        if (!nft) {
          throw new Error(`NFT not found: ${item.id}`);
        }

        // Check if artist is on a paid tier (starter, plus, or gold)
        const isPaidTier = nft.user.subscriptionTier && 
          ['starter', 'plus', 'gold'].includes(nft.user.subscriptionTier) &&
          nft.user.subscriptionStatus === 'active';

        // Allow payment if artist is on a paid tier OR if they have completed Stripe onboarding
        if (!isPaidTier && (!nft.user.stripeConnectAccountId || !nft.user.stripeOnboardingComplete || !nft.user.stripeChargesEnabled)) {
          throw new Error(`Artist for "${nft.name}" has not completed Stripe onboarding. Please contact the artist to complete their payment setup.`);
        }

        return {
          ...item,
          nft,
          artistAccountId: nft.user.stripeConnectAccountId || null, // Can be null for paid tier users
        };
      })
    );

    // For now, we'll create separate payment intents for each artist
    // TODO: In the future, consider grouping by artist to reduce fees
    const paymentResults = await Promise.all(
      nftDetails.map(async (item) => {
        const totalAmount = item.price * item.quantity * 100; // Convert to pence
        const platformFeeAmount = calculatePlatformFee(totalAmount);

        // Check if artist is on a paid tier
        const isPaidTier = item.nft.user.subscriptionTier && 
          ['starter', 'plus', 'gold'].includes(item.nft.user.subscriptionTier) &&
          item.nft.user.subscriptionStatus === 'active';

        // For paid tier users without Stripe Connect, create a regular payment intent
        if (isPaidTier && !item.artistAccountId) {
          const { stripe } = await import('@/lib/stripe');
          const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount,
            currency: 'gbp',
            customer: customer.id,
            metadata: {
              userId: userId || 'guest',
              userEmail,
              orderType: 'immediate',
              nftId: item.id,
              nftName: item.name,
              artistId: item.nft.userId,
              isPaidTierUser: 'true',
            },
          });

          return {
            item,
            paymentIntent,
            clientSecret: paymentIntent.client_secret,
            platformFeeAmount: 0, // No platform fee for paid tier users
            isPaidTierUser: true,
          };
        }

        // Create Connect payment intent for regular users (only if artistAccountId exists)
        if (!item.artistAccountId) {
          throw new Error(`Artist for "${item.name}" has not completed Stripe onboarding. Please contact the artist to complete their payment setup.`);
        }

        const paymentIntentResult = await createConnectPaymentIntent({
          amount: totalAmount,
          artistAccountId: item.artistAccountId,
          platformFeeAmount,
          customerId: customer.id,
          metadata: {
            userId: userId || 'guest',
            userEmail,
            orderType: 'immediate',
            nftId: item.id,
            nftName: item.name,
            artistId: item.nft.userId,
          },
        });

        if (!paymentIntentResult.success || !paymentIntentResult.paymentIntent) {
          throw new Error(`Failed to create payment intent for ${item.name}: ${paymentIntentResult.error}`);
        }

        if (!paymentIntentResult.clientSecret) {
          throw new Error(`Client secret not received for ${item.name}`);
        }

        return {
          item,
          paymentIntent: paymentIntentResult.paymentIntent,
          clientSecret: paymentIntentResult.clientSecret,
          platformFeeAmount,
          isPaidTierUser: false,
        };
      })
    );

    // Create orders in database
    const orders = await prisma.$transaction(async (tx) => {
      const createdOrders = [];

      for (let i = 0; i < paymentResults.length; i++) {
        const { item, paymentIntent, platformFeeAmount } = paymentResults[i];

        // Create order
        const order = await tx.order.create({
          data: {
            userId: userId || undefined, // Convert null to undefined for Prisma
            customerEmail: userEmail, // Store email for guest users
            customerName: userName, // Store name for guest users
            nftId: item.id,
            format: item.format,
            quantity: item.quantity,
            totalPrice: item.price * item.quantity,
            status: 'pending',
            paymentIntentId: paymentIntent.id,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod: 'card',
            isPresaleOrder: false,
            // Connect-specific fields (null for paid tier users)
            artistStripeAccountId: item.artistAccountId,
            platformFeeAmount: paymentResults[i].isPaidTierUser ? 0 : platformFeeAmount / 100, // No platform fee for paid tier users
            transferAmount: paymentResults[i].isPaidTierUser ? item.price * item.quantity : (item.price * item.quantity) - (platformFeeAmount / 100),
            transferStatus: paymentResults[i].isPaidTierUser ? 'completed' : 'pending', // Mark as completed for paid tier users
            shippingAddress: validatedData.shippingAddress?.address,
            shippingCity: validatedData.shippingAddress?.city,
            shippingPostcode: validatedData.shippingAddress?.postcode,
            shippingCountry: validatedData.shippingAddress?.country,
            // Set buyer location from shipping address for analytics
            buyerCountry: validatedData.shippingAddress?.country,
            buyerCity: validatedData.shippingAddress?.city,
          },
        });

        createdOrders.push(order);

        // Update NFT order count for digital downloads
        if (item.format === 'digital') {
          await tx.nFT.update({
            where: { id: item.id },
            data: {
              currentOrders: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      return createdOrders;
    });

    // Return the first payment intent for simplicity
    // TODO: Consider how to handle multiple payment intents in the UI
    const primaryPayment = paymentResults[0];

    return {
      success: true,
      clientSecret: primaryPayment.clientSecret,
      orders,
      paymentIntentId: primaryPayment.paymentIntent.id,
      // Include all payment intents for advanced handling
      allPayments: paymentResults.map(result => ({
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntent.id,
        nftId: result.item.id,
        nftName: result.item.name,
      })),
    };
  } catch (error) {
    console.error('Error processing immediate checkout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process presale checkout (vinyl presales - capture only)
 */
export async function processPresaleCheckout({
  userId,
  userEmail,
  userName,
  checkoutData,
}: {
  userId: string | null;
  userEmail: string;
  userName?: string;
  checkoutData: CheckoutData;
}) {
  try {
    // Validate checkout data
    const validatedData = checkoutSchema.parse(checkoutData);
    
    // Filter for vinyl presales only
    const vinylItems = validatedData.items.filter(item => item.format === 'vinyl');
    
    if (vinylItems.length === 0) {
      throw new Error('No vinyl presale items found');
    }

    // Get or create Stripe customer
    const customerResult = await getOrCreateCustomer({
      email: userEmail,
      name: userName,
      userId: userId || 'guest', // Use 'guest' for guest users
    });

    if (!customerResult.success || !customerResult.customer) {
      throw new Error(`Failed to create customer: ${customerResult.error}`);
    }

    const customer = customerResult.customer;

    // Process each vinyl presale item
    const results = await prisma.$transaction(async (tx) => {
      const processedItems = [];

      for (const item of vinylItems) {
        // Get NFT details including artist Connect info
        const nft = await tx.nFT.findUnique({
          where: { id: item.id },
          include: {
            user: {
              select: {
                id: true,
                stripeConnectAccountId: true,
                stripeOnboardingComplete: true,
                stripeChargesEnabled: true,
                subscriptionTier: true,
                subscriptionStatus: true,
              }
            }
          }
        });

        if (!nft) {
          throw new Error(`NFT not found: ${item.id}`);
        }

        if (!nft.isVinylPresale) {
          throw new Error(`NFT is not a vinyl presale: ${item.id}`);
        }

        // Check if artist is on a paid tier (starter, plus, or gold)
        const isPaidTier = nft.user.subscriptionTier && 
          ['starter', 'plus', 'gold'].includes(nft.user.subscriptionTier) &&
          nft.user.subscriptionStatus === 'active';

        // Validate artist has completed Connect onboarding OR is on a paid tier
        if (!isPaidTier && (!nft.user.stripeConnectAccountId || !nft.user.stripeOnboardingComplete || !nft.user.stripeChargesEnabled)) {
          throw new Error(`Artist for "${nft.name}" has not completed Stripe onboarding. Please contact the artist to complete their payment setup.`);
        }

        // Check if presale is still active
        if (nft.endDate && new Date(nft.endDate) < new Date()) {
          throw new Error(`Presale has ended for: ${nft.name}`);
        }

        // Get or create presale threshold
        let presaleThreshold = await tx.presaleThreshold.findUnique({
          where: { nftId: item.id },
        });

        if (!presaleThreshold) {
          presaleThreshold = await tx.presaleThreshold.create({
            data: {
              nftId: item.id,
              targetOrders: nft.targetOrders,
              currentOrders: 0,
              status: PresaleThresholdStatus.ACTIVE,
            },
          });
        }

        // Check if threshold is still active
        if (presaleThreshold.status !== PresaleThresholdStatus.ACTIVE) {
          throw new Error(`Presale threshold reached for: ${nft.name}`);
        }

        // Check if adding this order would exceed target
        const newTotal = presaleThreshold.currentOrders + item.quantity;
        if (newTotal > presaleThreshold.targetOrders) {
          throw new Error(`Order would exceed presale target for: ${nft.name}`);
        }

        // Calculate amount and platform fee
        const amount = item.price * item.quantity * 100; // Convert to pence
        const platformFeeAmount = calculatePlatformFee(amount);

        let paymentIntent: any;
        let clientSecret: string;

        // For paid tier users without Stripe Connect, create a regular payment intent
        if (isPaidTier && !nft.user.stripeConnectAccountId) {
          const { stripe } = await import('@/lib/stripe');
          paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'gbp',
            customer: customer.id,
            metadata: {
              userId: userId || 'guest',
              nftId: item.id,
              type: 'presale',
              quantity: item.quantity.toString(),
              nftName: nft.name,
              artistId: nft.userId,
              isPaidTierUser: 'true',
            },
          });
          clientSecret = paymentIntent.client_secret;
        } else {
          // Create Connect presale payment intent for regular users (only if artistAccountId exists)
          if (!nft.user.stripeConnectAccountId) {
            throw new Error(`Artist for "${nft.name}" has not completed Stripe onboarding. Please contact the artist to complete their payment setup.`);
          }

          const paymentIntentResult = await createConnectPresalePaymentIntent({
            amount,
            artistAccountId: nft.user.stripeConnectAccountId,
            platformFeeAmount,
            customerId: customer.id,
            metadata: {
              userId: userId || 'guest',
              nftId: item.id,
              orderType: 'presale',
              quantity: item.quantity.toString(),
              nftName: nft.name,
              artistId: nft.userId,
            },
          });

          if (!paymentIntentResult.success) {
            throw new Error(`Failed to create payment intent: ${paymentIntentResult.error}`);
          }

          paymentIntent = paymentIntentResult.paymentIntent;
          
          if (!paymentIntent) {
            throw new Error('Payment intent creation failed');
          }

          if (!paymentIntentResult.clientSecret) {
            throw new Error('Client secret not received from payment intent');
          }

          clientSecret = paymentIntentResult.clientSecret;
        }

        // Build order data object
        const orderData: any = {
          customerEmail: userEmail, // Store email for guest users
          customerName: userName,   // Store name for guest users
          nftId: item.id,
          format: item.format,
          quantity: item.quantity,
          totalPrice: item.price * item.quantity,
          status: 'pending',
          paymentIntentId: paymentIntent.id,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: 'card',
          isPresaleOrder: true,
          // Connect-specific fields (null for paid tier users)
          artistStripeAccountId: nft.user.stripeConnectAccountId,
          platformFeeAmount: isPaidTier && !nft.user.stripeConnectAccountId ? 0 : platformFeeAmount / 100, // No platform fee for paid tier users
          transferAmount: isPaidTier && !nft.user.stripeConnectAccountId ? item.price * item.quantity : (item.price * item.quantity) - (platformFeeAmount / 100),
          transferStatus: isPaidTier && !nft.user.stripeConnectAccountId ? 'completed' : 'pending', // Mark as completed for paid tier users
          shippingAddress: validatedData.shippingAddress?.address,
          shippingCity: validatedData.shippingAddress?.city,
          shippingPostcode: validatedData.shippingAddress?.postcode,
          shippingCountry: validatedData.shippingAddress?.country,
          // Set buyer location from shipping address for analytics
          buyerCountry: validatedData.shippingAddress?.country,
          buyerCity: validatedData.shippingAddress?.city,
        };
        if (userId) orderData.userId = userId;
        const order = await tx.order.create({ data: orderData });

        // Update presale threshold
        await tx.presaleThreshold.update({
          where: { id: presaleThreshold.id },
          data: {
            currentOrders: {
              increment: item.quantity,
            },
          },
        });

        // Update NFT order count
        await tx.nFT.update({
          where: { id: item.id },
          data: {
            currentOrders: {
              decrement: item.quantity,
            },
          },
        });

        // Check if threshold is now reached and auto-capture if so
        const updatedThreshold = await tx.presaleThreshold.findUnique({
          where: { id: presaleThreshold.id },
        });

        if (updatedThreshold && updatedThreshold.currentOrders >= updatedThreshold.targetOrders) {
          console.log(`🎯 Threshold reached for ${nft.name}! Manual capture required.`);
          
          // 🛑 AUTO-CAPTURE DISABLED - Manual capture required
          // Trigger auto-capture asynchronously (don't wait for it to complete)
          // setImmediate(async () => {
          //   try {
          //     await autoCapturePaymentsForNFT(item.id);
          //   } catch (error) {
          //     console.error('Error in auto-capture:', error);
          //   }
          // });
        }

        processedItems.push({
          order,
          clientSecret,
          paymentIntentId: paymentIntent.id,
          nftName: nft.name,
        });
      }

      return processedItems;
    });

    return {
      success: true,
      items: results,
    };
  } catch (error) {
    console.error('Error processing presale checkout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check and process presale thresholds
 */
export async function checkAndProcessPresaleThresholds() {
  try {
    const thresholds = await prisma.presaleThreshold.findMany({
      where: {
        status: PresaleThresholdStatus.ACTIVE,
      },
      include: {
        nft: {
          include: {
            orders: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    const processedThresholds = [];

    for (const threshold of thresholds) {
      // Check if threshold is reached
      if (threshold.currentOrders >= threshold.targetOrders) {
        console.log(`Processing presale threshold for NFT: ${threshold.nft.name}`);

        // Update threshold status
        await prisma.presaleThreshold.update({
          where: { id: threshold.id },
          data: {
            status: PresaleThresholdStatus.REACHED,
          },
        });

        // Capture all pending payments for this NFT
        const capturedPayments = await prisma.capturedPayment.findMany({
          where: {
            nftId: threshold.nftId,
            status: PaymentStatus.CAPTURED,
          },
        });

        const captureResults = [];

        for (const payment of capturedPayments) {
          const captureResult = await capturePresalePayment(payment.paymentIntentId);
          
          if (captureResult.success) {
            // Update payment status
            await prisma.capturedPayment.update({
              where: { id: payment.id },
              data: {
                status: PaymentStatus.PROCESSED,
                processedAt: new Date(),
              },
            });

            // Update order status
            await prisma.order.updateMany({
              where: {
                paymentIntentId: payment.paymentIntentId,
              },
              data: {
                paymentStatus: PaymentStatus.PROCESSED,
                status: 'completed',
                capturedAt: new Date(),
              },
            });

            captureResults.push({
              paymentId: payment.id,
              success: true,
            });
          } else {
            captureResults.push({
              paymentId: payment.id,
              success: false,
              error: captureResult.error,
            });
          }
        }

        // Update threshold status to completed
        await prisma.presaleThreshold.update({
          where: { id: threshold.id },
          data: {
            status: PresaleThresholdStatus.COMPLETED,
          },
        });

        processedThresholds.push({
          thresholdId: threshold.id,
          nftName: threshold.nft.name,
          captureResults,
        });
      }
    }

    return {
      success: true,
      processedThresholds,
    };
  } catch (error) {
    console.error('Error checking presale thresholds:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle failed presales (time ended but threshold not met)
 * 
 * NOTE: This function does NOT process automatic refunds for completed orders.
 * It only:
 * 1. Sends notification emails to creators and buyers
 * 2. Cancels pending payment intents (no money taken yet)
 * 3. Marks the presale threshold as failed
 * 
 * Refunds for completed orders must be processed manually by admin.
 */
export async function handleFailedPresales() {
  try {
    const now = new Date();
    
    // Find presales that have ended but didn't meet their threshold
    const failedPresales = await prisma.presaleThreshold.findMany({
      where: {
        status: PresaleThresholdStatus.ACTIVE,
        nft: {
          endDate: {
            lt: now,
          },
        },
      },
      include: {
        nft: {
          include: {
            user: true, // Include creator details for email notification
            orders: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    const processedFailures = [];

    for (const presale of failedPresales) {
      // Check if threshold was actually met
      if (presale.currentOrders >= presale.targetOrders) {
        continue; // This presale succeeded, skip
      }

      console.log(`Processing failed presale for NFT: ${presale.nft.name}`);

      // Update threshold status to failed
      await prisma.presaleThreshold.update({
        where: { id: presale.id },
        data: {
          status: 'failed',
        },
      });

      // Send conversion notification to creator
      try {
        const { sendPresaleToDigitalEmail } = await import('@/lib/brevo');
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        // Calculate digital price (half of vinyl price)
        let vinylPrice = 26;
        if (presale.nft.targetOrders === 200) vinylPrice = 22;
        if (presale.nft.targetOrders === 500) vinylPrice = 20;
        const digitalPrice = vinylPrice / 2;

        const emailResult = await sendPresaleToDigitalEmail({
          creatorEmail: presale.nft.user.email,
          creatorName: presale.nft.user.name || 'Artist',
          projectName: presale.nft.name,
          targetOrders: presale.targetOrders,
          actualOrders: presale.currentOrders,
          endDate: presale.nft.endDate!,
          digitalPrice,
          projectUrl: `${baseUrl}/nft-detail/${presale.nft.id}`,
          conversionReason: 'time_expired'
        });

        if (emailResult) {
          console.log(`✅ Presale conversion email sent to creator: ${presale.nft.user.email}`);
        } else {
          console.error(`❌ Failed to send presale conversion email to: ${presale.nft.user.email}`);
        }
      } catch (emailError) {
        console.error('Error sending presale conversion email:', emailError);
        // Don't fail the entire process if email fails
      }

      // Send presale failed notifications to buyers (template 21)
      try {
        const { sendPresaleFailedBuyerEmail } = await import('@/lib/brevo');
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        // Get all completed orders for this presale to notify buyers
        const presaleOrders = await prisma.order.findMany({
          where: {
            nftId: presale.nftId,
            format: 'vinyl',
            status: 'completed',
            paymentStatus: { in: ['processed', 'captured', 'completed'] }
          }
        });

        console.log(`📧 Sending presale failed emails to ${presaleOrders.length} buyers for NFT ${presale.nft.name}`);

        for (const order of presaleOrders) {
          if (order.customerEmail) {
            try {
              const buyerEmailResult = await sendPresaleFailedBuyerEmail({
                buyerEmail: order.customerEmail,
                buyerName: order.customerName || 'Music Fan',
                projectName: presale.nft.name,
                artistName: presale.nft.user.name || 'Artist',
                targetOrders: presale.targetOrders,
                actualOrders: presale.currentOrders,
                projectUrl: `${baseUrl}/nft-detail/${presale.nft.id}`,
                refundAmount: order.totalPrice,
                refundTimeline: '5-7 business days'
              });

              if (buyerEmailResult) {
                console.log(`✅ Presale failed buyer email sent to ${order.customerEmail}`);
              } else {
                console.error(`❌ Failed to send presale failed buyer email to ${order.customerEmail}`);
              }
            } catch (buyerEmailError) {
              console.error(`❌ Error sending presale failed buyer email to ${order.customerEmail}:`, buyerEmailError);
            }
          }
        }
      } catch (emailError) {
        console.error('Error sending presale failed buyer emails:', emailError);
        // Don't fail the entire process if email fails
      }

      // Get all pending payment intents for this NFT
      const pendingOrders = await prisma.order.findMany({
        where: {
          nftId: presale.nftId,
          isPresaleOrder: true,
          paymentStatus: PaymentStatus.PENDING,
        },
      });

      const cancelResults = [];

      for (const order of pendingOrders) {
        if (!order.paymentIntentId) continue;

        // Cancel the payment intent (no refund needed since no payment was taken)
        const cancelResult = await stripe.paymentIntents.cancel(order.paymentIntentId, {
          cancellation_reason: 'requested_by_customer',
        });
        
        if (cancelResult.status === 'canceled') {
          // Update order status
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: PaymentStatus.FAILED,
              status: 'cancelled',
            },
          });

          cancelResults.push({
            orderId: order.id,
            paymentIntentId: order.paymentIntentId,
            success: true,
          });
        } else {
          cancelResults.push({
            orderId: order.id,
            paymentIntentId: order.paymentIntentId,
            success: false,
            error: 'Failed to cancel payment intent',
          });
        }
      }

      processedFailures.push({
        thresholdId: presale.id,
        nftName: presale.nft.name,
        targetOrders: presale.targetOrders,
        actualOrders: presale.currentOrders,
        cancelResults,
      });
    }

    return {
      success: true,
      processedFailures,
    };
  } catch (error) {
    console.error('Error handling failed presales:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user's order history
 */
export async function getUserOrders(userId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        nft: {
          select: {
            id: true,
            name: true,
            sideAImage: true,
            sideBImage: true,
            sideATracks: true,
            sideBTracks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      orders,
    };
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 

/**
 * Auto-capture payments for an NFT when threshold is reached
 * Includes retry logic and refund handling for failed captures
 */
export async function autoCapturePaymentsForNFT(nftId: string) {
  try {
    console.log(`Auto-capturing payments for NFT: ${nftId}`);

    // Get the presale threshold for this NFT
    const presaleThreshold = await prisma.presaleThreshold.findUnique({
      where: { nftId },
      include: {
        nft: {
          include: {
            orders: {
              where: {
                paymentStatus: PaymentStatus.PENDING,
                isPresaleOrder: true,
              },
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!presaleThreshold) {
      throw new Error(`No presale threshold found for NFT: ${nftId}`);
    }

    // Check if threshold is actually reached
    if (presaleThreshold.currentOrders < presaleThreshold.targetOrders) {
      throw new Error(`Threshold not reached. Current: ${presaleThreshold.currentOrders}, Target: ${presaleThreshold.targetOrders}`);
    }

    // Update threshold status to processing
    await prisma.presaleThreshold.update({
      where: { id: presaleThreshold.id },
      data: {
        status: PresaleThresholdStatus.PROCESSING,
      },
    });

    // Get or create capture attempt record
    let captureAttempt = await prisma.captureAttempt.findFirst({
      where: { nftId },
      orderBy: { createdAt: 'desc' },
    });

    if (!captureAttempt) {
      captureAttempt = await prisma.captureAttempt.create({
        data: {
          nftId,
          attemptNumber: 1,
          totalOrders: presaleThreshold.nft.orders.length,
          successfulCaptures: 0,
          failedCaptures: 0,
          status: 'in_progress',
        },
      });
    } else {
      // Check if we should retry (max 5 attempts over 3 days)
      const daysSinceFirst = Math.floor((Date.now() - captureAttempt.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (captureAttempt.attemptNumber >= 5 || daysSinceFirst >= 3) {
        // Final attempt - check if we should refund
        return await handleFinalCaptureAttempt(nftId, captureAttempt);
      }

      // Increment attempt number
      captureAttempt = await prisma.captureAttempt.update({
        where: { id: captureAttempt.id },
        data: {
          attemptNumber: captureAttempt.attemptNumber + 1,
          totalOrders: presaleThreshold.nft.orders.length,
          successfulCaptures: 0,
          failedCaptures: 0,
          status: 'in_progress',
        },
      });
    }

    console.log(`🔄 Capture attempt ${captureAttempt.attemptNumber} for ${presaleThreshold.nft.name}`);

    const captureResults = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each pending order
    for (const order of presaleThreshold.nft.orders) {
      if (!order.paymentIntentId) {
        console.warn(`Order ${order.id} has no payment intent ID`);
        continue;
      }

      // Skip orders that were already successfully captured
      const existingCapturedPayment = await prisma.capturedPayment.findFirst({
        where: {
          paymentIntentId: order.paymentIntentId,
          status: PaymentStatus.CAPTURED,
        },
      });

      if (existingCapturedPayment) {
        console.log(`Order ${order.id} already captured, skipping`);
        successCount++;
        continue;
      }

      try {
        // Capture the payment
        const captureResult = await capturePresalePayment(order.paymentIntentId);
        
        if (captureResult.success) {
          // Update order status
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: PaymentStatus.CAPTURED,
              status: 'completed',
              capturedAt: new Date(),
            },
          });

          // Create captured payment record
          await prisma.capturedPayment.create({
            data: {
              paymentIntentId: order.paymentIntentId,
              nftId: order.nftId,
              amount: Math.round(order.totalPrice * 100), // Convert to pence
              status: PaymentStatus.CAPTURED,
            },
          });

          successCount++;
          captureResults.push({
            orderId: order.id,
            paymentIntentId: order.paymentIntentId,
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            amount: order.totalPrice,
            success: true,
          });

          console.log(`✅ Successfully captured payment for order ${order.id}`);
        } else {
          failureCount++;
          captureResults.push({
            orderId: order.id,
            paymentIntentId: order.paymentIntentId,
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            amount: order.totalPrice,
            success: false,
            error: captureResult.error,
          });

          console.error(`❌ Failed to capture payment for order ${order.id}: ${captureResult.error}`);
        }
      } catch (error) {
        failureCount++;
        console.error(`❌ Error processing order ${order.id}:`, error);
        captureResults.push({
          orderId: order.id,
          paymentIntentId: order.paymentIntentId,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          amount: order.totalPrice,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update capture attempt with results
    await prisma.captureAttempt.update({
      where: { id: captureAttempt.id },
      data: {
        successfulCaptures: successCount,
        failedCaptures: failureCount,
        status: failureCount === 0 ? 'completed' : 'partial',
        completedAt: failureCount === 0 ? new Date() : undefined,
      },
    });

    const totalOrders = successCount + failureCount;
    const successRate = totalOrders > 0 ? (successCount / totalOrders) * 100 : 0;

    console.log(`🎉 Capture attempt ${captureAttempt.attemptNumber} completed for ${presaleThreshold.nft.name}`);
    console.log(`✅ Successful captures: ${successCount}/${totalOrders} (${successRate.toFixed(1)}%)`);
    console.log(`❌ Failed captures: ${failureCount}`);

    // If success rate is >= 90%, mark as completed
    if (successRate >= 90) {
      await prisma.presaleThreshold.update({
        where: { id: presaleThreshold.id },
        data: {
          status: PresaleThresholdStatus.COMPLETED,
        },
      });

      await prisma.captureAttempt.update({
        where: { id: captureAttempt.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      console.log(`🎉 Presale completed successfully with ${successRate.toFixed(1)}% success rate`);
    } else {
      console.log(`⚠️ Success rate ${successRate.toFixed(1)}% below 90%, will retry later`);
    }

    return {
      success: true,
      nftName: presaleThreshold.nft.name,
      targetOrders: presaleThreshold.targetOrders,
      currentOrders: presaleThreshold.currentOrders,
      attemptNumber: captureAttempt.attemptNumber,
      successCount,
      failureCount,
      successRate,
      captureResults,
    };
  } catch (error) {
    console.error('Error in auto-capture:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle final capture attempt - refund if success rate is below 90%
 */
async function handleFinalCaptureAttempt(nftId: string, captureAttempt: any) {
  try {
    console.log(`🔚 Final capture attempt for NFT: ${nftId}`);

    const presaleThreshold = await prisma.presaleThreshold.findUnique({
      where: { nftId },
      include: {
        nft: {
          include: {
            orders: {
              where: {
                isPresaleOrder: true,
              },
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!presaleThreshold) {
      throw new Error(`No presale threshold found for NFT: ${nftId}`);
    }

    // Count successful and failed captures
    const successfulCaptures = await prisma.capturedPayment.count({
      where: {
        nftId,
        status: PaymentStatus.CAPTURED,
      },
    });

    const totalOrders = presaleThreshold.nft.orders.length;
    const successRate = totalOrders > 0 ? (successfulCaptures / totalOrders) * 100 : 0;

    console.log(`📊 Final results: ${successfulCaptures}/${totalOrders} (${successRate.toFixed(1)}%)`);

    if (successRate >= 90) {
      // Success! Mark as completed
      await prisma.presaleThreshold.update({
        where: { id: presaleThreshold.id },
        data: {
          status: PresaleThresholdStatus.COMPLETED,
        },
      });

      await prisma.captureAttempt.update({
        where: { id: captureAttempt.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      console.log(`🎉 Presale completed successfully with ${successRate.toFixed(1)}% success rate`);
      return {
        success: true,
        nftName: presaleThreshold.nft.name,
        finalResult: 'completed',
        successRate,
        successfulCaptures,
        totalOrders,
      };
    } else {
      // Failure - mark for manual refund processing (NO AUTOMATIC REFUNDS)
      console.log(`⚠️ Success rate ${successRate.toFixed(1)}% below 90%, marking for MANUAL refund processing...`);
      console.log(`🚨 ADMIN ACTION REQUIRED: Manual refunds needed for failed presale capture`);

      // Get all captured payments for this NFT for reporting
      const capturedPayments = await prisma.capturedPayment.findMany({
        where: {
          nftId,
          status: PaymentStatus.CAPTURED,
        },
      });

      console.log(`💰 ${capturedPayments.length} captured payments require manual refund review`);
      
      // Mark each payment as requiring manual review (do NOT auto-refund)
      const refundResults = [];
      for (const payment of capturedPayments) {
        // Just log for manual processing - no automatic refunds
        refundResults.push({
          paymentIntentId: payment.paymentIntentId,
          amount: payment.amount,
          status: 'requires_manual_refund',
          note: 'Capture failure - admin must manually process refund'
        });
        
        console.log(`🔍 Payment ${payment.paymentIntentId}: £${(payment.amount / 100).toFixed(2)} - REQUIRES MANUAL REFUND`);
      }

      // Mark presale as failed (but do not auto-refund)
      await prisma.presaleThreshold.update({
        where: { id: presaleThreshold.id },
        data: {
          status: PresaleThresholdStatus.FAILED,
        },
      });

      await prisma.captureAttempt.update({
        where: { id: captureAttempt.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
        },
      });

      console.log(`💸 Manual refund review completed: ${capturedPayments.length} payments flagged for admin review`);

      return {
        success: true,
        nftName: presaleThreshold.nft.name,
        finalResult: 'failed_requires_manual_refunds',
        successRate,
        successfulCaptures,
        totalOrders,
        paymentsRequiringManualRefund: capturedPayments.length,
        refundResults,
      };
    }
  } catch (error) {
    console.error('Error in final capture attempt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check all active presales and auto-capture those that have reached their threshold
 */
export async function checkAndAutoCaptureAllThresholds() {
  try {
    console.log('🔍 Checking all presale thresholds for auto-capture...');

    const activeThresholds = await prisma.presaleThreshold.findMany({
      where: {
        status: PresaleThresholdStatus.ACTIVE,
      },
      include: {
        nft: {
          include: {
            orders: {
              where: {
                paymentStatus: PaymentStatus.PENDING,
                isPresaleOrder: true,
              },
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    const results = [];

    for (const threshold of activeThresholds) {
      // Check if threshold is reached
      if (threshold.currentOrders >= threshold.targetOrders) {
        console.log(`🎯 Threshold reached for ${threshold.nft.name} (${threshold.currentOrders}/${threshold.targetOrders})`);
        
        const captureResult = await autoCapturePaymentsForNFT(threshold.nftId);
        results.push({
          nftId: threshold.nftId,
          nftName: threshold.nft.name,
          ...captureResult,
        });
      }
    }

    return {
      success: true,
      processedCount: results.length,
      results,
    };
  } catch (error) {
    console.error('Error checking thresholds:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 