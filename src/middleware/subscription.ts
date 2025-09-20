import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require specific subscription tiers
const PROTECTED_ROUTES = {
  '/analytics': ['indie', 'plus', 'gold'],
  '/ai-mastering': ['plus', 'gold'],
  '/promotion': ['plus', 'gold'],
};

export async function middleware(request: NextRequest) {
  // Get the user's token
  const token = await getToken({ req: request });
  
  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check if the current path requires subscription
  const path = request.nextUrl.pathname;
  const requiredTiers = PROTECTED_ROUTES[path as keyof typeof PROTECTED_ROUTES];

  if (requiredTiers) {
    const userTier = token.subscriptionTier as string || 'starter';
    const userStatus = token.subscriptionStatus as string;
    
    // Check if user's subscription is active and has the required tier
    if (userStatus !== 'active' || !requiredTiers.includes(userTier)) {
      // Redirect to subscription page if user doesn't have access
      return NextResponse.redirect(new URL('/subscription', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/analytics/:path*',
    '/ai-mastering/:path*',
    '/promotion/:path*',
  ],
}; 