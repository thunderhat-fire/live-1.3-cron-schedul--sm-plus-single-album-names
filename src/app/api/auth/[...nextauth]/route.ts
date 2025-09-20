import { authOptions } from '@/lib/auth';
import NextAuth from 'next-auth';
import { authLimiter, getRateLimitIdentifier } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

async function handler(req: NextRequest, context: any) {
  // Apply rate limiting for login attempts
  if (req.method === 'POST') {
    try {
      // Clone the request to avoid consuming the body
      const clonedReq = req.clone();
      const body = await clonedReq.text();
      const params = new URLSearchParams(body);
      const email = params.get('email');
      
      if (email) {
        const identifier = getRateLimitIdentifier(req, email);
        const { success, limit, reset, remaining } = await authLimiter.limit(identifier);
        
        if (!success) {
          return new Response(
            JSON.stringify({
              error: 'Too many login attempts. Please try again later.',
              reset,
            }),
            { 
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': reset.toString(),
              }
            }
          );
        }
      }
    } catch (error) {
      console.error('Rate limiting error:', error);
    }
  }

  // Proceed with NextAuth
  return NextAuth(req, context, authOptions);
}

export { handler as GET, handler as POST } 