// Drive time and distance data between consecutive trip days
// Based on the Hey USA family RV trip itinerary (Sep 10-30, 2026)
//
// findDriveTime(from, to) accepts city names OR day IDs.
// Days within the same area (Yellowstone 3-5, Yosemite 15-17, Vegas 13, SF 19-21)
// have durationMinutes: 0 / distanceKm: 0 — local driving only.

export interface DriveTime {
  from: string            // human-readable origin (city / location)
  to: string              // human-readable destination
  durationMinutes: number // total drive time in minutes (0 = local/no long drive)
  distanceKm: number      // distance in kilometres (0 = local)
  tips: string[]          // practical driving tips
}

// ── Raw data ──────────────────────────────────────────────────────────────────

const RAW: DriveTime[] = [
  // Day 1 – arrival in Denver, no driving
  {
    from: 'Denver',
    to: 'Denver',
    durationMinutes: 0,
    distanceKm: 0,
    tips: ['יום הגעה — נחיתה בדנבר, מלון ליד נמל התעופה'],
  },

  // Day 2 – Bozeman → Gardiner (after RV pickup; DEN→BZN flight excluded)
  {
    from: 'Bozeman',
    to: 'Gardiner',
    durationMinutes: 105,
    distanceKm: 153,
    tips: [
      'לתדלק לפני יציאה מבוזמן',
      'US-89 דרום — נוף יפה לאורך נהר ילוסטון',
      'גרדינר — שער הצפון של ילוסטון',
    ],
  },

  // Day 3 – Gardiner → Canyon Village (internal Yellowstone, ~2.5h)
  {
    from: 'Gardiner',
    to: 'Canyon Village',
    durationMinutes: 0,
    distanceKm: 0,
    tips: [
      'נסיעה פנימית בתוך ילוסטון (~90 מייל / ~2.5 שעות)',
      'מגבלת מהירות 45 מייל/שעה בתוך הפארק',
    ],
  },

  // Day 4 – Canyon Village → Madison (internal Yellowstone, ~1.5h)
  {
    from: 'Canyon Village',
    to: 'Madison',
    durationMinutes: 0,
    distanceKm: 0,
    tips: [
      'נסיעה פנימית בתוך ילוסטון (~30 מייל / ~1.5 שעות)',
      'מגבלת מהירות 45 מייל/שעה בתוך הפארק',
    ],
  },

  // Day 5 – Madison → Old Faithful → Grant Village (internal, ~1.5h)
  {
    from: 'Madison',
    to: 'Grant Village',
    durationMinutes: 0,
    distanceKm: 0,
    tips: [
      'נסיעה פנימית בתוך ילוסטון (~43 מייל / ~1.5 שעות)',
      'עצירה ב-Old Faithful וב-Grand Prismatic בדרך',
    ],
  },

  // Day 6 – Grant Village → Jackson, WY (via Grand Teton / Jenny Lake)
  {
    from: 'Grant Village',
    to: 'Jackson',
    durationMinutes: 150,
    distanceKm: 120,
    tips: [
      'יציאה מהשער הדרומי של ילוסטון',
      'עצירה ב-Jenny Lake בגרנד טיטון',
      "ג'קסון — כ-30 דקות דרומה מג'ני לייק",
    ],
  },

  // Day 7 – Jackson local day, no long drive
  {
    from: 'Jackson',
    to: 'Jackson',
    durationMinutes: 0,
    distanceKm: 0,
    tips: ["יום חופשי בג'קסון — נסיעות קצרות מקומיות בלבד"],
  },

  // Day 8 – Jackson, WY → Provo/Nephi, UT (long drive south, ~6.5h)
  {
    from: 'Jackson',
    to: 'Provo',
    durationMinutes: 390,
    distanceKm: 515,
    tips: [
      'לצאת מוקדם — נסיעה של ~6.5 שעות',
      'US-89 דרום דרך Afton + Montpelier (איידהו)',
      'I-15 דרומה ליוטה',
      'עצירה לאוכל ותדלוק בדרך',
    ],
  },

  // Day 9 – Provo/Nephi → Bryce Canyon (~3.5h)
  {
    from: 'Provo',
    to: 'Bryce Canyon',
    durationMinutes: 210,
    distanceKm: 338,
    tips: [
      'I-15 דרום + US-89 דרום + UT-12 לברייס',
      'לתדלק לפני הכניסה לאזור הפארק',
      'UT-12 — אחד הכבישים היפים בעולם!',
    ],
  },

  // Day 10 – Bryce Canyon → Zion/Springdale (RV bypass via I-15, avoid tunnel)
  {
    from: 'Bryce Canyon',
    to: 'Zion',
    durationMinutes: 150,
    distanceKm: 129,
    tips: [
      'מעקף עם קרוואן: UT-20 מערבה + I-15 דרום + UT-9',
      "קרוואן מעל 11'4\" אינו יכול לעבור במנהרת זאיון — המעקף חובה",
      'Watchman Campground — להזמין 6 חודשים מראש',
    ],
  },

  // Day 11 – Zion local day, no long drive
  {
    from: 'Zion',
    to: 'Zion',
    durationMinutes: 0,
    distanceKm: 0,
    tips: [
      'יום שלם בזאיון — שאטל בתוך הפארק',
      'אסור לנהוג בקרוואן לתוך עמק זאיון',
    ],
  },

  // Day 12 – Zion/Springdale → Las Vegas (~2.75h)
  {
    from: 'Zion',
    to: 'Las Vegas',
    durationMinutes: 165,
    distanceKm: 265,
    tips: [
      'UT-9 + I-15 מערב-דרום ללאס וגאס',
      'מזג אוויר חם מאוד — לבדוק מיזוג הקרוואן',
      'RV Parks בלאס וגאס — להזמין מראש',
    ],
  },

  // Day 13 – Las Vegas local day, no long drive
  {
    from: 'Las Vegas',
    to: 'Las Vegas',
    durationMinutes: 0,
    distanceKm: 0,
    tips: ['יום חופשי בלאס וגאס — נסיעות קצרות מקומיות בלבד'],
  },

  // Day 14 – Las Vegas → Mammoth Lakes via US-395 (~5.5h)
  {
    from: 'Las Vegas',
    to: 'Mammoth Lakes',
    durationMinutes: 330,
    distanceKm: 523,
    tips: [
      'US-95 צפון + US-6 + US-395 צפון — ~5.5 שעות',
      "לתדלק ב-Bishop לפני הכניסה למאמות'",
      'עצירה ב-Lone Pine ו-Alabama Hills',
    ],
  },

  // Day 15 – Mammoth Lakes → Yosemite Valley via Tioga Pass (~3h)
  {
    from: 'Mammoth Lakes',
    to: 'Yosemite Valley',
    durationMinutes: 180,
    distanceKm: 161,
    tips: [
      'CA-203 + Tioga Road (CA-120) לעמק יוסמיטי',
      'לוודא שמעבר טיוגה פתוח לפני יציאה!',
      'עצירה ב-Tuolumne Meadows בדרך',
    ],
  },

  // Day 16 – Yosemite Valley local day, no long drive
  {
    from: 'Yosemite Valley',
    to: 'Yosemite Valley',
    durationMinutes: 0,
    distanceKm: 0,
    tips: [
      'יום שלם בעמק יוסמיטי — שאטל פנימי, ללא נסיעה ארוכה',
      'אסור לנסוע בקרוואן ב-Happy Isles',
    ],
  },

  // Day 17 – Yosemite Valley → Wawona (internal, ~1.5h)
  {
    from: 'Yosemite Valley',
    to: 'Wawona',
    durationMinutes: 0,
    distanceKm: 0,
    tips: [
      'נסיעה פנימית בתוך יוסמיטי (~35 מייל / ~1.5 שעות)',
      'Glacier Point Road + Wawona Road דרומה',
    ],
  },

  // Day 18 – Wawona → Anthony Chabot (East Bay, ~4h)
  {
    from: 'Wawona',
    to: 'Anthony Chabot',
    durationMinutes: 240,
    distanceKm: 322,
    tips: [
      'CA-41 צפון + CA-99 + I-580 מערבה',
      'תנועה כבדה ב-Bay Area בשעות שיא — לצאת לפני 14:00',
    ],
  },

  // Day 19 – Anthony Chabot → Marin RV Park (~1h)
  {
    from: 'Anthony Chabot',
    to: 'Marin',
    durationMinutes: 60,
    distanceKm: 64,
    tips: [
      'I-580 + Bay Bridge + US-101 צפון למרין',
      'תנועה אפשרית על גשר הבי — לצאת לפני 9:00 או אחרי 10:00',
    ],
  },

  // Day 20 – Marin → Cruise America SF (return RV, ~30min)
  {
    from: 'Marin',
    to: 'San Francisco',
    durationMinutes: 30,
    distanceKm: 24,
    tips: [
      'US-101 דרום + Golden Gate Bridge לתחנת Cruise America',
      'להגיע בין 9:00 ל-11:00 — שעות החזרה',
      'לרוקן מים שחורים ואפורים, לנקות ולתדלק לפני הגעה',
    ],
  },

  // Day 21 – San Francisco local day, fly home
  {
    from: 'San Francisco',
    to: 'Home',
    durationMinutes: 0,
    distanceKm: 0,
    tips: [
      'יום אחרון בסן פרנסיסקו — גשר השער הזהב, רציף 39',
      'טיסה בערב — לצאת ל-SFO לפחות 3 שעות מראש',
    ],
  },
]

// ── Day-ID → RAW index mapping ────────────────────────────────────────────────

const DAY_INDEX: Record<string, DriveTime> = {
  'day-1': RAW[0],
  'day-2': RAW[1],
  'day-3': RAW[2],
  'day-4': RAW[3],
  'day-5': RAW[4],
  'day-6': RAW[5],
  'day-7': RAW[6],
  'day-8': RAW[7],
  'day-9': RAW[8],
  'day-10': RAW[9],
  'day-11': RAW[10],
  'day-12': RAW[11],
  'day-13': RAW[12],
  'day-14': RAW[13],
  'day-15': RAW[14],
  'day-16': RAW[15],
  'day-17': RAW[16],
  'day-18': RAW[17],
  'day-19': RAW[18],
  'day-20': RAW[19],
  'day-21': RAW[20],
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Find drive time data by day ID ("day-5") or by partial city name match.
 * Returns the best matching DriveTime entry, or undefined if not found.
 */
export function findDriveTime(from: string, to: string): DriveTime | undefined {
  // 1. Try day-ID lookup on the destination then origin
  if (to in DAY_INDEX) return DAY_INDEX[to]
  if (from in DAY_INDEX) return DAY_INDEX[from]

  // 2. Fuzzy city name match (case-insensitive, partial)
  const fromLower = from.toLowerCase()
  const toLower = to.toLowerCase()

  return RAW.find(
    (d) =>
      d.from.toLowerCase().includes(fromLower) &&
      d.to.toLowerCase().includes(toLower),
  )
}

/**
 * Format minutes to a human-readable Hebrew string.
 * e.g. formatDuration(150) → "2 שעות 30 דקות"
 */
export function formatDuration(minutes: number): string {
  if (!minutes) return 'נסיעות קצרות מקומיות'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} דקות`
  if (m === 0) return `${h} שעות`
  return `${h} שעות ${m} דקות`
}

/**
 * Format kilometres to a human-readable string with both km and miles.
 * e.g. formatDistance(161) → '161 ק"מ (100 מייל)'
 */
export function formatDistance(km: number): string {
  if (!km) return 'נסיעה מקומית'
  const miles = Math.round(km * 0.621371)
  return `${km} ק"מ (${miles} מייל)`
}

// ── Legacy record (for components that iterate all entries) ───────────────────

export const DRIVE_TIMES: Record<string, DriveTime> = DAY_INDEX
