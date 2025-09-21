import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Fetch NFT data for metadata
    const nft = await prisma.nFT.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        sideATracks: true,
        sideBTracks: true,
        presaleThreshold: true,
      },
    })

    if (!nft) {
      return {
        title: 'NFT Not Found | VinylFunders',
        description: 'The vinyl presale you are looking for could not be found.',
      }
    }

    // Calculate presale status
    const isPresaleCompleted = nft.presaleThreshold && 
      (nft.presaleThreshold.status === 'completed' || 
       nft.presaleThreshold.status === 'reached' ||
       nft.presaleThreshold.currentOrders >= nft.presaleThreshold.targetOrders)
    
    const isPresaleTimeEnded = nft.endDate && new Date(nft.endDate) < new Date()
    const showAsDigital = nft.isVinylPresale ? (isPresaleCompleted || isPresaleTimeEnded) : true
    
    // Calculate pricing based on record size
    let vinylPrice: number
    if (nft.recordSize === '7 inch') {
      vinylPrice = 13 // Fixed price for 7-inch records
    } else {
      // 12-inch tiered pricing
      vinylPrice = 26
      if (nft.targetOrders === 200) vinylPrice = 22
      if (nft.targetOrders === 500) vinylPrice = 20
    }
    
    const price = showAsDigital ? '13.00' : vinylPrice.toString()
    const formatType = showAsDigital ? 'Digital Edition' : 'Vinyl Presale'
    
    // Build metadata
    const title = `${nft.name} by ${nft.user.name || 'Independent Artist'} | VinylFunders`
    const description = `${nft.description || `Discover ${nft.name}, a ${nft.genre || 'music'} album available as ${formatType.toLowerCase()}.`} 
Genre: ${nft.genre || 'Music'} | Record Size: ${nft.recordSize || '12 inch'} | Price: £${price} | Artist: ${nft.user.name || 'Independent Artist'}`
    
    const imageUrl = nft.sideAImage || nft.sideBImage || '/placeholder-thumbnail.jpg'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vinylfunders.com'
    const pageUrl = `${baseUrl}/nft-detail/${nft.id}`

    // Count total tracks
    const totalTracks = (nft.sideATracks?.length || 0) + (nft.sideBTracks?.length || 0)

    return {
      title,
      description,
      keywords: [
        'vinyl presale',
        'independent music',
        nft.genre || 'music',
        nft.recordSize || '12 inch vinyl',
        'music album',
        'vinyl record',
        nft.user.name || 'independent artist',
        nft.name,
        formatType.toLowerCase()
      ],
      authors: [{ name: nft.user.name || 'Independent Artist' }],
      creator: nft.user.name || 'Independent Artist',
      publisher: 'VinylFunders',
      openGraph: {
        title,
        description,
        url: pageUrl,
        siteName: 'VinylFunders',
        images: [
          {
            url: imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`,
            width: 800,
            height: 800,
            alt: `${nft.name} album cover`,
          },
        ],
        locale: 'en_US',
        type: 'music.album',
        // Music-specific OpenGraph properties
        // @ts-ignore - These are valid OG music properties
        'music:musician': nft.user.name || 'Independent Artist',
        'music:album': nft.name,
        'music:release_date': nft.createdAt.toISOString().split('T')[0],
        'music:duration': totalTracks > 0 ? '180' : undefined, // Approximate duration
        'product:price:amount': price,
        'product:price:currency': 'GBP',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`],
        creator: '@vinylfunders',
      },
      other: {
        'fb:app_id': process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
        'music:album': nft.name,
        'music:musician': nft.user.name || 'Independent Artist',
        'product:price:amount': price,
        'product:price:currency': 'GBP',
        'product:availability': showAsDigital ? 'in stock' : 'preorder',
        'product:condition': 'new',
        'product:category': 'Music > Albums',
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
      },
    }
  } catch (error) {
    console.error('Error generating metadata for NFT:', error)
    return {
      title: 'Vinyl Presale | VinylFunders',
      description: 'Discover and support vinyl presales from independent artists on VinylFunders.',
    }
  }
}
