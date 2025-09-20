const { PrismaClient } = require('@prisma/client');

async function checkFailedPresales() {
  const prisma = new PrismaClient();
  
  try {
    const now = new Date();
    console.log('🔍 Checking for failed presales...');
    console.log('Current time:', now.toISOString());
    
    // Find presales that have ended but didn't meet their threshold
    const failedPresales = await prisma.presaleThreshold.findMany({
      where: {
        status: 'active', // Use the lowercase enum value
        nft: {
          endDate: {
            lt: now,
          },
        },
      },
      include: {
        nft: {
          include: {
            user: true,
            orders: {
              where: {
                format: 'vinyl',
                paymentStatus: { in: ['processed', 'captured', 'completed'] }
              }
            },
          },
        },
      },
    });

    console.log(`\n📊 Found ${failedPresales.length} expired presales`);
    
    for (const presale of failedPresales) {
      const isActuallyFailed = presale.currentOrders < presale.targetOrders;
      
      console.log(`\n🎵 "${presale.nft.name}"`);
      console.log(`   End Date: ${presale.nft.endDate?.toISOString()}`);
      console.log(`   Target: ${presale.targetOrders} orders`);
      console.log(`   Current: ${presale.currentOrders} orders`);
      console.log(`   Status: ${presale.status}`);
      console.log(`   Failed: ${isActuallyFailed ? '❌ YES' : '✅ NO'}`);
      console.log(`   Orders: ${presale.nft.orders.length} completed vinyl orders`);
      
      if (isActuallyFailed) {
        console.log(`   🚨 This presale SHOULD be processed as failed!`);
      }
    }

    // Also check for any ACTIVE presales (for comparison)
    const activePresales = await prisma.presaleThreshold.findMany({
      where: {
        status: 'active',
        nft: {
          endDate: {
            gte: now,
          },
        },
      },
      include: {
        nft: true,
      },
    });

    console.log(`\n✅ Found ${activePresales.length} still-active presales`);
    
    for (const presale of activePresales) {
      console.log(`\n🎵 "${presale.nft.name}"`);
      console.log(`   End Date: ${presale.nft.endDate?.toISOString()}`);
      console.log(`   Target: ${presale.targetOrders} orders`);
      console.log(`   Current: ${presale.currentOrders} orders`);
      console.log(`   Status: ${presale.status}`);
      
      const timeRemaining = presale.nft.endDate ? presale.nft.endDate.getTime() - now.getTime() : 0;
      const hoursRemaining = Math.round(timeRemaining / (1000 * 60 * 60));
      console.log(`   Time remaining: ${hoursRemaining} hours`);
    }

  } catch (error) {
    console.error('❌ Error checking presales:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFailedPresales();
