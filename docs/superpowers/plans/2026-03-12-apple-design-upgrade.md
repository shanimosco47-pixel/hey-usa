# Apple-Level Design Upgrade Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Hey USA app from generic Tailwind-starter to Apple-quality frosted glass design with iOS system colors.

**Architecture:** Pure CSS/Tailwind design system upgrade — no new runtime dependencies. Three new shared components (GlassCard, GradientIcon, Skeleton) become the building blocks. All 10 module pages, 4 layout components, and 2 auth screens get restyled.

**Tech Stack:** React 19, Tailwind 3, CSS custom properties, Google Fonts (Inter + Heebo), Lucide icons

**Spec:** `docs/superpowers/specs/2026-03-12-apple-design-upgrade.md`

---

## Chunk 1: Foundation

### Task 1: Add Google Fonts to index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add font preconnect and stylesheet links**

Add these lines inside `<head>`, before the `<title>` tag:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Heebo:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Also update the theme-color meta tag from `#c44d34` (old terracotta) to `#f5f5f7` (new Apple gray):
```html
<meta name="theme-color" content="#f5f5f7" />
```

- [ ] **Step 2: Verify fonts load**

Run: `npm run dev`
Open browser dev tools > Network tab. Confirm Inter and Heebo font files are loaded.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add Inter + Heebo Google Fonts and update theme color"
```

---

### Task 2: Replace Tailwind color palette and add typography tokens

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Replace entire tailwind.config.ts**

Replace the full file content with:

```ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // iOS System Colors
        ios: {
          blue: '#007AFF',
          green: '#34C759',
          red: '#FF3B30',
          orange: '#FF9500',
          yellow: '#FFCC00',
          purple: '#AF52DE',
          indigo: '#5856D6',
          teal: '#5AC8FA',
          pink: '#FF2D55',
          gray: '#8E8E93',
        },
        // Backgrounds & Surfaces
        surface: {
          primary: '#f5f5f7',
          elevated: 'rgba(255,255,255,0.72)',
          card: 'rgba(255,255,255,0.80)',
          dark: '#1d1d1f',
          'dark-secondary': '#2d2d30',
        },
        // Text
        apple: {
          primary: '#1d1d1f',
          secondary: '#86868b',
          tertiary: '#aeaeb2',
        },
        // Status
        status: {
          todo: '#FF3B30',
          progress: '#FF9500',
          done: '#34C759',
          waiting: '#8E8E93',
        },
        // Trip phases
        phase: {
          pre: '#5856D6',
          during: '#34C759',
          post: '#007AFF',
        },
        // Priority
        priority: {
          low: '#8E8E93',
          medium: '#007AFF',
          high: '#FF9500',
          urgent: '#FF3B30',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Heebo', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        hero: ['34px', { lineHeight: '1', fontWeight: '700', letterSpacing: '-1.5px' }],
        title: ['22px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.5px' }],
        headline: ['17px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '-0.3px' }],
        body: ['15px', { lineHeight: '1.5', fontWeight: '400', letterSpacing: '0' }],
        subhead: ['13px', { lineHeight: '1.5', fontWeight: '500', letterSpacing: '0' }],
        caption: ['11px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.5px' }],
      },
      borderRadius: {
        'apple-sm': '8px',
        'apple': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-6px)' },
          '80%': { transform: 'translateX(6px)' },
        },
        'page-enter': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'list-item-enter': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        'page-enter': 'page-enter 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'list-item-enter': 'list-item-enter 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
      },
      boxShadow: {
        'glass': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'glass-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'glass-float': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'dark-card': '0 8px 30px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 2: Verify build succeeds**

Run: `npx tsc -b && echo "OK"`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: replace desert palette with iOS system colors and typography tokens"
```

---

### Task 3: Replace CSS variables and global styles

**Files:**
- Modify: `src/index.css`
- Delete: `src/App.css`

- [ ] **Step 1: Replace src/index.css entirely**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Backgrounds & Surfaces */
  --bg-primary: #f5f5f7;
  --bg-elevated: rgba(255,255,255,0.72);
  --bg-card: rgba(255,255,255,0.80);
  --bg-dark: #1d1d1f;
  --bg-dark-secondary: #2d2d30;

  /* Text */
  --text-primary: #1d1d1f;
  --text-secondary: #86868b;
  --text-tertiary: #aeaeb2;

  /* iOS System Accents */
  --color-blue: #007AFF;
  --color-green: #34C759;
  --color-red: #FF3B30;
  --color-orange: #FF9500;
  --color-yellow: #FFCC00;
  --color-purple: #AF52DE;
  --color-indigo: #5856D6;
  --color-teal: #5AC8FA;
  --color-pink: #FF2D55;

  /* Status */
  --status-todo: #FF3B30;
  --status-progress: #FF9500;
  --status-done: #34C759;
  --status-waiting: #8E8E93;

  /* Trip Phases */
  --phase-pre: #5856D6;
  --phase-during: #34C759;
  --phase-post: #007AFF;

  /* Easing */
  --ease-default: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

html {
  direction: rtl;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  font-family: 'Inter', 'Heebo', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

#root {
  min-height: 100vh;
}

img,
svg {
  display: block;
  max-width: 100%;
}

input,
button,
textarea,
select {
  font: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
  font-weight: 700;
}

p {
  margin: 0;
}

ul, ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Glass surface utilities */
@layer utilities {
  .glass {
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 0.5px solid rgba(0, 0, 0, 0.06);
  }

  .glass-float {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 0.5px solid rgba(0, 0, 0, 0.1);
  }

  .glass-nav {
    background: rgba(255, 255, 255, 0.80);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .dark-card {
    background: linear-gradient(135deg, #1d1d1f 0%, #2d2d30 100%);
  }

  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

- [ ] **Step 2: Delete src/App.css**

This file contains only Vite boilerplate and is not imported anywhere. Delete it.

- [ ] **Step 3: Verify dev server renders**

Run: `npm run dev`
Check browser — app should load with the new light gray background (#f5f5f7) and Inter/Heebo fonts. Existing components will look broken (wrong color classes) — that's expected.

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git rm src/App.css
git commit -m "feat: replace CSS variables with iOS design system, add glass utilities"
```

---

### Task 4: Create animation styles

**Files:**
- Create: `src/styles/animations.css`
- Modify: `src/main.tsx` (import the new file)

- [ ] **Step 1: Create src/styles/animations.css**

```css
/* Page enter animation — apply to page wrapper divs */
.animate-page-enter {
  animation: page-enter 300ms var(--ease-default);
}

/* Staggered list items — set --index via style prop on each item */
.animate-list-item {
  animation: list-item-enter 350ms var(--ease-default) backwards;
  animation-delay: calc(var(--index, 0) * 50ms);
}

/* Card hover lift — desktop only */
@media (hover: hover) {
  .card-hover {
    transition: transform 200ms var(--ease-default), box-shadow 200ms var(--ease-default);
  }
  .card-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  .card-hover:active {
    transform: scale(0.98);
  }
}

/* Press feedback for touch targets */
.press-scale {
  transition: transform 100ms var(--ease-default);
}
.press-scale:active {
  transform: scale(0.95);
}

/* Shimmer skeleton */
.skeleton-shimmer {
  background: linear-gradient(90deg, #ebebeb 25%, #e0e0e0 50%, #ebebeb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}
```

- [ ] **Step 2: Import animations in main.tsx**

Add this import at the top of `src/main.tsx` (after the index.css import):

```ts
import './styles/animations.css'
```

- [ ] **Step 3: Verify build succeeds**

Run: `npx tsc -b && echo "OK"`

- [ ] **Step 4: Commit**

```bash
git add src/styles/animations.css src/main.tsx
git commit -m "feat: add animation utilities (page-enter, list-item, card-hover, shimmer)"
```

---

### Task 5: Update constants with new iOS colors

**Files:**
- Modify: `src/constants/index.ts`
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Update src/constants/index.ts**

Replace the FAMILY_MEMBERS colors and STATUS_MAP bg classes:

In `FAMILY_MEMBERS`, update each member's `color`:
```
aba: color: '#007AFF'    (was '#4a90d9')
ima: color: '#FF2D55'    (was '#e8735e')
kid1: color: '#34C759'   (was '#2d7d46')
kid2: color: '#FF9500'   (was '#f5c542')
kid3: color: '#5856D6'   (was '#6c5ce7')
```

In `STATUS_MAP`, update bg classes to use new Tailwind tokens:
```
todo: bg: 'bg-status-todo'         (unchanged class name, but now maps to #FF3B30)
in-progress: bg: 'bg-status-progress'  (unchanged)
in_progress: bg: 'bg-status-progress'  (unchanged)
done: bg: 'bg-status-done'         (unchanged)
waiting: bg: 'bg-status-waiting'   (unchanged)
```

Update text color references:
```
todo: color: 'text-white'           (unchanged)
in-progress: color: 'text-apple-primary'  (was 'text-brown')
in_progress: color: 'text-apple-primary'  (was 'text-brown')
done: color: 'text-white'           (unchanged)
waiting: color: 'text-white'        (unchanged)
```

- [ ] **Step 2: Update src/lib/constants.ts**

Update `FAMILY_MEMBERS` array colors:
```
aba: color: '#007AFF'
ima: color: '#FF2D55'
kid1: color: '#34C759'
kid2: color: '#FF9500'
kid3: color: '#5856D6'
```

Update `TASK_STATUSES` colors:
```
todo: color: '#FF3B30'       (was '#e17055')
in_progress: color: '#FF9500' (was '#fdcb6e')
done: color: '#34C759'       (was '#00b894')
waiting: color: '#8E8E93'    (was '#636e72')
```

Update `TASK_PRIORITIES` colors:
```
low: color: '#8E8E93'        (was '#636e72')
medium: color: '#007AFF'     (was '#4a90d9')
high: color: '#FF9500'       (was '#e17055')
urgent: color: '#FF3B30'     (was '#c44d34')
```

Fix the entertainment route bug in `MODULE_NAV`:
```
{ icon: 'music', label: 'בידור', path: '/entertainment' }   (was '/playlist')
```

- [ ] **Step 3: Verify build succeeds**

Run: `npx tsc -b && echo "OK"`

- [ ] **Step 4: Commit**

```bash
git add src/constants/index.ts src/lib/constants.ts
git commit -m "feat: update all color constants to iOS palette, fix /playlist route bug"
```

---

## Chunk 2: Shared Components

### Task 6: Create GlassCard component

**Files:**
- Create: `src/components/shared/GlassCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { cn } from '@/lib/cn'

interface GlassCardProps {
  elevation?: 1 | 2
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
} as const

export function GlassCard({
  elevation = 1,
  padding = 'md',
  className,
  children,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'motion-reduce:transition-none',
        elevation === 1
          ? 'glass rounded-apple-lg shadow-glass'
          : 'glass-float rounded-apple-xl shadow-glass-float',
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc -b && echo "OK"`

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/GlassCard.tsx
git commit -m "feat: add GlassCard shared component with elevation levels"
```

---

### Task 7: Create GradientIcon component

**Files:**
- Create: `src/components/shared/GradientIcon.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { cn } from '@/lib/cn'
import type { LucideIcon } from 'lucide-react'

interface GradientIconProps {
  icon: LucideIcon
  gradient: [string, string]
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { container: 'h-7 w-7 rounded-[6px]', icon: 'h-4 w-4' },
  md: { container: 'h-8 w-8 rounded-apple-sm', icon: 'h-[18px] w-[18px]' },
  lg: { container: 'h-10 w-10 rounded-[10px]', icon: 'h-5 w-5' },
} as const

export function GradientIcon({
  icon: Icon,
  gradient,
  size = 'md',
  className,
}: GradientIconProps) {
  const sizes = sizeMap[size]

  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0',
        sizes.container,
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        boxShadow: `0 2px 8px color-mix(in srgb, ${gradient[0]} 30%, transparent)`,
      }}
    >
      <Icon className={cn(sizes.icon, 'text-white')} />
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc -b && echo "OK"`

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/GradientIcon.tsx
git commit -m "feat: add GradientIcon component with iOS-style gradient squares"
```

---

### Task 8: Create Skeleton component

**Files:**
- Create: `src/components/shared/Skeleton.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { cn } from '@/lib/cn'

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'card' | 'rect'
  width?: string | number
  height?: string | number
  lines?: number
  className?: string
}

const defaultHeights = {
  text: 14,
  circle: 40,
  card: 120,
  rect: 40,
} as const

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
}: SkeletonProps) {
  const h = height ?? defaultHeights[variant]
  const w = width ?? (variant === 'circle' ? defaultHeights.circle : '100%')

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{
              height: h,
              width: i === lines - 1 ? '75%' : w,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'skeleton-shimmer',
        variant === 'circle' && 'rounded-full',
        className,
      )}
      style={{ width: w, height: h }}
    />
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc -b && echo "OK"`

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/Skeleton.tsx
git commit -m "feat: add Skeleton shimmer loading component"
```

---

### Task 9: Update FamilyAvatar with gradient ring

**Files:**
- Modify: `src/components/shared/FamilyAvatar.tsx`

- [ ] **Step 1: Update the component**

Replace the entire file content:

```tsx
import { cn } from '@/lib/cn'
import { FAMILY_MEMBERS } from '@/constants'
import type { FamilyMemberId } from '@/types'

interface FamilyAvatarProps {
  memberId: FamilyMemberId
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-base',
  md: 'h-10 w-10 text-xl',
  lg: 'h-16 w-16 text-3xl',
} as const

const ringClasses = {
  sm: 'ring-2',
  md: 'ring-2',
  lg: 'ring-[3px]',
} as const

export function FamilyAvatar({ memberId, size = 'md' }: FamilyAvatarProps) {
  const member = FAMILY_MEMBERS[memberId]

  if (!member) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-[#f5f5f7]',
          sizeClasses[size],
        )}
      >
        ?
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full shrink-0 ring-offset-1',
        sizeClasses[size],
        ringClasses[size],
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${member.color} 12%, white)`,
        '--tw-ring-color': member.color,
      } as React.CSSProperties}
      title={member.name}
    >
      <span role="img" aria-label={member.name}>
        {member.emoji}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc -b && echo "OK"`

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/FamilyAvatar.tsx
git commit -m "feat: update FamilyAvatar with colored ring and subtle tinted background"
```

---

### Task 10: Update DualClock typography

**Files:**
- Modify: `src/components/shared/DualClock.tsx`

- [ ] **Step 1: Update color classes**

Replace `text-brown-light` with `text-apple-secondary` (2 occurrences).
Replace `text-brown-light/50` with `text-apple-tertiary`.
Remove `font-hebrew` class (the global font-family now handles this).

The component's return becomes:
```tsx
return (
  <div className="flex items-center gap-2 text-xs text-apple-secondary">
    <span className="flex items-center gap-1">
      <span role="img" aria-label="Israel">🇮🇱</span>
      <span>{israelTime}</span>
    </span>
    <span className="text-apple-tertiary">|</span>
    <span className="flex items-center gap-1">
      <span role="img" aria-label="USA">🇺🇸</span>
      <span>{usaTime}</span>
    </span>
  </div>
)
```

- [ ] **Step 2: Verify build**

Run: `npx tsc -b && echo "OK"`

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/DualClock.tsx
git commit -m "feat: update DualClock to use Apple typography tokens"
```

---

### Task 11: Update StatusBadge and OfflineBanner

**Files:**
- Modify: `src/components/shared/StatusBadge.tsx`
- Modify: `src/components/shared/OfflineBanner.tsx`

- [ ] **Step 1: Update StatusBadge**

Read the current file, then replace any old color references:
- `text-brown` → `text-apple-primary`
- `bg-status-*` classes remain the same (Tailwind tokens already updated in config)
- Any `rounded-*` update to `rounded-apple-sm` for consistency

- [ ] **Step 2: Update OfflineBanner**

Read the current file, then update:
- Background: use `glass` utility class
- Text colors: `text-apple-primary` and `text-apple-secondary`
- Any border colors: `border-ios-orange/30`
- Add icon if not present using Lucide `WifiOff`

- [ ] **Step 3: Verify build**

Run: `npx tsc -b && echo "OK"`

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/StatusBadge.tsx src/components/shared/OfflineBanner.tsx
git commit -m "feat: update StatusBadge and OfflineBanner to glass design"
```

---

## Chunk 3: Layout Shell

### Task 12: Update AppShell

**Files:**
- Modify: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Update background and remove old font class**

Replace the entire component:

```tsx
import { Outlet } from 'react-router-dom'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomTabs } from '@/components/layout/BottomTabs'
import { OfflineBanner } from '@/components/shared/OfflineBanner'
import { cn } from '@/lib/cn'

export function AppShell() {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  return (
    <div className="min-h-screen bg-surface-primary" dir="rtl">
      <OfflineBanner />
      <TopBar />

      <div className="flex">
        {isDesktop && <Sidebar />}

        <main
          className={cn(
            'flex-1 min-h-[calc(100vh-3.5rem)]',
            isDesktop ? 'mr-56' : 'pb-16',
          )}
        >
          <div className="animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {!isDesktop && <BottomTabs />}
    </div>
  )
}

export default AppShell
```

Key changes: `bg-sand font-hebrew` → `bg-surface-primary`, added `animate-page-enter` wrapper around `<Outlet />`.

- [ ] **Step 2: Verify build**

Run: `npx tsc -b && echo "OK"`

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AppShell.tsx
git commit -m "feat: update AppShell with new background and page enter animation"
```

---

### Task 13: Update TopBar with frosted glass

**Files:**
- Modify: `src/components/layout/TopBar.tsx`

- [ ] **Step 1: Replace the component**

```tsx
import { DualClock } from '@/components/shared/DualClock'
import { FamilyAvatar } from '@/components/shared/FamilyAvatar'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/cn'

export function TopBar() {
  const { currentMember } = useAuth()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between px-4',
        'glass-nav',
        'border-b border-black/[0.06]',
      )}
    >
      <div className="flex items-center gap-2">
        <h1 className="text-headline text-apple-primary">
          Hey USA
        </h1>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2">
        <DualClock />
      </div>

      <div className="flex items-center gap-2">
        {currentMember ? (
          <FamilyAvatar memberId={currentMember} size="sm" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-surface-primary" />
        )}
      </div>
    </header>
  )
}
```

Key changes: `bg-cream/95 backdrop-blur-sm border-sand-dark/30` → `glass-nav border-black/[0.06]`, typography tokens updated, `bg-sand-dark` → `bg-surface-primary`.

- [ ] **Step 2: Verify renders correctly**

Check browser — TopBar should have frosted glass effect, Inter/Heebo typography.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/TopBar.tsx
git commit -m "feat: update TopBar with frosted glass and Apple typography"
```

---

### Task 14: Update Sidebar with glass surface and iOS active states

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Replace the component**

```tsx
import { NavLink } from 'react-router-dom'
import {
  Home, CheckSquare, Calendar, FileText, Map,
  Camera, BookOpen, DollarSign, Music, Package,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { NAV_ITEMS } from '@/constants'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Home, CheckSquare, Calendar, FileText, Map,
  Camera, BookOpen, DollarSign, Music, Package,
}

export function Sidebar() {
  return (
    <aside
      className={cn(
        'fixed top-14 right-0 bottom-0 z-20',
        'w-56 overflow-y-auto',
        'glass-nav border-l border-black/[0.06]',
        'flex flex-col',
      )}
    >
      <div className="px-4 py-5 border-b border-black/[0.06]">
        <h2 className="text-title text-apple-primary">
          Hey USA
        </h2>
      </div>

      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon]
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-apple',
                  'text-subhead transition-colors duration-150',
                  isActive
                    ? 'bg-ios-blue/10 text-ios-blue font-semibold'
                    : 'text-apple-secondary hover:bg-black/[0.04] hover:text-apple-primary',
                )
              }
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
```

Key changes: cream → glass-nav, border colors, terracotta active → system blue active, typography tokens, hover states.

- [ ] **Step 2: Verify on desktop viewport**

Resize browser to ≥768px. Sidebar should show frosted glass, blue active indicators.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: update Sidebar with glass surface and iOS blue active states"
```

---

### Task 15: Update BottomTabs with glass bar and iOS active states

**Files:**
- Modify: `src/components/layout/BottomTabs.tsx`

- [ ] **Step 1: Replace the component**

```tsx
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, CheckSquare, Map, Camera, MoreHorizontal,
  Calendar, FileText, BookOpen, DollarSign, Music, Package, X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { BOTTOM_TAB_ITEMS, MORE_MENU_ITEMS } from '@/constants'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Home, CheckSquare, Map, Camera, Calendar,
  FileText, BookOpen, DollarSign, Music, Package,
}

export function BottomTabs() {
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      {/* More Drawer Overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More Drawer */}
      <div
        className={cn(
          'fixed bottom-16 left-0 right-0 z-50',
          'glass-float rounded-t-apple-xl shadow-glass-float',
          'border-t border-black/[0.06]',
          'transform transition-transform duration-300',
          moreOpen ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ transitionTimingFunction: 'var(--ease-default)' }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-caption uppercase tracking-wide text-apple-secondary">More Modules</h3>
          <button
            onClick={() => setMoreOpen(false)}
            className="rounded-full p-1 hover:bg-black/[0.04] transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-apple-secondary" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1 px-4 pb-4">
          {MORE_MENU_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon]
            return (
              <button
                key={item.path}
                onClick={() => {
                  setMoreOpen(false)
                  navigate(item.path)
                }}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-apple py-3 px-2',
                  'hover:bg-black/[0.04] transition-colors press-scale',
                  'text-apple-primary',
                )}
              >
                {Icon && <Icon className="h-6 w-6" />}
                <span className="text-caption">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-30',
          'flex h-16 items-center justify-around',
          'glass-nav border-t border-black/[0.06]',
          'pb-safe',
        )}
      >
        {BOTTOM_TAB_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon]
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5',
                  'text-[10px] transition-colors',
                  isActive
                    ? 'text-ios-blue font-semibold'
                    : 'text-apple-secondary',
                )
              }
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span>{item.label}</span>
            </NavLink>
          )
        })}

        <button
          onClick={() => setMoreOpen((prev) => !prev)}
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-1.5',
            'text-[10px] transition-colors',
            moreOpen ? 'text-ios-blue font-semibold' : 'text-apple-secondary',
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>עוד</span>
        </button>
      </nav>
    </>
  )
}
```

Key changes: glass-nav for tab bar, glass-float for drawer, system blue active, safe-area padding, overlay with backdrop-blur, press-scale animation, easing tokens.

- [ ] **Step 2: Verify on mobile viewport**

Resize browser to <768px. Bottom tabs should have frosted glass, blue active state. Tap "More" — drawer should slide up with glass effect.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/BottomTabs.tsx
git commit -m "feat: update BottomTabs with glass bar, iOS blue active, smooth drawer"
```

---

## Chunk 4: Auth Screens

### Task 16: Update PinScreen

**Files:**
- Modify: `src/modules/auth/PinScreen.tsx`

- [ ] **Step 1: Replace the component**

```tsx
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Delete } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth } from '@/contexts/AuthContext'

const PIN_LENGTH = 4

export function PinScreen() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length >= PIN_LENGTH) return
      const newPin = pin + digit

      setError(false)
      setPin(newPin)

      if (newPin.length === PIN_LENGTH) {
        setTimeout(() => {
          const success = login(newPin)
          if (success) {
            navigate('/auth/select')
          } else {
            setError(true)
            setShaking(true)
            setTimeout(() => {
              setShaking(false)
              setPin('')
            }, 500)
          }
        }, 150)
      }
    },
    [pin, login, navigate],
  )

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1))
    setError(false)
  }, [])

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-surface-primary px-4"
      dir="rtl"
    >
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-hero text-apple-primary mb-2">
            Hey USA
          </h1>
          <p className="text-subhead text-apple-secondary">הכנס קוד משפחתי</p>
        </div>

        {/* PIN Dots */}
        <div
          className={cn(
            'flex gap-4 justify-center',
            shaking && 'animate-shake',
          )}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-4 w-4 rounded-full border-2 transition-all duration-200',
                i < pin.length
                  ? error
                    ? 'bg-ios-red border-ios-red'
                    : 'bg-ios-blue border-ios-blue'
                  : 'border-apple-tertiary bg-transparent',
              )}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-ios-red text-subhead -mt-4">קוד שגוי, נסה שוב</p>
        )}

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className={cn(
                'h-16 w-full rounded-apple-xl text-title',
                'glass shadow-glass',
                'text-apple-primary',
                'hover:bg-white active:scale-95',
                'transition-all duration-100',
              )}
            >
              {digit}
            </button>
          ))}

          <div />

          <button
            onClick={() => handleDigit('0')}
            className={cn(
              'h-16 w-full rounded-apple-xl text-title',
              'glass shadow-glass',
              'text-apple-primary',
              'hover:bg-white active:scale-95',
              'transition-all duration-100',
            )}
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className={cn(
              'h-16 w-full rounded-apple-xl flex items-center justify-center',
              'bg-white/40 text-apple-secondary',
              'hover:bg-white/60 active:scale-95',
              'transition-all duration-100',
            )}
            aria-label="מחק ספרה"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
```

Key changes: sand → surface-primary, brown → apple-primary, terracotta dots → blue dots, glass keypad buttons, removed desert gradient overlay.

- [ ] **Step 2: Verify PIN screen renders**

Navigate to `/auth`. Should see clean gray background, frosted glass number buttons, blue PIN dots.

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/PinScreen.tsx
git commit -m "feat: update PinScreen with glass keypad and iOS blue PIN dots"
```

---

### Task 17: Update FamilySelectScreen

**Files:**
- Modify: `src/modules/auth/FamilySelectScreen.tsx`

- [ ] **Step 1: Read current file and update**

Read `src/modules/auth/FamilySelectScreen.tsx` first to understand current structure. Then update:
- Background: `bg-surface-primary` (was `bg-sand`)
- Cards: wrap each family member option in `<GlassCard>` with `card-hover` class
- Typography: `text-apple-primary`, `text-apple-secondary`
- Remove any `font-hebrew` classes
- Import GlassCard: `import { GlassCard } from '@/components/shared/GlassCard'`

- [ ] **Step 2: Verify screen renders**

Enter PIN → should show family select with glass cards.

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/FamilySelectScreen.tsx
git commit -m "feat: update FamilySelectScreen with glass cards"
```

---

## Chunk 5: Dashboard

### Task 18: Update DashboardPage

**Files:**
- Modify: `src/modules/dashboard/DashboardPage.tsx`

- [ ] **Step 1: Replace the component**

```tsx
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plane, CheckSquare, Calendar, FileText, Map,
  Camera, BookOpen, DollarSign, Music, Package,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { FAMILY_MEMBERS } from '@/constants'
import { GlassCard } from '@/components/shared/GlassCard'
import { GradientIcon } from '@/components/shared/GradientIcon'
import type { LucideIcon } from 'lucide-react'

const TRIP_DATE = new Date('2026-09-11T00:00:00')

const MODULE_CARDS: {
  path: string
  icon: LucideIcon
  label: string
  gradient: [string, string]
}[] = [
  { path: '/tasks', icon: CheckSquare, label: 'משימות', gradient: ['#5856D6', '#AF52DE'] },
  { path: '/itinerary', icon: Calendar, label: 'לוח זמנים', gradient: ['#FF9500', '#FFCC00'] },
  { path: '/documents', icon: FileText, label: 'מסמכים', gradient: ['#FF3B30', '#FF6259'] },
  { path: '/map', icon: Map, label: 'מפה', gradient: ['#007AFF', '#34C759'] },
  { path: '/photos', icon: Camera, label: 'תמונות', gradient: ['#FF2D55', '#FF6B8A'] },
  { path: '/blog', icon: BookOpen, label: 'בלוג', gradient: ['#34C759', '#30D158'] },
  { path: '/budget', icon: DollarSign, label: 'תקציב', gradient: ['#FF9500', '#FF6723'] },
  { path: '/entertainment', icon: Music, label: 'בידור', gradient: ['#AF52DE', '#BF5AF2'] },
  { path: '/packing', icon: Package, label: 'אריזה', gradient: ['#5AC8FA', '#64D2FF'] },
]

function getDaysUntilTrip(): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = TRIP_DATE.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatHebrewDate(): string {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

export default function DashboardPage() {
  const { currentMember } = useAuth()
  const daysLeft = useMemo(() => getDaysUntilTrip(), [])
  const todayDate = useMemo(() => formatHebrewDate(), [])

  const memberData = currentMember ? FAMILY_MEMBERS[currentMember] : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header with greeting */}
      <div className="mb-6">
        <p className="text-caption uppercase tracking-wide text-apple-secondary">{todayDate}</p>
        <h1 className="mt-1 text-title text-apple-primary">
          {memberData ? `שלום, ${memberData.name}` : 'שלום!'}
          {memberData ? ` ${memberData.emoji}` : ''}
        </h1>
      </div>

      {/* Countdown widget — dark hero card */}
      <div className="mb-8 dark-card rounded-apple-xl p-6 text-white shadow-dark-card">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-apple-lg bg-white/[0.12]">
            <Plane className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-hero leading-none">{daysLeft}</span>
              <span className="text-headline font-medium opacity-90">ימים לטיול!</span>
            </div>
            <p className="mt-1 text-subhead opacity-70">
              11 בספטמבר 2026 - ארה״ב, אנחנו באים!
            </p>
          </div>
        </div>
      </div>

      {/* Quick access grid */}
      <h2 className="mb-4 text-caption uppercase tracking-wide text-apple-secondary">גישה מהירה</h2>
      <div className="grid grid-cols-3 gap-3">
        {MODULE_CARDS.map(({ path, icon, label, gradient }, index) => (
          <Link
            key={path}
            to={path}
            className="animate-list-item"
            style={{ '--index': index } as React.CSSProperties}
          >
            <GlassCard padding="md" className="flex flex-col items-center gap-2 card-hover">
              <GradientIcon icon={icon} gradient={gradient} />
              <span className="text-caption font-semibold text-apple-primary">{label}</span>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

Key changes: dark hero countdown card, GradientIcon for module grid, GlassCard wrappers, Apple typography tokens, staggered list animation, removed all old color classes.

- [ ] **Step 2: Verify dashboard renders**

Navigate to `/`. Should see: greeting with caption date, dark hero countdown card, grid of glass cards with gradient icons.

- [ ] **Step 3: Commit**

```bash
git add src/modules/dashboard/DashboardPage.tsx
git commit -m "feat: redesign DashboardPage with dark hero card and gradient icon grid"
```

---

## Chunk 6: Module Pages

### Task 19: Update ItineraryPage and its components

**Files:**
- Modify: `src/modules/itinerary/ItineraryPage.tsx`
- Modify: `src/modules/itinerary/components/DaySelector.tsx`
- Modify: `src/modules/itinerary/components/StopCard.tsx`
- Modify: `src/modules/itinerary/components/DriveSegment.tsx`

- [ ] **Step 1: Update ItineraryPage.tsx**

Replace all old color classes throughout the file:
- `text-brown` → `text-apple-primary`
- `text-brown-light` → `text-apple-secondary`
- `bg-gold/10` → `bg-ios-orange/10`
- `text-gold-dark` → `text-ios-orange`
- `text-terracotta` / `bg-terracotta/10` → `text-ios-blue` / `bg-ios-blue/10`
- `text-sand-dark` → `text-apple-tertiary`
- `bg-white/60` → glass utility or `bg-white/72`
- `border-gold/30 bg-gold/5` → `border-ios-orange/30 bg-ios-orange/5`
- Add `GlassCard` wrapper around the notes section
- Section header "לוח זמנים" should use the heading pattern: caption + title

- [ ] **Step 2: Update DaySelector.tsx**

Read current file, then update:
- Replace old colors with iOS system colors
- Active day pill: `bg-ios-blue text-white` (was likely terracotta-based)
- Inactive: `text-apple-secondary hover:bg-black/[0.04]`

- [ ] **Step 3: Update StopCard.tsx**

Read current file, then update:
- Wrap in GlassCard or apply `glass` utility
- Replace all brown/terracotta/gold references
- Use Apple typography tokens

- [ ] **Step 4: Update DriveSegment.tsx**

Read current file, then update:
- Connector line: `border-apple-tertiary` or `bg-apple-tertiary`
- Text: `text-apple-secondary`
- Remove any old color references

- [ ] **Step 5: Verify itinerary page renders**

Navigate to `/itinerary`. Check day selector, stop cards, drive segments, notes section.

- [ ] **Step 6: Commit**

```bash
git add src/modules/itinerary/
git commit -m "feat: update itinerary module with glass cards and iOS colors"
```

---

### Task 20: Update remaining module pages (batch)

**Files:**
- Modify: `src/modules/tasks/TasksPage.tsx` and components
- Modify: `src/modules/documents/DocumentsPage.tsx` and components
- Modify: `src/modules/map/MapPage.tsx`
- Modify: `src/modules/photos/PhotosPage.tsx`
- Modify: `src/modules/blog/BlogPage.tsx`
- Modify: `src/modules/budget/BudgetPage.tsx`
- Modify: `src/modules/entertainment/EntertainmentPage.tsx`
- Modify: `src/modules/packing/PackingPage.tsx`

For each module page, apply these systematic replacements:

**Color replacements (apply to ALL module files):**
```
text-brown        → text-apple-primary
text-brown-light  → text-apple-secondary
bg-sand           → bg-surface-primary
bg-sand-dark      → bg-black/[0.04]
bg-cream          → (remove, parent already has surface-primary)
border-sand-dark  → border-black/[0.06]
text-terracotta   → text-ios-blue (for active/accent states)
bg-terracotta     → bg-ios-blue
text-gold-dark    → text-ios-orange
bg-gold           → bg-ios-orange
text-sage         → text-ios-green
bg-sage           → bg-ios-green
font-hebrew       → (remove, global font handles this)
bg-white/60       → glass (utility class)
bg-white/70       → glass
rounded-2xl       → rounded-apple-lg
```

**Structural upgrades per module:**

- [ ] **Step 1: Update TasksPage** — wrap task cards in GlassCard, use iOS status/priority colors from constants
- [ ] **Step 2: Update DocumentsPage** — wrap document cards in GlassCard, update category colors
- [ ] **Step 3: Update MapPage** — add glass overlay panel for map controls
- [ ] **Step 4: Update PhotosPage** — clean grid with glass overlays
- [ ] **Step 5: Update BlogPage** — glass post cards, Apple typography
- [ ] **Step 6: Update BudgetPage** — glass surfaces, update Recharts colors to iOS palette (chart fill colors: `#007AFF`, `#FF9500`, `#34C759`, `#FF3B30`, `#AF52DE`, `#5856D6`, `#5AC8FA`, `#FF2D55`, `#FFCC00`), axis/grid styling per spec
- [ ] **Step 7: Update EntertainmentPage** — glass cards, replace group colors with phase colors
- [ ] **Step 8: Update PackingPage** — glass checklist items, iOS green for checked
- [ ] **Step 9: Verify each page renders** — navigate to each module, check for broken colors or layouts
- [ ] **Step 10: Commit per module** — one commit per module page or batch if small changes:

```bash
git add src/modules/tasks/ && git commit -m "feat: update tasks module with glass design"
git add src/modules/documents/ && git commit -m "feat: update documents module with glass design"
git add src/modules/map/ && git commit -m "feat: update map module with glass overlay"
git add src/modules/photos/ && git commit -m "feat: update photos module with glass design"
git add src/modules/blog/ && git commit -m "feat: update blog module with glass design"
git add src/modules/budget/ && git commit -m "feat: update budget module with glass design and iOS chart colors"
git add src/modules/entertainment/ && git commit -m "feat: update entertainment module with glass design"
git add src/modules/packing/ && git commit -m "feat: update packing module with glass design"
```

---

## Chunk 7: Polish Pass

### Task 21: Visual QA and polish

**Files:** Various — fix issues found during QA

- [ ] **Step 1: Full visual walkthrough**

Navigate through every screen: PIN → Family Select → Dashboard → each module page. Check:
- No old colors remaining (search codebase for: `brown`, `terracotta`, `sand`, `cream`, `sage`, `gold-dark`)
- Glass effects render properly (check backdrop-filter in dev tools)
- Typography is consistent (Inter/Heebo loading, correct sizes)
- Animations work (page enter, card hover, more drawer)
- Mobile and desktop layouts both work (test at 375px and 1280px)

- [ ] **Step 2: Fix any issues found**

Address each issue directly in the affected file.

- [ ] **Step 3: Search for any remaining old color references**

Run in project root:
```bash
grep -rn "brown\|terracotta\|sand\|cream\|sage\|gold-dark\|font-hebrew" src/ --include="*.tsx" --include="*.ts" --include="*.css"
```

Fix any remaining references.

- [ ] **Step 4: Final build check**

Run: `npx tsc -b && npm run build`
Expected: clean build with no errors.

- [ ] **Step 5: Commit polish fixes**

```bash
git add -A
git commit -m "fix: visual QA polish pass — remove all old color references"
```

---

### Task 22: Update memory files

**Files:**
- Modify: memory/design-upgrade.md

- [ ] **Step 1: Update memory with completion status**

Update `C:\Users\shani\.claude\projects\C--Users-shani-OneDrive-Hey-USA\memory\design-upgrade.md` to reflect the upgrade is complete, noting any decisions made during implementation.

- [ ] **Step 2: Done**

Design upgrade is complete.
