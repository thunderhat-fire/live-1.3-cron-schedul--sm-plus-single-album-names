import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Default settings
const DEFAULT_SETTINGS = {
  minPrice: 0.01,
  maxPrice: 1000000,
  commissionRate: 2.5,
  maintenanceMode: false,
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return default settings
    // In the future, you can store these in the database
    return NextResponse.json(DEFAULT_SETTINGS);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await request.json();

    // Validate settings
    if (typeof settings.minPrice !== 'number' || settings.minPrice < 0) {
      return NextResponse.json(
        { error: 'Invalid minimum price' },
        { status: 400 }
      );
    }

    if (typeof settings.maxPrice !== 'number' || settings.maxPrice < settings.minPrice) {
      return NextResponse.json(
        { error: 'Invalid maximum price' },
        { status: 400 }
      );
    }

    if (typeof settings.commissionRate !== 'number' || settings.commissionRate < 0 || settings.commissionRate > 100) {
      return NextResponse.json(
        { error: 'Invalid commission rate' },
        { status: 400 }
      );
    }

    if (typeof settings.maintenanceMode !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid maintenance mode setting' },
        { status: 400 }
      );
    }

    // For now, just return success
    // In the future, you can store these in the database
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
} 