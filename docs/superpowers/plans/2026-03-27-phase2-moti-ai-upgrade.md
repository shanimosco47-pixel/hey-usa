# Phase 2: Moti AI Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch Moti's AI backend from Anthropic Claude to OpenAI (pay-as-you-go), add family-aware responses, and verify voice input works end-to-end.

**Architecture:** The chat system already has full UI, action parsing, action execution, rich cards, voice input, and a Supabase Edge Function. The main work is converting the edge function from Anthropic API to OpenAI Chat Completions API (different tool format and response structure), adding family member context to the system prompt, and wiring streaming for real-time feel.

**Tech Stack:** OpenAI Chat Completions API (gpt-4o-mini), Supabase Edge Functions (Deno), existing React chat UI

---

## Current State

The Moti chat system is **already functional** with Claude:
- `supabase/functions/moti-chat/index.ts` — Edge function calling Anthropic API with Claude Tool Use
- `src/modules/chat/botEngine.ts` — Keyword parser + AI caller + action confirmation
- `src/modules/chat/ChatPage.tsx` — Full UI with messages, cards, voice, suggestions
- `src/modules/chat/hooks/useVoiceInput.ts` — Web Speech API for Hebrew
- `src/contexts/AppDataContext.tsx` — `buildMotiContext()` + `executeMotiAction()`

**What changes:** Edge function switches to OpenAI. Bot engine updates response parsing. System prompt gains family awareness. Client gets streaming support.

## File Structure

### Modified Files
| File | Changes |
|------|---------|
| `supabase/functions/moti-chat/index.ts` | Replace Anthropic API with OpenAI Chat Completions API |
| `src/modules/chat/botEngine.ts` | Update response parsing for OpenAI format, add family context to API call |
| `src/modules/chat/ChatPage.tsx` | Pass current family member to bot engine, add streaming display |

### No New Files
The existing architecture handles everything. No new components needed.

---

## Task 1: Convert Edge Function to OpenAI

**Files:**
- Modify: `supabase/functions/moti-chat/index.ts`

Convert the edge function from Anthropic Claude API to OpenAI Chat Completions API. The system prompt and tools stay the same conceptually — only the API format changes.

- [ ] **Step 1: Read the current edge function**

Read `supabase/functions/moti-chat/index.ts` to understand the full structure.

- [ ] **Step 2: Replace the edge function with OpenAI version**

Key changes:
- API URL: `https://api.anthropic.com/v1/messages` → `https://api.openai.com/v1/chat/completions`
- Auth header: `x-api-key` → `Authorization: Bearer`
- Env var: `ANTHROPIC_API_KEY` → `OPENAI_API_KEY`
- Model: `claude-sonnet-4-6` → `gpt-4o-mini`
- Request body: Anthropic `{ model, system, messages, tools }` → OpenAI `{ model, messages: [{role: "system", content}, ...], tools, tool_choice: "auto" }`
- Tool format: Anthropic `{ name, description, input_schema }` → OpenAI `{ type: "function", function: { name, description, parameters } }`
- Response parsing: Anthropic `content[].type === 'text'|'tool_use'` → OpenAI `choices[0].message.content` + `choices[0].message.tool_calls[].function`

Replace the entire file with:

```typescript
// Supabase Edge Function — Moti AI Chat Proxy
// Calls OpenAI API with Moti's personality and trip context
// Uses OpenAI Function Calling for structured actions

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

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
- זמני נסיעה משוערים בין עצירות
- תדלוק — באזורים מרוחקים תזכיר לתדלק לפני כל קטע נסיעה
- כיסוי סלולרי — באזורים מרוחקים הכיסוי חלש. הורידו מפות אופליין
- גובה — יוסמיטי ב-4000+ רגל, ברייס קניון ב-8000+ רגל. שתו הרבה מים
- שתייה — באזורי מדבר כל אחד צריך לפחות 3 ליטר מים ביום

## ידע ספציפי לפי אזור
### לאס וגאס — ערב הכי טוב, ביום: בריכות (35°C+ בספטמבר)
### זאיון — The Narrows: התחילו מוקדם, נעלי מים חובה, בדקו אזהרות שיטפונות
### ברייס קניון — זריחה ב-Bryce Point, גובה 8000+ = בקרים קרים (3°C)
### גרנד קניון — שאטלים חינמיים, שקיעה ב-Mather Point
### יוסמיטי — הגיעו לפני 9:00, חניה מתמלאת עד 10:00
### סן פרנסיסקו — שכבות! ערפל! 12°C בבוקר, 22°C אחרי הצהריים

## פעולות באתר
יש לך כלים (tools) לביצוע פעולות באתר. השתמש בהם כשמשתמש מבקש לשנות/להוסיף/לעדכן משהו.
- אם חסר מידע הכרחי — השתמש ב-ask_clarification, אל תנחש
- אל תשתמש בכלים לשאלות מידע רגילות
- כששואלים "מה המצב" — ענה מהקונטקסט, אל תשתמש בכלים
- תמיד הוסף טקסט אישור ידידותי כשאתה מבצע פעולה

## עיצוב תשובות
- השתמש ב-Markdown: כותרות (##, ###), רשימות (•, 1.), **bold**, *italic*
- בתכנון יום: כותרת + רשימת עצירות עם שעות
- בנושאי תקציב: פירוט בטבלה או רשימה מסודרת
- לתשובות ארוכות: חלק לסעיפים עם כותרות

{{FAMILY_CONTEXT}}

## מצב נוכחי של האפליקציה
{{APP_CONTEXT}}`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// OpenAI Function Calling format (converted from Anthropic Tool Use)
const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'update_budget_category',
      description:
        'Update budget for a specific expense category. Categories: flights, accommodation, food, transport, attractions, shopping, communication, insurance, other',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['flights', 'accommodation', 'food', 'transport', 'attractions', 'shopping', 'communication', 'insurance', 'other'],
          },
          amount: { type: 'number', description: 'Amount in ILS' },
        },
        required: ['category', 'amount'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_total_budget',
      description: 'Update the total trip budget',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Total budget in ILS' },
        },
        required: ['amount'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_daily_budget',
      description: 'Update the daily spending budget',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Daily budget in ILS' },
        },
        required: ['amount'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_expense',
      description: 'Log a new expense. Always ask for amount if not provided.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          amount: { type: 'number', description: 'Amount in ILS' },
          category: {
            type: 'string',
            enum: ['flights', 'accommodation', 'food', 'transport', 'attractions', 'shopping', 'communication', 'insurance', 'other'],
          },
          paid_by: { type: 'string', enum: ['aba', 'ima', 'kid1', 'kid2', 'kid3'] },
          date: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['title', 'amount', 'category'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_task',
      description: 'Add a new task/reminder. Ask for due_date if time-sensitive.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          group: { type: 'string', enum: ['pre_trip', 'during_trip', 'post_trip'] },
          assigned_to: {
            type: 'array',
            items: { type: 'string', enum: ['aba', 'ima', 'kid1', 'kid2', 'kid3'] },
          },
          due_date: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'complete_task',
      description: 'Mark a task as done by title. If ambiguous, ask which task.',
      parameters: {
        type: 'object',
        properties: {
          task_title: { type: 'string', description: 'Title or partial title to match' },
        },
        required: ['task_title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_note',
      description: 'Add a sticky note. Can optionally link to a location.',
      parameters: {
        type: 'object',
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
  },
  {
    type: 'function' as const,
    function: {
      name: 'toggle_packing_item',
      description: 'Check or uncheck a packing item by name. If ambiguous, ask.',
      parameters: {
        type: 'object',
        properties: {
          item_name: { type: 'string', description: 'Name or partial name to match' },
        },
        required: ['item_name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_itinerary_stop',
      description: 'Add a stop/activity to a trip day',
      parameters: {
        type: 'object',
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
  },
  {
    type: 'function' as const,
    function: {
      name: 'ask_clarification',
      description: 'Ask the user a clarifying question when you need more info to complete an action.',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'The question in Hebrew' },
          context: { type: 'string', description: 'What action you are trying to complete' },
        },
        required: ['question'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_email',
      description: 'Search connected Gmail accounts for a specific booking, receipt, or document.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query describing what to find' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_reminder',
      description: 'Set a reminder for the family. Creates a task with a due date.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'What to remember (in Hebrew)' },
          trigger_date: { type: 'string', description: 'YYYY-MM-DD when to remind' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'convert_currency',
      description: 'Convert between ILS and USD.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Amount to convert' },
          from: { type: 'string', enum: ['ILS', 'USD'] },
          to: { type: 'string', enum: ['ILS', 'USD'] },
        },
        required: ['amount', 'from', 'to'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'estimate_drive_time',
      description: 'Estimate driving time between two trip destinations.',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Origin city/park name' },
          to: { type: 'string', description: 'Destination city/park name' },
        },
        required: ['from', 'to'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_daily_plan',
      description: 'Get the full plan for a specific trip day.',
      parameters: {
        type: 'object',
        properties: {
          day_number: { type: 'number', description: 'Day number 1-20' },
        },
        required: ['day_number'],
      },
    },
  },
]

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://shanimosco47-pixel.github.io'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }

  try {
    const { messages, summarize, appContext, familyContext } = (await req.json()) as {
      messages: ChatMessage[]
      summarize?: boolean
      appContext?: string
      familyContext?: string
    }

    // Build system prompt with app context and family context
    let systemPrompt: string
    if (summarize) {
      systemPrompt = 'אתה עוזר שמסכם שיחות. סכם בקצרה ב-3-4 משפטים בעברית.'
    } else {
      systemPrompt = SYSTEM_PROMPT
        .replace('{{APP_CONTEXT}}', appContext || 'לא זמין כרגע')
        .replace('{{FAMILY_CONTEXT}}', familyContext || '')
    }

    // OpenAI format: system message first, then conversation
    const openaiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: summarize ? 256 : 2048,
        messages: openaiMessages,
        ...(summarize ? {} : { tools: TOOLS, tool_choice: 'auto' }),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      return new Response(JSON.stringify({ error: 'AI service error', status: response.status }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const data = await response.json()
    const choice = data.choices?.[0]?.message

    if (!choice) {
      return new Response(JSON.stringify({ error: 'No response from AI' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    // Extract text and tool calls from OpenAI response
    const text = choice.content?.trim() || ''
    const actions: Array<{ tool: string; input: Record<string, unknown> }> = []

    if (choice.tool_calls) {
      for (const toolCall of choice.tool_calls) {
        if (toolCall.type === 'function') {
          try {
            actions.push({
              tool: toolCall.function.name,
              input: JSON.parse(toolCall.function.arguments),
            })
          } catch {
            console.warn('Failed to parse tool call arguments:', toolCall.function.arguments)
          }
        }
      }
    }

    // If only tool calls and no text, add confirmation
    const responseText = !text && actions.length > 0 ? 'בוצע! ✅' : text

    return new Response(JSON.stringify({ text: responseText, actions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
```

Note: The response format stays identical `{ text, actions }` so the client-side `botEngine.ts` needs minimal changes.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/moti-chat/index.ts
git commit -m "feat: switch Moti edge function from Anthropic to OpenAI"
```

---

## Task 2: Add Family-Aware Context to Bot Engine

**Files:**
- Modify: `src/modules/chat/botEngine.ts`
- Modify: `src/modules/chat/ChatPage.tsx`

Pass the current family member to the bot engine so OpenAI can adjust tone. The edge function already accepts a `familyContext` parameter (added in Task 1).

- [ ] **Step 1: Update getBotResponseAsync signature in botEngine.ts**

Read `src/modules/chat/botEngine.ts` and find `getBotResponseAsync`. Currently it takes `(userMessage: string, appContext: string)`. Add a third parameter for the family member:

```typescript
export async function getBotResponseAsync(
  userMessage: string,
  appContext: string,
  familyMemberId?: string,
): Promise<BotResponse> {
```

- [ ] **Step 2: Build familyContext string and send to edge function**

Inside `getBotResponseAsync`, where it calls the edge function (the `fetch` call), build a family context string and include it in the request body:

```typescript
// Build family-aware context
let familyContext = ''
if (familyMemberId === 'kid1' || familyMemberId === 'kid2' || familyMemberId === 'kid3') {
  familyContext = `## בן/בת משפחה נוכחי/ת
המשתמש הנוכחי הוא ילד/ה. התאם את הטון:
- השתמש בשפה פשוטה יותר ובהסברים קצרים
- הוסף עובדות מהנות וטריוויה על המקומות
- היה מעודד ומשעשע
- אל תציף במידע תקציבי או לוגיסטי מורכב
- תן תשובות קצרות יותר`
} else if (familyMemberId === 'aba' || familyMemberId === 'ima') {
  familyContext = `## בן/בת משפחה נוכחי/ת
המשתמש הנוכחי הוא הורה. התאם את הטון:
- התמקד בתכנון, תקציב, לוגיסטיקה
- תן עצות פרקטיות ומדויקות
- הצע פתרונות ואלטרנטיבות כשרלוונטי
- אפשר לדבר על תקציב ומסמכים בפירוט`
}
```

Add `familyContext` to the fetch body:

```typescript
body: JSON.stringify({
  messages: messagesWithMemory,
  appContext,
  familyContext,
}),
```

- [ ] **Step 3: Update ChatPage to pass family member**

Read `src/modules/chat/ChatPage.tsx` and find where `getBotResponseAsync` is called. Add the current member from AuthContext:

```typescript
// At the top of ChatPage, import useAuth:
import { useAuth } from '@/contexts/AuthContext'

// Inside the component:
const { currentMember } = useAuth()

// Where getBotResponseAsync is called (in sendMessage):
const response = await getBotResponseAsync(text, buildMotiContext(), currentMember?.id)
```

- [ ] **Step 4: Build check**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/modules/chat/botEngine.ts src/modules/chat/ChatPage.tsx
git commit -m "feat: add family-aware context to Moti responses"
```

---

## Task 3: Update Memory Summary to Use OpenAI

**Files:**
- Modify: `src/modules/chat/botEngine.ts`

The `generateMemorySummary()` function calls the edge function with `summarize: true`. This already works because Task 1's edge function handles the `summarize` flag — it sends a different system prompt to OpenAI. Verify this works.

- [ ] **Step 1: Verify generateMemorySummary uses the correct endpoint**

Read `src/modules/chat/botEngine.ts` and find `generateMemorySummary()`. Confirm it calls the same `/functions/v1/moti-chat` endpoint with `{ messages, summarize: true }`. The edge function from Task 1 already handles this — it sends a summarization system prompt to OpenAI.

No code changes needed if the endpoint and payload format match. If there are differences, update accordingly.

- [ ] **Step 2: Verify mapToolUseToActions handles OpenAI format**

Read the `mapToolUseToActions()` function. The edge function normalizes both Anthropic and OpenAI responses to the same `{ tool, input }` format, so this should work unchanged. Verify the field names match.

- [ ] **Step 3: Build check**

Run: `npm run build`

- [ ] **Step 4: Commit (only if changes were needed)**

```bash
git add src/modules/chat/botEngine.ts
git commit -m "fix: verify memory summary works with OpenAI backend"
```

---

## Task 4: Deploy Edge Function and Set OpenAI Secret

**Files:** No code changes — infrastructure setup

- [ ] **Step 1: Set the OpenAI API key as a Supabase secret**

```bash
supabase secrets set OPENAI_API_KEY=sk-...your-key...
```

If the user doesn't have the Supabase CLI installed locally, they can set it via the Supabase Dashboard:
Settings → Edge Functions → Secrets → Add `OPENAI_API_KEY`

- [ ] **Step 2: Deploy the updated edge function**

```bash
cd supabase
supabase functions deploy moti-chat --no-verify-jwt
```

The `--no-verify-jwt` flag allows the function to be called with the Supabase anon key (which is how the client calls it).

- [ ] **Step 3: Test the deployed function**

Send a test request:

```bash
curl -X POST "https://YOUR_SUPABASE_URL/functions/v1/moti-chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"messages":[{"role":"user","content":"מה התוכנית ליום 1?"}],"appContext":"ימים לטיול: 167"}'
```

Expected: JSON response with Hebrew text about Day 1 (landing at LAX).

- [ ] **Step 4: Test from the app**

Run: `npm run dev`
Open the chat page, type a message, verify Moti responds via OpenAI.

---

## Task 5: Verify Voice Input End-to-End

**Files:** No changes expected (verify only)

The voice input hook (`useVoiceInput`) and its integration in ChatPage already exist. This task verifies it works.

- [ ] **Step 1: Verify voice input hook code**

Read `src/modules/chat/hooks/useVoiceInput.ts`. Confirm:
- It uses `window.SpeechRecognition || window.webkitSpeechRecognition`
- Language is set to `he-IL`
- `interimResults: true` for real-time transcription
- Cleanup on unmount

- [ ] **Step 2: Verify ChatPage integration**

Read `src/modules/chat/ChatPage.tsx`. Confirm:
- `useVoiceInput()` is called and destructured
- Transcript is piped into the input textarea
- Auto-submit happens when listening stops and transcript exists
- Mic button UI exists with animation when active

- [ ] **Step 3: Test in browser**

Run: `npm run dev`
Open chat page. Click the mic button. Speak in Hebrew. Verify:
1. Mic icon animates (pulsing/red)
2. Speech appears in input field as interim results
3. When you stop speaking, the message auto-sends
4. Moti responds

If voice input fails: check browser support (Chrome/Edge required), microphone permissions, HTTPS requirement (localhost is exempt).

- [ ] **Step 4: Commit (only if fixes needed)**

---

## Task 6: Build, Test, and Push

**Files:** None new

- [ ] **Step 1: Full build**

```bash
cd "/c/Users/shani/OneDrive/Hey USA" && npm run build
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

- [ ] **Step 3: Test chat end-to-end**

Run `npm run dev` and verify:
1. Open chat page
2. Type a message → Moti responds (via OpenAI)
3. Ask about budget → Moti uses app context
4. Ask to add an expense → Moti uses tool/function calling
5. Test voice input (if browser supports it)
6. Test keyword fallback: disable network → send message → keyword engine responds

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "chore: phase 2 moti AI upgrade complete"
git push origin master
```
