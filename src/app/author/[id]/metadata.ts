import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Fetch user data for metadata
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        website: true,
        facebook: true,
        twitter: true,
        tiktok: true,
        subscriptionTier: true,
        recordLabel: true,
        recordLabelImage: true,
        createdAt: true,
        updatedAt: true,
        nfts: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            name: true,
            genre: true,
            createdAt: true,
            sideAImage: true,
            viewCount: true,
            favoritesCount: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Latest 10 for metadata
        },
      },
    })

    if (!user) {
      return {
        title: 'Artist Not Found | VinylFunders',
        description: 'The artist profile you are looking for could not be found.',
      }
    }

    // Build artist metadata
    const artistName = user.name || 'Independent Artist'
    const albumCount = user.nfts?.length || 0
    const genres = Array.from(new Set(user.nfts?.map(nft => nft.genre).filter(Boolean))) || []
    const totalViews = user.nfts?.reduce((sum, nft) => sum + (nft.viewCount || 0), 0) || 0
    const totalLikes = user.nfts?.reduce((sum, nft) => sum + (nft.favoritesCount || 0), 0) || 0
    
    // Get representative image
    const artistImage = user.image || user.recordLabelImage || 
                       user.nfts?.find(nft => nft.sideAImage)?.sideAImage || 
                       '/images/placeholder-avatar.png'

    const title = `${artistName} - Independent Music Artist | VinylFunders`
    const description = user.bio || 
      `Discover ${artistName}'s music on VinylFunders. ${albumCount > 0 ? 
        `Listen to ${albumCount} album${albumCount > 1 ? 's' : ''} ${genres.length > 0 ? `spanning ${genres.join(', ')}` : ''}.` : 
        'Independent artist creating music on VinylFunders.'} ${user.recordLabel ? `Record Label: ${user.recordLabel}.` : ''} Support independent music and discover vinyl presales.`

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vinylfunders.com'
    const pageUrl = `${baseUrl}/author/${user.id}`
    const fullImageUrl = artistImage.startsWith('http') ? artistImage : `${baseUrl}${artistImage}`

    // Build social links array
    const socialLinks = [
      user.website,
      user.facebook,
      user.twitter,
      user.tiktok,
    ].filter(Boolean)

    return {
      title,
      description,
      keywords: [
        'independent artist',
        'music artist',
        'vinyl presale',
        artistName,
        ...(genres.length > 0 ? genres : ['music']),
        'independent music',
        'artist profile',
        user.recordLabel || 'independent',
        'music discovery',
        'vinyl records'
      ],
      authors: [{ name: artistName }],
      creator: artistName,
      publisher: 'VinylFunders',
      openGraph: {
        title,
        description,
        url: pageUrl,
        siteName: 'VinylFunders',
        images: [
          {
            url: fullImageUrl,
            width: 800,
            height: 800,
            alt: `${artistName} profile photo`,
          },
        ],
        locale: 'en_US',
        type: 'profile',
        // Profile-specific OpenGraph properties
        // @ts-ignore - These are valid OG profile properties
        'profile:first_name': artistName.split(' ')[0] || artistName,
        'profile:last_name': artistName.split(' ').slice(1).join(' ') || '',
        'profile:username': artistName.toLowerCase().replace(/\s+/g, ''),
        // Music-specific properties
        'music:musician': artistName,
        'music:album': user.nfts?.[0]?.name,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [fullImageUrl],
        creator: '@vinylfunders',
      },
      other: {
        'fb:app_id': process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
        'music:musician': artistName,
        'profile:first_name': artistName.split(' ')[0] || artistName,
        'profile:last_name': artistName.split(' ').slice(1).join(' ') || '',
        'artist:genre': genres.join(', ') || 'Music',
        'artist:album_count': albumCount.toString(),
        'artist:total_views': totalViews.toString(),
        'artist:record_label': user.recordLabel || 'Independent',
        'artist:member_since': new Date(user.createdAt).getFullYear().toString(),
        'artist:subscription_tier': user.subscriptionTier || 'starter',
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      alternates: {
        canonical: pageUrl,
        ...(socialLinks.length > 0 && {
          types: {
            'application/rss+xml': `${pageUrl}/feed`,
          },
        }),
      },
    }
  } catch (error) {
    console.error('Error generating metadata for artist:', error)
    return {
      title: 'Independent Artist | VinylFunders',
      description: 'Discover independent music artists and support vinyl presales on VinylFunders.',
    }
  }
}
