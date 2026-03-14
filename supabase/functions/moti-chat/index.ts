// Supabase Edge Function — Moti AI Chat Proxy
// Calls Claude API with Moti's personality and trip context
// Now supports structured actions — Moti can modify site data!

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

## פעולות באתר (ACTIONS)
אתה יכול לבצע פעולות באתר! כשמשתמש מבקש לשנות משהו (תקציב, מסלול, הערה), הוסף בסוף התשובה שלך בלוק JSON עם הפעולות.

### פורמט:
בסוף ההודעה שלך, הוסף שורה חדשה עם:
\`\`\`actions
[{"type": "ACTION_TYPE", ...params}]
\`\`\`

### פעולות נתמכות:

1. **UPDATE_BUDGET_CATEGORY** — עדכון תקציב קטגוריה
   קטגוריות: flights, accommodation, food, transport, attractions, shopping, communication, insurance, other
   \`\`\`actions
   [{"type": "UPDATE_BUDGET_CATEGORY", "category": "insurance", "amount": 3000}]
   \`\`\`

2. **UPDATE_TOTAL_BUDGET** — עדכון תקציב כולל
   \`\`\`actions
   [{"type": "UPDATE_TOTAL_BUDGET", "amount": 60000}]
   \`\`\`

3. **UPDATE_DAILY_BUDGET** — עדכון תקציב יומי
   \`\`\`actions
   [{"type": "UPDATE_DAILY_BUDGET", "amount": 3000}]
   \`\`\`

4. **ADD_EXPENSE** — הוספת הוצאה
   \`\`\`actions
   [{"type": "ADD_EXPENSE", "expense": {"title": "כרטיסי דיסנילנד", "amount": 3500, "currency": "₪", "category": "attractions", "paid_by": "aba", "date": "2026-06-01"}}]
   \`\`\`

5. **ADD_ITINERARY_STOP** — הוספת עצירה ליום מסוים (dayId = "day-1" עד "day-20")
   \`\`\`actions
   [{"type": "ADD_ITINERARY_STOP", "dayId": "day-5", "stop": {"title": "ביקור במוזיאון", "description": "מוזיאון היסטוריה טבעית", "category": "activity"}}]
   \`\`\`

6. **UPDATE_ITINERARY_DAY_NOTES** — עדכון הערות ליום
   \`\`\`actions
   [{"type": "UPDATE_ITINERARY_DAY_NOTES", "dayId": "day-3", "notes": "לקחת מים ואוכל"}]
   \`\`\`

### חשוב:
- הוסף actions רק כשהמשתמש מבקש במפורש לשנות/לעדכן/להוסיף משהו
- אל תוסיף actions לשאלות מידע רגילות
- תמיד ענה גם בטקסט רגיל (אישור הפעולה) + הactions בסוף
- אפשר לשלב כמה actions יחד: [action1, action2]
- paid_by חייב להיות: "aba", "ima", "kid1", "kid2", או "kid3"`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

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
    const { messages, summarize } = (await req.json()) as { messages: ChatMessage[]; summarize?: boolean }

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
          : SYSTEM_PROMPT,
        messages,
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
    const fullText = data.content?.[0]?.text ?? ''

    // Parse actions from the response
    let text = fullText
    let actions: unknown[] = []

    const actionsMatch = fullText.match(/```actions\s*\n([\s\S]*?)\n```/)
    if (actionsMatch) {
      try {
        actions = JSON.parse(actionsMatch[1])
        // Remove the actions block from the visible text
        text = fullText.replace(/\n?```actions\s*\n[\s\S]*?\n```\s*$/, '').trim()
      } catch {
        // If JSON parsing fails, just return the full text without actions
        console.warn('Failed to parse actions JSON:', actionsMatch[1])
      }
    }

    return new Response(
      JSON.stringify({ text, actions }),
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
