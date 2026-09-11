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
      ↺ tool loop (up to 4 rounds): server tools run, results go back, model may ask again
          ├ read tools  → Supabase REST, service-role key
          └ search_web  → OpenAI Responses API, hosted web_search tool
  ← { text, actions[], search[] }
  → AppDataContext.executeMotiAction() applies write actions in the app
  → dailyPack records the live results for offline use

Scheduled, with no browser open:
  cron → /functions/v1/trip-watch → search_web → detect.ts → chat_messages + trip_alerts
```

Details that matter:

- **The tool loop is bounded**, not open-ended: four rounds, twelve tool calls,
  forty-five seconds, and two consecutive fully failing rounds, each overridable
  by environment variable. Identical repeat calls are served from a per-request
  cache. When the budget runs out the model is told to answer with what it has
  and to say what went unverified. Only the final message reaches the user;
  intermediate turns never leave the server.
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
- **Offline is a real mode, and now has two stages.** If the fetch fails, `botEngine`
  tries the **Daily Pack** first and only then `getKeywordResponse()`:

  ```
  Online Moti → Daily Pack → keyword engine
  ```

## What he can do today

24 tools. Grouped by what they touch.

### Reads the trip's own data (server-side)

| Tool               | Returns                                                |
| ------------------ | ------------------------------------------------------ |
| `get_tasks`        | Tasks, filterable by status, priority, trip phase      |
| `get_packing_list` | Packing items by packed state, category, family member |
| `get_documents`    | Documents by category                                  |
| `get_expenses`     | Logged expenses by category                            |
| `get_notes`        | Sticky notes                                           |

### Changes the trip's own data (applied in the browser)

| Tool                                                                   | Effect                                                                    |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `add_task`, `complete_task`                                            | Create a task, mark one done by title                                     |
| `add_expense`                                                          | Log an expense in ILS                                                     |
| `update_budget_category`, `update_total_budget`, `update_daily_budget` | Adjust budgets                                                            |
| `toggle_packing_item`                                                  | Check or uncheck a packing item                                           |
| `add_note`                                                             | Add a sticky note, optionally linked to a location                        |
| `add_itinerary_stop`, `add_to_itinerary`                               | Add a stop to a day (`day-1`…`day-21`)                                    |
| `add_document`                                                         | File a document with confirmation number, dates, cost, cancellation terms |
| `set_reminder`                                                         | Remember something for a future date                                      |

### Reaches outside the app

| Tool               | Where it goes                                                              |
| ------------------ | -------------------------------------------------------------------------- |
| `search_email`     | Triggers the Gmail scan pipeline (`email-scan` edge function)              |
| `search_place`     | Google Maps Places, optionally biased to the route                         |
| `show_directions`  | Google Maps directions, drawn on the app's map                             |
| `convert_currency` | Live USD/ILS via `open.er-api.com`, cached 24h, fallback rate 3.57         |
| `search_web`       | Live web search, server-side, pinned to authoritative sources per category |

### Conversation helpers

| Tool                  | Purpose                                                   |
| --------------------- | --------------------------------------------------------- |
| `ask_clarification`   | Ask instead of guessing when a required detail is missing |
| `get_daily_plan`      | Render the full plan for a given day                      |
| `estimate_drive_time` | Drive-time estimate between two points on the route       |

## search_web, in detail

Categories pin the search to sources that are actually authoritative:

| Category              | Allowed domains                                                           |
| --------------------- | ------------------------------------------------------------------------- |
| `parks`               | nps.gov, recreation.gov, fs.usda.gov, blm.gov                             |
| `roads`               | mdt.mt.gov, wyoroad.info, udot.utah.gov, nvroads.com, dot.ca.gov, nps.gov |
| `weather`             | weather.gov, noaa.gov, spc.noaa.gov                                       |
| `wildfire`            | inciweb.nwcg.gov, nifc.gov, airnow.gov, fs.usda.gov                       |
| `business`, `general` | unrestricted, minus a blocklist (reddit, quora, pinterest, facebook)      |

Rules that hold regardless of what the model decides:

- **Source hierarchy.** App data is the truth about our trip; email about booking
  changes; maps about places; the web about current external conditions only.
  Web results never overwrite trip data, and a contradiction is reported as one.
- **Trip-data questions spend nothing.** "Where are we sleeping tonight" is
  refused before any network call, with an instruction to answer from the itinerary.
- **Failure is explicit.** If both providers fail, Moti says current information
  could not be verified and names the official source. It never fills the gap.
- **Results are data, not instructions.** Text is stripped of control characters,
  zero-width characters, HTML comments and role-like tags, capped in length, and
  delivered inside an envelope labelled UNTRUSTED EXTERNAL CONTENT.

## Offline: the Daily Pack

Rebuilt whenever trip data changes and the browser is online, stored in
`localStorage` under `hey-usa-daily-pack`. Covers **today and tomorrow**:

- the day's itinerary, with times and coordinates
- the stay spanning that night: property, address, confirmation, cost, cancellation deadline
- documents dated to that day
- emergency numbers
- the latest alerts and weather Moti fetched while online

Cached external information is always shown with when it was fetched
("נבדק לאחרונה לפני שעתיים") plus an explicit note that it could not be verified
now. Anything matching pin / password / passcode / secret / token / cvv / card
number is filtered out before caching rather than stored.

## Trip Watch

A scheduled edge function, `trip-watch`, that runs with every browser closed.
Twice a day it reads tomorrow's itinerary and the booking for that night, checks
parks, roads, weather and wildfire for those places, and speaks only when
something material changed.

- **Detection** (`detect.ts`) is pure and separate from delivery: deterministic
  severity from source wording, route filtering that ignores generic words like
  "national park", and a diff against `trip_watch_state`.
- **Threshold:** `major` and above. Minor and informational conditions never notify.
- **No repeats:** the same closure notifies once, and again only if it worsens.
- **Delivery:** a message from Moti in `chat_messages` plus a row in `trip_alerts`.
- **Cadence:** two cron entries in `014_trip_watch.sql`, 13:00 and 02:00 UTC.

## What he cannot do

- **He cannot browse freely.** `search_web` queries the web through a provider
  and returns summarised, cited results; Moti does not open arbitrary pages,
  log into anything, or follow links of its own accord.
- **He cannot write anything without the browser.** Write tools are applied
  client-side by design; Trip Watch can notify, not change trip data.
- **He cannot see attachments or files.** Documents reach him as rows, not as content.
- **He is only as fresh as the app's data.** If a booking row is stale, so is Moti.

## Known gaps

1. **Push delivery does not exist.** Trip Watch writes to chat and the database;
   reaching a phone with the app closed needs a subscription store and VAPID keys.
2. **The search model is unverified against this account.** `MOTI_SEARCH_MODEL`
   defaults to a Responses-API model with a documented fallback to
   `gpt-4o-search-preview`; only a live call proves which path is taken.
3. **Weather in the Daily Pack is plumbed but unpopulated.** The weather widget's
   own cache is not wired in yet; alerts come only from Moti's searches.
4. **Trip facts still live in the system prompt** as well as the database:
   flights, confirmation numbers and the day-by-day plan are duplicated in
   `moti-chat/index.ts`. They agree today. Moving them to the database is a
   follow-up issue, not done here.
5. **Severity classification is English-only.** A Hebrew-only source reads as
   informational.
6. Voice input exists (`useVoiceInput`, Web Speech API) but is browser-dependent
   and untested on the road.

## Environment variables

| Name                                        | Default                 | Purpose                                   |
| ------------------------------------------- | ----------------------- | ----------------------------------------- |
| `OPENAI_API_KEY`                            | —                       | required, server-side only                |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | —                       | server-side reads and writes              |
| `ALLOWED_ORIGIN`                            | the GitHub Pages origin | CORS                                      |
| `MOTI_SEARCH_MODEL`                         | `gpt-5.6`               | Responses-API model carrying `web_search` |
| `MOTI_SEARCH_FALLBACK_MODEL`                | `gpt-4o-search-preview` | chat-completions fallback                 |
| `MOTI_SEARCH_TIMEOUT_MS`                    | `20000`                 | per-search timeout                        |
| `MOTI_MAX_TOOL_ROUNDS`                      | `4`                     | tool-loop rounds                          |
| `MOTI_MAX_TOOL_CALLS`                       | `12`                    | tool-loop total calls                     |
| `MOTI_TOOL_LOOP_TIMEOUT_MS`                 | `45000`                 | tool-loop wall clock                      |
