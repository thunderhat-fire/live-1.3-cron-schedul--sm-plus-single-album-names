const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserSubscription(email) {
  try {
    console.log(`🔍 Checking subscription for: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        aiMasteringCredits: true,
        promotionalCredits: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:');
    console.log('📊 Current Status:', {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier || 'None',
      subscriptionStatus: user.subscriptionStatus || 'None',
      subscriptionEndDate: user.subscriptionEndDate ? user.subscriptionEndDate.toISOString() : 'None',
      aiMasteringCredits: user.aiMasteringCredits || 0,
      promotionalCredits: user.promotionalCredits || 0,
      lastUpdated: user.updatedAt.toISOString()
    });

    // Check recent orders for this user
    console.log('\n🛒 Recent orders:');
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        totalPrice: true,
        status: true,
        paymentStatus: true,
        paymentIntentId: true,
        createdAt: true,
        nft: {
          select: {
            name: true
          }
        }
      }
    });

    if (orders.length > 0) {
      orders.forEach(order => {
        console.log(`- Order ${order.id}: ${order.nft?.name || 'Unknown'} - £${order.totalPrice} - ${order.status} - ${order.paymentStatus} (${order.createdAt.toISOString()})`);
      });
    } else {
      console.log('No orders found');
    }

    return user;
  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function updateUserSubscription(email, tier) {
  try {
    console.log(`🔄 Updating subscription for ${email} to ${tier}`);
    
    const updateData = {
      subscriptionTier: tier,
      subscriptionStatus: 'active',
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    // Add credits for Plus/Gold tiers
    if (tier === 'plus' || tier === 'gold') {
      updateData.aiMasteringCredits = 8;
      if (tier === 'plus') {
        updateData.promotionalCredits = 20;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: updateData,
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        aiMasteringCredits: true,
        promotionalCredits: true
      }
    });

    console.log('✅ Subscription updated:', updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const email = args[1];
  const tier = args[2];

  if (!email) {
    console.log(`
Usage:
  node scripts/check-user-subscription.js check <email>              # Check current status
  node scripts/check-user-subscription.js update <email> <tier>      # Update subscription

Examples:
  node scripts/check-user-subscription.js check ross@xtransit.uk
  node scripts/check-user-subscription.js update ross@xtransit.uk gold
    `);
    return;
  }

  switch (command) {
    case 'check':
      await checkUserSubscription(email);
      break;
    case 'update':
      if (!tier) {
        console.log('❌ Please specify tier: starter, indie, plus, or gold');
        return;
      }
      await updateUserSubscription(email, tier);
      break;
    default:
      console.log('❌ Unknown command. Use "check" or "update"');
  }
}

main().catch(console.error); 