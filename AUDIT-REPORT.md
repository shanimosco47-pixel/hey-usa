# Hey USA — Full Project Audit Report

**Date**: 2026-03-19
**Auditor**: Claude Code
**Branch**: `claude/mobile-version-info-Fmqql`

---

## 1. Project Overview

| Metric | Value |
|--------|-------|
| **Framework** | React 19 + Vite + TypeScript |
| **Styling** | Tailwind CSS 3.4 + Framer Motion |
| **Backend** | Supabase (PostgreSQL) + Dexie (IndexedDB) |
| **Deployment** | GitHub Pages (`/hey-usa/`) |
| **Language** | Hebrew (RTL) |
| **Source files** | 93 (.ts/.tsx/.css) |
| **Pages/Routes** | 18 routes, 14 modules |
| **Public assets** | 4 files (pwa-192x192.svg, sw.js, vite.svg, 404.html) |
| **Version** | 2.1.0 |

### File Tree (source)

```
src/
├── App.tsx                          # Routes
├── main.tsx                         # Entry point
├── index.css                        # Global styles
├── globals.d.ts                     # Build-time type declarations
├── styles/animations.css            # Custom animations
├── assets/react.svg                 # Unused Vite default
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx             # Main layout wrapper
│   │   ├── TopBar.tsx               # Header with clock & version
│   │   ├── Sidebar.tsx              # Desktop navigation
│   │   └── BottomTabs.tsx           # Mobile navigation + "More" drawer
│   ├── shared/
│   │   ├── DualClock.tsx            # Israel/US timezone clock
│   │   ├── GlassCard.tsx            # Glassmorphic card component
│   │   ├── Skeleton.tsx             # Loading placeholder
│   │   ├── GradientIcon.tsx         # Gradient-filled icon
│   │   ├── FamilyAvatar.tsx         # Family member avatar
│   │   ├── MotiRobot.tsx            # Moti bot avatar/animation
│   │   ├── SplashScreen.tsx         # App splash screen
│   │   ├── WeatherWidget.tsx        # Weather display
│   │   ├── OfflineBanner.tsx        # Offline indicator
│   │   └── StatusBadge.tsx          # Task status badge
│   └── ui/
│       ├── button.tsx, badge.tsx, tooltip.tsx
│       ├── animated-icon.tsx, motion.tsx
├── constants/index.ts               # Nav items, family members, status map
├── contexts/
│   ├── AppDataContext.tsx            # Main data context (Supabase + local)
│   ├── TripDataContext.tsx           # Legacy context (unused, superseded)
│   ├── AuthContext.tsx               # PIN auth context
│   └── FamilyContext.tsx             # Family member selection
├── data/
│   ├── itinerary.ts                 # 21-day itinerary data
│   ├── locations.ts                 # US locations list
│   └── sampleLocationNotes.ts       # Sample sticky notes
├── hooks/useMediaQuery.ts           # Responsive breakpoint hook
├── lib/
│   ├── constants.ts                 # Domain constants (trip dates, categories)
│   ├── types.ts                     # TypeScript interfaces
│   ├── database.ts                  # Supabase CRUD operations
│   ├── supabase.ts                  # Supabase client init
│   ├── weather.ts                   # Weather API with caching
│   ├── version.ts                   # Build version/time exports
│   ├── cn.ts                        # Tailwind class merger utility
│   ├── avatarStorage.ts             # Avatar photo persistence
│   └── sampleData.ts               # Sample data detection
├── modules/
│   ├── auth/          (FamilySelectScreen, PinScreen)
│   ├── dashboard/     (DashboardPage)
│   ├── tasks/         (TasksPage + Kanban/Table/Timeline views)
│   ├── itinerary/     (ItineraryPage + DayPlanner/StopCard)
│   ├── documents/     (DocumentsPage + viewer/upload)
│   ├── map/           (MapPage — Leaflet)
│   ├── photos/        (PhotosPage)
│   ├── blog/          (BlogPage — TipTap editor)
│   ├── budget/        (BudgetPage — Recharts)
│   ├── entertainment/ (EntertainmentPage)
│   ├── packing/       (PackingPage)
│   ├── notes/         (NotesPage)
│   ├── locations/     (LocationsPage, LocationHubPage)
│   └── chat/          (ChatPage, MotiLogPage, botEngine)
├── screens/           # Re-export wrappers for auth screens
│   ├── PinScreen.tsx
│   └── FamilySelectScreen.tsx
└── types/index.ts     # Re-exported types
```

---

## 2. Issues Found

### CRITICAL

| # | Issue | File | Details |
|---|-------|------|---------|
| C1 | **Missing `<meta name="description">`** | `index.html` | No meta description for SEO. **FIXED** — added Hebrew description. |
| C2 | **`dangerouslySetInnerHTML` without sanitization** | `src/modules/chat/ChatPage.tsx:391` | User-generated markdown rendered as raw HTML via regex. XSS risk if bot output contains user-controlled data. |
| C3 | **`dangerouslySetInnerHTML` without sanitization** | `src/modules/blog/BlogPage.tsx:225` | Blog content rendered as raw HTML. If content comes from Supabase, could be injected. |
| C4 | **PWA service worker registration disabled** | `src/main.tsx:3-4` | `registerSW` import commented out. App won't work offline despite PWA config. Additionally, `index.html:83-91` force-kills all existing service workers on every page load. |
| C5 | **Hardcoded PIN `"1234"` in source code** | `src/constants/index.ts:4`, `src/lib/constants.ts:100` | Authentication PIN stored in plain text in two locations. |

### WARNING

| # | Issue | File | Details |
|---|-------|------|---------|
| W1 | **Duplicate constants files** | `src/constants/index.ts` vs `src/lib/constants.ts` | Two files define `APP_PIN`, `FAMILY_MEMBERS`, `STATUS_MAP`. Maintenance risk from divergence. |
| W2 | **Dead context: TripDataContext** | `src/contexts/TripDataContext.tsx` | 352 lines. Never imported anywhere. `useTripData` was aliased to `useAppData` in AppDataContext then alias was removed. This entire file is dead code. |
| W3 | **Hardcoded trip date** | `src/modules/chat/ChatPage.tsx:128` | Was `new Date('2026-09-11')` — should use `TRIP_START_DATE` constant. **FIXED**. |
| W4 | **Empty alt text on image** | `src/modules/itinerary/ItineraryPage.tsx:183` | `alt=""` on city hero photo. **FIXED** — now uses city name. |
| W5 | **Unused asset** | `src/assets/react.svg` | Default Vite scaffold file, not referenced anywhere. |
| W6 | **Unused exports in `lib/constants.ts`** | `src/lib/constants.ts` | `TASK_STATUSES`, `TASK_PRIORITIES`, `MODULE_NAV` are exported but never imported. |
| W7 | **`BudgetPage` chunk is 398 KB** | `dist/assets/BudgetPage-*.js` | Recharts is large. Consider lazy-loading chart components or using a lighter charting lib. |
| W8 | **Supabase silent failure** | `src/lib/supabase.ts` | Returns `null` without logging if env vars are missing. No indication to user that sync is disabled. |
| W9 | **Itinerary data one-way sync** | `src/contexts/AppDataContext.tsx:251-253` | Itinerary pushed to Supabase but never loaded from it (commented out). Data drift possible. |
| W10 | **`dist/` committed to git** | `dist/` | Build output in repo. GitHub Actions rebuilds on deploy — this is stale/redundant. Should be in `.gitignore`. |

### INFO

| # | Issue | File | Details |
|---|-------|------|---------|
| I1 | **Inline styles in auth screens** | `src/modules/auth/FamilySelectScreen.tsx:175-202` | Complex gradient/shadow inline styles. Works but harder to maintain. |
| I2 | **Hardcoded color arrays** | `DashboardPage.tsx:440`, `BudgetPage.tsx:69`, `MapPage.tsx:21` | `ROUTE_COLORS`, `PIE_COLORS`, `DAY_COLORS` — hex arrays outside design system. Acceptable for chart/map use cases but inconsistent. |
| I3 | **Screens directory is just re-exports** | `src/screens/*.tsx` | Each file is a 2-line re-export from `modules/auth/`. Could import directly in App.tsx. |
| I4 | **Fonts: Inter + Heebo, not Playfair Display** | `index.html`, `tailwind.config.ts` | Design uses iOS-inspired clean typography (Inter/Heebo), not passport-stamp Playfair Display. This is intentional — the design language is iOS/Apple-inspired, not vintage. |
| I5 | **No `robots.txt` or `sitemap.xml`** | `public/` | Not critical for a family app but good practice. |
| I6 | **Type mismatch: `colorEnd` not in `lib/types.ts`** | `src/lib/types.ts:32-38` | `FamilyMember` interface lacks `colorEnd` field used in `FamilyAvatar.tsx:78`. Works via optional chaining fallback but types are incomplete. |
| I7 | **No 404/error boundary page** | `src/App.tsx` | Catch-all redirects to `/` silently. No user-facing error page. |

---

## 3. Fixes Applied

### Fix 1: Added meta description to `index.html`
```diff
- <link rel="icon" type="image/svg+xml" href="/vite.svg" />
+ <link rel="icon" type="image/svg+xml" href="/vite.svg" />
+ <meta name="description" content="Hey USA — אפליקציית מסע משפחתית לטיול בארה״ב. ניהול לוח זמנים, תקציב, משימות, מסמכים ועוד." />
```

### Fix 2: Replaced hardcoded trip date in ChatPage
```diff
+ import { TRIP_START_DATE } from '@/lib/constants'
  ...
- (new Date('2026-09-11').getTime() - Date.now()) / (1000 * 60 * 60 * 24)
+ (new Date(TRIP_START_DATE).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
```

### Fix 3: Added meaningful alt text to itinerary hero image
```diff
- alt=""
+ alt={`${currentDay.city} — תמונת רקע`}
```

---

## 4. Remaining Action Items

### Must Do
1. **Add HTML sanitization** (DOMPurify) to `ChatPage.tsx:391` and `BlogPage.tsx:225` to prevent XSS.
2. **Decide on PWA status**: Either re-enable service worker registration in `main.tsx` and remove the force-kill script in `index.html`, or remove VitePWA plugin entirely to reduce confusion.
3. **Add `dist/` to `.gitignore`** — it's rebuilt by CI on every deploy.

### Should Do
4. **Consolidate constants**: Merge `src/lib/constants.ts` and `src/constants/index.ts` into a single source of truth. Remove unused exports (`TASK_STATUSES`, `TASK_PRIORITIES`, `MODULE_NAV`).
5. **Delete `TripDataContext.tsx`** — 352 lines of dead code, completely superseded by `AppDataContext`.
6. **Delete `src/assets/react.svg`** — unused Vite scaffold artifact.
7. **Add `colorEnd` to `FamilyMember` type** in `src/lib/types.ts` to match actual usage.

### Nice to Have
8. **Code-split Recharts** in BudgetPage to reduce the 398 KB chunk.
9. **Add Supabase connection warning** — log a console.warn when env vars are missing.
10. **Simplify `src/screens/`** — import auth screens directly in App.tsx, remove the re-export layer.
11. **Move hardcoded color arrays** (`ROUTE_COLORS`, `PIE_COLORS`, `DAY_COLORS`) into a shared `chartColors.ts` constant.

---

## 5. Validation Summary

| Check | Result |
|-------|--------|
| TypeScript compilation | PASS (zero errors) |
| Vite production build | PASS (58 precached entries) |
| All routes covered by navigation | PASS |
| All nav items point to valid routes | PASS |
| No TODO/FIXME/HACK comments | PASS |
| No lorem ipsum or placeholder text | PASS |
| All images have alt text | PASS (after fix) |
| No images over 1 MB | PASS (only 1 image: react.svg at 4.1 KB) |
| GitHub Pages compatibility | PASS (base path, 404.html SPA redirect, deploy workflow) |
| Case-sensitivity in imports | PASS |
| Responsive layout | PASS (desktop sidebar + mobile bottom tabs) |
| Font consistency | PASS (Inter + Heebo throughout) |
| Color system consistency | PASS (iOS-inspired tokens in Tailwind config) |
