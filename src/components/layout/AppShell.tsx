import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomTabs } from '@/components/layout/BottomTabs'
import { OfflineBanner } from '@/components/shared/OfflineBanner'
import { cn } from '@/lib/cn'

export function AppShell() {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const location = useLocation()

  return (
    <div className="min-h-screen bg-surface-primary" dir="rtl">
      <OfflineBanner />
      <TopBar />

      <div className="flex">
        {isDesktop && <Sidebar />}

        <main
          className={cn(
            'flex-1 min-w-0 min-h-[calc(100vh-3.5rem)] overflow-x-hidden',
            isDesktop ? 'mr-56' : 'pb-16',
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                mass: 0.8,
              }}
            >
              <Suspense
                fallback={
                  <div className="flex min-h-[50vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-black/[0.06] border-t-ios-blue" />
                  </div>
                }
              >
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {!isDesktop && <BottomTabs />}
    </div>
  )
}

export default AppShell
