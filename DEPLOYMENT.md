# Deployment Guide - VinylFunders

## 🚀 Environment Variables Setup

### **Required for All Environments**

```bash
# Authentication & Security
NEXTAUTH_SECRET=your-random-32-char-string
JWT_SECRET=your-random-32-char-string

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@vinylfunders.com
CONTACT_EMAIL=support@vinylfunders.com

# Rate Limiting
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# LiveKit (for live streaming)
LIVEKIT_API_KEY=your-livekit-key
LIVEKIT_API_SECRET=your-livekit-secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url

# ElevenLabs (for TTS)
ELEVENLABS_API_KEY=your-elevenlabs-key

# Brevo (for email lists and transactional emails)
BREVO_API_KEY=your-brevo-key
BREVO_SENDER_NAME="Vinyl Funders"
BREVO_SENDER_EMAIL=no-reply@vinylfunders.co.uk
```

### **Environment-Specific Variables**

#### **🔧 Development (.env.local)**
```bash
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000  # Optional - auto-detected
```

#### **🎭 Render (Preview/Staging)**
```bash
NODE_ENV=production
# NEXTAUTH_URL is auto-detected from RENDER_EXTERNAL_URL
# No need to set manually
```

#### **🌍 Production (vinylfunders.com)**
```bash
NODE_ENV=production
NEXTAUTH_URL=https://vinylfunders.com  # Optional - will fallback to this
```

## 📋 **Render Deployment Steps**

### **1. Environment Variables in Render**

Go to your service → **Environment** tab and add:

**Critical Variables:**
- `NEXTAUTH_SECRET` ⚠️ Generate with: `openssl rand -base64 32`
- `JWT_SECRET` ⚠️ Generate with: `openssl rand -base64 32`
- `DATABASE_URL` ⚠️ Your PostgreSQL connection string
- `STRIPE_SECRET_KEY` ⚠️ Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` ⚠️ Your Stripe webhook endpoint secret

**Auto-Detected Variables (No Need to Set):**
- `NEXTAUTH_URL` - Automatically uses `RENDER_EXTERNAL_URL`
- `NODE_ENV` - Automatically set to `production`

### **2. Build Configuration**

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

### **3. Domain Configuration**

1. **Custom Domain**: Add `vinylfunders.com` in Render settings
2. **SSL**: Enable automatic SSL certificates
3. **Redirects**: Set up www → non-www redirects if needed

## 🔄 **NEXTAUTH_URL Automatic Detection**

The app now automatically detects the correct URL:

1. **If `NEXTAUTH_URL` is set** → Uses that value
2. **If on Render** → Uses `RENDER_EXTERNAL_URL`
3. **If on Vercel** → Uses `VERCEL_URL`
4. **Production fallback** → Uses `https://vinylfunders.com`
5. **Development fallback** → Uses `http://localhost:3000`

## ⚠️ **Common Issues & Solutions**

### **Sign Out Redirects to Localhost**
- **Cause**: `NEXTAUTH_URL` set to localhost
- **Solution**: Update to production URL or remove (auto-detected)

### **Authentication Errors**
- **Cause**: Missing or incorrect `NEXTAUTH_SECRET`
- **Solution**: Generate with `openssl rand -base64 32`

### **Database Connection Issues**
- **Cause**: Incorrect `DATABASE_URL`
- **Solution**: Check PostgreSQL connection string format

### **Stripe Webhook Failures**
- **Cause**: Incorrect `STRIPE_WEBHOOK_SECRET`
- **Solution**: Get from Stripe Dashboard → Webhooks → Your endpoint

## 🔧 **Testing Deployment**

### **Check Environment Detection:**
```bash
# Add this to any page for debugging:
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('RENDER_EXTERNAL_URL:', process.env.RENDER_EXTERNAL_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
```

### **Test Authentication Flow:**
1. Sign in on deployed site
2. Sign out - should stay on deployed domain
3. Check redirect URLs in browser dev tools

## 📱 **Production Checklist**

- [ ] All environment variables set
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Database migrations run
- [ ] Stripe webhooks configured with production URL
- [ ] Email SMTP tested
- [ ] Authentication flow tested
- [ ] File uploads working (Cloudinary)
- [ ] Rate limiting active (Upstash)

## 🚨 **Security Notes**

- Never commit `.env` files to git
- Use strong, unique secrets for production
- Rotate API keys regularly
- Monitor failed authentication attempts
- Set up proper CORS for production domain 