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
        {itineraryDays.slice(0, 21).map((day, index) => {
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
