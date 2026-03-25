# Hey USA — Project Instructions

Family travel planning app for a 20-day USA RV trip (Sep 10-30, 2026). Hebrew RTL interface.
React 19 + Vite + Tailwind 3 + Radix UI. Deployed to GitHub Pages at `/hey-usa/`.

## Permissions

Skip permission prompts: `dangerouslySkipPermissions: true`

## Design System

All tokens defined in `tailwind.config.ts`. Use these — never invent custom values.

**Colors:** iOS system palette — `ios-blue`, `ios-green`, `ios-red`, `ios-orange`, `ios-purple`, `ios-pink`, `ios-teal`, `ios-indigo`. Text: `apple-primary` (#1d1d1f), `apple-secondary` (#86868b). Surfaces: `surface-primary` (#f5f5f7).

**Typography:** Font stack: Inter, Heebo (Hebrew), system. Scales: `text-hero` (34px/700), `text-title` (22px/700), `text-headline` (17px/600), `text-body` (15px/400), `text-subhead` (13px/500), `text-caption` (11px/600).

**Radii:** `rounded-apple-sm` (8px), `rounded-apple` (12px), `rounded-apple-lg` (16px), `rounded-apple-xl` (20px).

**Shadows:** `shadow-glass`, `shadow-glass-hover`, `shadow-glass-float`.

**Glass effects (CSS classes):** `.glass` (raised), `.glass-float` (floating), `.glass-nav` (navigation bar).

## Component Conventions

- `cn()` from `@/lib/cn` for class merging (clsx + tailwind-merge)
- `GlassCard` for container cards (elevation 1 or 2, padding sm/md/lg)
- `FamilyAvatar` for family member display (xs/sm/md/lg sizes)
- `StatusBadge` for status indicators
- `Button` (CVA) for actions — variants: default, destructive, outline, secondary, ghost
- Framer Motion for animations — spring physics (stiffness: 400, damping: 17)

## Module Structure

```
src/modules/{name}/
  {Name}Page.tsx            # Main page (default export, lazy-loaded)
  hooks/use{Name}.ts        # State & logic hook
  components/               # Sub-components
  data/sample{Name}.ts      # Sample/seed data
```

## Import Rules

- Path alias: `@/` → `src/`
- Types: `import type { X } from '@/types'`
- Shared components: `import { X } from '@/components/shared/X'`
- UI primitives: `import { X } from '@/components/ui/x'`
- Relative imports within a module: `import { X } from './components/X'`

## RTL Rules

- Global `dir="rtl"` in index.css — all UI is right-to-left
- Use `dir="ltr"` only for LTR-specific content (dates, numbers, code)
- Flex containers in RTL reverse visual order — be aware when using arrows/flow indicators
- Test layout direction after adding any horizontal flow UI

## Git Rules

- **Conventional commits:** `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`
- **Always run `npm run build` before committing** — CI treats warnings as errors
- **Never push broken code** — the `formatDateRange` incident: unused variable broke the deploy
- Commit message format: lowercase, concise, explains why not what

## Deploy

Push to `master` → GitHub Actions builds → deploys to GitHub Pages.
Live URL: `https://shanimosco47-pixel.github.io/hey-usa/`
Base path: `/hey-usa/` (configured in vite.config.ts and React Router)

## State Management

- Module-level hooks: `useState` + `useCallback` (no Redux)
- `AuthContext` for PIN auth + family member selection
- `AppDataContext` for global app state
- `localStorage` for persistence (key prefix: `hey-usa-`)
- Supabase for remote sync (falls back to sample data when unavailable)

## Rules for Claude

### Before Any Fix
- **Verify the full data flow** — check that the app connects to its data source (env vars, Supabase client) before updating data on the server side
- **Identify what the user sees** — read the rendering code, not just the data layer. "X doesn't show" may mean the UI doesn't render it, not that the data is missing
- **Read the request twice** — distinguish between "the data is wrong" and "the display is wrong"
- **One PR per fix** — diagnose first, then ship one targeted change. No speculative fixes

### File Safety
- **Before creating any file, check if it already exists** using Glob or ls in the working directory
- **Before checking GitHub for a file, specify the branch** — don't assume master
- **Never overwrite existing files** without first reading and showing the current content
- **When the user says a file exists, trust them** — verify before contradicting

### Environment Awareness
- **Never assume environments are isolated** — ask how local and remote are connected if unclear
- **After editing CLAUDE.md, always commit and push** — web sessions only see committed files
- **Sample data is the fallback** — if Supabase env vars aren't set, the app runs from hardcoded data. Keep sample data in sync with DB

### Testing
- **Verify changes visually before claiming done** — build, check the output, confirm the UI matches expectations
- **Test the deployed result, not just the code** — PWA caching, service workers, and localStorage can mask changes

## File Size Rule

This file must stay under 150 lines. If approaching limit, move detailed sections to sub-CLAUDE.md files in relevant directories (e.g., `src/modules/CLAUDE.md`).
