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
    <div className="min-h-screen bg-sand font-hebrew" dir="rtl">
      <OfflineBanner />
      <TopBar />

      <div className="flex">
        {/* Desktop sidebar on the right (RTL means right is the start side) */}
        {isDesktop && <Sidebar />}

        {/* Main content area */}
        <main
          className={cn(
            'flex-1 min-h-[calc(100vh-3.5rem)]',
            isDesktop ? 'mr-56' : 'pb-16',
          )}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tabs */}
      {!isDesktop && <BottomTabs />}
    </div>
  )
}

export default AppShell
