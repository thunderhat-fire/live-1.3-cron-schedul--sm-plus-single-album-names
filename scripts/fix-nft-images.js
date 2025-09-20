const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixNftImages() {
  try {
    console.log('🔍 Finding NFTs with temp image URLs...');
    
    // Find NFTs with temp URLs
    const nfts = await prisma.nFT.findMany({
      where: {
        OR: [
          { sideAImage: { contains: '/artwork/temp/' } },
          { sideBImage: { contains: '/artwork/temp/' } }
        ]
      }
    });

    console.log(`Found ${nfts.length} NFTs with temp URLs`);

    for (const nft of nfts) {
      console.log(`\n🔄 Processing NFT: ${nft.name} (${nft.id})`);
      
      let updatedSideA = nft.sideAImage;
      let updatedSideB = nft.sideBImage;

      // Fix Side A image URL
      if (nft.sideAImage && nft.sideAImage.includes('/artwork/temp/')) {
        const filename = nft.sideAImage.split('/').pop();
        updatedSideA = `https://vinylfunders-media.s3.eu-west-1.wasabisys.com/artwork/${nft.id}/side-a/${filename}`;
        console.log(`  Side A: ${nft.sideAImage} → ${updatedSideA}`);
      }

      // Fix Side B image URL
      if (nft.sideBImage && nft.sideBImage.includes('/artwork/temp/')) {
        const filename = nft.sideBImage.split('/').pop();
        updatedSideB = `https://vinylfunders-media.s3.eu-west-1.wasabisys.com/artwork/${nft.id}/side-b/${filename}`;
        console.log(`  Side B: ${nft.sideBImage} → ${updatedSideB}`);
      }

      // Update the NFT in database
      await prisma.nFT.update({
        where: { id: nft.id },
        data: {
          sideAImage: updatedSideA,
          sideBImage: updatedSideB
        }
      });

      console.log(`  ✅ Updated NFT: ${nft.name}`);
    }

    console.log('\n🎉 All NFT image URLs have been fixed!');
  } catch (error) {
    console.error('❌ Error fixing NFT images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNftImages();

