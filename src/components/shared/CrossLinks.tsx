import { Link } from 'react-router-dom'
import { MapPin, StickyNote, FileText, Bed, Calendar, Map } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface CrossLink {
  to: string
  label: string
  icon: 'location' | 'notes' | 'documents' | 'campsites' | 'itinerary' | 'map'
  count?: number
}

const ICON_MAP = {
  location: { Icon: MapPin, color: 'text-ios-blue bg-ios-blue/10' },
  notes: { Icon: StickyNote, color: 'text-ios-orange bg-ios-orange/10' },
  documents: { Icon: FileText, color: 'text-ios-purple bg-ios-purple/10' },
  campsites: { Icon: Bed, color: 'text-ios-green bg-ios-green/10' },
  itinerary: { Icon: Calendar, color: 'text-ios-red bg-ios-red/10' },
  map: { Icon: Map, color: 'text-ios-teal bg-ios-teal/10' },
} as const

export function CrossLinks({ links, className }: { links: CrossLink[]; className?: string }) {
  if (links.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {links.map((link) => {
        const { Icon, color } = ICON_MAP[link.icon]
        return (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
              'text-caption font-medium transition-all',
              'hover:shadow-sm hover:scale-[1.03] active:scale-[0.97]',
              color,
            )}
          >
            <Icon className="h-3 w-3" />
            <span>{link.label}</span>
            {link.count !== undefined && link.count > 0 && (
              <span className="opacity-60">({link.count})</span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
