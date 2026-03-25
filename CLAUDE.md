# CLAUDE.md

## Project Overview

Hey USA — a family trip planner PWA for a 20-day USA road trip (September 2026). Built with React 19 + TypeScript, Vite 7, Tailwind CSS, Supabase backend, and deployed to GitHub Pages.

## Commands

- `npm run dev` — start dev server
- `npm run build` — typecheck + production build (`tsc -b && vite build`)
- `npm run test` — run tests (Vitest)
- `npm run lint` — ESLint
- `npm run format:check` — Prettier check
- `npm run typecheck` — TypeScript type checking (`tsc --noEmit`)

## Architecture

- `src/components/` — shared UI components (layout, buttons, dialogs)
- `src/modules/` — feature modules (dashboard, tasks, itinerary, map, budget, etc.)
- `src/contexts/` — React contexts (Auth, AppData)
- `src/lib/` — utilities, Supabase client, types, database helpers
- `src/data/` — static data (itinerary, locations)
- `src/constants/` — app constants
- `src/hooks/` — custom React hooks
- `supabase/` — Supabase migrations and edge functions

## Tech Stack

- React 19, TypeScript, Vite 7
- Tailwind CSS 3.4, Radix UI, Framer Motion
- React Router 7, Leaflet, Recharts, Tiptap, DND Kit
- Supabase (Postgres, Auth, Storage, Edge Functions)
- Vitest + Testing Library for tests
- ESLint 9, Prettier, Husky + lint-staged

## Code Style

- Pre-commit hooks run ESLint + Prettier via lint-staged
- Prefer functional components with hooks
- Use TypeScript strict mode
- Write in Hebrew for user-facing text (RTL app)

## Rules for Claude

- Before creating any file, check if it already exists locally using Glob or ls
- When checking if a file exists on GitHub, always specify the branch explicitly
- Never assume the working environment is isolated from the user's desktop — ask if unclear
- When the user states something about their own system, trust them
- Never overwrite existing files without first reading and showing the current content
