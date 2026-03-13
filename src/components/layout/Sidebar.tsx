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
        'glass-nav border-l border-black/[0.04]',
        'shadow-[-1px_0_3px_rgba(0,0,0,0.02)]',
        'flex flex-col',
      )}
    >
      <nav className="flex-1 py-3 px-2.5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-apple-tertiary">
          ניווט
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon]
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-[10px] mb-0.5',
                  'text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-ios-blue text-white shadow-[0_2px_8px_rgba(0,122,255,0.3)]'
                    : 'text-apple-secondary hover:bg-black/[0.04] hover:text-apple-primary',
                )
              }
            >
              {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
