import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, ClipboardCheck, MapPinned, ImagePlus, MoreHorizontal,
  CalendarDays, FolderOpen, Notebook, Wallet, Headphones, Luggage, Bot, X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { BOTTOM_TAB_ITEMS, MORE_MENU_ITEMS } from '@/constants'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Home, ClipboardCheck, MapPinned, ImagePlus, CalendarDays,
  FolderOpen, Notebook, Wallet, Headphones, Luggage, Bot,
}

export function BottomTabs() {
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      {/* More Drawer Overlay */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* More Drawer — spring-animated */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'fixed bottom-16 left-0 right-0 z-50',
              'glass-float rounded-t-apple-xl shadow-glass-float',
              'border-t border-black/[0.06]',
            )}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-caption uppercase tracking-wide text-apple-secondary">עוד מודולים</h3>
              <motion.button
                whileTap={{ scale: 0.85, rotate: 90 }}
                onClick={() => setMoreOpen(false)}
                className="rounded-full p-1 hover:bg-black/[0.04] transition-colors"
                aria-label="סגור"
              >
                <X className="h-5 w-5 text-apple-secondary" />
              </motion.button>
            </div>
            <div className="grid grid-cols-3 gap-1 px-4 pb-4">
              {MORE_MENU_ITEMS.map((item, index) => {
                const Icon = ICON_MAP[item.icon]
                return (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.04,
                      type: 'spring',
                      stiffness: 300,
                      damping: 24,
                    }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      setMoreOpen(false)
                      navigate(item.path)
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-apple py-3 px-2',
                      'hover:bg-black/[0.04] transition-colors',
                      'text-apple-primary',
                    )}
                  >
                    {Icon && <Icon className="h-6 w-6" />}
                    <span className="text-caption">{item.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Tab Bar */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-30',
          'flex h-16 items-center justify-around',
          'glass-nav border-t border-black/[0.06]',
          'pb-safe',
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
                  'flex flex-col items-center gap-0.5 px-4 py-1.5',
                  'text-[10px] font-medium transition-colors duration-150',
                  isActive
                    ? 'text-ios-blue font-semibold'
                    : 'text-apple-tertiary',
                )
              }
            >
              {({ isActive }) => (
                <motion.div
                  className="flex flex-col items-center gap-0.5"
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  {isActive && (
                    <motion.div
                      layoutId="tab-dot"
                      className="h-[3px] w-[3px] rounded-full bg-ios-blue"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span>{item.label}</span>
                </motion.div>
              )}
            </NavLink>
          )
        })}

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => setMoreOpen((prev) => !prev)}
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-1.5',
            'text-[10px] transition-colors',
            moreOpen ? 'text-ios-blue font-semibold' : 'text-apple-secondary',
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>עוד</span>
        </motion.button>
      </nav>
    </>
  )
}
