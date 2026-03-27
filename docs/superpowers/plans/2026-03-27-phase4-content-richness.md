# Phase 4: Content & Data Richness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app feel like it *knows* the trip — weather per day in itinerary, drive time estimates between stops, quick photo capture with day tagging, blog daily templates, and document expiry warnings.

**Architecture:** Enhance existing modules with richer data display. Weather already works (Open-Meteo). Drive times use a static lookup table (no API needed — the route is fixed). Photo capture uses native `<input type="file" capture>`. Blog templates pre-fill from itinerary data. Document expiry uses existing `expiry_date` field with visual warnings.

**Tech Stack:** Existing React 19 stack, Open-Meteo API (already integrated), Supabase Storage for photo uploads, browser-image-compression (already installed)

**Spec:** `docs/superpowers/specs/2026-03-27-premium-overhaul-design.md` — Phase 4

---

## Scope Decisions

**In scope:**
- Weather forecast per day in itinerary (already partially done, enhance)
- Drive time estimates between consecutive stops (static data, no API)
- Quick photo capture → auto-tagged to day
- Blog daily templates pre-filled from itinerary
- Document expiry warnings (30-day alert)
- Document completeness checklist

**Deferred (depends on Phase 2 / OpenAI):**
- AI auto-enrich of stop descriptions (needs OpenAI API key deployed)
- Shareable trip journal link (complex, low ROI pre-trip)

## File Structure

### New Files
| File | Responsibility |
|------|----------------|
| `src/data/driveTimes.ts` | Static drive time/distance data between trip stops |
| `src/modules/itinerary/components/DriveInfo.tsx` | Enhanced drive segment showing time + distance |
| `src/modules/photos/components/PhotoCapture.tsx` | Camera capture + day tagging + upload |
| `src/modules/blog/components/DailyTemplates.tsx` | Template cards pre-filled from itinerary |
| `src/modules/documents/components/ExpiryWarning.tsx` | Document expiry alert badge |
| `src/modules/documents/components/DocChecklist.tsx` | Completeness checklist by category |

### Modified Files
| File | Changes |
|------|---------|
| `src/modules/itinerary/ItineraryPage.tsx` | Replace DriveSegment with DriveInfo |
| `src/modules/photos/PhotosPage.tsx` | Add PhotoCapture button, day filter |
| `src/modules/blog/BlogPage.tsx` | Add daily template section |
| `src/modules/documents/DocumentsPage.tsx` | Add expiry warnings + checklist view |

---

## Task 1: Drive Time Static Data

**Files:**
- Create: `src/data/driveTimes.ts`

Static lookup of drive times between consecutive trip stops. The route is fixed so no API needed.

- [ ] **Step 1: Create drive times data**

```typescript
// src/data/driveTimes.ts

export interface DriveTime {
  from: string       // city/location name
  to: string         // city/location name
  duration: string   // e.g., "4h 30m"
  distance: string   // e.g., "450 km"
  notes?: string     // tips (fuel, scenery, etc.)
}

// Drive segments between consecutive trip destinations
export const DRIVE_TIMES: Record<string, DriveTime> = {
  'day-1': { from: 'שדה התעופה', to: 'דנבר', duration: '30 דק׳', distance: '35 ק"מ', notes: 'שאטל או Uber מהשדה' },
  'day-2': { from: 'דנבר', to: 'ילוסטון', duration: '9 שעות', distance: '900 ק"מ', notes: 'נסיעה ארוכה! עצירה מומלצת בקספר' },
  'day-3': { from: 'ילוסטון', to: 'ילוסטון', duration: '', distance: '', notes: 'יום בפארק — נסיעות קצרות בין אטרקציות' },
  'day-4': { from: 'ילוסטון', to: 'גרנד טיטון', duration: '1h 30m', distance: '100 ק"מ', notes: 'כביש ציורי דרך הפארק' },
  'day-5': { from: 'גרנד טיטון', to: 'סולט לייק סיטי', duration: '5 שעות', distance: '450 ק"מ' },
  'day-6': { from: 'סולט לייק סיטי', to: 'ארצ\'ס', duration: '4 שעות', distance: '370 ק"מ' },
  'day-7': { from: 'ארצ\'ס', to: 'ברייס קניון', duration: '4h 30m', distance: '420 ק"מ', notes: 'עצרו ב-Capitol Reef בדרך' },
  'day-8': { from: 'ברייס קניון', to: 'זאיון', duration: '1h 30m', distance: '130 ק"מ' },
  'day-9': { from: 'זאיון', to: 'לאס וגאס', duration: '2h 45m', distance: '270 ק"מ' },
  'day-10': { from: 'לאס וגאס', to: 'לאס וגאס', duration: '', distance: '', notes: 'יום בעיר — הסטריפ ואטרקציות' },
  'day-11': { from: 'לאס וגאס', to: 'גרנד קניון', duration: '4h 30m', distance: '440 ק"מ', notes: 'תדלקו לפני! אין הרבה תחנות' },
  'day-12': { from: 'גרנד קניון', to: 'פייג\'', duration: '2h 15m', distance: '210 ק"מ', notes: 'Horseshoe Bend בדרך!' },
  'day-13': { from: 'פייג\'', to: 'מוניומנט ואלי', duration: '2h 30m', distance: '200 ק"מ', notes: 'כביש 163 — הנוף האיקוני' },
  'day-14': { from: 'מוניומנט ואלי', to: 'מואב', duration: '3 שעות', distance: '250 ק"מ' },
  'day-15': { from: 'מואב', to: 'דנבר', duration: '5h 30m', distance: '560 ק"מ', notes: 'נסיעה ארוכה — עצירה ב-Glenwood Springs' },
  'day-16': { from: 'דנבר', to: 'לוס אנג\'לס', duration: 'טיסה 3h', distance: '1,500 ק"מ', notes: 'טיסה פנימית' },
  'day-17': { from: 'לוס אנג\'לס', to: 'דיסנילנד', duration: '45 דק׳', distance: '50 ק"מ' },
  'day-18': { from: 'דיסנילנד', to: 'סן פרנסיסקו', duration: 'טיסה 1h', distance: '600 ק"מ', notes: 'או נסיעה 6 שעות על PCH' },
  'day-19': { from: 'סן פרנסיסקו', to: 'סן פרנסיסקו', duration: '', distance: '', notes: 'יום בעיר — טראם, Golden Gate, Fisherman\'s Wharf' },
  'day-20': { from: 'סן פרנסיסקו', to: 'שדה התעופה SFO', duration: '30 דק׳', distance: '20 ק"מ', notes: 'טיסה הביתה!' },
}
```

**Note:** Read `src/data/itinerary.ts` first to verify the actual day IDs and city names match. Adjust the data to match the real itinerary.

- [ ] **Step 2: Build and commit**

```bash
npm run build
git add src/data/driveTimes.ts
git commit -m "feat: add static drive time data between trip stops"
```

---

## Task 2: Enhanced DriveInfo Component

**Files:**
- Create: `src/modules/itinerary/components/DriveInfo.tsx`
- Modify: `src/modules/itinerary/ItineraryPage.tsx`

Replace the simple DriveSegment divider with an informative drive card showing time, distance, and tips.

- [ ] **Step 1: Create DriveInfo component**

```tsx
// src/modules/itinerary/components/DriveInfo.tsx
import { Car, MapPin } from 'lucide-react'
import type { DriveTime } from '@/data/driveTimes'
import { cn } from '@/lib/cn'

interface DriveInfoProps {
  driveTime: DriveTime | undefined
  className?: string
}

export function DriveInfo({ driveTime, className }: DriveInfoProps) {
  if (!driveTime || (!driveTime.duration && !driveTime.notes)) {
    // Fallback to simple divider if no data
    return (
      <div className="flex items-center justify-center py-1">
        <div className="h-6 w-px border-r border-dashed border-apple-tertiary/30" />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center py-2', className)}>
      <div className="flex items-center gap-2 rounded-apple bg-ios-teal/5 px-3 py-1.5">
        <Car className="h-4 w-4 text-ios-teal shrink-0" />
        <div className="flex items-center gap-2 text-caption">
          {driveTime.duration && (
            <span className="text-apple-primary font-medium">{driveTime.duration}</span>
          )}
          {driveTime.distance && (
            <>
              <span className="text-apple-tertiary">·</span>
              <span className="text-apple-secondary">{driveTime.distance}</span>
            </>
          )}
        </div>
        {driveTime.notes && (
          <>
            <span className="text-apple-tertiary">·</span>
            <span className="text-caption text-ios-teal">{driveTime.notes}</span>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into ItineraryPage**

Read `src/modules/itinerary/ItineraryPage.tsx`. Find where `DriveSegment` is rendered between stops. Replace it with `DriveInfo`, passing the drive time data for the current day:

```tsx
// Add imports:
import { DriveInfo } from './components/DriveInfo'
import { DRIVE_TIMES } from '@/data/driveTimes'

// Where DriveSegment renders between stops, replace with:
<DriveInfo driveTime={DRIVE_TIMES[currentDay?.id ?? '']} />
```

If DriveSegment is rendered inside a loop between each stop, DriveInfo should show once per day (not between every stop). Place it at the top of the day content or between the first and second stop.

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add src/modules/itinerary/components/DriveInfo.tsx src/modules/itinerary/ItineraryPage.tsx
git commit -m "feat: add drive time estimates to itinerary days"
```

---

## Task 3: Photo Capture Component

**Files:**
- Create: `src/modules/photos/components/PhotoCapture.tsx`
- Modify: `src/modules/photos/PhotosPage.tsx`

Add a camera capture button that opens the device camera, compresses the photo, uploads to Supabase Storage (if available) or creates a local blob URL, and tags with the current day.

- [ ] **Step 1: Create PhotoCapture component**

```tsx
// src/modules/photos/components/PhotoCapture.tsx
import { useState, useRef } from 'react'
import { Camera, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/AppDataContext'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/shared/ToastContext'
import type { FamilyMemberId } from '@/lib/types'

interface PhotoCaptureProps {
  dayId?: string
  location?: string
}

export function PhotoCapture({ dayId, location }: PhotoCaptureProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { currentMember } = useAuth()
  const { addPhoto } = useAppData()
  const { addToast } = useToast()

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // Compress the image
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })

      let url: string

      if (supabase) {
        // Upload to Supabase Storage
        const fileName = `${Date.now()}-${compressed.name}`
        const { data, error } = await supabase.storage
          .from('photos')
          .upload(`trip/${fileName}`, compressed)

        if (error) throw error

        const { data: publicUrl } = supabase.storage
          .from('photos')
          .getPublicUrl(data.path)

        url = publicUrl.publicUrl
      } else {
        // Fallback: local blob URL
        url = URL.createObjectURL(compressed)
      }

      addPhoto({
        url,
        caption: '',
        taken_by: (currentMember || 'aba') as FamilyMemberId,
        day_id: dayId,
        location: location || '',
        tags: [],
        is_favorite: false,
        taken_at: new Date().toISOString(),
      })

      addToast('תמונה נוספה בהצלחה! 📸')
    } catch (err) {
      console.error('Photo capture failed:', err)
      addToast('שגיאה בהעלאת התמונה', 'error')
    } finally {
      setIsUploading(false)
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex-1"
      >
        {isUploading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/[0.06] border-t-ios-blue ml-2" />
        ) : (
          <Camera className="h-4 w-4 ml-2" />
        )}
        {isUploading ? 'מעלה...' : 'צלם תמונה'}
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          // Remove capture attribute to allow gallery pick
          if (fileInputRef.current) {
            fileInputRef.current.removeAttribute('capture')
            fileInputRef.current.click()
            // Re-add capture for next camera use
            setTimeout(() => fileInputRef.current?.setAttribute('capture', 'environment'), 100)
          }
        }}
        disabled={isUploading}
      >
        <Upload className="h-4 w-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />
    </div>
  )
}
```

- [ ] **Step 2: Add PhotoCapture to PhotosPage**

Read `src/modules/photos/PhotosPage.tsx`. Add the capture button at the top of the page, below the header/filters:

```tsx
import { PhotoCapture } from './components/PhotoCapture'

// After the filter/view toggle bar:
<div className="px-4 mb-4">
  <PhotoCapture />
</div>
```

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add src/modules/photos/components/PhotoCapture.tsx src/modules/photos/PhotosPage.tsx
git commit -m "feat: add photo capture with compression and day tagging"
```

---

## Task 4: Blog Daily Templates

**Files:**
- Create: `src/modules/blog/components/DailyTemplates.tsx`
- Modify: `src/modules/blog/BlogPage.tsx`

Pre-filled blog templates based on itinerary days — tap a day card to start a post with date, location, and stops pre-filled.

- [ ] **Step 1: Create DailyTemplates component**

```tsx
// src/modules/blog/components/DailyTemplates.tsx
import { useAppData } from '@/contexts/AppDataContext'
import { MapPin, Calendar } from 'lucide-react'
import { cn } from '@/lib/cn'

interface DailyTemplatesProps {
  onSelectTemplate: (title: string, content: string, tags: string[], dayId: string) => void
}

export function DailyTemplates({ onSelectTemplate }: DailyTemplatesProps) {
  const { itineraryDays } = useAppData()

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-headline text-apple-primary mb-1">תבניות יומיות</h3>
      <p className="text-caption text-apple-secondary mb-2">
        בחרו יום מהמסלול ותתחילו לכתוב
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {itineraryDays.slice(0, 20).map((day, index) => {
          const dayNum = index + 1
          const stopsText = day.stops
            .slice(0, 3)
            .map((s) => `• ${s.title}`)
            .join('\n')
          const template = `${day.description || day.title}\n\n${stopsText}\n\n`

          return (
            <button
              key={day.id}
              onClick={() =>
                onSelectTemplate(
                  `יום ${dayNum}: ${day.title}`,
                  template,
                  [day.city || '', `יום-${dayNum}`].filter(Boolean),
                  day.id,
                )
              }
              className={cn(
                'shrink-0 w-32 glass rounded-apple-lg p-3 text-right card-hover',
                'flex flex-col gap-1',
              )}
            >
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-ios-blue" />
                <span className="text-caption text-ios-blue font-medium">יום {dayNum}</span>
              </div>
              <span className="text-subhead text-apple-primary truncate">{day.title}</span>
              {day.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-apple-secondary" />
                  <span className="text-caption text-apple-secondary">{day.city}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into BlogPage**

Read `src/modules/blog/BlogPage.tsx`. Find where the "new post" editor opens. Add the DailyTemplates component above the existing Moti prompts:

```tsx
import { DailyTemplates } from './components/DailyTemplates'

// In the editor section, before or alongside the existing prompts:
<DailyTemplates
  onSelectTemplate={(title, content, tags, dayId) => {
    setEditTitle(title)
    setEditContent(content)
    setEditTags(tags.join(', '))
    // If editDayId state exists, set it too
  }}
/>
```

The `onSelectTemplate` callback pre-fills the editor fields. Read the actual state variable names from BlogPage and adjust accordingly.

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add src/modules/blog/components/DailyTemplates.tsx src/modules/blog/BlogPage.tsx
git commit -m "feat: add daily blog templates from itinerary"
```

---

## Task 5: Document Expiry Warnings

**Files:**
- Create: `src/modules/documents/components/ExpiryWarning.tsx`
- Modify: `src/modules/documents/DocumentsPage.tsx`
- Modify: `src/modules/documents/components/DocumentCard.tsx` (if it exists)

Show warning badges on documents expiring within 30 days of the trip start (Sep 10, 2026).

- [ ] **Step 1: Create ExpiryWarning component**

```tsx
// src/modules/documents/components/ExpiryWarning.tsx
import { AlertTriangle, Clock } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ExpiryWarningProps {
  expiryDate: string | undefined
  className?: string
}

const TRIP_START = new Date('2026-09-10')

export function ExpiryWarning({ expiryDate, className }: ExpiryWarningProps) {
  if (!expiryDate) return null

  const expiry = new Date(expiryDate)
  const now = new Date()
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / 86400000)
  const expiresBeforeTrip = expiry < TRIP_START

  if (daysUntilExpiry < 0) {
    // Already expired
    return (
      <div className={cn('flex items-center gap-1 rounded-apple-sm bg-ios-red/10 px-2 py-1', className)}>
        <AlertTriangle className="h-3.5 w-3.5 text-ios-red" />
        <span className="text-caption text-ios-red font-medium">פג תוקף!</span>
      </div>
    )
  }

  if (expiresBeforeTrip) {
    // Expires before trip
    return (
      <div className={cn('flex items-center gap-1 rounded-apple-sm bg-ios-orange/10 px-2 py-1', className)}>
        <AlertTriangle className="h-3.5 w-3.5 text-ios-orange" />
        <span className="text-caption text-ios-orange font-medium">
          פג לפני הטיול! ({daysUntilExpiry} ימים)
        </span>
      </div>
    )
  }

  if (daysUntilExpiry <= 90) {
    // Expires within 90 days of now (some countries require 6-month passport validity)
    return (
      <div className={cn('flex items-center gap-1 rounded-apple-sm bg-ios-orange/10 px-2 py-1', className)}>
        <Clock className="h-3.5 w-3.5 text-ios-orange" />
        <span className="text-caption text-ios-orange">
          תוקף: עוד {daysUntilExpiry} ימים
        </span>
      </div>
    )
  }

  return null
}
```

- [ ] **Step 2: Add ExpiryWarning to document cards**

Read `src/modules/documents/components/DocumentCard.tsx` (or wherever individual documents render). Add the ExpiryWarning component:

```tsx
import { ExpiryWarning } from './ExpiryWarning'

// Inside the card, after the title/category:
<ExpiryWarning expiryDate={document.expiry_date} />
```

Also add a summary warning banner at the top of DocumentsPage if any documents are expired or expiring before the trip:

```tsx
// In DocumentsPage, compute expiring docs:
const expiringDocs = documents.filter((d) => {
  if (!d.expiry_date) return false
  const expiry = new Date(d.expiry_date)
  return expiry < new Date('2026-09-10')
})

// Render banner if any:
{expiringDocs.length > 0 && (
  <div className="glass rounded-apple-lg p-3 border border-ios-orange/20 bg-ios-orange/5 flex items-center gap-2 mx-4 mb-3">
    <AlertTriangle className="h-5 w-5 text-ios-orange shrink-0" />
    <span className="text-body text-apple-primary">
      {expiringDocs.length} מסמכים עם תוקף שפג או יפוג לפני הטיול
    </span>
  </div>
)}
```

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add src/modules/documents/
git commit -m "feat: add document expiry warnings and trip-date alerts"
```

---

## Task 6: Document Completeness Checklist

**Files:**
- Create: `src/modules/documents/components/DocChecklist.tsx`
- Modify: `src/modules/documents/DocumentsPage.tsx`

Show a checklist of required document categories with completion status.

- [ ] **Step 1: Create DocChecklist component**

```tsx
// src/modules/documents/components/DocChecklist.tsx
import { useAppData } from '@/contexts/AppDataContext'
import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ChecklistItem {
  category: string
  label: string
  required: boolean
  description: string
}

const REQUIRED_DOCS: ChecklistItem[] = [
  { category: 'passport', label: 'דרכונים', required: true, description: '5 דרכונים בתוקף' },
  { category: 'visas', label: 'ESTA', required: true, description: 'אישור כניסה לארה"ב לכל בני המשפחה' },
  { category: 'insurance', label: 'ביטוח נסיעות', required: true, description: 'ביטוח מקיף לכל המשפחה' },
  { category: 'flights', label: 'טיסות', required: true, description: 'כרטיסי טיסה הלוך וחזור' },
  { category: 'car_rental', label: 'השכרת רכב', required: true, description: 'אישור הזמנת קרוואן/רכב' },
  { category: 'accommodation', label: 'לינה', required: false, description: 'הזמנות מלונות ו-Airbnb' },
  { category: 'campsites', label: 'קמפינג', required: false, description: 'הזמנות קמפינג' },
  { category: 'medical', label: 'רפואי', required: false, description: 'מרשמים, ביטוח רפואי' },
]

export function DocChecklist() {
  const { documents } = useAppData()

  const checklist = REQUIRED_DOCS.map((item) => {
    const docs = documents.filter((d) => d.category === item.category)
    const hasDoc = docs.length > 0
    const hasConfirmed = docs.some((d) => d.status === 'reserved')
    return { ...item, hasDoc, hasConfirmed, count: docs.length }
  })

  const completedCount = checklist.filter((c) => c.hasDoc).length

  return (
    <div className="glass rounded-apple-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-headline text-apple-primary">רשימת מסמכים</h3>
        <span className="text-caption text-apple-secondary">
          {completedCount}/{checklist.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {checklist.map((item) => (
          <div key={item.category} className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                item.hasDoc ? 'bg-ios-green/10' : 'bg-black/[0.04]',
              )}
            >
              {item.hasDoc ? (
                <Check className="h-4 w-4 text-ios-green" />
              ) : (
                <Circle className="h-4 w-4 text-apple-tertiary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-body',
                    item.hasDoc ? 'text-apple-primary' : 'text-apple-secondary',
                  )}
                >
                  {item.label}
                </span>
                {item.required && !item.hasDoc && (
                  <span className="text-caption text-ios-red">חובה</span>
                )}
                {item.count > 0 && (
                  <span className="text-caption text-apple-secondary">({item.count})</span>
                )}
              </div>
              <p className="text-caption text-apple-tertiary">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add DocChecklist to DocumentsPage**

Read `src/modules/documents/DocumentsPage.tsx`. Add the checklist as a collapsible section at the top, before the document grid:

```tsx
import { DocChecklist } from './components/DocChecklist'

// Before the category tabs / document grid:
<div className="px-4 mb-4">
  <DocChecklist />
</div>
```

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add src/modules/documents/components/DocChecklist.tsx src/modules/documents/DocumentsPage.tsx
git commit -m "feat: add document completeness checklist"
```

---

## Task 7: Final Build, Test & Deploy

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
1. **Itinerary:** Drive time estimates show between days with duration, distance, tips
2. **Photos:** Camera capture button works, photo compresses and saves with day tag
3. **Blog:** Daily template cards appear, tapping one pre-fills the editor
4. **Documents:** Expiry warnings show on expired/expiring docs, checklist shows completion
5. **RTL:** All new components look correct in RTL

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "chore: phase 4 content richness complete"
git push origin master
```
