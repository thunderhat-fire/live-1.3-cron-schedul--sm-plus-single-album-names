const { PrismaClient } = require('@prisma/client');

// Import the handleFailedPresales function
// We'll simulate it here since it's in TypeScript
async function handleFailedPresales() {
  const prisma = new PrismaClient();
  
  try {
    const now = new Date();
    
    console.log('🔍 Finding presales that have ended but didn\'t meet their threshold...');
    
    // Find presales that have ended but didn't meet their threshold
    const failedPresales = await prisma.presaleThreshold.findMany({
      where: {
        status: 'active', // Only active ones
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
              where: {
                format: 'vinyl',
                paymentStatus: { in: ['processed', 'captured', 'completed'] }
              },
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    console.log(`📊 Found ${failedPresales.length} failed presales to process`);

    const processedFailures = [];

    for (const presale of failedPresales) {
      // Check if threshold was actually met
      if (presale.currentOrders >= presale.targetOrders) {
        console.log(`⏭️  Skipping "${presale.nft.name}" - threshold was actually met`);
        continue; // This presale succeeded, skip
      }

      console.log(`\n🚨 Processing failed presale for NFT: "${presale.nft.name}"`);
      console.log(`   Target: ${presale.targetOrders}, Current: ${presale.currentOrders}`);
      console.log(`   Completed orders: ${presale.nft.orders.length}`);

      // Update threshold status to failed
      console.log(`   ⚠️  Marking threshold as failed...`);
      await prisma.presaleThreshold.update({
        where: { id: presale.id },
        data: {
          status: 'failed',
        },
      });

      console.log(`   📧 Would send failure notification to creator: ${presale.nft.user.email || 'No email'}`);
      
      // Get all completed orders for this presale to notify buyers
      const presaleOrders = presale.nft.orders;
      
      console.log(`   📧 Would send failure emails to ${presaleOrders.length} buyers:`);
      
      for (const order of presaleOrders) {
        if (order.customerEmail) {
          console.log(`      - ${order.customerEmail} (£${(order.totalPrice / 100).toFixed(2)} refund)`);
        }
      }

      // Get all pending payment intents for this NFT (would cancel them)
      const pendingOrders = await prisma.order.findMany({
        where: {
          nftId: presale.nftId,
          isPresaleOrder: true,
          paymentStatus: 'pending',
        },
      });

      console.log(`   🔄 Would cancel ${pendingOrders.length} pending orders`);

      processedFailures.push({
        thresholdId: presale.id,
        nftName: presale.nft.name,
        targetOrders: presale.targetOrders,
        actualOrders: presale.currentOrders,
        completedOrders: presaleOrders.length,
        pendingOrders: pendingOrders.length,
        buyersToNotify: presaleOrders.filter(o => o.customerEmail).length
      });
    }

    console.log(`\n✅ Processed ${processedFailures.length} failed presales`);
    
    return {
      success: true,
      processedFailures,
    };
  } catch (error) {
    console.error('❌ Error handling failed presales:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
handleFailedPresales().then(result => {
  console.log('\n📋 Final Result:', JSON.stringify(result, null, 2));
});
