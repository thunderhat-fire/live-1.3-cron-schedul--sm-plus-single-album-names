import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = 'admin123'; // You should change this
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        isAdmin: true,
      },
      create: {
        email,
        password: hashedPassword,
        name: 'Admin User',
        isAdmin: true,
      },
    });

    console.log('Admin user created/updated:', {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 