const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  try {
    const updatedUser = await prisma.user.update({
      where: {
        email: 'ross@xtransit.uk',
      },
      data: {
        subscriptionTier: 'plus',
        subscriptionStatus: 'active',
        subscriptionEndDate: thirtyDaysFromNow,
        aiMasteringCredits: 8,
        promotionalCredits: 50,
      },
    })
    console.log('Successfully updated user:', updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 