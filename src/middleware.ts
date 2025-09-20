import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of paths that should be accessible during maintenance mode
const ALLOWED_PATHS = [
  '/_next',
  '/images',
  '/api/health', // Add a health check endpoint if needed
  '/maintenance'
];

// List of IPs that can bypass maintenance mode (for testing)
const ALLOWED_IPS = process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : [];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const { pathname } = request.nextUrl;
  
  // Check if we're in maintenance mode
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  
  // If we're not in maintenance mode, proceed as normal
  if (!isMaintenanceMode) {
    // Add security headers to all responses
    const response = NextResponse.next();
    
    // Additional security headers that can be set in middleware
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Download-Options', 'noopen');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    
    return response;
  }

  // Check if user is admin
  if (token?.isAdmin) {
    return NextResponse.next();
  }

  // Check if the path should be allowed during maintenance
  const isAllowedPath = ALLOWED_PATHS.some(path => pathname.startsWith(path));
  if (isAllowedPath) {
    return NextResponse.next();
  }

  // Check if the request is already for the maintenance page
  if (pathname === '/maintenance') {
    return NextResponse.next();
  }

  // Check for allowed IPs
  const clientIP = request.headers.get('x-real-ip') || 
                  request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  '';
  const isAllowedIP = ALLOWED_IPS.includes(clientIP);
  if (isAllowedIP) {
    console.log('Maintenance mode bypassed by IP:', clientIP);
    return NextResponse.next();
  }

  // Redirect all other requests to the maintenance page
  return NextResponse.rewrite(new URL('/maintenance', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next (Next.js internals)
     * 2. /api/health (health check endpoints)
     * 3. /images (static files)
     * 4. /_next/static (static files)
     * 5. /_next/image (image optimization files)
     */
    '/((?!_next/static|_next/image|images|api/health).*)',
  ],
} 