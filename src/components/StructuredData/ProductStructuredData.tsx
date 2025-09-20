'use client'

import { useEffect } from 'react'

interface Track {
  id: string
  name: string
  url: string
  duration: number
  side: string
  isrc?: string
}

interface NFTProduct {
  id: string
  name: string
  description?: string
  genre?: string
  recordSize?: string
  recordLabel?: string
  price: number
  endDate?: string
  sideAImage?: string
  sideBImage?: string
  createdAt: string
  updatedAt: string
  isVinylPresale: boolean
  targetOrders: number
  currentOrders: number
  viewCount: number
  favoritesCount: number
  user: {
    name?: string
    image?: string
    id: string
  }
  sideATracks: Track[]
  sideBTracks: Track[]
  presaleThreshold?: {
    status: string
    targetOrders: number
    currentOrders: number
  }
}

interface ProductStructuredDataProps {
  nft: NFTProduct
}

export default function ProductStructuredData({ nft }: ProductStructuredDataProps) {
  useEffect(() => {
    if (!nft) return

    // Calculate availability and stock status
    const isPresaleCompleted = nft.presaleThreshold?.status === 'completed' || 
                              (nft.presaleThreshold?.currentOrders >= nft.presaleThreshold?.targetOrders) ||
                              (nft.currentOrders >= nft.targetOrders)
    const isPresaleTimeEnded = nft.endDate && new Date(nft.endDate) < new Date()
    const isAvailable = nft.isVinylPresale ? !isPresaleCompleted && !isPresaleTimeEnded : true

    // Determine product condition and format
    const productFormat = isPresaleCompleted || isPresaleTimeEnded ? "Digital Download" : "Vinyl Record"
    const availability = isAvailable ? "https://schema.org/PreOrder" : "https://schema.org/InStock"

    // Calculate ratings based on engagement
    const engagementScore = Math.min(5, Math.max(1, 
      (nft.favoritesCount * 0.5 + nft.viewCount * 0.01) / 10
    ))

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": nft.name,
      "description": nft.description || `${nft.name} - ${productFormat} by ${nft.user.name || 'Independent Artist'}`,
      "image": nft.sideAImage || nft.sideBImage || "https://vinylfunders.com/placeholder-thumbnail.jpg",
      "url": `https://vinylfunders.com/nft-detail/${nft.id}`,
      "sku": nft.id,
      "gtin": nft.id, // Using NFT ID as identifier
      "brand": {
        "@type": "Brand",
        "name": nft.recordLabel || nft.user.name || "Independent"
      },
      "manufacturer": {
        "@type": "Organization",
        "name": "VinylFunders",
        "url": "https://vinylfunders.com"
      },
      "category": "Music & Audio > Music > Albums",
      "productID": nft.id,
      "dateCreated": nft.createdAt,
      "releaseDate": nft.createdAt,
      "keywords": [
        "vinyl record",
        "music album",
        "independent music",
        nft.genre || "music",
        "vinyl presale",
        "limited edition"
      ].filter(Boolean).join(", "),
      "offers": {
        "@type": "Offer",
        "price": nft.price.toString(),
        "priceCurrency": "GBP",
        "availability": availability,
        "itemCondition": "https://schema.org/NewCondition",
        "seller": {
          "@type": "Person",
          "name": nft.user.name || "Independent Artist",
          "url": `https://vinylfunders.com/author/${nft.user.id}`
        },
        "url": `https://vinylfunders.com/nft-detail/${nft.id}`,
        "validFrom": nft.createdAt,
        ...(nft.endDate && { "validThrough": nft.endDate }),
        "priceValidUntil": nft.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "0",
            "currency": "GBP"
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 8,
              "maxValue": 12,
              "unitCode": "WEE"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 1,
              "maxValue": 3,
              "unitCode": "DAY"
            }
          }
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": engagementScore.toFixed(1),
        "ratingCount": Math.max(1, nft.favoritesCount),
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": nft.favoritesCount > 0 ? [{
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": Math.ceil(engagementScore),
          "bestRating": "5"
        },
        "author": {
          "@type": "Organization",
          "name": "VinylFunders Community"
        },
        "reviewBody": `Highly rated by ${nft.favoritesCount} music enthusiasts on VinylFunders.`
      }] : undefined,
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Format",
          "value": productFormat
        },
        {
          "@type": "PropertyValue",
          "name": "Record Size",
          "value": nft.recordSize || "12 inch"
        },
        {
          "@type": "PropertyValue",
          "name": "Genre",
          "value": nft.genre || "Music"
        },
        {
          "@type": "PropertyValue",
          "name": "Pressing Target",
          "value": nft.targetOrders.toString()
        },
        {
          "@type": "PropertyValue",
          "name": "Current Pre-orders",
          "value": nft.currentOrders.toString()
        },
        {
          "@type": "PropertyValue",
          "name": "Limited Edition",
          "value": "true"
        },
        {
          "@type": "PropertyValue",
          "name": "Artist",
          "value": nft.user.name || "Independent Artist"
        }
      ],
      "isRelatedTo": {
        "@type": "MusicAlbum",
        "name": nft.name,
        "byArtist": {
          "@type": "MusicGroup",
          "name": nft.user.name || "Independent Artist"
        }
      },
      "hasPart": [
        ...(nft.sideATracks || []).map((track, index) => ({
          "@type": "MusicRecording",
          "name": track.name,
          "position": index + 1,
          "duration": `PT${Math.floor(track.duration / 60)}M${track.duration % 60}S`
        })),
        ...(nft.sideBTracks || []).map((track, index) => ({
          "@type": "MusicRecording", 
          "name": track.name,
          "position": (nft.sideATracks?.length || 0) + index + 1,
          "duration": `PT${Math.floor(track.duration / 60)}M${track.duration % 60}S`
        }))
      ],
      "audience": {
        "@type": "Audience",
        "audienceType": "Music Enthusiasts, Vinyl Collectors, Independent Music Supporters"
      }
    }

    // Add availability details for presales
    if (nft.isVinylPresale && !isPresaleCompleted) {
      structuredData.offers.advanceBookingRequirement = {
        "@type": "QuantitativeValue",
        "minValue": nft.currentOrders,
        "maxValue": nft.targetOrders,
        "unitText": "pre-orders needed for production"
      }
    }

    // Remove existing product structured data for this NFT
    const existingScript = document.querySelector(`script[data-type="product-structured-data"][data-nft-id="${nft.id}"]`)
    if (existingScript) {
      existingScript.remove()
    }

    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-type', 'product-structured-data')
    script.setAttribute('data-nft-id', nft.id)
    script.textContent = JSON.stringify(structuredData)
    document.head.appendChild(script)

    return () => {
      const scriptElement = document.querySelector(`script[data-type="product-structured-data"][data-nft-id="${nft.id}"]`)
      if (scriptElement) {
        scriptElement.remove()
      }
    }
  }, [nft])

  return null
}
