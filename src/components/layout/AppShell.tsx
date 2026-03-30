import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomTabs } from '@/components/layout/BottomTabs'
import { OfflineBanner } from '@/components/shared/OfflineBanner'
import { PageErrorBoundary } from '@/components/shared/PageErrorBoundary'
import { cn } from '@/lib/cn'

export function AppShell() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const location = useLocation()

  return (
    <div className="min-h-screen bg-passport-cream dark:bg-black" dir="rtl">
      <a href="#main-content" className="skip-link">
        דלג לתוכן הראשי
      </a>
      <OfflineBanner />
      <TopBar />

      <div className="flex">
        {isDesktop && <Sidebar />}

        <main
          id="main-content"
          className={cn(
            'flex-1 min-w-0 min-h-[calc(100vh-3.5rem)] overflow-x-hidden',
            isDesktop ? 'me-64' : 'pb-16',
          )}
        >
          <div className="w-full max-w-7xl mx-auto">
            <PageErrorBoundary>
              <Suspense
                fallback={
                  <div className="flex min-h-[50vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-black/[0.06] border-t-ios-blue" />
                  </div>
                }
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                      mass: 0.8,
                    }}
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </PageErrorBoundary>
          </div>
        </main>
      </div>

      {!isDesktop && <BottomTabs />}
    </div>
  )
}

export default AppShell
