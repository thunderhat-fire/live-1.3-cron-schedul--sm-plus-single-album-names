import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Redis credentials are not properly configured');
}

// Create a new Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Create a new ratelimiter that allows 5 requests per minute for auth
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/auth',
});

// Rate limiter for API endpoints (100 requests per minute)
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/api',
});

// Rate limiter for file uploads – presale creation can need up to ~20 files (10 tracks + artwork + previews)
// Allow 30 uploads per hour to give headroom while still preventing abuse.
export const uploadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 h'),
  analytics: true,
  prefix: '@upstash/ratelimit/upload',
});

// Rate limiter for contact forms (5 submissions per hour)
export const contactLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: true,
  prefix: '@upstash/ratelimit/contact',
});

// Helper function to get client IP from request
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return '127.0.0.1';
}

// Helper function to create a unique identifier for rate limiting
export function getRateLimitIdentifier(request: Request, identifier?: string): string {
  const clientIP = getClientIP(request);
  return identifier ? `${clientIP}:${identifier}` : clientIP;
} 