// Pre-computed driving times between key trip destinations
// Based on Google Maps estimates for RV/Class C motorhome (add ~20% to car times)

export interface DriveTimeEntry {
  from: string
  to: string
  durationMinutes: number
  distanceKm: number
  tips: string[]
}

// Bidirectional lookup — each entry works both ways
export const DRIVE_TIMES: DriveTimeEntry[] = [
  // Denver area
  { from: 'Denver', to: 'Bozeman', durationMinutes: 600, distanceKm: 960, tips: ['נסיעה ארוכה! תעצרו להפסקות כל 2 שעות', 'I-25 צפונה ואז I-90 מערבה'] },

  // Yellowstone area
  { from: 'Bozeman', to: 'Yellowstone', durationMinutes: 120, distanceKm: 145, tips: ['כניסה צפונית דרך Gardiner'] },
  { from: 'Yellowstone', to: 'Jackson', durationMinutes: 90, distanceKm: 100, tips: ['Grand Teton בדרך — עצרו לצילומים!'] },

  // South through Utah
  { from: 'Jackson', to: 'Provo', durationMinutes: 330, distanceKm: 430, tips: ['תדלקו ב-Jackson לפני הדרך', 'נסיעה דרך Idaho — נוף מדהים'] },
  { from: 'Provo', to: 'Bryce Canyon', durationMinutes: 240, distanceKm: 370, tips: ['I-15 דרומה ואז Route 12 — אחד הכבישים היפים בארה"ב'] },
  { from: 'Bryce Canyon', to: 'Zion', durationMinutes: 100, distanceKm: 135, tips: ['Route 9 מספק נוף מטורף של מנהרות ופיתולים'] },

  // Vegas and west
  { from: 'Zion', to: 'Las Vegas', durationMinutes: 180, distanceKm: 260, tips: ['I-15 דרומה, כביש ישר ומהיר'] },
  { from: 'Las Vegas', to: 'Mammoth Lakes', durationMinutes: 360, distanceKm: 450, tips: ['US-395 צפונה — כביש מדברי מרהיב', 'תדלקו לפני היציאה מוגאס!', 'כמעט אין תחנות דלק בדרך'] },
  { from: 'Las Vegas', to: 'Grand Canyon', durationMinutes: 270, distanceKm: 440, tips: ['כ-4.5 שעות, עצרו ב-Hoover Dam בדרך'] },

  // Yosemite area
  { from: 'Mammoth Lakes', to: 'Yosemite', durationMinutes: 120, distanceKm: 100, tips: ['Tioga Pass (Route 120) — בדקו שפתוח! נסגר בשלג', 'נוף עוצר נשימה'] },
  { from: 'Yosemite', to: 'San Francisco', durationMinutes: 240, distanceKm: 310, tips: ['CA-120 מערבה ואז I-580', 'עוצרים ב-Oakdale לארוחה'] },

  // Grand Canyon connections
  { from: 'Grand Canyon', to: 'Zion', durationMinutes: 180, distanceKm: 250, tips: ['Route 89 צפונה — Vermilion Cliffs בדרך'] },
  { from: 'Grand Canyon', to: 'Bryce Canyon', durationMinutes: 270, distanceKm: 380, tips: ['עוברים דרך Kanab — עיירה חמודה להפסקה'] },

  // Bay Area
  { from: 'San Francisco', to: 'Yosemite', durationMinutes: 240, distanceKm: 310, tips: ['I-580 מזרחה ואז CA-120'] },
]

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

const ALIASES: Record<string, string> = {
  'לאס וגאס': 'las vegas',
  'וגאס': 'las vegas',
  'סן פרנסיסקו': 'san francisco',
  'sf': 'san francisco',
  'יוסמיטי': 'yosemite',
  'גרנד קניון': 'grand canyon',
  'ברייס קניון': 'bryce canyon',
  'ברייס': 'bryce canyon',
  'זאיון': 'zion',
  'ילוסטון': 'yellowstone',
  'דנבר': 'denver',
  'בוזמן': 'bozeman',
  "ג'קסון": 'jackson',
  'ג׳קסון': 'jackson',
  'פרובו': 'provo',
  'ממות לייקס': 'mammoth lakes',
  'mammoth': 'mammoth lakes',
}

function resolveAlias(name: string): string {
  const n = normalize(name)
  return ALIASES[n] || n
}

export function findDriveTime(from: string, to: string): DriveTimeEntry | null {
  const f = resolveAlias(from)
  const t = resolveAlias(to)

  for (const entry of DRIVE_TIMES) {
    const ef = normalize(entry.from)
    const et = normalize(entry.to)
    if ((ef === f && et === t) || (ef === t && et === f)) {
      // Return in requested direction
      if (ef === f) return entry
      return { ...entry, from: entry.to, to: entry.from }
    }
  }
  return null
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} דקות`
  if (m === 0) return `${h} שעות`
  return `${h} שעות ו-${m} דקות`
}

export function formatDistance(km: number): string {
  return `${km} ק"מ`
}
