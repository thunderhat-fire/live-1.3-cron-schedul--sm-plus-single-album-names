import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Add logging to see what DATABASE_URL is being used
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 20) + '...');
}

export const prisma = global.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;

// Export a function to test the connection
export async function testPrismaConnection() {
  try {
    console.log('Testing Prisma connection...');
    await prisma.$connect();
    const userCount = await prisma.user.count();
    console.log('Database connection test successful. User count:', userCount);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
} 