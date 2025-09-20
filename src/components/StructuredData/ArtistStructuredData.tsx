'use client'

import { useEffect } from 'react'

interface NFTSummary {
  id: string
  name: string
  createdAt: string
  genre?: string
}

interface ArtistUser {
  id: string
  name?: string
  email: string
  bio?: string
  website?: string
  facebook?: string
  twitter?: string
  tiktok?: string
  image?: string
  recordLabel?: string
  recordLabelImage?: string
  createdAt: string
  updatedAt: string
  subscriptionTier: string
  nfts: NFTSummary[]
}

interface ArtistStructuredDataProps {
  artist: ArtistUser
}

export default function ArtistStructuredData({ artist }: ArtistStructuredDataProps) {
  useEffect(() => {
    if (!artist) return

    // Create albums/works list
    const albums = artist.nfts?.map(nft => ({
      "@type": "MusicAlbum",
      "name": nft.name,
      "url": `https://vinylfunders.com/nft-detail/${nft.id}`,
      "dateCreated": nft.createdAt,
      "genre": nft.genre || "Music",
      "byArtist": {
        "@type": "MusicGroup",
        "name": artist.name || "Unknown Artist"
      }
    })) || []

    // Build social media profiles
    const sameAs = []
    if (artist.website) sameAs.push(artist.website)
    if (artist.facebook) sameAs.push(artist.facebook)
    if (artist.twitter) sameAs.push(artist.twitter)
    if (artist.tiktok) sameAs.push(artist.tiktok)

    // Determine artist type and genre based on albums
    const genres = artist.nfts?.map(nft => nft.genre).filter((genre): genre is string => Boolean(genre)) || []
    const uniqueGenres = Array.from(new Set(genres))

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "MusicGroup",
      "name": artist.name || "Independent Artist",
      "alternateName": artist.recordLabel || undefined,
      "description": artist.bio || `${artist.name || 'Independent artist'} creating music on VinylFunders. Discover their vinyl releases and support independent music.`,
      "url": `https://vinylfunders.com/author/${artist.id}`,
      "image": artist.image || artist.recordLabelImage || "https://vinylfunders.com/images/placeholder-avatar.png",
      "sameAs": sameAs.length > 0 ? sameAs : undefined,
      "foundingDate": artist.createdAt,
      "genre": uniqueGenres.length > 0 ? uniqueGenres : ["Music"],
      "recordLabel": artist.recordLabel ? {
        "@type": "Organization",
        "name": artist.recordLabel,
        "image": artist.recordLabelImage
      } : undefined,
      "album": albums,
      "track": albums.flatMap(album => ({
        "@type": "MusicRecording",
        "name": album.name,
        "byArtist": {
          "@type": "MusicGroup",
          "name": artist.name || "Unknown Artist"
        },
        "inAlbum": album
      })),
      "memberOf": {
        "@type": "Organization",
        "name": "VinylFunders",
        "url": "https://vinylfunders.com",
        "description": "Platform for independent artists to run vinyl presale campaigns"
      },
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Platform",
          "value": "VinylFunders"
        },
        {
          "@type": "PropertyValue",
          "name": "Member Since",
          "value": new Date(artist.createdAt).getFullYear().toString()
        },
        {
          "@type": "PropertyValue",
          "name": "Total Albums",
          "value": artist.nfts?.length.toString() || "0"
        },
        {
          "@type": "PropertyValue",
          "name": "Subscription Tier",
          "value": artist.subscriptionTier
        }
      ],
      "mainEntity": {
        "@type": "ProfilePage",
        "dateCreated": artist.createdAt,
        "dateModified": artist.updatedAt,
        "mainEntity": {
          "@type": "Person",
          "name": artist.name || "Independent Artist",
          "description": artist.bio,
          "image": artist.image,
          "email": artist.email,
          "url": `https://vinylfunders.com/author/${artist.id}`
        }
      },
      "potentialAction": [
        {
          "@type": "FollowAction",
          "target": `https://vinylfunders.com/author/${artist.id}`,
          "name": `Follow ${artist.name || 'this artist'}`
        },
        {
          "@type": "ListenAction",
          "target": `https://vinylfunders.com/author/${artist.id}/created`,
          "name": `Listen to ${artist.name || 'this artist'}'s music`
        }
      ]
    }

    // Add contact information if website is available
    if (artist.website || artist.email) {
      (structuredData as any).contactPoint = {
        "@type": "ContactPoint",
        "contactType": "fan mail",
        "email": artist.email,
        "url": artist.website
      }
    }

    // Remove existing artist structured data for this artist
    const existingScript = document.querySelector(`script[data-type="artist-structured-data"][data-artist-id="${artist.id}"]`)
    if (existingScript) {
      existingScript.remove()
    }

    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-type', 'artist-structured-data')
    script.setAttribute('data-artist-id', artist.id)
    script.textContent = JSON.stringify(structuredData)
    document.head.appendChild(script)

    return () => {
      const scriptElement = document.querySelector(`script[data-type="artist-structured-data"][data-artist-id="${artist.id}"]`)
      if (scriptElement) {
        scriptElement.remove()
      }
    }
  }, [artist])

  return null
}
