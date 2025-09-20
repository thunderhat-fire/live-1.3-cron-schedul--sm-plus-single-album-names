'use client'

import { useEffect } from 'react'

export default function OrganizationStructuredData() {
  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "VinylFunders",
      "description": "Join VinylFunders to discover and fund vinyl presales from independent artists. We handle pressing, packing and posting directly to your fans.",
      "url": "https://vinylfunders.com",
      "logo": "https://vinylfunders.com/images/og-image.png",
      "sameAs": [
        "https://facebook.com/vinylfunders",
        "https://twitter.com/vinylfunders",
        "https://instagram.com/vinylfunders"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+44-20-XXXX-XXXX",
        "contactType": "customer service",
        "email": "support@vinylfunders.com",
        "availableLanguage": "English"
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "GB",
        "addressLocality": "London"
      },
      "foundingDate": "2024",
      "founders": [
        {
          "@type": "Person",
          "name": "VinylFunders Team"
        }
      ],
      "numberOfEmployees": "1-10",
      "industry": "Music Technology",
      "keywords": "vinyl presale, independent artists, music crowdfunding, vinyl records, music platform, artist funding, vinyl pressing, music community, limited edition vinyl",
      "serviceArea": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": "51.5074",
          "longitude": "-0.1278"
        },
        "geoRadius": "global"
      },
      "makesOffer": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Vinyl Presale Platform",
            "description": "Platform for artists to run vinyl presale campaigns and for fans to discover and fund vinyl releases"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Vinyl Pressing Services",
            "description": "Full-service vinyl pressing, packaging, and distribution for independent artists"
          }
        }
      ]
    }

    // Remove existing organization structured data
    const existingScript = document.querySelector('script[data-type="organization-structured-data"]')
    if (existingScript) {
      existingScript.remove()
    }

    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-type', 'organization-structured-data')
    script.textContent = JSON.stringify(structuredData)
    document.head.appendChild(script)

    return () => {
      const scriptElement = document.querySelector('script[data-type="organization-structured-data"]')
      if (scriptElement) {
        scriptElement.remove()
      }
    }
  }, [])

  return null
}
