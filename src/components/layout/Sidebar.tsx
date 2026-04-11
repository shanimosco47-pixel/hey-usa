import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  ClipboardCheck,
  CalendarDays,
  FolderOpen,
  MapPinned,
  MapPin,
  ImagePlus,
  Notebook,
  Wallet,
  Headphones,
  Luggage,
  StickyNote,
  Bot,
  Tent,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { NAV_ITEMS } from '@/constants'
import { APP_VERSION, buildTimeFormatted } from '@/lib/version'
import { useSidebar } from '@/contexts/SidebarContext'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  ClipboardCheck,
  CalendarDays,
  FolderOpen,
  MapPinned,
  MapPin,
  ImagePlus,
  Notebook,
  Wallet,
  Headphones,
  Luggage,
  StickyNote,
  Bot,
  Tent,
}

export function Sidebar() {
  const { collapsed, toggle } = useSidebar()

  return (
    <>
      {/* Expand button visible when sidebar is collapsed */}
      {collapsed && (
        <button
          onClick={toggle}
          className="fixed top-16 right-2 z-30 rounded-apple-sm bg-white/90 backdrop-blur-sm p-2 shadow-glass hover:shadow-glass-hover transition-shadow"
          title="הצג תפריט"
        >
          <PanelRightOpen className="h-5 w-5 text-apple-secondary" />
        </button>
      )}
      <aside
        className={cn(
          'fixed top-14 right-0 bottom-0 z-20',
          'w-64 overflow-y-auto',
          'glass-nav border-l border-passport-rust/[0.06]',
          'shadow-[-1px_0_3px_rgba(0,0,0,0.02)]',
          'flex flex-col',
          'transition-transform duration-300',
          collapsed ? 'translate-x-full' : 'translate-x-0',
        )}
      >
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <p className="text-subhead font-semibold uppercase tracking-widest text-apple-tertiary">
            ניווט
          </p>
          <button
            onClick={toggle}
            className="rounded-apple-sm p-1.5 hover:bg-passport-rust/[0.06] transition-colors"
            title="הסתר תפריט"
          >
            <PanelRightClose className="h-4 w-4 text-apple-tertiary" />
          </button>
        </div>
        <nav aria-label="ניווט ראשי" className="flex-1 py-1 px-2.5">
          {NAV_ITEMS.map((item, index) => {
            const Icon = ICON_MAP[item.icon]
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: index * 0.03,
                  type: 'spring',
                  stiffness: 300,
                  damping: 24,
                }}
              >
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-[10px] mb-0.5',
                      'text-body font-medium transition-all duration-150',
                      isActive
                        ? 'bg-passport-rust text-white shadow-[0_2px_8px_rgba(180,83,9,0.25)]'
                        : 'text-apple-secondary hover:bg-passport-rust/[0.06] hover:text-apple-primary',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {Icon && (
                        <motion.div
                          whileHover={!isActive ? { scale: 1.15, rotate: 5 } : undefined}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                          className="inline-flex"
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                        </motion.div>
                      )}
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              </motion.div>
            )
          })}
        </nav>
        <div className="px-4 py-3 border-t border-black/[0.04] text-caption text-apple-tertiary text-center leading-relaxed">
          <span>גרסה {APP_VERSION}</span>
          <span className="mx-1">·</span>
          <span>עודכן {buildTimeFormatted()}</span>
        </div>
      </aside>
    </>
  )
}
