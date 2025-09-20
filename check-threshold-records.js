const { PrismaClient } = require('@prisma/client');

async function checkThresholdRecords() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking current PresaleThreshold records...');
    
    const allThresholds = await prisma.presaleThreshold.findMany({
      include: {
        nft: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Total threshold records: ${allThresholds.length}`);
    
    const now = new Date();
    
    for (const threshold of allThresholds) {
      console.log(`\n🎵 "${threshold.nft.name}"`);
      console.log(`   Threshold ID: ${threshold.id}`);
      console.log(`   Status: ${threshold.status}`);
      console.log(`   Target: ${threshold.targetOrders}`);
      console.log(`   Current: ${threshold.currentOrders}`);
      console.log(`   End Date: ${threshold.nft.endDate?.toISOString()}`);
      
      const isExpired = threshold.nft.endDate && threshold.nft.endDate < now;
      const hasMetTarget = threshold.currentOrders >= threshold.targetOrders;
      
      console.log(`   Is Expired: ${isExpired}`);
      console.log(`   Has Met Target: ${hasMetTarget}`);
      
      // Check what the handleFailedPresales function would see
      if (threshold.status === 'active' && isExpired && !hasMetTarget) {
        console.log(`   🚨 Would be processed by handleFailedPresales()`);
      } else if (threshold.status === 'failed') {
        console.log(`   ❌ Already marked as failed - won't be processed again`);
      } else if (threshold.status === 'active' && !isExpired) {
        console.log(`   ⏳ Still active and not expired`);
      } else if (hasMetTarget) {
        console.log(`   ✅ Target met - successful presale`);
      }
    }
    
    // Check specifically what the handleFailedPresales query would find
    console.log(`\n🔍 What handleFailedPresales() would find:`);
    
    const failedPresales = await prisma.presaleThreshold.findMany({
      where: {
        status: 'active',
        nft: {
          endDate: {
            lt: now,
          },
        },
      },
      include: {
        nft: true
      }
    });
    
    console.log(`   Found: ${failedPresales.length} expired active presales`);
    
    for (const presale of failedPresales) {
      console.log(`   - "${presale.nft.name}" (${presale.currentOrders}/${presale.targetOrders})`);
    }
    
  } catch (error) {
    console.error('❌ Error checking thresholds:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkThresholdRecords();
