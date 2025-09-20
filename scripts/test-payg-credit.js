const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addPayAsYouGoCredit() {
  try {
    console.log('🔍 Finding user with email ross@soundonshape.com...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'ross@soundonshape.com' },
      select: { 
        id: true, 
        email: true, 
        subscriptionTier: true,
        payAsYouGoCredits: true 
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 Current user data:', user);

    // Add 1 pay-as-you-go credit
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        payAsYouGoCredits: {
          increment: 1
        }
      },
      select: { 
        id: true, 
        email: true, 
        subscriptionTier: true,
        payAsYouGoCredits: true 
      }
    });

    console.log('✅ Updated user data:', updatedUser);
    console.log('🎉 Added 1 pay-as-you-go credit!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPayAsYouGoCredit();
