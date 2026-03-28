# Hey USA — Project Specification

Family travel planning app for a 20-day USA RV trip (Sep 10–30, 2026). Hebrew RTL interface with offline-first architecture, deployed as a PWA to GitHub Pages.

**Live URL:** `https://shanimosco47-pixel.github.io/hey-usa/`

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19 |
| Language | TypeScript | 5.9 |
| Build | Vite | 7.3 |
| Styling | Tailwind CSS | 3.4 |
| Routing | React Router | 7.13 |
| Animations | Framer Motion | 12.36 |
| UI Primitives | Radix UI | 1.x |
| Local DB | Dexie (IndexedDB) | 4.3 |
| Remote DB | Supabase (Postgres) | 2.99 |
| Maps | Maplibre GL + React Map GL | 5.21 / 8.1 |
| Charts | Recharts | 3.8 |
| Rich Text | Tiptap | 3.20 |
| Drag & Drop | DND Kit | 6.3 / 10.0 |
| Icons | Lucide React | 0.577 |
| PWA | Vite PWA (Workbox) | 1.2 |
| Testing | Vitest + Testing Library | 4.1 |
| Linting | ESLint 9 + Prettier 3.8 | |
| Pre-commit | Husky + Lint-staged | |

---

## Project Structure

```
src/
  modules/{name}/             # Feature modules
    {Name}Page.tsx            #   Main page (lazy-loaded)
    hooks/use{Name}.ts        #   State & logic
    components/               #   Sub-components
    data/sample{Name}.ts      #   Fallback sample data
  components/
    layout/                   # AppShell, TopBar, BottomTabs, Sidebar
    shared/                   # Toast, Search, ErrorBoundary, EmptyState
    ui/                       # Button, Badge, GlassCard, Magic UI
  contexts/
    AuthContext.tsx            # PIN auth + family member selection
    AppDataContext.tsx         # Central app state + CRUD + Moti logging
    FamilyContext.tsx          # Family member metadata
  lib/
    database.ts               # Supabase CRUD operations
    db.ts                     # Dexie IndexedDB schema
    sync.ts                   # Bidirectional Dexie-Supabase sync
    supabase.ts               # Supabase client init
    weather.ts                # Open-Meteo API integration
    export.ts                 # CSV/text export utilities
    cn.ts                     # Tailwind class merging (clsx + twMerge)
    types.ts                  # Core TypeScript interfaces
  data/
    itinerary.ts              # 21-day itinerary with 50+ stops
    locations.ts              # 25+ US destinations with coordinates
    driveTimes.ts             # Drive time matrix between cities
  constants/
    index.ts                  # Family members, categories, trip dates
  hooks/                      # useMediaQuery, useOnlineStatus, useTheme
  styles/                     # Global CSS, animations
supabase/
  migrations/                 # DB schema migrations
  functions/                  # Edge functions
public/
  sw.js                       # Service worker
  404.html                    # SPA fallback
.github/workflows/deploy.yml  # CI/CD to GitHub Pages
```

---

## Feature Modules

### 1. Dashboard (`/`)
- Trip countdown timer (target: Sep 10–30, 2026)
- Weather widget for current location
- Task completion progress bar
- Destination carousel
- Quick-access cards to all modules
- Parent vs. kid dashboard views

### 2. Tasks (`/tasks`)
- Three views: Kanban, Table, Timeline
- Drag-and-drop reordering via DND Kit
- Fields: title, description, status, priority, assignees, due date, tags, parent task
- Statuses: `todo`, `in_progress`, `waiting`, `done`
- Priorities: `low`, `medium`, `high`, `urgent`
- Groups: `pre_trip`, `during_trip`, `post_trip`
- Multi-assignee support with filtering

### 3. Itinerary (`/itinerary`, `/itinerary/:day`)
- 21-day plan with ~50 stops across the USA
- Each stop: title, location, lat/lng, times, notes, cost estimate
- Day-by-day view with city themes, gradients, hero photos
- Drive time visualization between stops
- Weather forecast per day (Open-Meteo API)
- Activity polls for day planning
- Drag-and-drop day planner board
- Text export

### 4. Budget (`/budget`)
- Planning vs. Actual tabs
- 9 expense categories: flights, accommodation, food, transport, attractions, shopping, communication, insurance, other
- Pie chart (category split) and bar chart (daily breakdown)
- Receipt photo support
- Daily budget calculator and alerts
- CSV export
- Default budget: $3,500 over 21 days

### 5. Packing (`/packing`)
- 8 categories: clothing, toiletries, electronics, documents, medicine, entertainment, snacks, other
- Per-member assignment and quantity tracking
- Checkbox completion with filtering by member
- 50+ sample items

### 6. Blog (`/blog`, `/blog/new`, `/blog/:id`)
- Rich-text editor (Tiptap): bold, italic, headings, links, images, lists
- Daily templates with writing prompts
- Author selection (family member)
- Tags, cover photo, photo gallery
- Publish/draft toggle

### 7. Photos (`/photos`)
- Grid and list view modes
- Favorites and per-member filtering
- Browser camera capture
- Lightbox viewer with navigation
- Metadata: caption, location, coordinates, photographer, day

### 8. Documents (`/documents`)
- 9 categories: passport, visa, insurance, flights, accommodation, car rental, attractions, medical, other
- File upload and preview (PDF/image)
- Expiry date tracking
- Status: reserved, waitlist
- Gmail integration for email scanning
- Document checklist

### 9. Entertainment (`/entertainment`)
- Playlist: add songs, upvote/downvote by family member
- Road trip games: pre-loaded game ideas
- USA trivia: 50+ questions with answers
- 20+ sample songs

### 10. Locations (`/locations`, `/locations/:locationId`)
- 25+ major US destinations
- Per-location: itinerary stops, sticky notes, documents
- Local weather display
- Date range for each location
- Card-based grid layout

### 11. Notes (`/notes`)
- Color-coded sticky notes: yellow, pink, blue, green, orange, purple
- Linked to locations or general
- Pin favorites
- Author attribution
- Quick filters

### 12. Map (`/map`)
- Maplibre GL with free vector tiles (no API key)
- Itinerary stops as colored markers (by day)
- Route line visualization
- Popup with stop details
- Day filter toggle

### 13. Campsites (`/campsites`)
- Booking status: confirmed, pending, not_open, waitlist, cancelled
- Priority: primary, backup
- Type: campground, RV park, hotel, overnight parking
- Changelog tracking and document linking
- Regional grouping
- Legacy view at `/campsites/old`

### 14. Chat — Moti AI (`/chat`, `/chat/log`)
- AI assistant powered by Claude API (Anthropic)
- Context-aware actions: add expense, task, update budget, etc.
- Smart timeline-aware suggestions
- Voice input (Web Speech API)
- Message cards: weather, budget, itinerary, drive time
- Markdown response rendering
- Conversation persistence
- Action change log at `/chat/log`

### 15. Auth (`/auth`, `/auth/select`)
- PIN-based login (default PIN: `1234`)
- Family member selection screen
- Optional OAuth via Supabase (`/oauth/callback`)

---

## Family Members

| ID | Hebrew | English | Emoji | Color |
|----|--------|---------|-------|-------|
| `aba` | אבא | Dad | 👨 | #007AFF (Blue) |
| `ima` | אמא | Mom | 👩 | #FF2D55 (Pink) |
| `kid1` | ילד 1 | Kid 1 | 👦 | #34C759 (Green) |
| `kid2` | ילד 2 | Kid 2 | 👧 | #FF9500 (Orange) |
| `kid3` | ילד 3 | Kid 3 | 🧒 | #5856D6 (Purple) |
| `moti` | מוטי | Moti (AI) | 🤖 | #8E8E93 (Gray) |

---

## Data Layer

### Local Storage (Dexie IndexedDB)
Database name: `hey-usa` (v2). Tables mirror all feature modules:

- `tasks` — multi-entry index on `assigned_to`
- `expenses` — indexed by category, date, paid_by
- `budgetSettings` — singleton (id: `main`)
- `itineraryDays` — days and stops
- `packingItems` — per-member items
- `blogPosts` — journal entries
- `photos` — photo metadata
- `documents` — document metadata
- `playlistItems` — songs with votes
- `locationNotes` — sticky notes
- `polls` — activity polls per day
- `syncQueue` — pending Supabase operations

### Remote Storage (Supabase)
- Postgres with Row-Level Security
- Edge Functions for AI integration
- File Storage for documents and photos
- Optional — app falls back to sample data when unavailable

### Sync Strategy
1. Load from Dexie (instant)
2. Pull from Supabase in background
3. Queue local changes to `syncQueue`
4. Flush queue when online or on interval
5. Last-write-wins conflict resolution

### State Management
- No Redux — module-level `useState` + `useCallback`
- `AppDataContext` centralizes all CRUD operations (~1300 lines)
- `AuthContext` for session management
- `localStorage` for persistence (key prefix: `hey-usa-`)

---

## Design System

### Colors
iOS system palette: `ios-blue`, `ios-green`, `ios-red`, `ios-orange`, `ios-purple`, `ios-pink`, `ios-teal`, `ios-indigo`. Text: `apple-primary` (#1d1d1f), `apple-secondary` (#86868b). Surfaces: `surface-primary` (#f5f5f7).

### Typography
Font stack: Inter, Heebo (Hebrew), system fallbacks. Scales:

| Token | Size | Weight |
|-------|------|--------|
| `text-hero` | 34px | 700 |
| `text-title` | 22px | 700 |
| `text-headline` | 17px | 600 |
| `text-body` | 15px | 400 |
| `text-subhead` | 13px | 500 |
| `text-caption` | 11px | 600 |

### Border Radii
`rounded-apple-sm` (8px), `rounded-apple` (12px), `rounded-apple-lg` (16px), `rounded-apple-xl` (20px).

### Effects
- Glass-morphism: `.glass`, `.glass-float`, `.glass-nav`
- Shadows: `shadow-glass`, `shadow-glass-hover`, `shadow-glass-float`
- Animations: spring physics (stiffness: 400, damping: 17)

### Components
- `GlassCard` — container cards (elevation 1/2, padding sm/md/lg)
- `FamilyAvatar` — member display (xs/sm/md/lg)
- `StatusBadge` — status indicators
- `Button` (CVA) — variants: default, destructive, outline, secondary, ghost
- Magic UI: animated icons, blur fade, border beam, marquee, shimmer button, number ticker

---

## Routing

### Protected Routes (require auth + member selection)
| Path | Page |
|------|------|
| `/` | Dashboard |
| `/tasks` | Tasks |
| `/itinerary` | Itinerary |
| `/itinerary/:day` | Itinerary (specific day) |
| `/campsites` | Campsites V2 |
| `/campsites/old` | Campsites (legacy) |
| `/documents` | Documents |
| `/map` | Map |
| `/photos` | Photos |
| `/blog` | Blog |
| `/blog/new` | Blog (create) |
| `/blog/:id` | Blog (edit) |
| `/budget` | Budget |
| `/entertainment` | Entertainment |
| `/packing` | Packing |
| `/notes` | Notes |
| `/locations` | Locations |
| `/locations/:locationId` | Location Hub |
| `/chat` | Moti Chat |
| `/chat/log` | Moti Action Log |

### Public Routes
| Path | Page |
|------|------|
| `/auth` | PIN Screen |
| `/auth/select` | Family Select |
| `/oauth/callback` | OAuth Callback |
| `*` | 404 Not Found |

All protected routes are lazy-loaded with `React.lazy()` and wrapped in `Suspense` with a `ChunkErrorBoundary`.

---

## Build & Deployment

- **Build:** `npm run build` (TypeScript check + Vite build). Warnings treated as errors.
- **Code splitting:** Manual chunks for vendor-react, vendor-motion, vendor-radix, vendor-maps, vendor-dexie.
- **PWA:** Auto-update service worker, runtime caching (Unsplash: CacheFirst 30d, Open-Meteo: NetworkFirst 1h).
- **CI/CD:** Push to `master` triggers GitHub Actions build and deploy to GitHub Pages.
- **Base path:** `/hey-usa/`

### Environment Variables
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

App runs fully without these, falling back to sample data.

---

## Testing

- **Framework:** Vitest 4.1 + Testing Library (React) + JSDOM
- **Commands:** `npm test` (run once), `npm run test:watch`, `npm run test:coverage`
- **Coverage areas:** Budget calculations, sample data validation, itinerary data integrity, packing data

---

## Accessibility

- RTL layout (`dir="rtl"`) globally applied
- Skip link for keyboard navigation
- Semantic HTML (main, section, article)
- ARIA labels and roles via Radix UI
- Keyboard support for all interactive elements
- Focus management in modals/dialogs
- Dark mode support (class-based)
