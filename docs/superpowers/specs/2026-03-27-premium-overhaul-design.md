# Hey USA Premium Overhaul — Design Spec

**Date:** 2026-03-27
**Goal:** Transform Hey USA from "works fine" to "feels premium" and get the whole family engaged.
**Timeline:** 6 months before trip (Sep 10-30, 2026)
**LLM preference:** OpenAI API (pay-as-you-go) for all AI features

## Context

Hey USA is a Hebrew RTL family trip planner for a 20-day USA RV trip. It has 16 feature modules covering dashboard, tasks, itinerary, map, budget, documents, packing, blog, photos, entertainment, Moti AI chat, locations, campsites, and notes. The core functionality works, but the app doesn't feel polished enough to engage the whole family — currently only the trip planner (Shani) uses it regularly.

**Problem:** The family doesn't open the app. It needs to feel premium and give each family member a reason to come back.

## Approach

Phased overhaul: polish first, then intelligence, then engagement, then content. Each phase delivers standalone value. Engagement features (Phase 3) are optional — the spec is designed so Phases 1+2 create a complete premium experience, with 3+4 layering on top.

---

## Phase 1: Foundation Polish

Make every screen feel crafted. No blank states, no layout jumps, no inconsistencies.

### 1.1 Design System Audit & Tightening

- Audit every page for spacing, font sizes, and colors that don't match `tailwind.config.ts` tokens
- Standardize card styles: every container uses `GlassCard` with consistent elevation and padding
- Consistent icon sizing (Lucide icons) and touch target padding (minimum 44px) across all modules
- Fix RTL quirks: arrows, flow indicators, horizontal lists that reverse incorrectly
- Ensure DM Sans / Playfair Display / Heebo font stack renders correctly everywhere
- Remove any hardcoded colors, spacing, or font sizes that bypass the design system

### 1.2 State Polish

Every page and interactive component must handle all states:

- **Loading:** Skeleton screens matching the layout shape (not spinners)
- **Empty:** Illustration or icon + helpful message + CTA (e.g., "No expenses yet — add your first one")
- **Error:** Friendly message with retry action, no raw error text
- **Optimistic UI:** Checking a task, adding an expense, toggling packing items — instant visual feedback, sync in background. Revert on failure with toast notification.

### 1.3 Transitions & Micro-Interactions

- Page transitions: fade + subtle slide using Framer Motion `AnimatePresence` on route changes
- List items: staggered enter animation for cards and rows
- Modal/dialog: scale-up entry with backdrop blur (consistent with glass design)
- Checkboxes, toggles, buttons: tactile spring animations (use existing stiffness: 400, damping: 17)
- Satisfying completion effects: confetti burst on major milestones (all items packed, trip prep 100%)
- No gratuitous animation — every animation communicates state change or provides feedback

### 1.4 Offline-First with Dexie

Dexie (IndexedDB) is installed but unused. Move from localStorage to Dexie for reliability and capacity:

- Define Dexie schema mirroring current data structures (tasks, expenses, itinerary, packing, etc.)
- Migrate existing localStorage data on first load
- Read/write through Dexie locally, sync to Supabase when online
- Sync strategy: last-write-wins with timestamp comparison (sufficient for family use)
- Offline indicator in nav bar (existing `OfflineBanner` component)
- Queue mutations when offline, flush on reconnect

### 1.5 Performance

- Run bundle analyzer (`npm run analyze`) and identify heavy chunks
- Verify lazy loading works for: MapPage (maplibre-gl), BlogEditor (Tiptap), BudgetPage (Recharts)
- Image optimization in photos module: thumbnails for gallery grid, full-size on tap
- Reduce initial JS payload — target under 200KB gzipped for first paint
- Measure and improve Lighthouse PWA + Performance scores

---

## Phase 2: Moti AI Upgrade

Moti has a keyword-based action parser (botEngine.ts) that can modify app data. What's missing is an actual LLM that can *converse*. This is the "wow" feature.

### 2.1 OpenAI Integration via Supabase Edge Function

- Create Supabase Edge Function `chat-completion` that proxies to OpenAI Chat Completions API
- Use `gpt-4o-mini` for cost efficiency (upgrade path to `gpt-4o` if needed)
- API key stored as Supabase secret, never exposed to client
- Client sends: user message + conversation history (last 10 messages) + trip context
- Edge function returns: streamed response for real-time feel

### 2.2 System Prompt & Trip Context

Build a system prompt that makes Moti a knowledgeable trip assistant:

- Trip dates, family members (names, roles), current date, days until trip
- Current itinerary summary (day → stops)
- Budget status (planned vs actual per category)
- Packing progress per family member
- Pending tasks count and priorities
- Moti personality: warm, fun, Hebrew-first, uses emojis, encouraging

Context is assembled client-side from AppDataContext and sent with each request. Keep under 2000 tokens.

### 2.3 Action Parsing Integration

- Keep the existing `botEngine.ts` action system
- Flow: user message → OpenAI for natural language response → check if response implies an action → execute action via existing dispatch
- OpenAI instructed to output structured action hints when the user wants to modify data (e.g., `[ACTION:add_expense:amount=50,category=food]`)
- Fallback: if OpenAI is unavailable, use existing keyword parser

### 2.4 Family-Aware Responses

- Moti adjusts tone based on logged-in family member
- Kids: fun facts, simpler language, encouraging, game-like
- Parents: planning-focused, budget-aware, practical suggestions
- Family member context passed in system prompt

### 2.5 Voice Input

- Wire existing `useVoiceInput` hook end-to-end
- Browser Speech Recognition API (Web Speech API) → text → send to Moti
- Visual feedback: pulsing mic icon during recording
- Great for in-car use during the trip itself

---

## Phase 3: Family Engagement Layer (Optional)

These features make the family *want* to open the app. Designed as additions on top of Phases 1+2.

### 3.1 Personalized Dashboard

After family member login, dashboard content adapts:

**Kids see:**
- Countdown with fun daily USA fact
- Trivia challenge shortcut
- Their packing progress (with family comparison)
- Moti chat shortcut ("Ask Moti anything!")
- Mini-games or entertainment shortcuts

**Parents see:**
- Planning overview: tasks remaining, documents status, budget summary
- Upcoming bookings and deadlines
- Quick-add expense / quick-add task
- Moti shortcut for planning queries

Implementation: Dashboard reads `currentUser` from AuthContext, renders different card grid based on role (parent vs child, configurable in family member data).

### 3.2 Light Gamification

No points system or heavy gamification. Just satisfying progress:

- **Packing race:** Family progress bars side by side — "אמא 80%, אבא 45%"
- **Trip prep achievements:** Badge-style unlocks — "All documents uploaded", "Every day planned", "Budget set"
- **Daily countdown facts:** New fun USA fact each day in the countdown (static list of 180+ facts)
- **Completion celebrations:** Confetti / animation when a major milestone is reached

### 3.3 Family Social Features

- **Activity voting:** Create polls on any itinerary stop — "Rafting or hiking on Day 7?" Family members vote, results show in real-time
- **Reactions:** Heart/thumbs-up on blog posts and photos (during and after trip)
- **Wish list:** Each family member can add wishes per location ("I want to see Old Faithful")
- Data stored in Supabase, simple vote/reaction tables

### 3.4 Notifications & Nudges

- PWA push notifications via existing Workbox setup
- Notification types: countdown milestones, document expiry, packing reminders, new poll
- Configurable per family member in settings
- Fallback: in-app notification badge on dashboard if push not permitted

---

## Phase 4: Content & Data Richness

Make the app feel like it *knows* the trip, not just stores data about it.

### 4.1 Location Intelligence

- Auto-enrich itinerary stops with: description, photos, tips, opening hours
- Source: OpenAI function calling to generate location briefs, or manual curation
- Weather forecast widget per location (closer to trip, use free weather API like Open-Meteo)
- Drive time display between consecutive stops (existing DriveSegment component)

### 4.2 Trip-Time Blog & Photos

During the trip itself:

- Quick photo capture: tap → photo → auto-tagged to current day and location
- Blog daily templates: pre-filled date/location, family can write a few lines each
- Photo gallery auto-organized by day
- Shareable trip journal link for family back home (stretch goal)

### 4.3 Documents Completeness

- Pre-trip document checklist: passports, ESTA, travel insurance, car rental confirmation, campsite bookings
- Auto-reminders for documents expiring within 30 days of trip
- Finish email scanning feature if partially built, or remove the UI if not viable

---

## Architecture Notes

### What Changes

| Layer | Current | After |
|-------|---------|-------|
| Local storage | localStorage | Dexie (IndexedDB) |
| AI | Keyword parser only | OpenAI via Supabase Edge Function + keyword fallback |
| Sync | Manual, no conflict resolution | Dexie → Supabase with last-write-wins |
| Dashboard | Same for everyone | Personalized by family member role |
| Notifications | None | PWA push notifications |

### What Stays the Same

- React 19 + Vite + Tailwind 3 + Radix UI stack
- Module structure (`src/modules/{name}/`)
- Supabase as backend (Postgres, Auth, Storage, Edge Functions)
- GitHub Pages deployment
- RTL Hebrew interface
- PIN auth + family member selection flow

### New Supabase Resources Needed

- Edge Function: `chat-completion` (OpenAI proxy)
- Tables: `votes`, `reactions`, `achievements`, `wishes` (Phase 3)
- Supabase secret: `OPENAI_API_KEY`

### Risk Mitigation

- **OpenAI costs:** Use `gpt-4o-mini` ($0.15/1M input tokens), cap context at 2000 tokens, rate-limit per user
- **Offline during trip:** Dexie ensures full offline capability, sync when WiFi available
- **Scope creep:** Each phase is independently shippable. Stop after any phase for a better app.
- **Data safety:** Never overwrite user-entered data. Migrations are additive only.

---

## Success Criteria

1. **Premium feel:** Every page has consistent design, proper loading/empty/error states, smooth transitions
2. **Moti works:** Family can chat with Moti in Hebrew and get useful, context-aware responses
3. **Family engagement:** At least 3 family members open the app regularly (measurable via Supabase auth logs)
4. **Offline reliable:** App works fully offline with Dexie, syncs when connected
5. **Trip ready:** By Aug 2026, all 4 phases complete and tested on family devices
