import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://vinylfunders.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/collection`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/help-center`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/seller-guide`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/buyer-protection`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/upload-item`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/data-protection`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ]

  try {
    // Get all published NFTs (albums)
    const nfts = await prisma.nFT.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Get all active users with NFTs (artists)
    const artists = await prisma.user.findMany({
      where: {
        nfts: {
          some: {
            isDeleted: false,
          },
        },
      },
      select: {
        id: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Generate NFT pages
    const nftPages: MetadataRoute.Sitemap = nfts.map((nft) => ({
      url: `${baseUrl}/nft-detail/${nft.id}`,
      lastModified: nft.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Generate artist pages
    const artistPages: MetadataRoute.Sitemap = artists.map((artist) => ({
      url: `${baseUrl}/author/${artist.id}`,
      lastModified: artist.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Generate artist created pages
    const artistCreatedPages: MetadataRoute.Sitemap = artists.map((artist) => ({
      url: `${baseUrl}/author/${artist.id}/created`,
      lastModified: artist.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    return [...staticPages, ...nftPages, ...artistPages, ...artistCreatedPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static pages only if there's an error with dynamic content
    return staticPages
  }
}
