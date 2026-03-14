import { LOCATIONS } from '@/data/locations'

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  accommodation: ['hotel', 'hostel', 'airbnb', 'booking', 'מלון', 'לינה', 'camp', 'rv park', 'motel'],
  flights: ['flight', 'טיסה', 'airline', 'boarding', 'eticket', 'e-ticket', 'itinerary'],
  car_rental: ['car rental', 'cruise america', 'rv', 'rental', 'השכרת רכב', 'קרוואן'],
  attractions: ['ticket', 'כרטיס', 'entrance', 'pass', 'disney', 'national park', 'yosemite', 'grand canyon', 'zion'],
  insurance: ['insurance', 'ביטוח', 'policy', 'פוליסה'],
  passport: ['passport', 'דרכון'],
  visa: ['visa', 'ויזה', 'esta'],
  medical: ['medical', 'רפואי', 'doctor', 'prescription', 'תרופות'],
}

export interface SuggestedMeta {
  category?: string
  locationId?: string
}

export function suggestDocumentMeta(title: string): SuggestedMeta {
  const lower = title.toLowerCase()
  const result: SuggestedMeta = {}

  // Match category
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      result.category = category
      break
    }
  }

  // Match location
  for (const loc of LOCATIONS) {
    if (loc.matchPatterns.some((pattern) => lower.includes(pattern.toLowerCase()))) {
      result.locationId = loc.id
      break
    }
  }

  return result
}
