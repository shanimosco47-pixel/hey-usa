# Design Spec: Apple-Level Design Upgrade

**Date:** 2026-03-12
**Status:** Approved
**Direction:** Warm Glass + Apple System Colors

## Overview

Transform the Hey USA family travel app from its current generic Tailwind-starter aesthetic into a premium, Apple-quality interface. The upgrade touches every visual layer: color palette, typography, surfaces, iconography, motion, and layout system.

The app is a Hebrew RTL interface for a family trip to the USA (Sep 2026). It has 10 modules (dashboard, tasks, itinerary, documents, map, photos, blog, budget, entertainment, packing) plus auth screens (PIN entry, family member select).

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Visual direction | Warm Glass | Frosted glass surfaces, layered depth, dark hero cards — premium but inviting |
| Color system | Apple iOS system colors | Universal, high-contrast, professionally calibrated. Replaces desert palette entirely |
| Typography | Inter + Heebo | Apple-like feel for Latin, excellent Hebrew support. Free Google Fonts |
| Motion level | Subtle & purposeful | Spring-based transitions, hover lifts, skeleton loaders. Natural, never flashy |

## 1. Color Palette

### Remove Entirely
- sand (#faf3e8, #f0e4cc)
- terracotta (#c44d34, #e8735e)
- sage (#2d7d46, #4a9e62)
- sky (#4a90d9, #7ab5e8)
- gold (#f5c542, #8B6914)
- cream (#fff5e6)
- brown (#5c3d2e, #8b6f5e)

### New System Colors

**Backgrounds & Surfaces:**
```
--bg-primary: #f5f5f7          /* Apple signature light gray */
--bg-elevated: rgba(255,255,255,0.72)  /* Frosted glass */
--bg-card: rgba(255,255,255,0.80)
--bg-dark: #1d1d1f             /* Dark hero cards */
--bg-dark-secondary: #2d2d30
```

**Text:**
```
--text-primary: #1d1d1f        /* Apple primary text */
--text-secondary: #86868b      /* Apple secondary text */
--text-tertiary: #aeaeb2       /* Subtle labels */
--text-on-dark: #ffffff
--text-on-dark-secondary: rgba(255,255,255,0.7)
```

**iOS System Accents:**
```
--color-blue: #007AFF
--color-green: #34C759
--color-red: #FF3B30
--color-orange: #FF9500
--color-yellow: #FFCC00
--color-purple: #AF52DE
--color-indigo: #5856D6
--color-teal: #5AC8FA
--color-pink: #FF2D55
```

**Module Color Assignments:**
| Module | Color | Gradient |
|--------|-------|----------|
| Dashboard | blue | #007AFF → #5AC8FA |
| Tasks | indigo | #5856D6 → #AF52DE |
| Itinerary | orange | #FF9500 → #FFCC00 |
| Documents | red | #FF3B30 → #FF6259 |
| Map | blue | #007AFF → #34C759 |
| Photos | pink | #FF2D55 → #FF6B8A |
| Blog | green | #34C759 → #30D158 |
| Budget | orange | #FF9500 → #FF6723 |
| Entertainment | purple | #AF52DE → #BF5AF2 |
| Packing | teal | #5AC8FA → #64D2FF |

**Status Colors (keep semantic meaning, use iOS variants):**
```
--status-todo: #FF3B30
--status-progress: #FF9500
--status-done: #34C759
--status-waiting: #8E8E93
```

**Trip Phase Colors (replaces group-pre/during/post):**
```
--phase-pre: #5856D6       /* indigo — pre-trip planning */
--phase-during: #34C759    /* green — during trip */
--phase-post: #007AFF      /* blue — post-trip */
```

**Task Priority Colors:**
```
--priority-low: #8E8E93     /* system gray */
--priority-medium: #007AFF  /* system blue */
--priority-high: #FF9500    /* system orange */
--priority-urgent: #FF3B30  /* system red */
```

**Family Member Colors:**
| Member | Color | Use |
|--------|-------|-----|
| aba (Dad) | #007AFF (blue) | Avatar ring, assignments |
| ima (Mom) | #FF2D55 (pink) | Avatar ring, assignments |
| kid1 | #34C759 (green) | Avatar ring, assignments |
| kid2 | #FF9500 (orange) | Avatar ring, assignments |
| kid3 | #5856D6 (indigo) | Avatar ring, assignments |

## 2. Typography

### Font Stack
Load via `<link>` tags in `index.html` (not CSS @import — avoids render-blocking):
```html
<!-- In index.html <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Heebo:wght@400;500;600;700&display=swap" rel="stylesheet">
```
```css
font-family: 'Inter', 'Heebo', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Type Scale
| Token | Size | Weight | Letter-spacing | Use |
|-------|------|--------|---------------|-----|
| `text-hero` | 34px | 700 | -1.5px | Big numbers (countdown) |
| `text-title` | 22px | 700 | -0.5px | Page titles |
| `text-headline` | 17px | 600 | -0.3px | Card titles, section heads |
| `text-body` | 15px | 400 | 0 | Body text |
| `text-subhead` | 13px | 500 | 0 | Secondary info |
| `text-caption` | 11px | 600 | 0.5px | Section labels (Latin: all-caps; Hebrew: normal case), timestamps |

### Heading Pattern
All page headers follow this structure:
```
[CAPTION - all caps, secondary color, spaced tracking]
[TITLE - large, bold, tight tracking]
[optional SUBHEAD - secondary color, normal weight]
```

Example:
```
SCHEDULE
לוח זמנים
20 days in the western USA | September 2026
```

## 3. Surfaces & Depth

### Three Elevation Levels

**Level 0 — Flat (page background):**
```css
background: #f5f5f7;
```

**Level 1 — Raised (cards, list items):**
```css
background: rgba(255, 255, 255, 0.72);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 0.5px solid rgba(0, 0, 0, 0.06);
border-radius: 16px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
```

**Level 2 — Floating (modals, sheets, popovers):**
```css
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(40px);
-webkit-backdrop-filter: blur(40px);
border: 0.5px solid rgba(0, 0, 0, 0.1);
border-radius: 20px;
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
```

### Dark Hero Cards
For the countdown widget and other featured content:
```css
background: linear-gradient(135deg, #1d1d1f 0%, #2d2d30 100%);
border-radius: 20px;
padding: 20px;
color: white;
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
```

### Glass Navigation Bars
```css
/* Top bar */
background: rgba(255, 255, 255, 0.80);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);

/* Bottom tabs */
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border-top: 0.5px solid rgba(0, 0, 0, 0.06);
```

## 4. Icon System

Replace the current pattern (flat Lucide icon on tinted circle) with iOS-style gradient rounded squares:

```css
/* Icon container */
width: 32px;
height: 32px;
border-radius: 8px; /* 10px for larger 40px icons */
background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
display: flex;
align-items: center;
justify-content: center;
/* Glow shadow — pass module color as inline style, e.g. style={{ '--icon-glow': '#007AFF' }} */
box-shadow: 0 2px 8px color-mix(in srgb, var(--icon-glow) 30%, transparent);

/* Icon itself */
color: white;
width: 18px;
height: 18px;
```

Each module icon gets a glow shadow that matches its gradient color, creating subtle colored light beneath each icon.

## 5. Motion & Animation

### Principles
- Every animation serves a purpose (guides attention, confirms action, shows relationship)
- Duration: 200-350ms for micro-interactions, 300-500ms for page transitions
- Easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` for natural deceleration (Apple's standard ease-out)

### Specific Animations

**Card hover (desktop):**
```css
transition: transform 200ms ease-out, box-shadow 200ms ease-out;
&:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
&:active {
  transform: scale(0.98);
}
```

**Page transitions:**
```css
/* Enter */
@keyframes page-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
animation: page-enter 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

**Staggered list items:**
```css
@keyframes list-item-enter {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Each item delayed by 50ms × index */
animation: list-item-enter 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards;
animation-delay: calc(var(--index) * 50ms);
```

**Skeleton shimmer (loading states):**
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
background-size: 200% 100%;
animation: shimmer 1.5s ease-in-out infinite;
border-radius: 8px;
```

**Bottom sheet / drawer:**
```css
transition: transform 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
/* Closed: translate-y-full, Open: translate-y-0 */
```

### Easing Tokens
```css
--ease-default: cubic-bezier(0.25, 0.46, 0.45, 0.94);  /* Natural deceleration — use everywhere */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);       /* Overshoot — toggle switches, bouncy elements */
```
Use `var(--ease-default)` consistently. The CSS `ease-out` keyword should NOT be used (it's a different curve).

### Reduced Motion
Use Tailwind's `motion-reduce:` variant instead of a global `!important` override:
```css
/* In component classes: */
class="motion-reduce:transition-none motion-reduce:animate-none"
```
This is scoped and doesn't fight Tailwind utilities.

## 6. Layout System

### Spacing Scale
Use Tailwind's default scale consistently:
- `p-4` (16px) — mobile content padding
- `p-6` (24px) — desktop content padding
- `gap-3` (12px) — between grid items
- `gap-4` (16px) — between sections
- `mb-6` (24px) — major section breaks
- `mb-8` (32px) — page section breaks

### Page Structure
Every module page follows this pattern:
```
[Page Header]
  - Caption (all-caps, secondary, tracking-wide)
  - Title (large, bold, tight tracking)
  - Optional subtitle

[Content Area]
  - max-w-2xl mx-auto px-4 md:px-6
  - Consistent vertical rhythm
```

### Navigation

**Top Bar (56px height):**
- Frosted glass background
- App title (left in RTL), centered dual clock, avatar (right in RTL)
- Clean separator line (not border — 0.5px solid rgba(0,0,0,0.06))

**Sidebar (desktop, w-56 / 224px — matches current):**
- Frosted glass background
- Module list with iOS-style active indicator (tinted background pill + bold text + system blue)
- Icon + label per row

**Bottom Tabs (mobile, 64px height):**
- Frosted glass background
- 5 tabs: Home, Tasks, Map, Photos, More
- Active state: filled icon + system blue tint + bold label
- "More" opens a bottom sheet with remaining modules

### Responsive Breakpoints
- Mobile: < 768px (bottom tabs, single column)
- Desktop: >= 768px (sidebar, wider content area)

## 7. Component Patterns

### Cards
All cards use Level 1 elevation. Content cards have:
- 16px padding
- 16px border-radius
- Consistent internal spacing (12px between elements)

### Buttons
**Primary:** System blue background, white text, 12px border-radius, 44px min height
**Secondary:** Glass background (white/72 blur), primary text, subtle border
**Ghost:** No background, system blue text

### Form Inputs
- Glass background (white/60 blur)
- 12px border-radius
- 0.5px border, darkens on focus
- 44px height (touch target)

### PIN Keypad
- Glass number buttons (white/72 blur, 20px border-radius)
- 64px height per button
- Subtle press animation (scale 0.95)
- PIN dots: filled with system blue (not terracotta)

## 8. Files to Modify

### Core Design System
1. `tailwind.config.ts` — new color palette, font family, animations
2. `src/index.css` — CSS variables, font imports, global styles, RTL adjustments
3. `src/App.css` — remove (consolidate into index.css)

### Layout Components
4. `src/components/layout/TopBar.tsx` — frosted glass, new typography
5. `src/components/layout/Sidebar.tsx` — glass surface, iOS-style active states
6. `src/components/layout/BottomTabs.tsx` — glass bar, system blue active, sheet animation
7. `src/components/layout/AppShell.tsx` — new background color

### Shared Components
8. `src/components/shared/DualClock.tsx` — new typography tokens
9. `src/components/shared/FamilyAvatar.tsx` — gradient ring instead of plain circle
10. `src/components/shared/StatusBadge.tsx` — iOS status colors
11. `src/components/shared/OfflineBanner.tsx` — glass surface styling

### Auth Screens
12. `src/modules/auth/PinScreen.tsx` — glass keypad, new background, system blue dots
13. `src/modules/auth/FamilySelectScreen.tsx` — glass cards, gradient avatars

### Module Pages (all 10)
14. `src/modules/dashboard/DashboardPage.tsx` — dark hero card, gradient icons, new typography
15. `src/modules/tasks/TasksPage.tsx` — glass cards, iOS status colors
16. `src/modules/itinerary/ItineraryPage.tsx` — glass surfaces, new day selector
17. `src/modules/itinerary/components/DaySelector.tsx` — pill-style selector
18. `src/modules/itinerary/components/StopCard.tsx` — glass card styling
19. `src/modules/itinerary/components/DriveSegment.tsx` — subtle connector line
20. `src/modules/documents/DocumentsPage.tsx` — glass cards
21. `src/modules/map/MapPage.tsx` — glass overlay on map
22. `src/modules/photos/PhotosPage.tsx` — clean grid, glass overlay
23. `src/modules/blog/BlogPage.tsx` — glass cards, new typography
24. `src/modules/budget/BudgetPage.tsx` — glass surfaces, iOS chart colors
25. `src/modules/entertainment/EntertainmentPage.tsx` — glass cards
26. `src/modules/packing/PackingPage.tsx` — glass checklist items

### Constants & Data
27. `src/constants/index.ts` — update FAMILY_MEMBERS colors to new iOS palette, update STATUS_MAP bg classes
28. `src/lib/constants.ts` — update FAMILY_MEMBERS colors, TASK_STATUSES colors, TASK_PRIORITIES colors, fix `/playlist` → `/entertainment` route bug
29. `index.html` — add Google Fonts `<link>` tags for Inter + Heebo

### New Files
30. `src/styles/animations.css` — centralized animation keyframes and utilities
31. `src/components/shared/GradientIcon.tsx` — reusable iOS-style gradient icon component
32. `src/components/shared/GlassCard.tsx` — reusable glass surface component
33. `src/components/shared/Skeleton.tsx` — shimmer loading skeleton component

### Cleanup
34. `src/App.css` — delete entirely (current content is Vite boilerplate: `#root { max-width: 1280px }` etc. — not used, AppShell handles layout)
35. Consolidate duplicate constants: `src/constants/index.ts` is the canonical source; `src/lib/constants.ts` is the secondary file used by some modules. Both need updating but no consolidation in this phase.

## 9. Implementation Order

1. **Foundation** — tailwind config, CSS variables, fonts, animations
2. **Shared components** — GlassCard, GradientIcon, Skeleton, updated shared components
3. **Layout shell** — TopBar, Sidebar, BottomTabs, AppShell
4. **Auth screens** — PinScreen, FamilySelectScreen
5. **Dashboard** — hero card, module grid (the showcase page)
6. **Module pages** — one at a time, starting with itinerary (most complex)
7. **Polish pass** — motion, hover states, loading states, edge cases

## 10. New Component APIs

### GlassCard
```tsx
interface GlassCardProps {
  elevation?: 1 | 2;       // Level 1 (raised) or Level 2 (floating). Default: 1
  padding?: 'sm' | 'md' | 'lg'; // 12px | 16px | 20px. Default: 'md'
  className?: string;       // Additional classes
  children: React.ReactNode;
}
// Usage: <GlassCard elevation={2}><h3>Title</h3></GlassCard>
```

### GradientIcon
```tsx
interface GradientIconProps {
  icon: LucideIcon;         // Lucide icon component
  gradient: [string, string]; // [startColor, endColor] hex values
  size?: 'sm' | 'md' | 'lg'; // 28px | 32px | 40px. Default: 'md'
  className?: string;
}
// Usage: <GradientIcon icon={CheckSquare} gradient={['#5856D6', '#AF52DE']} />
// The component handles the glow shadow automatically from gradient[0].
```

### Skeleton
```tsx
interface SkeletonProps {
  variant?: 'text' | 'circle' | 'card' | 'rect'; // Default: 'text'
  width?: string | number;   // CSS width. Default: '100%'
  height?: string | number;  // CSS height. Default: based on variant
  lines?: number;            // For variant='text': number of text lines. Default: 1
  className?: string;
}
// Usage: <Skeleton variant="text" lines={3} />
//        <Skeleton variant="circle" width={40} height={40} />
//        <Skeleton variant="card" height={120} />
```

## 11. Radix UI Component Styling

All Radix UI primitives used in the app need glass treatment:

- **Dialog overlay**: `bg-black/30 backdrop-blur-sm`, content uses Level 2 elevation
- **Dialog content**: Level 2 glass surface, `rounded-2xl`, system blue primary buttons
- **Select trigger**: Glass input style (white/60 blur, 0.5px border, 12px radius)
- **Select content**: Level 2 glass surface, items highlight with `bg-[--color-blue]/10`
- **Dropdown menu**: Level 2 glass surface, same item highlight pattern
- **Accordion**: Glass card per item, `border-b` separator between items
- **Checkbox**: System blue fill when checked, rounded-md
- **Tabs**: Glass surface tab bar, active tab gets system blue underline or pill background
- **Progress**: Rounded-full track (`bg-black/5`), system blue fill bar

## 12. Third-Party Library Theming

### Recharts (Budget module)
- Chart colors: use module color assignments from Section 1 (e.g., flights = blue, food = orange)
- Axis labels: `text-secondary` color (#86868b), 11px Inter
- Grid lines: `rgba(0, 0, 0, 0.04)` — barely visible
- Tooltip: Level 2 glass surface styling
- No chart borders or outlines — clean Apple look

### Leaflet (Map module)
- Map controls (zoom +/-): glass surface treatment (white/80 blur, rounded-lg)
- Popups/tooltips: Level 1 glass surface, `rounded-xl`, system typography
- Custom markers: gradient-filled circles matching module colors
- Map tiles: default OpenStreetMap — no change needed
- Overlay panels: glass surface positioned absolutely over the map

## 13. Technical Notes

- **No new dependencies** for motion — CSS animations and transitions only
- **Google Fonts** loaded via `<link>` tags in index.html (not CSS @import)
- **Backdrop-filter** has 97%+ browser support; always include `-webkit-` prefix
- **CSS custom properties** for the color system, Tailwind for utility classes
- **RTL**: This is an RTL-only app. Current physical properties (right-0, border-l) are intentional and correct. No change to RTL approach.
- **Dark mode**: Not in scope for this phase. The CSS variable architecture makes future dark mode straightforward.
- **0.5px borders**: On non-Retina (1x DPR) displays, 0.5px may render as 0 or 1px. This is acceptable — the borders are decorative, not structural.
- **Safe area**: Add `padding-bottom: env(safe-area-inset-bottom)` to bottom tabs for notched devices. Add a Tailwind utility `pb-safe` via config.
