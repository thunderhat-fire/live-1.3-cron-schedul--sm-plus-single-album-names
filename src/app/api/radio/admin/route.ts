import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/radio/adminService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const timeRange = searchParams.get('timeRange') as '24h' | '7d' | '30d' || '7d';

    switch (action) {
      case 'metrics':
        // Get system metrics
        const metrics = await adminService.getSystemMetrics();
        return NextResponse.json({ success: true, metrics });

      case 'analytics':
        // Get radio analytics
        const analytics = await adminService.getRadioAnalytics(timeRange);
        return NextResponse.json({ success: true, analytics });

      case 'health':
        // Check system health
        const health = await adminService.checkSystemHealth();
        return NextResponse.json({ success: true, health });

      case 'actions':
        // Get admin action history
        const limit = parseInt(searchParams.get('limit') || '50');
        const actions = adminService.getAdminActions(limit);
        return NextResponse.json({ success: true, actions });

      case 'health-history':
        // Get health check history
        const healthLimit = parseInt(searchParams.get('limit') || '50');
        const healthHistory = adminService.getHealthHistory(healthLimit);
        return NextResponse.json({ success: true, healthHistory });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in admin API:', error);
    return NextResponse.json(
      { error: 'Failed to process admin request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { isAdmin: true, name: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, type, description, metadata } = body;

    if (action === 'perform') {
      // Perform admin action
      const adminAction = await adminService.performAdminAction({
        type,
        description,
        userId: session.user.id!,
        userName: user.name || session.user.email!,
        metadata,
      });

      return NextResponse.json({ 
        success: true, 
        action: adminAction,
        message: 'Admin action performed successfully' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in admin API:', error);
    return NextResponse.json(
      { error: 'Failed to process admin request' },
      { status: 500 }
    );
  }
} 