# Moti — what he is, how he is wired, what he can do

Reference for the Hey USA chatbot as it stands today. Written because the capabilities were
spread across a system prompt, 24 tool definitions and a client-side fallback engine, with no
single place that said what Moti actually is.

Source files: `supabase/functions/moti-chat/index.ts`, `src/modules/chat/botEngine.ts`,
`src/modules/chat/ChatPage.tsx`, `src/contexts/AppDataContext.tsx`.

## Who Moti is

Moti is the trip assistant inside Hey USA, the planning app for the family's 21-day RV trip
across the western United States (10–30 September 2026, five travellers, Newark → Bozeman →
Yellowstone → Grand Teton → Bryce → Zion → Las Vegas → Yosemite → San Francisco).

He is written to a persona: Hebrew-first, dry and funny, warm underneath, practical over
clever. He addresses whoever is logged in by name and adapts register for a child or a parent.
The whole trip is baked into his system prompt, flights and confirmation numbers included, so
he answers about the trip from memory rather than from a lookup.

He was defined in `docs/superpowers/specs/2026-03-27-premium-overhaul-design.md` (Phase 2) and
built per `docs/superpowers/plans/2026-03-27-phase2-moti-ai-upgrade.md`.

## How he is connected

```
Browser (ChatPage → botEngine.ts)
  → POST {VITE_SUPABASE_URL}/functions/v1/moti-chat     Supabase Edge Function, Deno
      → OpenAI Chat Completions, model gpt-4o, max_tokens 2048
      → (read tools only) Supabase REST, service-role key, server-side
  ← { text, actions[] }
  → AppDataContext.executeMotiAction() applies write actions in the app
```

Details that matter:

- **The client sends the last 20 messages** verbatim (`MAX_CONTEXT_MESSAGES`), plus a rolling
  summary of anything older, plus app context and the current family member.
- **Read tools run server-side.** `get_tasks`, `get_packing_list`, `get_documents`,
  `get_expenses` and `get_notes` are executed by the edge function against Supabase REST with
  the service-role key, and the results are fed back to the model for a second turn. That
  second turn is answer-only; no further tool calls.
- **Write tools never run server-side.** They come back as `actions[]` and are applied in the
  browser by `executeMotiAction`, which is what keeps them subject to the app's own state and
  confirmation flow.
- **Secrets stay in Supabase.** `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  and `ALLOWED_ORIGIN` (default `https://shanimosco47-pixel.github.io`) are edge-function
  environment variables. The browser never sees the OpenAI key.
- **Offline is a real mode.** If the fetch fails for any reason, `botEngine` falls back to
  `getKeywordResponse()`, a local keyword matcher with canned Hebrew answers. It keeps talking,
  but it is not the same assistant, and it cannot perform actions. Across the western parks,
  expect this mode often.

## What he can do today

24 tools. Grouped by what they touch.

### Reads the trip's own data (server-side)
| Tool | Returns |
|---|---|
| `get_tasks` | Tasks, filterable by status, priority, trip phase |
| `get_packing_list` | Packing items by packed state, category, family member |
| `get_documents` | Documents by category |
| `get_expenses` | Logged expenses by category |
| `get_notes` | Sticky notes |

### Changes the trip's own data (applied in the browser)
| Tool | Effect |
|---|---|
| `add_task`, `complete_task` | Create a task, mark one done by title |
| `add_expense` | Log an expense in ILS |
| `update_budget_category`, `update_total_budget`, `update_daily_budget` | Adjust budgets |
| `toggle_packing_item` | Check or uncheck a packing item |
| `add_note` | Add a sticky note, optionally linked to a location |
| `add_itinerary_stop`, `add_to_itinerary` | Add a stop to a day (`day-1`…`day-21`) |
| `add_document` | File a document with confirmation number, dates, cost, cancellation terms |
| `set_reminder` | Remember something for a future date |

### Reaches outside the app
| Tool | Where it goes |
|---|---|
| `search_email` | Triggers the Gmail scan pipeline (`email-scan` edge function) |
| `search_place` | Google Maps Places, optionally biased to the route |
| `show_directions` | Google Maps directions, drawn on the app's map |
| `convert_currency` | Live USD/ILS via `open.er-api.com`, cached 24h, fallback rate 3.57 |

### Conversation helpers
| Tool | Purpose |
|---|---|
| `ask_clarification` | Ask instead of guessing when a required detail is missing |
| `get_daily_plan` | Render the full plan for a given day |
| `estimate_drive_time` | Drive-time estimate between two points on the route |

## What he cannot do

- **He cannot browse or search the web.** There is no web-search tool and there never has been;
  `git log -S` over the whole history finds none. Anything not in his prompt or in Supabase, he
  does not know. Opening hours, road closures, park alerts and "is this place still open" are
  all outside his reach.
- **He cannot act without the browser.** Write tools are applied client-side, so no action
  happens from a background job or a scheduled scan.
- **He cannot see attachments or files.** Documents reach him as rows, not as content.
- **He is only as fresh as the app's data.** If a booking row is stale, so is Moti.

## Known gaps

1. No live information (see above). A `search_web` tool is proposed, backed by OpenAI's search
   model behind the tool boundary so the existing 24 tools and `gpt-4o` stay untouched.
2. The offline keyword fallback is thin, and it is exactly what the family will hit in the
   parks. Worth deciding what the critical answers are and making sure they live in the app.
3. Voice input exists (`useVoiceInput`, Web Speech API) but is browser-dependent and untested
   on the road.
