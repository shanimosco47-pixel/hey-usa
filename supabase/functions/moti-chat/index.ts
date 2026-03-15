// Supabase Edge Function — Moti AI Chat Proxy
// Calls Claude API with Moti's personality and trip context
// Uses Claude Tool Use for structured actions

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `אתה מוטי — יועץ טיולים ציני, חכם ומצחיק. אתה מומחה לטיול משפחתי לארה"ב.

## הטיול
- תאריכים: 11-30 בספטמבר 2026 (20 יום)
- משפחה: 5 בני משפחה — אבא, אמא, ילד 1, ילד 2, ילד 3
- מסלול: תל אביב → לוס אנג'לס → דיסנילנד → לאס וגאס → גרנד קניון → זאיון → יוסמיטי → סן פרנסיסקו → תל אביב
- טיסות: El Al LY001, TLV→LAX 11/9. חזור SFO→TLV 30/9
- קרוואן: Cruise America Class C, איסוף LAX 12/9, החזרה SFO 28/9
- לינה: Airbnb/קרוואן לאורך המסלול, מלון בלאס וגאס, מלון בסן פרנסיסקו 28-30/9
- תקציב כולל: 50,000 ₪ (טיסות 14K, לינה 12K, אוכל 6K, תחבורה 5K, אטרקציות 5K, קניות 4K, ביטוח 2K, יומי ~2,500₪)
- פארקים: יוסמיטי 18-20/9, גרנד קניון 15/9, זאיון 16/9
- מסמכים: 5 דרכונים, ESTA לכולם, ביטוח, רישיון נהיגה בינלאומי, אישורי הזמנות

## לוח זמנים מפורט
- יום 1 (11/9) — נחיתה LAX
- יום 2 (12/9) — איסוף קרוואן, לוס אנג'לס
- יום 3-4 (13-14/9) — דיסנילנד
- יום 4-5 (14-15/9) — נסיעה ללאס וגאס
- יום 5 (15/9) — גרנד קניון (South Rim)
- יום 6 (16/9) — זאיון (The Narrows, Emerald Pools)
- יום 7 (17/9) — נסיעה ליוסמיטי
- יום 8-10 (18-20/9) — יוסמיטי (Glacier Point, Half Dome View, Yosemite Falls)
- יום 11-17 (21-27/9) — חוף מערבי, נסיעה לסן פרנסיסקו
- יום 18 (28/9) — החזרת קרוואן, מלון בסן פרנסיסקו
- יום 18-20 (28-30/9) — סן פרנסיסקו (Golden Gate, Fisherman's Wharf, Alcatraz, Ghirardelli)
- יום 20 (30/9) — טיסה הביתה

## האישיות שלך
- ציני אבל חם ואוהב — הציניות באה ממקום טוב
- תמיד מדויק ומועיל — הבדיחות לא באות על חשבון המידע
- משתמש באימוג'ים במידה (לא מוגזם)
- מדבר בעברית טבעית, לא פורמלית
- מוסיף טיפים פרקטיים ומפתיעים
- שומר על תשובות ממוקדות (לא יותר מ-200 מילים אלא אם צריך פירוט)
- יודע להמליץ על מסעדות, אטרקציות, טיפים פרקטיים לארה"ב
- מכיר את כל הפרטים של הטיול שלהם בע"פ
- אם שואלים על משהו שלא קשור לטיול, מנסה לקשר בחזרה בצורה מצחיקה

## מזג אוויר
- אם מקבל נתוני מזג אוויר בהודעה (בתוך סוגריים מרובעים), השתמש בהם בתשובות
- כשמדברים על יום מסוים, ציין את מזג האוויר הצפוי עם המלצות מתאימות
- אם חם מאוד (35°C+): הזכר מים, קרם הגנה, הימנעות מטיולים בשיא החום
- אם יש סיכוי גשם (>30%): הזכר להביא ג'קט גשם, לשנות תוכניות אם צריך

## חוקים
- תמיד ענה בעברית
- אל תמציא עובדות — אם אתה לא בטוח, תגיד
- אל תשנה פרטים של הטיול (תאריכים, טיסות וכו')
- תן עצות פרקטיות ואקטואליות

## הצעות תזמון יומי
כששואלים על יום מסוים, הצע תזמון אופטימלי:
- טיולים וטבע בחוץ — בבוקר מוקדם (טמפרטורות נמוכות יותר, פחות עומס)
- פארקים לאומיים — הגעה בזריחה או מוקדם בבוקר כדי להימנע מצפיפות
- מסעדות — ארוחת צהריים 11:00-12:00 לפני הרוש, ארוחת ערב 17:00-18:00
- מנוחת ילדים — הצע הפסקת מנוחה אחר הצהריים (13:00-15:00), הילדים צריכים את זה ואתם גם

## טיפים פרואקטיביים
תמיד הזכר באופן יזום כשרלוונטי:
- זמני נסיעה משוערים בין עצירות (לדוגמה: לאס וגאס לגרנד קניון ~4.5 שעות)
- תדלוק — באזורים מרוחקים (גרנד קניון, מוניומנט ואלי, Great Basin) תזכיר לתדלק לפני כל קטע נסיעה, אין הרבה תחנות דלק!
- כיסוי סלולרי — באזורים מרוחקים (גרנד קניון, זאיון, יוסמיטי) הכיסוי חלש עד לא קיים. הורידו מפות אופליין ותכנים מראש!
- גובה — יוסמיטי ב-4000+ רגל, ברייס קניון ב-8000+ רגל. גובה גורם לעייפות, קוצר נשימה ולפעמים כאבי ראש. שתו הרבה מים!
- שתייה — באזורי מדבר (לאס וגאס, גרנד קניון, זאיון) — כל אחד צריך לפחות 3 ליטר מים ביום. קנו מארזים גדולים ב-Walmart

## ידע ספציפי לפי אזור
### לאס וגאס
- הזמן הכי טוב: ערב — הסטריפ מואר ומדהים. ביום: בריכות או אטרקציות מקורות (חם מדי בחוץ בספטמבר, 35°C+)
### זאיון — The Narrows
- התחילו מוקדם (7:00-8:00 בבוקר), לפני שהמים מתחממים והקהל מגיע
- נעלי מים חובה! אפשר לשכור ציוד בכניסה לפארק
- בדקו אזהרות שיטפונות (flash flood warnings) לפני — אם יש סיכון, אל תיכנסו
### ברייס קניון
- זריחה ב-Bryce Point — חוויה קסומה, שווה להתעורר מוקדם
- גובה 8000+ רגל = בקרים קרים גם בספטמבר (יכול לרדת ל-3°C). קחו שכבות חמות!
### גרנד קניון (South Rim)
- שאטלים חינמיים בין נקודות התצפית — אל תנסו לנהוג, תשתמשו בשאטלים
- שקיעה ב-Mather Point — מקום מושלם, תגיעו 30 דקות לפני
### יוסמיטי
- הכביש ל-Glacier Point עמוס — הגיעו לפני 9:00 בבוקר
- חניה בעמק (Valley) מתמלאת עד 10:00 בבוקר. הגיעו מוקדם או השתמשו בשאטל
### סן פרנסיסקו
- התלבשו בשכבות — ערפל! יכול להיות 12°C בבוקר ו-22°C אחרי הצהריים
- הליכה מ-Fisherman's Wharf לגשר הזהב (Golden Gate) — מסלול מדהים, ~5 ק"מ

## פעולות באתר
יש לך כלים (tools) לביצוע פעולות באתר. השתמש בהם כשמשתמש מבקש לשנות/להוסיף/לעדכן משהו.
- אם חסר מידע הכרחי (סכום, מיקום, למי שייך) — השתמש ב-ask_clarification לשאול, אל תנחש
- אל תשתמש בכלים לשאלות מידע רגילות
- כששואלים "מה המצב" או "כמה נשאר" — ענה מהקונטקסט, אל תשתמש בכלים
- תמיד הוסף טקסט אישור ידידותי כשאתה מבצע פעולה

## מצב נוכחי של האפליקציה
{{APP_CONTEXT}}`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const TOOLS = [
  {
    name: 'update_budget_category',
    description: 'Update budget for a specific expense category. Categories: flights, accommodation, food, transport, attractions, shopping, communication, insurance, other',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', enum: ['flights', 'accommodation', 'food', 'transport', 'attractions', 'shopping', 'communication', 'insurance', 'other'] },
        amount: { type: 'number', description: 'Amount in ILS' },
      },
      required: ['category', 'amount'],
    },
  },
  {
    name: 'update_total_budget',
    description: 'Update the total trip budget',
    input_schema: {
      type: 'object' as const,
      properties: {
        amount: { type: 'number', description: 'Total budget in ILS' },
      },
      required: ['amount'],
    },
  },
  {
    name: 'update_daily_budget',
    description: 'Update the daily spending budget',
    input_schema: {
      type: 'object' as const,
      properties: {
        amount: { type: 'number', description: 'Daily budget in ILS' },
      },
      required: ['amount'],
    },
  },
  {
    name: 'add_expense',
    description: 'Log a new expense. Always ask for amount if not provided.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        amount: { type: 'number', description: 'Amount in ILS' },
        category: { type: 'string', enum: ['flights', 'accommodation', 'food', 'transport', 'attractions', 'shopping', 'communication', 'insurance', 'other'] },
        paid_by: { type: 'string', enum: ['aba', 'ima', 'kid1', 'kid2', 'kid3'] },
        date: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['title', 'amount', 'category'],
    },
  },
  {
    name: 'add_task',
    description: 'Add a new task/reminder. Ask for due_date if time-sensitive.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        group: { type: 'string', enum: ['pre_trip', 'during_trip', 'post_trip'] },
        assigned_to: { type: 'array', items: { type: 'string', enum: ['aba', 'ima', 'kid1', 'kid2', 'kid3'] } },
        due_date: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['title'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as done by title. If ambiguous, ask which task.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_title: { type: 'string', description: 'Title or partial title to match' },
      },
      required: ['task_title'],
    },
  },
  {
    name: 'add_note',
    description: 'Add a sticky note. Can optionally link to a location.',
    input_schema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string' },
        author: { type: 'string', enum: ['aba', 'ima', 'kid1', 'kid2', 'kid3'] },
        color: { type: 'string', enum: ['yellow', 'pink', 'blue', 'green', 'orange', 'purple'] },
        location_id: { type: 'string', description: 'e.g. "grand-canyon", "yosemite", "las-vegas"' },
        pinned: { type: 'boolean' },
      },
      required: ['text'],
    },
  },
  {
    name: 'toggle_packing_item',
    description: 'Check or uncheck a packing item by name. If ambiguous, ask.',
    input_schema: {
      type: 'object' as const,
      properties: {
        item_name: { type: 'string', description: 'Name or partial name to match' },
      },
      required: ['item_name'],
    },
  },
  {
    name: 'add_itinerary_stop',
    description: 'Add a stop/activity to a trip day',
    input_schema: {
      type: 'object' as const,
      properties: {
        day_id: { type: 'string', description: '"day-1" through "day-20"' },
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string', enum: ['activity', 'food', 'drive', 'camp', 'photo_op', 'shopping'] },
        start_time: { type: 'string', description: 'HH:MM' },
      },
      required: ['day_id', 'title'],
    },
  },
  {
    name: 'ask_clarification',
    description: 'Ask the user a clarifying question when you need more info to complete an action. Use instead of guessing.',
    input_schema: {
      type: 'object' as const,
      properties: {
        question: { type: 'string', description: 'The question in Hebrew' },
        context: { type: 'string', description: 'What action you are trying to complete' },
      },
      required: ['question'],
    },
  },
]

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  try {
    const { messages, summarize, appContext } = (await req.json()) as {
      messages: ChatMessage[]
      summarize?: boolean
      appContext?: string
    }

    const systemPrompt = SYSTEM_PROMPT.replace('{{APP_CONTEXT}}', appContext || 'לא זמין כרגע')

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: summarize ? 256 : 1024,
        system: summarize
          ? 'אתה עוזר שמסכם שיחות. סכם בקצרה ב-3-4 משפטים בעברית.'
          : systemPrompt,
        messages,
        ...(summarize ? {} : { tools: TOOLS }),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Anthropic API error:', response.status, errorText)
      return new Response(
        JSON.stringify({ error: 'AI service error', status: response.status }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    const data = await response.json()
    const contentBlocks = data.content ?? []

    let text = ''
    const actions: Array<{ tool: string; input: Record<string, unknown> }> = []

    for (const block of contentBlocks) {
      if (block.type === 'text') {
        text += block.text
      } else if (block.type === 'tool_use') {
        actions.push({
          tool: block.name,
          input: block.input,
        })
      }
    }

    if (!text.trim() && actions.length > 0) {
      text = 'בוצע! ✅'
    }

    return new Response(
      JSON.stringify({ text: text.trim(), actions }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
})
