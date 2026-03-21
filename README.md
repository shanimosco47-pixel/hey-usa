# Hey USA 🇺🇸

Family trip planner for a 20-day USA road trip (September 2026).

**Live:** https://shanimosco47-pixel.github.io/hey-usa/

## Features

- **Dashboard** — trip countdown, weather, quick navigation
- **Tasks** — kanban, table, and timeline views with drag-and-drop
- **Itinerary** — day-by-day stops with times, locations, and costs
- **Map** — interactive Leaflet map with route lines and day filtering
- **Documents** — travel document manager with categories and expiry tracking
- **Budget** — expense tracking with pie/bar charts (Recharts)
- **Packing** — checklist per family member and category
- **Blog** — trip journal with rich text editor (Tiptap)
- **Photos** — gallery with lightbox, favorites, and filters
- **Entertainment** — playlist voting, road trip games, USA trivia quiz
- **Moti AI** — AI trip advisor powered by Claude (Anthropic)
- **Location Hub** — per-location notes, weather, and itinerary

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript |
| Build | Vite 7, SWC |
| Styling | Tailwind CSS 3.4 |
| UI | Radix UI, Framer Motion |
| Routing | React Router 7 |
| Maps | Leaflet / React-Leaflet |
| Charts | Recharts |
| Editor | Tiptap |
| Drag & Drop | DND Kit |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| AI | Anthropic Claude API |
| PWA | Vite PWA (Workbox) |
| Testing | Vitest, Testing Library |
| Linting | ESLint 9, Prettier |

## Architecture

```
src/
├── components/     # Shared UI components (layout, buttons, etc.)
├── constants/      # App constants, family members, nav items
├── contexts/       # React contexts (Auth, AppData)
├── data/           # Static data (itinerary, locations)
├── lib/            # Utilities (database, supabase client, types)
├── modules/        # Feature modules
│   ├── auth/       # PIN login, family member select
│   ├── budget/     # Expense tracking & charts
│   ├── blog/       # Trip journal
│   ├── campsites/  # Campsite bookings
│   ├── chat/       # Moti AI chatbot
│   ├── dashboard/  # Home dashboard
│   ├── documents/  # Document management
│   ├── entertainment/ # Playlist, games, trivia
│   ├── itinerary/  # Day-by-day planner
│   ├── locations/  # Location hubs & notes
│   ├── map/        # Interactive map
│   ├── notes/      # Sticky notes
│   ├── packing/    # Packing checklist
│   ├── photos/     # Photo gallery
│   └── tasks/      # Task management
└── styles/         # Global CSS & animations
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start dev server
npm run dev
```

Default PIN: `1234`

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

The app works offline with sample data when Supabase is not configured.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm test` | Run test suite |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |

## Deployment

Deployed to GitHub Pages via GitHub Actions on push to `main`. See `.github/workflows/deploy.yml`.

## License

[MIT](./LICENSE)
