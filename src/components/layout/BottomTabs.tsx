import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home,
  CheckSquare,
  Map,
  Camera,
  MoreHorizontal,
  Calendar,
  FileText,
  BookOpen,
  DollarSign,
  Music,
  Package,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { BOTTOM_TAB_ITEMS, MORE_MENU_ITEMS } from '@/constants'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  CheckSquare,
  Map,
  Camera,
  Calendar,
  FileText,
  BookOpen,
  DollarSign,
  Music,
  Package,
}

export function BottomTabs() {
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      {/* More Drawer Overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More Drawer */}
      <div
        className={cn(
          'fixed bottom-16 left-0 right-0 z-50',
          'bg-cream rounded-t-2xl shadow-lg border-t border-sand-dark/30',
          'transform transition-transform duration-300 ease-out',
          'font-hebrew',
          moreOpen ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-sm font-bold text-brown">עוד מודולים</h3>
          <button
            onClick={() => setMoreOpen(false)}
            className="rounded-full p-1 hover:bg-sand-dark/30 transition-colors"
            aria-label="סגור"
          >
            <X className="h-5 w-5 text-brown-light" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1 px-4 pb-4">
          {MORE_MENU_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon]
            return (
              <button
                key={item.path}
                onClick={() => {
                  setMoreOpen(false)
                  navigate(item.path)
                }}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl py-3 px-2',
                  'hover:bg-sand-dark/30 transition-colors',
                  'text-brown',
                )}
              >
                {Icon && <Icon className="h-6 w-6" />}
                <span className="text-xs">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-30',
          'flex h-16 items-center justify-around',
          'bg-cream/95 backdrop-blur-sm border-t border-sand-dark/30',
          'font-hebrew safe-area-pb',
        )}
      >
        {BOTTOM_TAB_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon]
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5',
                  'text-xs transition-colors',
                  isActive
                    ? 'text-terracotta font-semibold'
                    : 'text-brown-light',
                )
              }
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span>{item.label}</span>
            </NavLink>
          )
        })}

        {/* More Button */}
        <button
          onClick={() => setMoreOpen((prev) => !prev)}
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-1.5',
            'text-xs transition-colors',
            moreOpen ? 'text-terracotta font-semibold' : 'text-brown-light',
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>עוד</span>
        </button>
      </nav>
    </>
  )
}
