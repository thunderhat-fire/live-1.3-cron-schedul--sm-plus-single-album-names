const { PrismaClient } = require('@prisma/client');

async function fixThresholdStatusCase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Fixing threshold status case (UPPERCASE -> lowercase)...');
    
    // Find all thresholds with uppercase status values
    const thresholdsToFix = await prisma.presaleThreshold.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'FAILED' },
          { status: 'REACHED' },
          { status: 'PROCESSING' },
          { status: 'COMPLETED' }
        ]
      },
      include: {
        nft: true
      }
    });
    
    console.log(`📊 Found ${thresholdsToFix.length} thresholds with uppercase status`);
    
    for (const threshold of thresholdsToFix) {
      const oldStatus = threshold.status;
      const newStatus = oldStatus.toLowerCase();
      
      console.log(`🔄 "${threshold.nft.name}": ${oldStatus} -> ${newStatus}`);
      
      await prisma.presaleThreshold.update({
        where: { id: threshold.id },
        data: { status: newStatus }
      });
    }
    
    console.log(`✅ Fixed ${thresholdsToFix.length} threshold status values`);
    
  } catch (error) {
    console.error('❌ Error fixing threshold status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixThresholdStatusCase();
