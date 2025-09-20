import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'ross@xtransit.uk';
  const newPassword = 'admin123'; // We'll set this as a temporary password

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        isAdmin: true,
        name: true
      }
    });

    if (!user) {
      console.error('User not found');
      return;
    }

    console.log('Found user:', {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      name: user.name
    });

    // Hash and update the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        isAdmin: true // Ensure admin status
      }
    });

    console.log('Updated user credentials.');
    console.log('You can now login with:');
    console.log('Email:', email);
    console.log('Password:', newPassword);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 