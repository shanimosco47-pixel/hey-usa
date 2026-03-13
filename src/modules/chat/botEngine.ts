// מוטי — AI-powered cynical travel advisor
// Uses Claude API via Supabase Edge Function, with keyword fallback
// Now with ACTIONS — Moti can modify site data!

import { supabase } from '@/lib/supabase'
import type { MotiAction } from '@/contexts/TripDataContext'
import { EXPENSE_CATEGORIES } from '@/lib/constants'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface BotResponse {
  text: string
  actions: MotiAction[]
}

export const BOT_NAME = 'מוטי'
export const BOT_SUBTITLE = 'יועץ טיולים ציני (מופעל ע"י AI)'

// ─── Category Mapping (Hebrew → key) ───────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  'טיסות': 'flights',
  'טיסה': 'flights',
  'לינה': 'accommodation',
  'מלון': 'accommodation',
  'אירוח': 'accommodation',
  'אוכל': 'food',
  'מזון': 'food',
  'תחבורה': 'transport',
  'הסעות': 'transport',
  'רכב': 'transport',
  'אטרקציות': 'attractions',
  'כרטיסים': 'attractions',
  'קניות': 'shopping',
  'שופינג': 'shopping',
  'תקשורת': 'communication',
  'סים': 'communication',
  'ביטוח': 'insurance',
  'אחר': 'other',
}

const CATEGORY_LABELS: Record<string, string> = {}
for (const [heb, key] of Object.entries(CATEGORY_MAP)) {
  if (!CATEGORY_LABELS[key]) CATEGORY_LABELS[key] = heb
}
// Also add from EXPENSE_CATEGORIES
for (const [key, { label }] of Object.entries(EXPENSE_CATEGORIES)) {
  CATEGORY_LABELS[key] = label
}

// ─── Day mapping ───────────────────────────────────────────────────

const DAY_MAP: Record<string, string> = {}
for (let i = 1; i <= 20; i++) {
  DAY_MAP[`יום ${i}`] = `day-${i}`
  DAY_MAP[`day ${i}`] = `day-${i}`
  DAY_MAP[`${i}`] = `day-${i}`
}

// ─── Action Parser ─────────────────────────────────────────────────

function extractNumber(text: string): number | null {
  // Match numbers with commas or plain: 3,000 or 3000
  const match = text.match(/(\d[\d,]*)/g)
  if (!match) return null
  // Take the last number (usually the value, not part of a category)
  for (let i = match.length - 1; i >= 0; i--) {
    const num = Number(match[i].replace(/,/g, ''))
    if (num > 0) return num
  }
  return null
}

function findCategory(text: string): string | null {
  const lower = text.toLowerCase()
  for (const [heb, key] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(heb)) return key
  }
  return null
}

function findDayId(text: string): string | null {
  const lower = text.toLowerCase()
  for (const [pattern, id] of Object.entries(DAY_MAP)) {
    if (lower.includes(pattern)) return id
  }
  // Also match dates like "11 בספטמבר" → day-1, "12 בספטמבר" → day-2, etc.
  const dateMatch = lower.match(/(\d{1,2})\s*(בספט|ספט|\/9|\.9)/)
  if (dateMatch) {
    const dayOfMonth = Number(dateMatch[1])
    const dayIndex = dayOfMonth - 10 // Sept 11 = day 1
    if (dayIndex >= 1 && dayIndex <= 20) return `day-${dayIndex}`
  }
  return null
}

export function parseActions(message: string): MotiAction[] {
  const lower = message.trim()
  const actions: MotiAction[] = []

  // ── Budget category update ──────────────────────────────────────
  // "תעדכן/שנה/עדכן את תקציב הביטוח ל-3000"
  // "תקציב ביטוח 3000"
  const budgetUpdatePatterns = [
    /(?:תעדכן|עדכן|שנה|תשנה|הגדר|תגדיר|קבע|תקבע)\s.*?תקציב\s.*?(?:ה)?(טיסות|טיסה|לינה|מלון|אירוח|אוכל|מזון|תחבורה|הסעות|רכב|אטרקציות|כרטיסים|קניות|שופינג|תקשורת|סים|ביטוח|אחר)\s.*?(?:ל[-\s]?)?(\d[\d,]*)/,
    /(?:תעדכן|עדכן|שנה|תשנה|הגדר|תגדיר|קבע|תקבע)\s.*?(?:ה)?(טיסות|טיסה|לינה|מלון|אירוח|אוכל|מזון|תחבורה|הסעות|רכב|אטרקציות|כרטיסים|קניות|שופינג|תקשורת|סים|ביטוח|אחר)\s.*?(?:ל[-\s]?)?(\d[\d,]*)/,
    /תקציב\s+(?:ה)?(טיסות|טיסה|לינה|מלון|אירוח|אוכל|מזון|תחבורה|הסעות|רכב|אטרקציות|כרטיסים|קניות|שופינג|תקשורת|סים|ביטוח|אחר)\s.*?(?:ל[-\s]?)?(\d[\d,]*)/,
    /(?:ה)?(טיסות|טיסה|לינה|מלון|אירוח|אוכל|מזון|תחבורה|הסעות|רכב|אטרקציות|כרטיסים|קניות|שופינג|תקשורת|סים|ביטוח|אחר)\s.*?תקציב\s.*?(?:ל[-\s]?)?(\d[\d,]*)/,
  ]

  for (const pattern of budgetUpdatePatterns) {
    const match = lower.match(pattern)
    if (match) {
      const category = CATEGORY_MAP[match[1]]
      const amount = Number(match[2].replace(/,/g, ''))
      if (category && amount > 0) {
        actions.push({ type: 'UPDATE_BUDGET_CATEGORY', category, amount })
        return actions
      }
    }
  }

  // ── Total budget update ─────────────────────────────────────────
  // "תעדכן את התקציב הכולל ל-60000"
  const totalBudgetMatch = lower.match(
    /(?:תעדכן|עדכן|שנה|תשנה|הגדר|תגדיר|קבע|תקבע)\s.*?תקציב\s+(?:ה)?כולל\s.*?(?:ל[-\s]?)?(\d[\d,]*)/,
  )
  if (totalBudgetMatch) {
    const amount = Number(totalBudgetMatch[1].replace(/,/g, ''))
    if (amount > 0) {
      actions.push({ type: 'UPDATE_TOTAL_BUDGET', amount })
      return actions
    }
  }

  // ── Daily budget update ─────────────────────────────────────────
  const dailyBudgetMatch = lower.match(
    /(?:תעדכן|עדכן|שנה|תשנה|הגדר|תגדיר|קבע|תקבע)\s.*?תקציב\s+(?:ה)?יומי\s.*?(?:ל[-\s]?)?(\d[\d,]*)/,
  )
  if (dailyBudgetMatch) {
    const amount = Number(dailyBudgetMatch[1].replace(/,/g, ''))
    if (amount > 0) {
      actions.push({ type: 'UPDATE_DAILY_BUDGET', amount })
      return actions
    }
  }

  // ── Generic budget category detection (simpler patterns) ────────
  // "ביטוח 3000" or "שנה ביטוח ל-3000"
  if (/(?:תעדכן|עדכן|שנה|תשנה|הגדר|תגדיר|קבע|תקבע)/.test(lower)) {
    const category = findCategory(lower)
    const amount = extractNumber(lower)
    if (category && amount && amount > 0) {
      actions.push({ type: 'UPDATE_BUDGET_CATEGORY', category, amount })
      return actions
    }
  }

  // ── Add stop to itinerary ───────────────────────────────────────
  // "תוסיף עצירה ביום 3: ביקור במוזיאון"
  const addStopMatch = lower.match(
    /(?:תוסיף|הוסף|תכניס|הכנס)\s+(?:עצירה|תחנה|פעילות|אטרקציה)\s+(?:ב)?(יום\s+\d+|\d{1,2}\s*בספט)/,
  )
  if (addStopMatch) {
    const dayId = findDayId(lower)
    if (dayId) {
      // Extract the description after the day reference
      const afterDay = lower.split(/יום\s+\d+|\d{1,2}\s*בספט/)[1] || ''
      const title = afterDay.replace(/^[\s:—\-]+/, '').trim() || 'עצירה חדשה'
      actions.push({
        type: 'ADD_ITINERARY_STOP',
        dayId,
        stop: { title, category: 'activity' },
      })
      return actions
    }
  }

  // ── Update itinerary day notes ──────────────────────────────────
  // "תוסיף הערה ליום 5: לזכור לקחת מים"
  const notesMatch = lower.match(
    /(?:תוסיף|הוסף|תעדכן|עדכן)\s+(?:הערה|הערות|פתק)\s+(?:ל|ב)?(יום\s+\d+|\d{1,2}\s*בספט)/,
  )
  if (notesMatch) {
    const dayId = findDayId(lower)
    if (dayId) {
      const afterDay = lower.split(/יום\s+\d+|\d{1,2}\s*בספט/)[1] || ''
      const notes = afterDay.replace(/^[\s:—\-]+/, '').trim() || ''
      if (notes) {
        actions.push({ type: 'UPDATE_ITINERARY_DAY_NOTES', dayId, notes })
        return actions
      }
    }
  }

  return actions
}

// ─── AI Engine ──────────────────────────────────────────────────────

let conversationHistory: ChatMessage[] = []
const MAX_HISTORY = 20

export function resetConversation() {
  conversationHistory = []
}

export async function getBotResponseAsync(userMessage: string): Promise<BotResponse> {
  // First, check for actions in the message
  const actions = parseActions(userMessage)

  // Add user message to history
  conversationHistory.push({ role: 'user', content: userMessage })
  if (conversationHistory.length > MAX_HISTORY) {
    conversationHistory = conversationHistory.slice(-MAX_HISTORY)
  }

  // If we detected actions, generate a confirmation response
  if (actions.length > 0) {
    const confirmText = generateActionConfirmation(actions)
    conversationHistory.push({ role: 'assistant', content: confirmText })
    return { text: confirmText, actions }
  }

  // Try AI
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('moti-chat', {
        body: { messages: conversationHistory },
      })

      if (!error && data?.text) {
        const assistantMessage = data.text as string
        conversationHistory.push({ role: 'assistant', content: assistantMessage })
        return { text: assistantMessage, actions: [] }
      }
      console.warn('Supabase function error, falling back to keywords:', error)
    } catch (err) {
      console.warn('AI request failed, falling back to keywords:', err)
    }
  }

  // Fallback to keyword engine
  const fallbackText = getKeywordResponse(userMessage)
  conversationHistory.push({ role: 'assistant', content: fallbackText })
  return { text: fallbackText, actions: [] }
}

// ─── Action Confirmation Messages ──────────────────────────────────

function generateActionConfirmation(actions: MotiAction[]): string {
  const parts: string[] = []

  for (const action of actions) {
    switch (action.type) {
      case 'UPDATE_BUDGET_CATEGORY': {
        const label = CATEGORY_LABELS[action.category] || action.category
        parts.push(
          `בוצע! עדכנתי את תקציב **${label}** ל-**₪${action.amount.toLocaleString()}**. ✅\n\nתבדקו בעמוד התקציב — הכל מעודכן שם.`,
        )
        break
      }
      case 'UPDATE_TOTAL_BUDGET':
        parts.push(
          `בוצע! עדכנתי את **התקציב הכולל** ל-**₪${action.amount.toLocaleString()}**. ✅\n\nמקווה שמצאתם עוד כסף מתחת לספה.`,
        )
        break
      case 'UPDATE_DAILY_BUDGET':
        parts.push(
          `בוצע! עדכנתי את **התקציב היומי** ל-**₪${action.amount.toLocaleString()}**. ✅`,
        )
        break
      case 'ADD_EXPENSE':
        parts.push(
          `בוצע! הוספתי הוצאה חדשה: **${action.expense.title}** בסך **₪${action.expense.amount.toLocaleString()}**. ✅`,
        )
        break
      case 'UPDATE_ITINERARY_DAY_NOTES':
        parts.push(
          `בוצע! עדכנתי את ההערות ל-**${action.dayId.replace('day-', 'יום ')}**. ✅\n\nתבדקו בלוח הזמנים.`,
        )
        break
      case 'ADD_ITINERARY_STOP':
        parts.push(
          `בוצע! הוספתי עצירה חדשה ל-**${action.dayId.replace('day-', 'יום ')}**: **${action.stop.title}**. ✅\n\nתבדקו בלוח הזמנים — הכל מעודכן.`,
        )
        break
    }
  }

  return parts.join('\n\n') + '\n\nעוד משהו לעדכן? אני פה. 😏'
}

// ─── Keyword Fallback Engine ────────────────────────────────────────

const TRIP = {
  dates: '11-30 בספטמבר 2026',
  duration: '20 יום',
  route: 'תל אביב → לוס אנג\'לס → דיסנילנד → לאס וגאס → גרנד קניון → זאיון → יוסמיטי → סן פרנסיסקו → תל אביב',
  flights: {
    outbound: 'El Al LY001, TLV→LAX, 11 בספטמבר 2026',
    return: 'SFO→TLV, 30 בספטמבר 2026',
  },
  rv: 'Cruise America Class C, איסוף LAX 12/9, החזרה SFO 28/9',
  family: '5 בני משפחה: אבא, אמא, ילד 1, ילד 2, ילד 3',
  budget: {
    total: '50,000 ₪',
    flights: '14,000 ₪',
    accommodation: '12,000 ₪',
    food: '6,000 ₪',
    transport: '5,000 ₪',
    attractions: '5,000 ₪',
    shopping: '4,000 ₪',
    insurance: '2,000 ₪',
    daily: '2,500 ₪',
  },
}

const OPENERS = [
  'אוקיי, שאלת את מוטי — אז תקבל את האמת.',
  'טוב, בוא נדבר תכלס.',
  'אהה, שאלה מעולה. ואני אומר את זה בלי אירוניה. טוב, אולי קצת.',
  'שנייה, מסדר את המשקפיים של היועץ...',
  'מוטי פה. יאללה, לעניין.',
  'אוף, חשבתי שלא תשאלו לעולם.',
]

const CLOSERS = [
  'עוד שאלות? אני פה, לא שיש לי ברירה. 😏',
  'תודו שאני שווה כל שקל. אה רגע, אני בחינם.',
  'בבקשה, בלי תשלום. הפעם.',
  'מוטי לשירותכם. 24/7. כי אין לי חיים.',
]

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function wrap(body: string): string {
  return `${randomPick(OPENERS)}\n\n${body}\n\n${randomPick(CLOSERS)}`
}

interface MatchRule {
  keywords: string[]
  response: () => string
}

const rules: MatchRule[] = [
  {
    keywords: ['ביטוח', 'insurance'],
    response: () => wrap(
      `ביטוח נסיעות — תזמינו **לפחות חודש לפני** הטיסה. יש לכם תקציב של ${TRIP.budget.insurance} לביטוח.\n\n` +
      `כמה טיפים ממוטי:\n` +
      `• קנו ביטוח עם כיסוי רפואי של לפחות $1M — אמריקה זו לא קופת חולים\n` +
      `• וודאו שהביטוח מכסה פעילות אתגרית (הייקינג בגרנד קניון זה לא טיול בפארק הירקון)\n` +
      `• שמרו את הפוליסה בנייד + עותק מודפס\n` +
      `• שימו לב שהביטוח מכסה את כל 5 בני המשפחה\n\n` +
      `💡 *רוצים לעדכן את תקציב הביטוח? כתבו: "עדכן תקציב ביטוח ל-3000"*`
    ),
  },
  {
    keywords: ['תקציב', 'כסף', 'budget', 'עלות', 'מחיר'],
    response: () => wrap(
      `התקציב הכולל: **${TRIP.budget.total}**\n\n` +
      `הנה הפירוט (תחזיקו חזק):\n` +
      `✈️ טיסות: ${TRIP.budget.flights}\n` +
      `🏨 לינה: ${TRIP.budget.accommodation}\n` +
      `🍔 אוכל: ${TRIP.budget.food}\n` +
      `🚗 תחבורה: ${TRIP.budget.transport}\n` +
      `🎢 אטרקציות: ${TRIP.budget.attractions}\n` +
      `🛍️ קניות: ${TRIP.budget.shopping}\n` +
      `🛡️ ביטוח: ${TRIP.budget.insurance}\n\n` +
      `תקציב יומי: **${TRIP.budget.daily}**. כלומר, תשכחו מסטייקים כל ערב. אבל In-N-Out Burger? חובה.\n\n` +
      `💡 *רוצים לשנות? כתבו למשל: "עדכן תקציב ביטוח ל-3000" או "שנה תקציב כולל ל-60000"*`
    ),
  },
  {
    keywords: ['טיסה', 'טיסות', 'flight', 'לטוס', 'שדה תעופה'],
    response: () => wrap(
      `פרטי הטיסות שלכם:\n\n` +
      `**הלוך:** ${TRIP.flights.outbound}\n` +
      `**חזור:** ${TRIP.flights.return}\n\n` +
      `טיפ ממוטי: תגיעו 3 שעות לפני לנתב"ג. כן, אני יודע שכולם אומרים את זה. אבל עם 5 בני משפחה? תגיעו 4.\n\n` +
      `וגם: הזמינו מושבים מראש אם לא עשיתם. 5 אנשים מפוזרים במטוס = ילדים שמפריעים לזרים = הורים מתים מבושה.`
    ),
  },
  {
    keywords: ['קרוואן', 'rv', 'נהיגה', 'רכב'],
    response: () => wrap(
      `הקרוואן: **${TRIP.rv}**\n\n` +
      `כמה דברים חשובים:\n` +
      `• צריך **רישיון נהיגה בינלאומי** — זה במשימות שלכם, מקווה שטיפלתם\n` +
      `• Class C זה קרוואן על בסיס משאית — לא קטן, לא ענק, בדיוק מספיק ל-5\n` +
      `• תדלקו לפני שהמחוג מגיע לרבע — בגרנד קניון אין תחנת דלק בכל פינה\n` +
      `• נהיגה בצד ימין, לא שמאל. כן, אני צריך לומר את זה.`
    ),
  },
  {
    keywords: ['דיסנילנד', 'דיסני', 'disney'],
    response: () => wrap(
      `דיסנילנד! הילדים ישתגעו (וההורים יישברו כלכלית, אבל שווה).\n\n` +
      `טיפים ממוטי הציני:\n` +
      `• הזמינו כרטיסים **מראש** — כבר יש לכם את זה במשימות\n` +
      `• תורידו את אפליקציית דיסנילנד — לתור חכם ולמפה\n` +
      `• הגיעו **לפתיחה** — השעה הראשונה שווה שלוש אחר הצהריים\n` +
      `• קחו בקבוקי מים ריקים (יש מילוי בחינם בפארק)\n` +
      `• תקציב אוכל בפארק: תוסיפו 30% על מה שחשבתם. רציני.`
    ),
  },
  {
    keywords: ['גרנד קניון', 'grand canyon', 'קניון'],
    response: () => wrap(
      `גרנד קניון — **15 בספטמבר**.\n\n` +
      `זה אחד מהמקומות האלה שאתה מגיע ופתאום מבין כמה אתה קטן. ציני כמוני? גם אני הייתי בשוק.\n\n` +
      `טיפים:\n` +
      `• South Rim — הגישה הקלאסית, מתאימה למשפחה\n` +
      `• **מים מים מים** — ספטמבר עדיין חם שם, 30+ מעלות\n` +
      `• אל תנסו לרדת לתחתית ולחזור באותו יום עם ילדים. סתם לא.\n` +
      `• שקיעה מ-Mather Point = הרגע הכי שווה בטיול`
    ),
  },
  {
    keywords: ['יוסמיטי', 'yosemite'],
    response: () => wrap(
      `יוסמיטי — **18-20 בספטמבר** (3 ימים!).\n\n` +
      `שלושה ימים ביוסמיטי זה מושלם. בניגוד לרוב ההחלטות שלכם (צחוק, צחוק).\n\n` +
      `חובה:\n` +
      `• Half Dome View מ-Glacier Point\n` +
      `• Yosemite Falls Trail (הייק קל יחסית, מתאים לילדים)\n` +
      `• Tunnel View — העצירה הראשונה, הכי מצולמת\n\n` +
      `שימו לב: ספטמבר = פחות מפלים (סוף הקיץ), אבל פחות המוני אנשים. Win.`
    ),
  },
  {
    keywords: ['זאיון', 'zion'],
    response: () => wrap(
      `זאיון — **16 בספטמבר**.\n\n` +
      `Angels Landing? עם ילדים? אממ... Narrows יותר בטוח ומדהים.\n\n` +
      `• The Narrows = הליכה בתוך הנהר, בין קירות סלע ענקיים. הילדים יאהבו.\n` +
      `• קחו נעלי מים (או שכרו ציוד בכניסה לפארק)\n` +
      `• Emerald Pools Trail — קל, יפה, לכל המשפחה\n` +
      `• השאטל בתוך הפארק חינמי — אל תנסו להיכנס ברכב`
    ),
  },
  {
    keywords: ['וגאס', 'vegas', 'לאס וגאס'],
    response: () => wrap(
      `לאס וגאס עם ילדים. כן, אנשים עושים את זה. לא, זה לא מוזר. (קצת מוזר.)\n\n` +
      `אטרקציות למשפחה:\n` +
      `• High Roller — הגלגל הכי גדול בעולם, נוף מטורף\n` +
      `• Shark Reef ב-Mandalay Bay\n` +
      `• ה-Strip בלילה — פשוט ללכת ולהסתכל (חינם!)\n` +
      `• Bellagio Fountains — מופע מים חינמי שגורם לילדים לפעור פה\n\n` +
      `יש לכם מלון שם כבר, אז לפחות את זה סגרתם. 👏`
    ),
  },
  {
    keywords: ['אריזה', 'packing', 'לארוז', 'מזוודה'],
    response: () => wrap(
      `אריזה ל-20 יום עם 5 בני משפחה. בהצלחה.\n\n` +
      `הדברים שאנשים **תמיד** שוכחים:\n` +
      `• מתאם חשמל לארה"ב (Type A/B — אלה עם שני פינים שטוחים)\n` +
      `• תרופות מרשם + צילום המרשם באנגלית\n` +
      `• קרם הגנה SPF50+ (ספטמבר במדבר = שמש רצחנית)\n` +
      `• בגדי שכבות — יוסמיטי בלילה קר, וגאס ביום רותח\n` +
      `• נעלי הייקינג מנוסות (לא חדשות! שבירה של נעלים בגרנד קניון = סיוט)\n\n` +
      `יש לכם רשימת אריזה מלאה במודול האריזה. תשתמשו בה. בבקשה.`
    ),
  },
  {
    keywords: ['מסמכים', 'דרכון', 'visa', 'esta', 'ויזה'],
    response: () => wrap(
      `מסמכים — הדבר הכי משעמם והכי חשוב:\n\n` +
      `✅ 5 דרכונים — וודאו שתקפים לפחות 6 חודשים אחרי 30/9/2026\n` +
      `✅ ESTA — צריך לכל 5 בני המשפחה, גם הילדים\n` +
      `✅ ביטוח נסיעות\n` +
      `✅ רישיון נהיגה בינלאומי (לקרוואן!)\n` +
      `✅ אישורי הזמנות (טיסות, קרוואן, מלונות, דיסנילנד)\n\n` +
      `טיפ: תשמרו הכל גם בענן וגם מודפס. כי WiFi בגרנד קניון? 😂`
    ),
  },
  {
    keywords: ['מתי', 'לוח זמנים', 'תאריך', 'מסלול', 'route', 'itinerary'],
    response: () => wrap(
      `המסלול המלא:\n\n` +
      `📅 **${TRIP.dates}** (${TRIP.duration})\n\n` +
      `${TRIP.route}\n\n` +
      `**תחנות עיקריות:**\n` +
      `• 11/9 — נחיתה ב-LAX\n` +
      `• 12/9 — איסוף קרוואן + לוס אנג'לס\n` +
      `• דיסנילנד\n` +
      `• לאס וגאס\n` +
      `• 15/9 — גרנד קניון\n` +
      `• 16/9 — זאיון\n` +
      `• 18-20/9 — יוסמיטי\n` +
      `• 28/9 — החזרת קרוואן בסן פרנסיסקו\n` +
      `• 28-30/9 — סן פרנסיסקו (מלון)\n` +
      `• 30/9 — טיסה הביתה מ-SFO\n\n` +
      `20 יום. 5 בני משפחה. קרוואן אחד. מה יכול להשתבש? 😄\n\n` +
      `💡 *רוצים להוסיף עצירה? כתבו: "תוסיף עצירה ביום 5: ביקור במוזיאון"*`
    ),
  },
  {
    keywords: ['אוכל', 'מסעדה', 'לאכול', 'food', 'restaurant'],
    response: () => wrap(
      `אוכל בארה"ב! תקציב: **${TRIP.budget.food}** לכל הטיול.\n\n` +
      `המלצות ממוטי (שאכל כל מה שאפשר):\n` +
      `• **In-N-Out Burger** — חובה ביום הראשון. Double-Double, Animal Style. תודו לי.\n` +
      `• **Trader Joe's** — סופר מעולה לקניות לקרוואן, חוסך המון\n` +
      `• **Costco** — חברות יומית ב-$5, שווה לקניית מים וחטיפים בכמויות\n` +
      `• סן פרנסיסקו: Clam Chowder ב-Fisherman's Wharf\n` +
      `• וגאס: Buffet — הילדים יאכלו ב-$15-20 ואתם תוציאו את הכסף\n\n` +
      `עם קרוואן, בשלו לעצמכם ארוחות בוקר וצהריים. מסעדות רק בערב = שורדים בתקציב.`
    ),
  },
  {
    keywords: ['san francisco', 'סן פרנסיסקו', 'sf'],
    response: () => wrap(
      `סן פרנסיסקו — הסיום המושלם! **28-30 בספטמבר** (מלון).\n\n` +
      `אחרי 16 יום בקרוואן, מלון ירגיש כמו ארמון.\n\n` +
      `חובה:\n` +
      `• Golden Gate Bridge (הפתעה, נכון?)\n` +
      `• Fisherman's Wharf + Pier 39 (כלבי ים!)\n` +
      `• כבל קאר — הילדים ישתגעו\n` +
      `• Alcatraz — אם הזמנתם מראש (מומלץ!)\n` +
      `• Ghirardelli Square — שוקולד חינמי בחנות\n\n` +
      `וה-Fog? זה לא ערפל, זה אווירה. 😎`
    ),
  },
  {
    keywords: ['עזרה', 'help', 'מה אתה', 'מי אתה'],
    response: () =>
      `אני **מוטי** 🤖 — יועץ הטיולים הציני שלכם, מופעל על ידי AI.\n\n` +
      `אני מכיר את הטיול שלכם בע"פ: ${TRIP.dates}, ${TRIP.family}, מסלול מלא ברחבי ארה"ב.\n\n` +
      `תשאלו אותי על:\n` +
      `• ✈️ טיסות ומסלול\n` +
      `• 🚐 קרוואן ונהיגה\n` +
      `• 💰 תקציב\n` +
      `• 📋 ביטוח ומסמכים\n` +
      `• 🏞️ פארקים לאומיים\n` +
      `• 🎢 דיסנילנד ואטרקציות\n` +
      `• 🧳 אריזה\n` +
      `• 🍔 אוכל\n` +
      `• או **כל שאלה אחרת** — אני AI, אני יודע הכל! (כמעט.)\n\n` +
      `🔧 **חדש! אני יכול גם לשנות דברים באתר:**\n` +
      `• "עדכן תקציב ביטוח ל-3000"\n` +
      `• "שנה תקציב כולל ל-60000"\n` +
      `• "תוסיף עצירה ביום 5: ביקור במוזיאון"\n` +
      `• "תוסיף הערה ליום 3: לקחת מים"\n\n` +
      `ציני אבל מדויק. ולפחות לא משעמם. 😏`,
  },
]

const FALLBACKS = [
  `שאלה מעניינת, אבל מוטי במצב אופליין כרגע ולא מחובר ל-AI. 🔌\n\nנסו לשאול על משהו ספציפי — טיסות, ביטוח, תקציב, אריזה, או כל מקום במסלול!\n\nאו פשוט תכתבו "עזרה" ואני אראה לכם מה אני יודע.`,
  `אממ... מוטי לא מחובר ל-AI כרגע, אז אני עובד במצב בסיסי. 🤖\n\nאני מומחה לטיול שלכם לארה"ב — שאלו אותי על המסלול, התקציב, המסמכים, או כל אטרקציה ספציפית!`,
  `לא הבנתי, אבל אל תיקחו את זה אישית — אני במצב אופליין. 😅\n\nשאלו על הטיול: ביטוח? דיסנילנד? גרנד קניון? אריזה? תקציב? אני פה!`,
]

function getKeywordResponse(message: string): string {
  const lower = message.toLowerCase().trim()

  // Check for greeting
  if (/^(היי|הי|שלום|בוקר|ערב|מה נשמע|אהלן|hey|hi|hello)/.test(lower)) {
    return `שלום שלום! 👋 אני מוטי, היועץ הציני שלכם לטיול לארה"ב.\n\nמה רוצים לדעת? יש לי דעה על הכל — ביטוח, תקציב, דיסנילנד, גרנד קניון... רק תשאלו.\n\n🔧 **חידוש:** אני יכול גם לעדכן דברים באתר! נסו: "עדכן תקציב ביטוח ל-3000"`
  }

  // Check rules by keyword match
  for (const rule of rules) {
    const matched = rule.keywords.some((kw) => lower.includes(kw))
    if (matched) {
      return rule.response()
    }
  }

  // Fallback
  return randomPick(FALLBACKS)
}

// Check if AI mode is available
export function isAIMode(): boolean {
  return supabase !== null
}
