/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "vinylfunders.com",
      },
      {
        protocol: "https",
        hostname: "vinylfunders-media.s3.eu-central-1.wasabisys.com",
      },
      {
        protocol: "https",
        hostname: "vinylfunders-media.s3.eu-west-1.wasabisys.com",
      },
    ],
  },
  experimental: {
    scrollRestoration: true,
  },
  sassOptions: {
    includePaths: ['./src/styles'],
  },
  async headers() {
    return [
      // Allow camera/mic ONLY on /live
      {
        source: '/live/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(), payment=()'
          }
        ]
      },
      // Webhook endpoints - no strict headers to prevent 307 redirects
      {
        source: '/api/webhooks/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self'",
              "style-src 'self'",
              "img-src 'self' data:",
              "connect-src 'self'",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
          // Note: No Strict-Transport-Security for webhooks to prevent 307 redirects
        ]
      },
      // Restrict everywhere else (NO Permissions-Policy here)
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://conversations-widget.brevo.com https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com https://m.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://js.stripe.com",
              "font-src 'self' 'data:' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob: https://js.stripe.com",
              "media-src 'self' https: blob: https://res.cloudinary.com https://vinylfunders-media.s3.eu-central-1.wasabisys.com https://vinylfunders-media.s3.eu-west-1.wasabisys.com",
              "connect-src 'self' https://conversations-widget.brevo.com https://api.brevo.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com wss://vinylfunders-gdqiiai0.livekit.cloud https://vinylfunders-gdqiiai0.livekit.cloud https://api.stripe.com https://m.stripe.com",
              "frame-src 'self' https://www.youtube.com https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'"
            ].join('; ')
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Strict Transport Security
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
