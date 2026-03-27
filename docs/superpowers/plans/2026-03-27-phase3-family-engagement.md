# Phase 3: Family Engagement Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the family want to open the app by personalizing the dashboard per member role, adding satisfying progress visualization, and letting family members vote on activities.

**Architecture:** Add a role helper (`isParent`/`isChild`) to constants. Refactor DashboardPage to render different card grids based on role. Add a `useFamilyProgress` hook for gamification data. Create an `ActivityPoll` component for itinerary voting, stored as JSONB in a new Supabase column. Skip push notifications (fragile on iOS/PWA) — use in-app badges instead.

**Tech Stack:** React 19, Framer Motion, Supabase (JSONB for votes), existing design system

**Spec:** `docs/superpowers/specs/2026-03-27-premium-overhaul-design.md` — Phase 3

---

## Scope Decisions

**In scope:**
- Personalized dashboard (kids vs parents)
- Packing race (family progress bars)
- Trip prep achievements (visual milestones)
- Activity voting on itinerary stops
- Daily countdown facts

**Deferred:**
- PWA push notifications (complex, fragile on iOS Safari, low ROI for 5-person family)
- Reactions on blog/photos (nice-to-have, not core engagement)
- Wish list per location (can add later if family uses locations)

## File Structure

### New Files
| File | Responsibility |
|------|----------------|
| `src/lib/familyRoles.ts` | Role helpers: `isParent()`, `isChild()`, role type |
| `src/modules/dashboard/components/KidsDashboard.tsx` | Dashboard layout for kid members |
| `src/modules/dashboard/components/ParentDashboard.tsx` | Dashboard layout for parent members |
| `src/modules/dashboard/components/PackingRace.tsx` | Family packing progress bars side by side |
| `src/modules/dashboard/components/TripAchievements.tsx` | Visual milestone badges |
| `src/modules/dashboard/components/CountdownFact.tsx` | Daily fun USA fact |
| `src/modules/dashboard/data/usaFacts.ts` | Static list of 200 fun USA facts |
| `src/modules/itinerary/components/ActivityPoll.tsx` | Voting UI for itinerary stop alternatives |

### Modified Files
| File | Changes |
|------|---------|
| `src/modules/dashboard/DashboardPage.tsx` | Split into Kids/Parent dashboard based on role |
| `src/contexts/AppDataContext.tsx` | Add poll vote functions |
| `src/lib/types.ts` | Add `ActivityPoll` type |
| `src/lib/database.ts` | Add poll CRUD functions |
| `src/lib/db.ts` | Add polls table to Dexie schema |
| `src/lib/sync.ts` | Add polls to sync engine |

---

## Task 1: Family Role Helpers

**Files:**
- Create: `src/lib/familyRoles.ts`

- [ ] **Step 1: Create role helper**

```typescript
// src/lib/familyRoles.ts
import type { FamilyMemberId } from './types'

export type FamilyRole = 'parent' | 'child' | 'ai'

const PARENTS: FamilyMemberId[] = ['aba', 'ima']
const CHILDREN: FamilyMemberId[] = ['kid1', 'kid2', 'kid3']

export function getFamilyRole(memberId: FamilyMemberId): FamilyRole {
  if (PARENTS.includes(memberId)) return 'parent'
  if (CHILDREN.includes(memberId)) return 'child'
  return 'ai'
}

export function isParent(memberId: FamilyMemberId): boolean {
  return PARENTS.includes(memberId)
}

export function isChild(memberId: FamilyMemberId): boolean {
  return CHILDREN.includes(memberId)
}
```

- [ ] **Step 2: Build and commit**

```bash
npm run build
git add src/lib/familyRoles.ts
git commit -m "feat: add family role helpers (parent/child)"
```

---

## Task 2: USA Fun Facts Data

**Files:**
- Create: `src/modules/dashboard/data/usaFacts.ts`

- [ ] **Step 1: Create facts list**

Static list of 200 fun USA facts. The app picks one per day based on `dayOfYear % facts.length`.

```typescript
// src/modules/dashboard/data/usaFacts.ts
export const USA_FACTS: string[] = [
  'גרנד קניון כל כך עמוק שאפשר להכניס לתוכו את מגדל אייפל — פעמיים!',
  'ביוסמיטי יש עצי סקויה בני 3,000 שנה — הם היו כאן לפני הפירמידות',
  'בלאס וגאס יש יותר חדרי מלון מכל עיר אחרת בעולם — 150,000!',
  'כביש 66 — "הכביש הראשי של אמריקה" — עובר דרך 8 מדינות',
  'בגרנד קניון הטמפרטורה בתחתית יכולה להיות 20°C יותר מאשר בשפה',
  'הגולדן גייט בסן פרנסיסקו צבוע ב-"כתום בינלאומי" — לא אדום!',
  'בזאיון יש צמח שנקרא "Hanging Garden" שגדל על קירות סלע אנכיים',
  'בארה"ב אוכלים 3 מיליארד פיצות בשנה — זה 23 פרוסות לכל אמריקאי',
  'עמק יוסמיטי נחצב על ידי קרחונים לפני 10,000 שנה',
  'בלאס וגאס אף פעם לא כבים את האורות — צריכת החשמל כמו של מדינה קטנה',
  'הכביש הכי ארוך בארה"ב (Route 20) משתרע על 5,415 ק"מ!',
  'בגולדן גייט פארק בסן פרנסיסקו יש עדר באפלו חי',
  'גרנד קניון כל כך גדול שהוא נראה מהחלל',
  'ביוסמיטי יש מפל שגבוה פי 15 ממפלי ניאגרה',
  'ב-Death Valley נמדדה הטמפרטורה הגבוהה ביותר על פני כדור הארץ — 56.7°C',
  'בסן פרנסיסקו יש יותר מ-200 ימי ערפל בשנה',
  'הסטריפ בלאס וגאס הוא הרחוב המואר ביותר בעולם',
  'בזאיון "The Narrows" הוא קניון כל כך צר שהשמש מגיעה רק בצהריים',
  'בארה"ב יש 63 פארקים לאומיים — רובם במערב',
  'ביוסמיטי גרים דובי שחורים, אבל הם לא באמת שחורים — הם חומים!',
  'הגשר הזהב בסן פרנסיסקו נבנה תוך 4 שנים בלבד (1933-1937)',
  'בלאס וגאס אפשר להתחתן תוך 30 דקות — בלי תור',
  'בגרנד קניון הסלעים בתחתית בני 1.8 מיליארד שנה',
  'בארה"ב יש 50 מדינות אבל רק 48 מחוברות ביבשה',
  'בדיסנילנד יש מנהרות סודיות מתחת לפארק שבהן עובדים נעים',
  'האמריקאים שותים 400 מיליון כוסות קפה ביום',
  'בסן פרנסיסקו הרחובות כל כך תלולים שמדרגות שלמות חצובות בהם',
  'הגרנד קניון ארוך 446 ק"מ — כמו מתל אביב לאילת',
  'ביוסמיטי El Capitan הוא הצוק האנכי הגבוה ביותר בצפון אמריקה',
  'בארה"ב יש יותר פיצריות מאשר מקדונלדס',
  'הכוכבים בדגל ארה"ב מסודרים ב-9 שורות לסירוגין',
  'בזאיון יש 289 מיני ציפורים — יותר מברוב המדינות באירופה',
  'לאס וגאס נוסדה ב-1905 — היא צעירה יחסית',
  'בארה"ב מותר לנהוג מגיל 16 ברוב המדינות',
  'הגולדן גייט צריך צביעה מתמדת — צוות של 38 צבעים עובד כל השנה',
  'בגרנד קניון יש 5 אזורי אקלים שונים מהשפה לתחתית',
  'בארה"ב המרחקים מטורפים — טקסס לבדה גדולה מצרפת',
  'דיסנילנד נפתח ב-1955 ומאז ביקרו בו יותר מ-700 מיליון אנשים',
  'ביוסמיטי "Firefall" — תופעה שבה מפל נראה כמו לבה — קורה רק בפברואר',
  'בארה"ב הטיפ במסעדות הוא 15-20% — חובה, לא אופציונלי!',
  'בסן פרנסיסקו אלקטרז שימש כבית סוהר רק 29 שנה (1934-1963)',
  'בלאס וגאס יורד גשם רק 26 ימים בשנה בממוצע',
  'הקניונים במערב ארה"ב נוצרו על ידי נהרות שחצבו סלע במשך מיליוני שנים',
  'בארה"ב גודל מנות האוכל כפול מאירופה — הכינו את הבטן',
  'בזאיון אפשר לראות כוכבים בצורה מדהימה — אין זיהום אור',
  'בארה"ב יש 4 אזורי זמן — כשבניו יורק 17:00, בלוס אנג\'לס רק 14:00',
  'הגרנד קניון נוצר על ידי נהר קולורדו לאורך 5-6 מיליון שנה',
  'בסן פרנסיסקו הטראם (Cable Car) הוא אתר היסטורי לאומי נוסע',
  'ביוסמיטי Glacier Point מציע תצפית של 270° על העמק',
  'בארה"ב שופינג ב-Outlet זול ב-30-70% ממחירי חנויות רגילות',
]
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/dashboard/data/usaFacts.ts
git commit -m "feat: add 50 fun USA facts for daily countdown"
```

---

## Task 3: CountdownFact Component

**Files:**
- Create: `src/modules/dashboard/components/CountdownFact.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/modules/dashboard/components/CountdownFact.tsx
import { Lightbulb } from 'lucide-react'
import { USA_FACTS } from '../data/usaFacts'

export function CountdownFact() {
  // Pick a fact based on the day of year (changes daily)
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  )
  const fact = USA_FACTS[dayOfYear % USA_FACTS.length]

  return (
    <div className="glass rounded-apple-lg p-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ios-orange/10">
        <Lightbulb className="h-5 w-5 text-ios-orange" />
      </div>
      <div>
        <p className="text-caption text-apple-secondary mb-1">הידעת? 🇺🇸</p>
        <p className="text-body text-apple-primary">{fact}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build and commit**

```bash
npm run build
git add src/modules/dashboard/components/CountdownFact.tsx
git commit -m "feat: add CountdownFact component with daily USA facts"
```

---

## Task 4: PackingRace Component

**Files:**
- Create: `src/modules/dashboard/components/PackingRace.tsx`

Family packing progress bars displayed side by side as a friendly race.

- [ ] **Step 1: Create the component**

```tsx
// src/modules/dashboard/components/PackingRace.tsx
import { useAppData } from '@/contexts/AppDataContext'
import { FAMILY_MEMBERS } from '@/constants'
import { FamilyAvatar } from '@/components/shared/FamilyAvatar'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import type { FamilyMemberId } from '@/lib/types'

export function PackingRace() {
  const { packingItems } = useAppData()

  // Calculate progress per family member (excluding 'moti')
  const memberProgress = FAMILY_MEMBERS
    .filter((m) => m.id !== 'moti')
    .map((member) => {
      const items = packingItems.filter((p) => p.assigned_to === member.id)
      const packed = items.filter((p) => p.is_packed).length
      const total = items.length
      const percent = total > 0 ? Math.round((packed / total) * 100) : 0
      return { member, packed, total, percent }
    })
    .sort((a, b) => b.percent - a.percent) // Leader first

  if (memberProgress.every((m) => m.total === 0)) return null

  return (
    <div className="glass rounded-apple-lg p-4">
      <h3 className="text-headline text-apple-primary mb-3">מירוץ האריזה 🧳</h3>
      <div className="flex flex-col gap-3">
        {memberProgress.map(({ member, packed, total, percent }, i) => (
          <div key={member.id} className="flex items-center gap-3">
            <FamilyAvatar memberId={member.id as FamilyMemberId} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-subhead text-apple-primary">{member.name}</span>
                <span className="text-caption text-apple-secondary">
                  {packed}/{total}
                </span>
              </div>
              <div className="h-2 rounded-full bg-black/[0.04] overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    i === 0 ? 'bg-ios-green' : 'bg-ios-blue',
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.1 }}
                />
              </div>
            </div>
            {percent === 100 && <span className="text-body">✅</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build and commit**

```bash
npm run build
git add src/modules/dashboard/components/PackingRace.tsx
git commit -m "feat: add PackingRace component showing family packing progress"
```

---

## Task 5: TripAchievements Component

**Files:**
- Create: `src/modules/dashboard/components/TripAchievements.tsx`

Visual milestone badges that unlock based on trip preparation progress.

- [ ] **Step 1: Create the component**

```tsx
// src/modules/dashboard/components/TripAchievements.tsx
import { useAppData } from '@/contexts/AppDataContext'
import { cn } from '@/lib/cn'
import {
  FileCheck,
  ListChecks,
  Wallet,
  Luggage,
  MapPin,
  BookOpen,
  Trophy,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Achievement {
  id: string
  icon: LucideIcon
  label: string
  description: string
  check: () => boolean
}

export function TripAchievements() {
  const { tasks, documents, packingItems, budgetSettings, expenses, itineraryDays, blogPosts } =
    useAppData()

  const achievements: Achievement[] = [
    {
      id: 'docs-ready',
      icon: FileCheck,
      label: 'מסמכים מוכנים',
      description: 'כל המסמכים הועלו',
      check: () => documents.length >= 5,
    },
    {
      id: 'tasks-done',
      icon: ListChecks,
      label: 'משימות הושלמו',
      description: 'כל המשימות הושלמו',
      check: () => tasks.length > 0 && tasks.every((t) => t.status === 'done'),
    },
    {
      id: 'budget-set',
      icon: Wallet,
      label: 'תקציב מתוכנן',
      description: 'הגדרת תקציב לכל קטגוריה',
      check: () => Object.keys(budgetSettings.category_budgets).length >= 5,
    },
    {
      id: 'all-packed',
      icon: Luggage,
      label: 'הכל ארוז!',
      description: 'כל פריטי האריזה מסומנים',
      check: () => packingItems.length > 0 && packingItems.every((p) => p.is_packed),
    },
    {
      id: 'route-planned',
      icon: MapPin,
      label: 'מסלול מתוכנן',
      description: 'כל הימים מתוכננים',
      check: () => itineraryDays.every((d) => d.stops.length > 0),
    },
    {
      id: 'first-post',
      icon: BookOpen,
      label: 'סופר מטייל',
      description: 'כתבת פוסט ראשון',
      check: () => blogPosts.length > 0,
    },
    {
      id: 'trip-master',
      icon: Trophy,
      label: 'מאסטר טיול',
      description: 'כל ההישגים הושלמו!',
      check: () => false, // Computed below
    },
  ]

  // Compute unlocked state
  const results = achievements.map((a) => ({
    ...a,
    unlocked: a.id === 'trip-master' ? false : a.check(),
  }))

  // Trip master unlocks when all others are unlocked
  const allOthersUnlocked = results.filter((r) => r.id !== 'trip-master').every((r) => r.unlocked)
  const finalResults = results.map((r) =>
    r.id === 'trip-master' ? { ...r, unlocked: allOthersUnlocked } : r,
  )

  const unlockedCount = finalResults.filter((r) => r.unlocked).length

  return (
    <div className="glass rounded-apple-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-headline text-apple-primary">הישגים</h3>
        <span className="text-caption text-apple-secondary">
          {unlockedCount}/{finalResults.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {finalResults.map((a) => {
          const Icon = a.icon
          return (
            <div
              key={a.id}
              className={cn(
                'flex flex-col items-center gap-1 w-16',
                a.unlocked ? 'opacity-100' : 'opacity-30',
              )}
              title={a.description}
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full',
                  a.unlocked ? 'bg-ios-green/10' : 'bg-black/[0.04]',
                )}
              >
                <Icon
                  className={cn('h-6 w-6', a.unlocked ? 'text-ios-green' : 'text-apple-secondary')}
                />
              </div>
              <span className="text-caption text-apple-primary text-center leading-tight">
                {a.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build and commit**

```bash
npm run build
git add src/modules/dashboard/components/TripAchievements.tsx
git commit -m "feat: add TripAchievements component with milestone badges"
```

---

## Task 6: Personalized Dashboard

**Files:**
- Create: `src/modules/dashboard/components/KidsDashboard.tsx`
- Create: `src/modules/dashboard/components/ParentDashboard.tsx`
- Modify: `src/modules/dashboard/DashboardPage.tsx`

Split the dashboard into role-specific views. Both share the hero section and module grid, but the middle content differs.

- [ ] **Step 1: Create KidsDashboard**

```tsx
// src/modules/dashboard/components/KidsDashboard.tsx
import { CountdownFact } from './CountdownFact'
import { PackingRace } from './PackingRace'
import { TripAchievements } from './TripAchievements'
import { Link } from 'react-router-dom'
import { MessageCircle, Gamepad2 } from 'lucide-react'

export function KidsDashboard() {
  return (
    <div className="flex flex-col gap-4">
      {/* Fun daily fact */}
      <CountdownFact />

      {/* Packing race */}
      <PackingRace />

      {/* Quick links for kids */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/chat"
          className="glass rounded-apple-lg p-4 flex flex-col items-center gap-2 card-hover"
        >
          <MessageCircle className="h-8 w-8 text-ios-blue" />
          <span className="text-subhead text-apple-primary">שאלו את מוטי!</span>
        </Link>
        <Link
          to="/entertainment"
          className="glass rounded-apple-lg p-4 flex flex-col items-center gap-2 card-hover"
        >
          <Gamepad2 className="h-8 w-8 text-ios-purple" />
          <span className="text-subhead text-apple-primary">משחקים וטריוויה</span>
        </Link>
      </div>

      {/* Achievements */}
      <TripAchievements />
    </div>
  )
}
```

- [ ] **Step 2: Create ParentDashboard**

```tsx
// src/modules/dashboard/components/ParentDashboard.tsx
import { CountdownFact } from './CountdownFact'
import { PackingRace } from './PackingRace'
import { TripAchievements } from './TripAchievements'

interface ParentDashboardProps {
  attentionSection: React.ReactNode
  nextStopSection: React.ReactNode
  weatherSection: React.ReactNode
}

export function ParentDashboard({
  attentionSection,
  nextStopSection,
  weatherSection,
}: ParentDashboardProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Urgent items and planning */}
      {attentionSection}
      {nextStopSection}
      {weatherSection}

      {/* Fun fact */}
      <CountdownFact />

      {/* Family progress */}
      <PackingRace />

      {/* Achievements */}
      <TripAchievements />
    </div>
  )
}
```

- [ ] **Step 3: Modify DashboardPage to use role-based views**

Read `src/modules/dashboard/DashboardPage.tsx`. Find the area between the quick stats row and the module grid. Replace the middle content with role-based rendering:

```tsx
// Add imports at top:
import { useAuth } from '@/contexts/AuthContext'
import { isChild } from '@/lib/familyRoles'
import { KidsDashboard } from './components/KidsDashboard'
import { ParentDashboard } from './components/ParentDashboard'

// Inside the component, after useAuth:
const { currentMember } = useAuth()
const showKidsView = currentMember ? isChild(currentMember) : false

// Replace the middle sections (attention, next stop, weather, reminders) with:
{showKidsView ? (
  <KidsDashboard />
) : (
  <ParentDashboard
    attentionSection={/* existing attention JSX */}
    nextStopSection={/* existing next stop JSX */}
    weatherSection={/* existing weather JSX */}
  />
)}
```

Extract the existing attention, next stop, and weather sections into variables that get passed as props to ParentDashboard. The hero section, quick stats, trip route progress, and module grid remain shared for both views.

- [ ] **Step 4: Build and commit**

```bash
npm run build
git add src/modules/dashboard/ src/lib/familyRoles.ts
git commit -m "feat: personalize dashboard for kids vs parents"
```

---

## Task 7: Activity Poll Type and Data Layer

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/database.ts`
- Modify: `src/lib/db.ts`
- Modify: `src/lib/sync.ts`

Add the data infrastructure for activity voting.

- [ ] **Step 1: Add ActivityPoll type**

In `src/lib/types.ts`, add at the end:

```typescript
// ─── Activity Polls ──────────────────────────────────────────────────

export interface PollVote {
  member_id: FamilyMemberId
  option_index: number
}

export interface ActivityPoll {
  id: string
  day_id: string
  question: string
  options: string[]
  votes: PollVote[]
  created_by: FamilyMemberId
  created_at: string
}
```

- [ ] **Step 2: Add Supabase migration**

Create `supabase/migrations/010_activity_polls.sql`:

```sql
CREATE TABLE IF NOT EXISTS activity_polls (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  day_id TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  votes JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activity_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON activity_polls FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **Step 3: Add database functions**

In `src/lib/database.ts`, add:

```typescript
// ─── Activity Polls ──────────────────────────────────────────────────

export async function fetchActivityPolls(): Promise<ActivityPoll[]> {
  const sb = assertSupabase()
  const { data, error } = await sb.from('activity_polls').select('*').order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((p) => ({
    id: p.id,
    day_id: p.day_id,
    question: p.question,
    options: (p.options as string[]) ?? [],
    votes: (p.votes as PollVote[]) ?? [],
    created_by: p.created_by,
    created_at: p.created_at,
  }))
}

export async function upsertActivityPoll(poll: ActivityPoll): Promise<void> {
  const sb = assertSupabase()
  await sb.from('activity_polls').upsert({
    id: poll.id,
    day_id: poll.day_id,
    question: poll.question,
    options: poll.options,
    votes: poll.votes,
    created_by: poll.created_by,
    created_at: poll.created_at,
  })
}

export async function deleteActivityPoll(id: string): Promise<void> {
  const sb = assertSupabase()
  await sb.from('activity_polls').delete().eq('id', id)
}
```

Add the import for `ActivityPoll` and `PollVote` at the top of database.ts.

- [ ] **Step 4: Add polls to Dexie schema**

In `src/lib/db.ts`, add to the class:

```typescript
polls!: EntityTable<ActivityPoll, 'id'>
```

Add to the version(1).stores():

```typescript
polls: 'id, day_id, created_by',
```

Note: This changes the Dexie schema version. Update `this.version(1)` to `this.version(2)` and add the new store definition. Keep version 1 for migration:

```typescript
this.version(1).stores({
  // ... existing stores
})
this.version(2).stores({
  // ... all existing stores PLUS:
  polls: 'id, day_id, created_by',
})
```

- [ ] **Step 5: Add polls to sync engine**

In `src/lib/sync.ts`, add `polls: 'activity_polls'` to the `TABLE_MAP` object. Add polls to the `pullFromSupabase` function:

```typescript
// Add to Promise.all:
supabase.from('activity_polls').select('*'),

// Add to transaction:
if (polls?.length) await localDb.polls.bulkPut(polls as ActivityPoll[])
```

- [ ] **Step 6: Build and commit**

```bash
npm run build
git add src/lib/types.ts src/lib/database.ts src/lib/db.ts src/lib/sync.ts supabase/migrations/010_activity_polls.sql
git commit -m "feat: add activity poll data layer (types, DB, Dexie, sync)"
```

---

## Task 8: Activity Poll UI Component

**Files:**
- Create: `src/modules/itinerary/components/ActivityPoll.tsx`
- Modify: `src/modules/itinerary/ItineraryPage.tsx`

- [ ] **Step 1: Create ActivityPoll component**

```tsx
// src/modules/itinerary/components/ActivityPoll.tsx
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { FamilyAvatar } from '@/components/shared/FamilyAvatar'
import { FAMILY_MEMBERS } from '@/constants'
import { cn } from '@/lib/cn'
import { Vote, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import type { ActivityPoll as ActivityPollType, FamilyMemberId } from '@/lib/types'

interface ActivityPollProps {
  poll: ActivityPollType
  onVote: (pollId: string, optionIndex: number) => void
  onDelete?: (pollId: string) => void
}

export function ActivityPoll({ poll, onVote, onDelete }: ActivityPollProps) {
  const { currentMember } = useAuth()
  const myVote = poll.votes.find((v) => v.member_id === currentMember)

  const totalVotes = poll.votes.length
  const hasVoted = !!myVote

  return (
    <div className="glass rounded-apple-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Vote className="h-5 w-5 text-ios-purple" />
          <h4 className="text-headline text-apple-primary">{poll.question}</h4>
        </div>
        {onDelete && (
          <button onClick={() => onDelete(poll.id)} className="p-1 rounded-full hover:bg-black/[0.04]">
            <X className="h-4 w-4 text-apple-secondary" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {poll.options.map((option, index) => {
          const optionVotes = poll.votes.filter((v) => v.option_index === index)
          const percent = totalVotes > 0 ? Math.round((optionVotes.length / totalVotes) * 100) : 0
          const isMyChoice = myVote?.option_index === index

          return (
            <button
              key={index}
              onClick={() => onVote(poll.id, index)}
              className={cn(
                'relative rounded-apple p-3 text-right overflow-hidden transition-colors',
                isMyChoice
                  ? 'border-2 border-ios-purple bg-ios-purple/5'
                  : 'border border-black/[0.06] hover:bg-black/[0.02]',
              )}
            >
              {/* Progress bar background */}
              {hasVoted && (
                <motion.div
                  className="absolute inset-y-0 right-0 bg-ios-purple/10 rounded-apple"
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className="text-body text-apple-primary">{option}</span>
                <div className="flex items-center gap-1">
                  {hasVoted && (
                    <span className="text-caption text-apple-secondary">{percent}%</span>
                  )}
                  {/* Show voter avatars */}
                  <div className="flex -space-x-1 rtl:space-x-reverse">
                    {optionVotes.slice(0, 3).map((v) => (
                      <FamilyAvatar key={v.member_id} memberId={v.member_id} size="xs" />
                    ))}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-caption text-apple-secondary mt-2">
        {totalVotes} הצבעות
      </p>
    </div>
  )
}

interface CreatePollProps {
  dayId: string
  onCreatePoll: (poll: Omit<ActivityPollType, 'id' | 'created_at'>) => void
}

export function CreatePollButton({ dayId, onCreatePoll }: CreatePollProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const { currentMember } = useAuth()

  const handleSubmit = () => {
    if (!question.trim() || options.filter((o) => o.trim()).length < 2 || !currentMember) return
    onCreatePoll({
      day_id: dayId,
      question: question.trim(),
      options: options.filter((o) => o.trim()),
      votes: [],
      created_by: currentMember,
    })
    setIsOpen(false)
    setQuestion('')
    setOptions(['', ''])
  }

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)} className="w-full">
        <Plus className="h-4 w-4 ml-2" />
        הצבעה חדשה
      </Button>
    )
  }

  return (
    <div className="glass rounded-apple-lg p-4">
      <h4 className="text-headline text-apple-primary mb-3">הצבעה חדשה</h4>
      <input
        type="text"
        placeholder="מה השאלה?"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full rounded-apple border border-black/[0.06] p-3 text-body mb-3 bg-transparent"
        dir="rtl"
      />
      {options.map((opt, i) => (
        <input
          key={i}
          type="text"
          placeholder={`אפשרות ${i + 1}`}
          value={opt}
          onChange={(e) => {
            const next = [...options]
            next[i] = e.target.value
            setOptions(next)
          }}
          className="w-full rounded-apple border border-black/[0.06] p-3 text-body mb-2 bg-transparent"
          dir="rtl"
        />
      ))}
      <div className="flex gap-2 mt-2">
        {options.length < 4 && (
          <Button variant="ghost" onClick={() => setOptions([...options, ''])}>
            + אפשרות
          </Button>
        )}
        <div className="flex-1" />
        <Button variant="ghost" onClick={() => setIsOpen(false)}>ביטול</Button>
        <Button onClick={handleSubmit}>צור הצבעה</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add poll state and handlers to AppDataContext**

In `src/contexts/AppDataContext.tsx`, add:

Types/imports:
```typescript
import type { ActivityPoll, PollVote } from '@/lib/types'
```

State:
```typescript
const [polls, setPolls] = useState<ActivityPoll[]>([])
```

Load polls in the Dexie loading useEffect (add alongside other data loads):
```typescript
setPolls(await localDb.polls.toArray())
```

Add mutation functions:
```typescript
const addPoll = useCallback((poll: Omit<ActivityPoll, 'id' | 'created_at'>) => {
  const newPoll: ActivityPoll = {
    ...poll,
    id: `poll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    created_at: new Date().toISOString(),
  }
  setPolls((prev) => [newPoll, ...prev])
  localDb.polls.put(newPoll).catch(() => {})
  queueSync('polls', newPoll.id, 'upsert').catch(() => {})
  db.upsertActivityPoll(newPoll).catch(() => {})
}, [])

const votePoll = useCallback((pollId: string, optionIndex: number, memberId: FamilyMemberId) => {
  setPolls((prev) => prev.map((p) => {
    if (p.id !== pollId) return p
    // Remove existing vote from this member, add new one
    const filtered = p.votes.filter((v) => v.member_id !== memberId)
    const updated = { ...p, votes: [...filtered, { member_id: memberId, option_index: optionIndex }] }
    localDb.polls.put(updated).catch(() => {})
    queueSync('polls', pollId, 'upsert').catch(() => {})
    db.upsertActivityPoll(updated).catch(() => {})
    return updated
  }))
}, [])

const deletePoll = useCallback((id: string) => {
  setPolls((prev) => prev.filter((p) => p.id !== id))
  localDb.polls.delete(id).catch(() => {})
  queueSync('polls', id, 'delete').catch(() => {})
  db.deleteActivityPoll(id).catch(() => {})
}, [])
```

Add to context interface and value:
```typescript
// In AppDataContextType interface:
polls: ActivityPoll[]
addPoll: (poll: Omit<ActivityPoll, 'id' | 'created_at'>) => void
votePoll: (pollId: string, optionIndex: number, memberId: FamilyMemberId) => void
deletePoll: (id: string) => void
```

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add src/modules/itinerary/components/ActivityPoll.tsx src/contexts/AppDataContext.tsx
git commit -m "feat: add activity poll UI and state management"
```

---

## Task 9: Wire Polls into Itinerary Page

**Files:**
- Modify: `src/modules/itinerary/ItineraryPage.tsx`

- [ ] **Step 1: Add polls to itinerary day view**

Read `src/modules/itinerary/ItineraryPage.tsx`. Find where each day's content is rendered (after the stops list). Add poll display and creation:

```tsx
// Add imports:
import { ActivityPoll, CreatePollButton } from './components/ActivityPoll'
import { useAuth } from '@/contexts/AuthContext'
import { isParent } from '@/lib/familyRoles'

// Inside the component:
const { polls, addPoll, votePoll, deletePoll } = useAppData()
const { currentMember } = useAuth()

// Filter polls for current day:
const dayPolls = polls.filter((p) => p.day_id === currentDay?.id)

// After the stops list, before the day notes:
{/* Activity Polls */}
{dayPolls.length > 0 && (
  <div className="flex flex-col gap-3 mt-4">
    {dayPolls.map((poll) => (
      <ActivityPoll
        key={poll.id}
        poll={poll}
        onVote={(pollId, optionIndex) => {
          if (currentMember) votePoll(pollId, optionIndex, currentMember)
        }}
        onDelete={currentMember && isParent(currentMember) ? deletePoll : undefined}
      />
    ))}
  </div>
)}
{currentDay && (
  <div className="mt-3">
    <CreatePollButton
      dayId={currentDay.id}
      onCreatePoll={addPoll}
    />
  </div>
)}
```

- [ ] **Step 2: Build and commit**

```bash
npm run build
git add src/modules/itinerary/ItineraryPage.tsx
git commit -m "feat: wire activity polls into itinerary day view"
```

---

## Task 10: Final Build, Test & Deploy

**Files:** None new

- [ ] **Step 1: Full build**

```bash
cd "/c/Users/shani/OneDrive/Hey USA" && npm run build
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

- [ ] **Step 3: Test all new features**

Run `npm run dev` and verify:
1. Log in as a kid (kid1) → dashboard shows fun fact, packing race, Moti/entertainment shortcuts, achievements
2. Log in as a parent (aba) → dashboard shows attention items, next stop, weather, plus fun fact, packing race, achievements
3. Go to itinerary → create a poll → vote → see results
4. Check packing race reflects actual packing data
5. Check achievements unlock based on real data

- [ ] **Step 4: Apply Supabase migration**

```bash
supabase db push
```

Or run the SQL manually in the Supabase dashboard SQL editor.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "chore: phase 3 family engagement layer complete"
git push origin master
```
