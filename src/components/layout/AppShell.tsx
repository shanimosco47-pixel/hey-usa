import { Outlet } from 'react-router-dom'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomTabs } from '@/components/layout/BottomTabs'
import { OfflineBanner } from '@/components/shared/OfflineBanner'
import { cn } from '@/lib/cn'

export function AppShell() {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  return (
    <div className="min-h-screen bg-surface-primary" dir="rtl">
      <OfflineBanner />
      <TopBar />

      <div className="flex">
        {isDesktop && <Sidebar />}

        <main
          className={cn(
            'flex-1 min-h-[calc(100vh-3.5rem)]',
            isDesktop ? 'mr-56' : 'pb-16',
          )}
        >
          <div className="animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {!isDesktop && <BottomTabs />}
    </div>
  )
}

export default AppShell
