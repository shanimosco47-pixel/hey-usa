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
  const { tasks, documents, packingItems, budgetSettings, itineraryDays, blogPosts } = useAppData()

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

  const results = achievements.map((a) => ({
    ...a,
    unlocked: a.id === 'trip-master' ? false : a.check(),
  }))

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
