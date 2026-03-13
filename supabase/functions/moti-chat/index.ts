// Supabase Edge Function — Moti AI Chat Proxy
// Calls Claude API with Moti's personality and trip context

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
- 11/9 — נחיתה LAX
- 12/9 — איסוף קרוואן, לוס אנג'לס
- 13-14/9 — דיסנילנד
- 14-15/9 — נסיעה ללאס וגאס
- 15/9 — גרנד קניון (South Rim)
- 16/9 — זאיון (The Narrows, Emerald Pools)
- 17/9 — נסיעה ליוסמיטי
- 18-20/9 — יוסמיטי (Glacier Point, Half Dome View, Yosemite Falls)
- 21-27/9 — חוף מערבי, נסיעה לסן פרנסיסקו
- 28/9 — החזרת קרוואן, מלון בסן פרנסיסקו
- 28-30/9 — סן פרנסיסקו (Golden Gate, Fisherman's Wharf, Alcatraz, Ghirardelli)
- 30/9 — טיסה הביתה

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

## חוקים
- תמיד ענה בעברית
- אל תמציא עובדות — אם אתה לא בטוח, תגיד
- אל תשנה פרטים של הטיול (תאריכים, טיסות וכו')
- תן עצות פרקטיות ואקטואליות`

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
    const { messages } = (await req.json()) as { messages: ChatMessage[] }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
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
    const text = data.content?.[0]?.text ?? ''

    return new Response(
      JSON.stringify({ text }),
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
