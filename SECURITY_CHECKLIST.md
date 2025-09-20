# Security Checklist for VinylFunders

## Environment Variables Required

### Critical Security Variables
- `JWT_SECRET` - Must be a strong, random string (at least 32 characters)
- `NEXTAUTH_SECRET` - Must be a strong, random string (at least 32 characters)
- `NEXTAUTH_URL` - Your production domain (e.g., https://vinylfunders.com)

### Database
- `DATABASE_URL` - PostgreSQL connection string

### Authentication & Rate Limiting
- `UPSTASH_REDIS_REST_URL` - Redis URL for rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Redis token for rate limiting

### External Services
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `LIVEKIT_API_KEY` - LiveKit API key
- `LIVEKIT_API_SECRET` - LiveKit API secret

### Email Services
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `SMTP_FROM` - From email address
- `CONTACT_EMAIL` - Contact form recipient email

### Optional Features
- `MAINTENANCE_MODE` - Set to 'true' to enable maintenance mode
- `ALLOWED_IPS` - Comma-separated list of IPs that can bypass maintenance mode

## Security Headers Implemented

✅ Content Security Policy (CSP)
✅ X-Frame-Options: DENY
✅ X-Content-Type-Options: nosniff
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ X-XSS-Protection: 1; mode=block
✅ Permissions-Policy
✅ Strict-Transport-Security (HSTS)
✅ X-DNS-Prefetch-Control: off
✅ X-Download-Options: noopen
✅ X-Permitted-Cross-Domain-Policies: none

## Rate Limiting

✅ Authentication: 5 requests per minute
✅ API endpoints: 100 requests per minute
✅ File uploads: 10 uploads per hour
✅ Contact forms: 5 submissions per hour

## File Upload Security

✅ File type validation
✅ File size limits (100MB audio, 10MB images)
✅ Rate limiting on uploads
✅ Authentication required

## API Security

✅ Session-based authentication
✅ Admin role verification
✅ Input validation with Zod
✅ Rate limiting
✅ CORS properly configured

## Authentication Security

✅ bcrypt password hashing
✅ JWT token verification
✅ Session management
✅ Password reset functionality
✅ Rate limiting on auth endpoints

## Database Security

✅ Prisma ORM with parameterized queries
✅ User input validation
✅ Proper error handling

## Recommendations for Production

1. **Generate Strong Secrets**: Use a secure random generator for JWT_SECRET and NEXTAUTH_SECRET
2. **Enable HTTPS**: Ensure all traffic is encrypted
3. **Database Security**: Use connection pooling and enable SSL
4. **Monitoring**: Set up logging and monitoring for security events
5. **Backup**: Regular database backups
6. **Updates**: Keep all dependencies updated
7. **Environment**: Use different secrets for development and production

## Security Testing

- [ ] Run security audit: `npm audit`
- [ ] Test rate limiting
- [ ] Verify authentication flows
- [ ] Test file upload restrictions
- [ ] Check for XSS vulnerabilities
- [ ] Verify CSRF protection
- [ ] Test admin access controls

## Emergency Procedures

1. **Security Breach**: Immediately rotate all secrets and keys
2. **Rate Limit Abuse**: Monitor and adjust limits as needed
3. **File Upload Abuse**: Review and tighten restrictions
4. **Database Compromise**: Restore from backup and rotate credentials 