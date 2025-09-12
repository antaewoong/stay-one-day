import { Metadata, Viewport } from 'next'

export const siteConfig = {
  name: "Stay One Day",
  description: "청주, 세종, 대전 지역 최고의 숙박 플랫폼. 프라이빗 독채, 풀빌라, 한옥 등 다양한 숙소를 합리적인 가격에 예약하세요.",
  url: "https://stay-oneday.com",
  ogImage: "https://stay-oneday.com/og-image.jpg",
  keywords: [
    "청주숙박", "세종숙박", "대전숙박", "충북펜션", "충남펜션",
    "풀빌라", "독채펜션", "프라이빗숙소", "한옥스테이", "가족여행",
    "커플여행", "반려견동반숙소", "키즈펜션", "바베큐펜션", "수영장펜션"
  ]
}

export function generateMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  keywords = siteConfig.keywords,
  image = siteConfig.ogImage,
  noIndex = false
}: {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  noIndex?: boolean
} = {}): Metadata {
  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    keywords: keywords.join(", "),
    authors: [{ name: "Stay One Day" }],
    creator: "Stay One Day",
    publisher: "Stay One Day",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      title,
      description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      locale: "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@StayOneDay",
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: "your-google-verification-code",
      other: {
        "naver-site-verification": "your-naver-verification-code",
      }
    }
  }
}

export function generateViewport(): Viewport {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover" // 노치 대응 풀스크린
  }
}

export function generateAccommodationMetadata({
  name,
  description,
  region,
  price,
  images,
  rating,
  reviewCount
}: {
  name: string
  description: string
  region: string
  price: number
  images: string[]
  rating: number
  reviewCount: number
}): Metadata {
  const title = `${name} - ${region} 숙소 예약 | Stay One Day`
  const metaDescription = `${name} ${region}. ${description.substring(0, 100)}... 1박 ${price.toLocaleString()}원부터. 평점 ${rating}점 (${reviewCount}개 후기)`
  
  return generateMetadata({
    title,
    description: metaDescription,
    keywords: [
      name,
      `${region}숙박`,
      `${region}펜션`,
      `${region}독채`,
      "프라이빗숙소",
      "가족여행",
      "커플여행",
      ...siteConfig.keywords
    ],
    image: images[0] || siteConfig.ogImage
  })
}

export const jsonLd = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+82-70-1234-5678",
      contactType: "customer service",
      availableLanguage: ["Korean"]
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "KR",
      addressLocality: "청주시",
      addressRegion: "충청북도"
    }
  },
  
  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/spaces?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  },

  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }),

  accommodation: (accommodation: {
    id: string
    name: string
    description: string
    region: string
    address: string
    price: number
    rating: number
    reviewCount: number
    amenities: string[]
    images: string[]
    latitude: number
    longitude: number
  }) => ({
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: accommodation.name,
    description: accommodation.description,
    url: `${siteConfig.url}/spaces/${accommodation.id}`,
    image: accommodation.images,
    address: {
      "@type": "PostalAddress",
      streetAddress: accommodation.address,
      addressLocality: accommodation.region,
      addressCountry: "KR"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: accommodation.latitude,
      longitude: accommodation.longitude
    },
    amenityFeature: accommodation.amenities.map(amenity => ({
      "@type": "LocationFeatureSpecification",
      name: amenity
    })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: accommodation.rating,
      reviewCount: accommodation.reviewCount
    },
    priceRange: `₩${accommodation.price.toLocaleString()}`,
    telephone: "+82-70-1234-5678",
    acceptsReservations: "True"
  })
}