import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { migrateUsersToTierLists } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    console.log('🚀 Starting Brevo user migration...');
    const result = await migrateUsersToTierLists();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Migration completed successfully!`,
        details: {
          totalUsers: result.totalUsers,
          successCount: result.successCount,
          errorCount: result.errorCount
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 