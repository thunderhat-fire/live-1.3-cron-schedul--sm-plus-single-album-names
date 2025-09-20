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

interface NFT {
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
  previewAudioUrl?: string
  user: {
    name?: string
    image?: string
    id: string
  }
  sideATracks: Track[]
  sideBTracks: Track[]
}

interface AlbumStructuredDataProps {
  nft: NFT
}

export default function AlbumStructuredData({ nft }: AlbumStructuredDataProps) {
  useEffect(() => {
    if (!nft) return

    // Combine all tracks from both sides
    const allTracks = [...(nft.sideATracks || []), ...(nft.sideBTracks || [])]
    
    // Create track list for structured data
    const trackList = allTracks.map((track, index) => ({
      "@type": "MusicRecording",
      "name": track.name,
      "position": index + 1,
      "duration": `PT${Math.floor(track.duration / 60)}M${track.duration % 60}S`,
      "isrcCode": track.isrc,
      "byArtist": {
        "@type": "MusicGroup",
        "name": nft.user.name || "Unknown Artist",
        "url": `https://vinylfunders.com/author/${nft.user.id}`
      },
      "inAlbum": {
        "@type": "MusicAlbum",
        "name": nft.name
      }
    }))

    // Calculate release type based on presale status
    const isPresaleCompleted = nft.currentOrders >= nft.targetOrders
    const isPresaleTimeEnded = nft.endDate && new Date(nft.endDate) < new Date()
    const availableFormat = isPresaleCompleted || isPresaleTimeEnded ? "Digital" : "Vinyl Presale"

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "MusicAlbum",
      "name": nft.name,
      "description": nft.description || `${nft.name} - A vinyl album available for presale on VinylFunders`,
      "url": `https://vinylfunders.com/nft-detail/${nft.id}`,
      "image": nft.sideAImage || nft.sideBImage || "https://vinylfunders.com/placeholder-thumbnail.jpg",
      "genre": nft.genre || "Music",
      "albumProductionType": "StudioAlbum",
      "albumReleaseType": "AlbumRelease",
      "recordLabel": nft.recordLabel || nft.user.name || "Independent",
      "byArtist": {
        "@type": "MusicGroup",
        "name": nft.user.name || "Unknown Artist",
        "url": `https://vinylfunders.com/author/${nft.user.id}`,
        "image": nft.user.image
      },
      "dateCreated": nft.createdAt,
      "dateModified": nft.updatedAt,
      "numTracks": allTracks.length,
      "track": trackList,
      "offers": [
        {
          "@type": "Offer",
          "price": nft.price.toString(),
          "priceCurrency": "GBP",
          "availability": isPresaleCompleted || isPresaleTimeEnded ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
          "itemCondition": "https://schema.org/NewCondition",
          "format": availableFormat,
          "seller": {
            "@type": "Organization",
            "name": "VinylFunders",
            "url": "https://vinylfunders.com"
          },
          "url": `https://vinylfunders.com/nft-detail/${nft.id}`,
          "validFrom": nft.createdAt,
          ...(nft.endDate && { "validThrough": nft.endDate })
        }
      ],
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Record Size",
          "value": nft.recordSize || "12 inch"
        },
        {
          "@type": "PropertyValue",
          "name": "Pressing Target",
          "value": nft.targetOrders.toString()
        },
        {
          "@type": "PropertyValue",
          "name": "Current Orders",
          "value": nft.currentOrders.toString()
        },
        {
          "@type": "PropertyValue",
          "name": "Format Type",
          "value": nft.isVinylPresale ? "Vinyl Presale" : "Digital Release"
        }
      ],
      "mainEntity": {
        "@type": "Product",
        "name": nft.name,
        "description": nft.description || `${nft.name} - Vinyl Album`,
        "category": "Music Album",
        "brand": {
          "@type": "Brand",
          "name": nft.recordLabel || nft.user.name || "Independent"
        },
        "manufacturer": {
          "@type": "Organization",
          "name": "VinylFunders",
          "url": "https://vinylfunders.com"
        }
      }
    }

    // Add preview audio if available
    if (nft.previewAudioUrl) {
      structuredData.audio = {
        "@type": "AudioObject",
        "contentUrl": nft.previewAudioUrl,
        "encodingFormat": "audio/mpeg",
        "name": `${nft.name} - Preview`
      }
    }

    // Remove existing album structured data for this NFT
    const existingScript = document.querySelector(`script[data-type="album-structured-data"][data-nft-id="${nft.id}"]`)
    if (existingScript) {
      existingScript.remove()
    }

    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-type', 'album-structured-data')
    script.setAttribute('data-nft-id', nft.id)
    script.textContent = JSON.stringify(structuredData)
    document.head.appendChild(script)

    return () => {
      const scriptElement = document.querySelector(`script[data-type="album-structured-data"][data-nft-id="${nft.id}"]`)
      if (scriptElement) {
        scriptElement.remove()
      }
    }
  }, [nft])

  return null
}
