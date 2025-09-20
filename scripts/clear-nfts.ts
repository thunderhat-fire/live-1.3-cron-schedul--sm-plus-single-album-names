import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Removing all NFTs from database...');
    
    // Remove the NFTs
    const deletedNFTs = await prisma.nFT.deleteMany({});
    
    console.log(`Successfully removed ${deletedNFTs.count} NFTs`);
    
    // Verify the deletion
    const remainingNFTs = await prisma.nFT.count();
    console.log(`Remaining NFTs in database: ${remainingNFTs}`);
    
  } catch (error) {
    console.error('Error clearing NFTs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();