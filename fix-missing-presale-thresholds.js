const { PrismaClient } = require('@prisma/client');

async function fixMissingPresaleThresholds() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Fixing missing PresaleThreshold records...');
    
    // Find all vinyl presale NFTs that don't have threshold records
    const nftsWithoutThresholds = await prisma.nFT.findMany({
      where: {
        isVinylPresale: true,
        // Only include NFTs that don't have a threshold record
        presaleThreshold: null
      },
      include: {
        user: true,
        orders: {
          where: {
            format: 'vinyl',
            paymentStatus: { in: ['processed', 'captured', 'completed'] }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n📊 Found ${nftsWithoutThresholds.length} vinyl NFTs without PresaleThreshold records`);
    
    if (nftsWithoutThresholds.length === 0) {
      console.log('✅ All vinyl presale NFTs already have threshold records!');
      return;
    }
    
    const createdThresholds = [];
    
    for (const nft of nftsWithoutThresholds) {
      console.log(`\n🎵 Processing "${nft.name}"`);
      console.log(`   ID: ${nft.id}`);
      console.log(`   Target Orders: ${nft.targetOrders}`);
      console.log(`   Current Orders: ${nft.currentOrders}`);
      console.log(`   End Date: ${nft.endDate?.toISOString()}`);
      console.log(`   Vinyl Orders: ${nft.orders.length}`);
      
      const now = new Date();
      const isExpired = nft.endDate && nft.endDate < now;
      const hasMetTarget = nft.currentOrders >= nft.targetOrders;
      
      // Determine the correct status
      let status = 'ACTIVE';
      if (isExpired) {
        if (hasMetTarget) {
          status = 'REACHED'; // Should have been processed as successful
        } else {
          status = 'FAILED'; // Should have been processed as failed
        }
      } else if (hasMetTarget) {
        status = 'REACHED'; // Currently successful
      }
      
      console.log(`   Calculated Status: ${status}`);
      
      // Create the threshold record
      const threshold = await prisma.presaleThreshold.create({
        data: {
          nftId: nft.id,
          targetOrders: nft.targetOrders,
          currentOrders: nft.currentOrders,
          status: status
        }
      });
      
      console.log(`   ✅ Created PresaleThreshold record: ${threshold.id}`);
      
      createdThresholds.push({
        nftId: nft.id,
        nftName: nft.name,
        thresholdId: threshold.id,
        status: status,
        isExpired: isExpired,
        hasMetTarget: hasMetTarget,
        shouldBeProcessed: (isExpired && !hasMetTarget) || hasMetTarget
      });
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   Created ${createdThresholds.length} PresaleThreshold records`);
    
    const needsProcessing = createdThresholds.filter(t => t.shouldBeProcessed);
    console.log(`   ${needsProcessing.length} presales need to be processed`);
    
    const failed = createdThresholds.filter(t => t.status === 'FAILED');
    const successful = createdThresholds.filter(t => t.status === 'REACHED');
    const active = createdThresholds.filter(t => t.status === 'ACTIVE');
    
    console.log(`   - ${failed.length} failed presales`);
    console.log(`   - ${successful.length} successful presales`);
    console.log(`   - ${active.length} still active presales`);
    
    if (failed.length > 0) {
      console.log(`\n🚨 Failed presales that need processing:`);
      failed.forEach(f => {
        console.log(`   - "${f.nftName}" (${f.nftId})`);
      });
    }
    
    console.log(`\n✅ PresaleThreshold records created successfully!`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Run the presale scheduler to process these: POST /api/presale/scheduler {"action":"trigger"}`);
    console.log(`   2. Or run manual processing: POST /api/presale/process`);

  } catch (error) {
    console.error('❌ Error fixing presale thresholds:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingPresaleThresholds();
