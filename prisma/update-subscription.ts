import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

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

  console.log('Updated user:', updatedUser)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 