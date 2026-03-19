import type { ItineraryDay } from '@/lib/types'

export interface LocationDef {
  id: string
  name: string
  nameHe: string
  emoji: string
  gradient: string
  photo: string
  matchPatterns: string[]
  coordinates: { lat: number; lng: number }
  type: 'city' | 'park' | 'town' | 'scenic'
  /** Moti's summary of the location */
  summary?: string
  /** Short fun fact */
  funFact?: string
}

export const LOCATIONS: LocationDef[] = [
  {
    id: 'denver',
    name: 'Denver',
    nameHe: 'דנוור',
    emoji: '🏔️',
    gradient: 'from-blue-500 to-indigo-500',
    photo: 'https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=800&q=80',
    matchPatterns: ['Denver'],
    coordinates: { lat: 39.7392, lng: -104.9903 },
    type: 'city',
    summary: 'Mile High City! נקודת הנחיתה שלנו. עיר מגניבה ברגלי הרוקיס, עם אווירת הרים ובירה מקומית מעולה. חניכה קצרה לפני ההרפתקה!',
    funFact: '🤖 ידעתם? דנוור נמצאת בדיוק מייל (1,609 מטר) מעל פני הים — ובגלל הגובה הכדורים ב-Coors Field עפים יותר רחוק!',
  },
  {
    id: 'bozeman',
    name: 'Bozeman',
    nameHe: 'בוזמן',
    emoji: '🦬',
    gradient: 'from-emerald-500 to-teal-600',
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    matchPatterns: ['Bozeman', 'Gardiner'],
    coordinates: { lat: 45.6770, lng: -111.0429 },
    type: 'town',
    summary: 'שער הכניסה ליילוסטון! עיירה מקסימה במונטנה שמוקפת בהרים. כאן אוספים את הקרוואן ומתחילים את ההרפתקה הגדולה.',
    funFact: '🤖 ידעתם? גרדינר היא הכניסה היחידה ליילוסטון שפתוחה כל השנה — ושם הקשת של רוזוולט מ-1903!',
  },
  {
    id: 'yellowstone',
    name: 'Yellowstone',
    nameHe: 'ילוסטון',
    emoji: '🌋',
    gradient: 'from-yellow-500 to-orange-600',
    photo: 'https://images.unsplash.com/photo-1533419790775-85dff57b5a3e?w=800&q=80',
    matchPatterns: ['Yellowstone'],
    coordinates: { lat: 44.4280, lng: -110.5885 },
    type: 'park',
    summary: 'הפארק הלאומי הראשון בעולם! גייזרים, מעיינות חמים בצבעי קשת, דובי גריזלי, ביזונים — מקום שנראה כאילו הוא מכוכב אחר.',
    funFact: '🤖 ידעתם? יילוסטון יושב על סופר-וולקנו ענק! Old Faithful פולט 30,000 ליטר מים רותחים כל 90 דקות כבר מאות שנים!',
  },
  {
    id: 'grand-teton',
    name: 'Grand Teton',
    nameHe: 'גרנד טיטון',
    emoji: '🏔️',
    gradient: 'from-sky-500 to-blue-700',
    photo: 'https://images.unsplash.com/photo-1536183922588-166604504d5e?w=800&q=80',
    matchPatterns: ['Grand Teton', 'Teton'],
    coordinates: { lat: 43.7904, lng: -110.6818 },
    type: 'park',
    summary: 'הפסגות הכי דרמטיות ברוקיס! ההרים עולים ישר מהעמק, אגמים צלולים כמראה, ולוסים שמסתובבים ברחוב. טבע פראי בשיאו.',
    funFact: '🤖 ידעתם? רכס הטיטון קיבל את שמו מציידי פרוות צרפתיים ב-1800 — והשם אומר... בואו נגיד שהם היו יצירתיים 😏',
  },
  {
    id: 'jackson',
    name: 'Jackson',
    nameHe: "ג'קסון",
    emoji: '🤠',
    gradient: 'from-amber-500 to-yellow-600',
    photo: 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=800&q=80',
    matchPatterns: ['Jackson'],
    coordinates: { lat: 43.4799, lng: -110.7624 },
    type: 'town',
    summary: "עיירה של קאובויים אמיתיים! כיכר עם שערי קרניים של אייל, גונדולה לפסגת ההר, ראפטינג על הנחל, ושוקולד חם מטורף.",
    funFact: "🤖 ידעתם? לג'קסון הול יש את הקשתות המפורסמות מקרניים של אלק — כל קשת עשויה מאלפי קרניים שנושרות באביב!",
  },
  {
    id: 'bryce-canyon',
    name: 'Bryce Canyon',
    nameHe: 'ברייס קניון',
    emoji: '🪨',
    gradient: 'from-orange-500 to-red-600',
    photo: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800&q=80',
    matchPatterns: ['Bryce'],
    coordinates: { lat: 37.5930, lng: -112.1871 },
    type: 'park',
    summary: 'עמודי הודו (Hoodoos) — תצורות סלע מדהימות שנראות כאילו הגיעו מכוכב אחר. הזריחה כאן היא מהמרהיבות בעולם!',
    funFact: '🤖 ידעתם? ברייס קניון הוא לא באמת קניון — הוא אמפיתיאטר טבעי ענק שנשחק ע"י גשם וקרח לאורך מיליוני שנים!',
  },
  {
    id: 'zion',
    name: 'Zion National Park',
    nameHe: 'פארק זאיון',
    emoji: '🏔️',
    gradient: 'from-red-500 to-orange-500',
    photo: 'https://images.unsplash.com/photo-1462651567147-aa679fd1cfaf?w=800&q=80',
    matchPatterns: ['Zion'],
    coordinates: { lat: 37.2982, lng: -113.0263 },
    type: 'park',
    summary: 'קניונים אדומים מרהיבים, מסלולי הליכה לכל הרמות, ונהר הווירג\'ין שזורם בתוך הקניון. חובה: Angels Landing או Narrows.',
    funFact: '🤖 ידעתם? שם הפארק "ציון" ניתן לו על ידי מתיישבים מורמונים ב-1860 — הם חשבו שזה נראה כמו גן עדן!',
  },
  {
    id: 'las-vegas',
    name: 'Las Vegas',
    nameHe: 'לאס וגאס',
    emoji: '🎰',
    gradient: 'from-purple-500 to-pink-500',
    photo: 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800&q=80',
    matchPatterns: ['Las Vegas'],
    coordinates: { lat: 36.1699, lng: -115.1398 },
    type: 'city',
    summary: 'הנה, ויגאס! גם עם ילדים יש פה מלא מה לעשות — שואו של Cirque du Soleil, הרצפת זכוכית ב-Stratosphere, ומדבר נבדה ממש מעבר לפינה.',
    funFact: '🤖 ידעתם? לאס וגאס צורכת כמות חשמל שיכולה להאיר את כל תל אביב פי 3 — והכל במדבר!',
  },
  {
    id: 'mammoth-lakes',
    name: 'Mammoth Lakes',
    nameHe: "מאמות' לייקס",
    emoji: '🎿',
    gradient: 'from-blue-500 to-indigo-600',
    photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    matchPatterns: ['Mammoth'],
    coordinates: { lat: 37.6485, lng: -118.9721 },
    type: 'town',
    summary: 'אתר סקי מפורסם שבקיץ הופך לגן עדן של טיולים ואגמים. מעיינות חמים, אגמי הרים צלולים, ונוף וולקני מרשים.',
    funFact: "🤖 ידעתם? האגמי הרים באזור מאמות' הם כל כך צלולים שאפשר לראות את הקרקעית ב-30 מטר עומק!",
  },
  {
    id: 'yosemite',
    name: 'Yosemite',
    nameHe: 'יוסמיטי',
    emoji: '🌿',
    gradient: 'from-green-600 to-emerald-500',
    photo: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80',
    matchPatterns: ['Yosemite'],
    coordinates: { lat: 37.7490, lng: -119.5885 },
    type: 'park',
    summary: 'אחד הפארקים הלאומיים המפורסמים בעולם! מפלי ענק, צוקים מרשימים, ועצי סקויה עתיקים. El Capitan ו-Half Dome — האייקונים של קליפורניה.',
    funFact: '🤖 ידעתם? מפל יוסמיטי הוא המפל הגבוה ביותר בצפון אמריקה — 739 מטר, כמעט פי 7 ממפלי הניאגרה!',
  },
  {
    id: 'san-francisco',
    name: 'San Francisco',
    nameHe: 'סן פרנסיסקו',
    emoji: '🌉',
    gradient: 'from-red-500 to-orange-400',
    photo: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
    matchPatterns: ['San Francisco'],
    coordinates: { lat: 37.7749, lng: -122.4194 },
    type: 'city',
    summary: 'העיר האחרונה בטיול! גשר הזהב, הרכבלים, רציף הדייגים ואלקטרז. עיר עם אופי מיוחד, ערפל מפורסם ואוכל מדהים.',
    funFact: '🤖 ידעתם? כבלי הרכבלים של סן פרנסיסקו הם מערכת התחבורה האחרונה מסוגה בעולם — ופועלים מאז 1873!',
  },
]

/** Get a location by ID */
export function getLocationById(id: string): LocationDef | undefined {
  return LOCATIONS.find((l) => l.id === id)
}

/** Get matching locations for a city string (e.g. "Las Vegas → Zion National Park") */
export function getLocationsForCity(city?: string): LocationDef[] {
  if (!city) return []
  return LOCATIONS.filter((loc) =>
    loc.matchPatterns.some((pattern) => city.includes(pattern)),
  )
}

/** Get the primary location for a city string (first match) */
export function getPrimaryLocationForCity(city?: string): LocationDef | undefined {
  return getLocationsForCity(city)[0]
}

/** Get all itinerary days that match a given location */
export function getDaysForLocation(locationId: string, days: ItineraryDay[]): ItineraryDay[] {
  const location = getLocationById(locationId)
  if (!location) return []
  return days.filter((day) =>
    location.matchPatterns.some((pattern) => day.city?.includes(pattern)),
  )
}

/** Get date range for a location across all matching days */
export function getLocationDateRange(locationId: string, days: ItineraryDay[]): { start: string; end: string } | null {
  const matchingDays = getDaysForLocation(locationId, days)
  if (matchingDays.length === 0) return null
  return {
    start: matchingDays[0].date,
    end: matchingDays[matchingDays.length - 1].date,
  }
}
