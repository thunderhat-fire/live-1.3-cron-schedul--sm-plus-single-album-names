import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/test-*',
        '/maintenance',
        '/_next/',
        '/private/',
      ],
    },
    sitemap: 'https://vinylfunders.com/sitemap.xml',
  }
}
