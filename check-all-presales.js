const { PrismaClient } = require('@prisma/client');

async function checkAllPresales() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking ALL presales in database...');
    
    // Get all presale thresholds
    const allPresales = await prisma.presaleThreshold.findMany({
      include: {
        nft: {
          include: {
            user: true,
            orders: {
              where: {
                format: 'vinyl'
              }
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📊 Total presales in database: ${allPresales.length}`);
    
    if (allPresales.length === 0) {
      console.log('❌ No presales found in database!');
      
      // Check if there are any NFTs that should have presales
      const vinylNFTs = await prisma.nFT.findMany({
        where: {
          isVinylPresale: true
        },
        include: {
          user: true,
          orders: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });
      
      console.log(`\n🎵 Found ${vinylNFTs.length} vinyl presale NFTs:`);
      
      for (const nft of vinylNFTs) {
        console.log(`\n🎵 "${nft.name}"`);
        console.log(`   ID: ${nft.id}`);
        console.log(`   End Date: ${nft.endDate?.toISOString()}`);
        console.log(`   Target Orders: ${nft.targetOrders}`);
        console.log(`   Current Orders: ${nft.currentOrders}`);
        console.log(`   Is Vinyl Presale: ${nft.isVinylPresale}`);
        console.log(`   Orders: ${nft.orders.length}`);
        console.log(`   Created: ${nft.createdAt.toISOString()}`);
        
        const now = new Date();
        const isExpired = nft.endDate && nft.endDate < now;
        const hasMetTarget = nft.currentOrders >= nft.targetOrders;
        
        console.log(`   Status: ${isExpired ? '⏰ EXPIRED' : '⏳ ACTIVE'} | ${hasMetTarget ? '✅ TARGET MET' : '❌ TARGET NOT MET'}`);
        
        if (isExpired && !hasMetTarget) {
          console.log(`   🚨 This NFT should have triggered failed presale processing!`);
        }
      }
    } else {
      const now = new Date();
      
      // Group by status
      const statusCounts = {};
      
      for (const presale of allPresales) {
        const status = presale.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        
        console.log(`\n🎵 "${presale.nft.name}"`);
        console.log(`   ID: ${presale.id}`);
        console.log(`   NFT ID: ${presale.nftId}`);
        console.log(`   Status: ${presale.status}`);
        console.log(`   Target: ${presale.targetOrders} orders`);
        console.log(`   Current: ${presale.currentOrders} orders`);
        console.log(`   End Date: ${presale.nft.endDate?.toISOString()}`);
        console.log(`   Orders: ${presale.nft.orders.length} vinyl orders`);
        console.log(`   Created: ${presale.createdAt.toISOString()}`);
        
        const isExpired = presale.nft.endDate && presale.nft.endDate < now;
        const hasMetTarget = presale.currentOrders >= presale.targetOrders;
        
        if (isExpired && !hasMetTarget && presale.status === 'ACTIVE') {
          console.log(`   🚨 FAILED PRESALE - Should be processed!`);
        } else if (hasMetTarget && presale.status === 'ACTIVE') {
          console.log(`   ✅ SUCCESSFUL PRESALE - Should be processed!`);
        } else if (isExpired) {
          console.log(`   ⏰ Expired and already processed`);
        } else {
          console.log(`   ⏳ Still active`);
        }
      }
      
      console.log(`\n📈 Status breakdown:`);
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking presales:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllPresales();
