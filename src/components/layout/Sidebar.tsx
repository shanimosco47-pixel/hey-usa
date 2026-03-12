import { NavLink } from 'react-router-dom'
import {
  Home,
  CheckSquare,
  Calendar,
  FileText,
  Map,
  Camera,
  BookOpen,
  DollarSign,
  Music,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { NAV_ITEMS } from '@/constants'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  CheckSquare,
  Calendar,
  FileText,
  Map,
  Camera,
  BookOpen,
  DollarSign,
  Music,
  Package,
}

export function Sidebar() {
  return (
    <aside
      className={cn(
        'fixed top-14 right-0 bottom-0 z-20',
        'w-56 overflow-y-auto',
        'bg-cream border-l border-sand-dark/30',
        'flex flex-col font-hebrew',
      )}
    >
      {/* Logo / Title */}
      <div className="px-4 py-5 border-b border-sand-dark/20">
        <h2 className="text-xl font-bold text-brown">
          Hey USA 🇺🇸
        </h2>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon]
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg',
                  'text-sm transition-colors duration-150',
                  isActive
                    ? 'bg-terracotta/10 text-terracotta font-semibold'
                    : 'text-brown hover:bg-sand-dark/30 hover:text-brown',
                )
              }
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
