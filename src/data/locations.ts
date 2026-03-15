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
    id: 'los-angeles',
    name: 'Los Angeles',
    nameHe: 'לוס אנג\'לס',
    emoji: '🌴',
    gradient: 'from-orange-400 to-pink-500',
    photo: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800&q=80',
    matchPatterns: ['Los Angeles'],
    coordinates: { lat: 33.9425, lng: -118.4081 },
    type: 'city',
    summary: 'עיר המלאכים! כאן אוספים את הקרוואן ויוצאים לדרך. שווה לעצור בחוף סנטה מוניקה, לטייל בהוליווד בולוורד, ולהכין את עצמכם להרפתקה הגדולה.',
    funFact: '🤖 ידעתם? שלט ה-HOLLYWOOD המקורי נבנה ב-1923 כפרסומת לנדל"ן ונועד לעמוד רק 18 חודשים!',
  },
  {
    id: 'barstow',
    name: 'Barstow',
    nameHe: 'בארסטו',
    emoji: '🏜️',
    gradient: 'from-amber-500 to-orange-600',
    photo: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80',
    matchPatterns: ['Barstow'],
    coordinates: { lat: 34.8958, lng: -117.0173 },
    type: 'town',
    summary: 'עצירת ביניים אייקונית על כביש 66! עיירת מדבר עם אווירה של מערב פרוע. מקום מושלם לתדלק, לאכול ולצלם.',
    funFact: '🤖 ידעתם? בארסטו היא אחת מהעיירות הוותיקות ביותר על הכביש הראשי בין LA ללאס וגאס — רוט 66 המקורי!',
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
    id: 'zion',
    name: 'Zion National Park',
    nameHe: 'פארק זאיון',
    emoji: '🏔️',
    gradient: 'from-red-500 to-orange-500',
    photo: 'https://images.unsplash.com/photo-1462651567147-aa679fd1cfaf?w=800&q=80',
    matchPatterns: ['Zion'],
    coordinates: { lat: 37.2982, lng: -113.0263 },
    type: 'park',
    summary: 'הפארק הלאומי הראשון שלנו! קניונים אדומים מרהיבים, מסלולי הליכה לכל הרמות, ונהר הווירג\'ין שזורם בתוך הקניון. חובה: Angels Landing או Narrows.',
    funFact: '🤖 ידעתם? שם הפארק "ציון" ניתן לו על ידי מתיישבים מורמונים ב-1860 — הם חשבו שזה נראה כמו גן עדן!',
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
    id: 'capitol-reef',
    name: 'Capitol Reef',
    nameHe: 'קפיטול ריף',
    emoji: '🏜️',
    gradient: 'from-amber-600 to-red-500',
    photo: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=800&q=80',
    matchPatterns: ['Capitol Reef'],
    coordinates: { lat: 38.2972, lng: -111.2615 },
    type: 'park',
    summary: 'הפנינה הנסתרת של יוטה! פחות תיירים, יותר שקט ונוף. הפארק מפורסם בגשרי הסלע, הקירות הצבעוניים ומטעי הפירות ההיסטוריים.',
    funFact: '🤖 ידעתם? בפארק יש מטע פירות מתקופת המתיישבים — אפשר לקטוף תפוחים ודובדבנים בחינם (בעונה)!',
  },
  {
    id: 'moab',
    name: 'Moab',
    nameHe: 'מואב',
    emoji: '🌄',
    gradient: 'from-red-600 to-amber-500',
    photo: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80',
    matchPatterns: ['Moab', 'Canyonlands'],
    coordinates: { lat: 38.5733, lng: -109.5498 },
    type: 'town',
    summary: 'בירת ההרפתקאות של יוטה! שער הכניסה ל-Arches ול-Canyonlands. ג\'יפים, אופני הרים, ומסלולי טיול מטורפים. חובה: Delicate Arch בשקיעה.',
    funFact: '🤖 ידעתם? ב-Arches National Park יש מעל 2,000 קשתות סלע טבעיות — הריכוז הגדול בעולם!',
  },
  {
    id: 'monument-valley',
    name: 'Monument Valley',
    nameHe: 'עמק המונומנטים',
    emoji: '🏜️',
    gradient: 'from-red-700 to-orange-500',
    photo: 'https://images.unsplash.com/photo-1558216993-3f64d879ae76?w=800&q=80',
    matchPatterns: ['Monument Valley'],
    coordinates: { lat: 36.9985, lng: -110.0985 },
    type: 'scenic',
    summary: 'הנוף האיקוני של אמריקה! ביוטות אדומים ענקיים שמשתקפים מכל סרט מערבון שראיתם. שטח הנבאחו — תרבות ומסורת מרתקת.',
    funFact: '🤖 ידעתם? מוניומנט ואלי הוא לא פארק לאומי אלא שמורה של עם הנבאחו — הם מנהלים אותו בעצמם!',
  },
  {
    id: 'page',
    name: 'Page, Arizona',
    nameHe: 'פייג\', אריזונה',
    emoji: '🌊',
    gradient: 'from-blue-500 to-cyan-400',
    photo: 'https://images.unsplash.com/photo-1527549993586-dff825b37782?w=800&q=80',
    matchPatterns: ['Page'],
    coordinates: { lat: 36.9147, lng: -111.4558 },
    type: 'town',
    summary: 'כאן נמצאים שניים מהאתרים המצולמים ביותר בעולם: Antelope Canyon וההורסשו בנד. הצבעים בקניון הם פשוט לא אמיתיים!',
    funFact: '🤖 ידעתם? Antelope Canyon נוצר ע"י שיטפונות פתאומיים שחצבו את אבן החול במשך אלפי שנים — ועדיין מוצף לפעמים!',
  },
  {
    id: 'grand-canyon',
    name: 'Grand Canyon',
    nameHe: 'גרנד קניון',
    emoji: '🏞️',
    gradient: 'from-orange-600 to-red-700',
    photo: 'https://images.unsplash.com/photo-1615551043360-33de8b5f410c?w=800&q=80',
    matchPatterns: ['Grand Canyon'],
    coordinates: { lat: 36.0544, lng: -112.1401 },
    type: 'park',
    summary: 'אחד מ-7 פלאי הטבע של העולם. 1.6 קילומטר עומק, 16 קילומטר רוחב. השקיעה מהשפה הדרומית היא חוויה שלא תשכחו לעולם.',
    funFact: '🤖 ידעתם? הסלעים בתחתית הגרנד קניון בני כמעט 2 מיליארד שנה — כמעט חצי מגיל כדור הארץ!',
  },
  {
    id: 'kanab',
    name: 'Kanab',
    nameHe: 'קנאב',
    emoji: '⛰️',
    gradient: 'from-amber-500 to-red-400',
    photo: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&q=80',
    matchPatterns: ['Kanab'],
    coordinates: { lat: 37.0475, lng: -112.5263 },
    type: 'town',
    summary: 'עיירה קטנה ומקסימה על הגבול בין יוטה לאריזונה. בסיס מושלם לטיולים באזור — קרוב לגרנד קניון, זאיון וברייס.',
    funFact: '🤖 ידעתם? קנאב מכונה "ליטל הוליווד" — צולמו כאן מעל 100 סרטי מערבון בשנות ה-50 וה-60!',
  },
  {
    id: 'great-basin',
    name: 'Great Basin',
    nameHe: 'גרייט ביסין',
    emoji: '🌲',
    gradient: 'from-emerald-600 to-teal-500',
    photo: 'https://images.unsplash.com/photo-1504567961542-e24d9439a724?w=800&q=80',
    matchPatterns: ['Great Basin', 'Ely'],
    coordinates: { lat: 38.9833, lng: -114.3007 },
    type: 'park',
    summary: 'הפארק הלאומי הכי פחות מבוקר בארה"ב — וזה בדיוק הקסם שלו. מערות שיש מרהיבות, עצי Bristlecone בני 5,000 שנה, ושמים מלאי כוכבים.',
    funFact: '🤖 ידעתם? כאן גדל העץ הכי זקן בעולם — Bristlecone Pine בן 4,855 שנים, זקן מהפירמידות!',
  },
  {
    id: 'bishop',
    name: 'Bishop',
    nameHe: 'בישופ',
    emoji: '🏔️',
    gradient: 'from-sky-500 to-blue-600',
    photo: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=80',
    matchPatterns: ['Bishop'],
    coordinates: { lat: 37.3636, lng: -118.3951 },
    type: 'town',
    summary: 'עיירה קטנה ומקסימה למרגלות הרי הסיירה נבדה. נקודת עצירה מושלמת בדרך ליוסמיטי, עם נופי הרים מטורפים.',
    funFact: '🤖 ידעתם? בישופ היא בירת הטיפוס של קליפורניה — סלעי Buttermilk מושכים מטפסים מכל העולם!',
  },
  {
    id: 'mammoth-lakes',
    name: 'Mammoth Lakes',
    nameHe: 'מאמות\' לייקס',
    emoji: '🎿',
    gradient: 'from-blue-500 to-indigo-600',
    photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    matchPatterns: ['Mammoth'],
    coordinates: { lat: 37.6485, lng: -118.9721 },
    type: 'town',
    summary: 'אתר סקי מפורסם שבקיץ הופך לגן עדן של טיולים ואגמים. מעיינות חמים, אגמי הרים צלולים, ונוף וולקני מרשים.',
    funFact: '🤖 ידעתם? האגמי הרים באזור מאמות\' הם כל כך צלולים שאפשר לראות את הקרקעית ב-30 מטר עומק!',
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
    id: 'california-coast',
    name: 'California Coast',
    nameHe: 'חוף קליפורניה',
    emoji: '🌊',
    gradient: 'from-cyan-400 to-blue-500',
    photo: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800&q=80',
    matchPatterns: ['California'],
    coordinates: { lat: 36.5580, lng: -121.9233 },
    type: 'scenic',
    summary: 'כביש החוף של קליפורניה (Highway 1) — אחד הכבישים היפים בעולם. צוקים דרמטיים, אריות ים, ומפרצים טורקיזיים. נהיגה לאטלאט.',
    funFact: '🤖 ידעתם? גשר Bixby Bridge בביג סור הוא אחד הגשרים המצולמים ביותר בעולם — וגובהו 85 מטר!',
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
