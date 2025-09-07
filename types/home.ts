export interface HeroSlide {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  cta: string
  badge: string
  stats: {
    avgRating?: string
    bookings?: string
    price?: string
  }
  order: number
  active: boolean
}

export interface Accommodation {
  id: string
  name: string
  location: string
  price: number
  rating: number
  image: string
  capacity: number
  badges?: string[]
  amenities?: string[]
}

export interface Section {
  id: string
  name: string
  title: string
  subtitle: string
  accommodations: Accommodation[]
  active: boolean
}