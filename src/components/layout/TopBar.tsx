import { Sun, Moon, Search } from 'lucide-react'
import { DualClock } from '@/components/shared/DualClock'
import { FamilyAvatar } from '@/components/shared/FamilyAvatar'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/cn'
import { APP_VERSION, buildTimeFormatted } from '@/lib/version'

export function TopBar() {
  const { currentMember } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center justify-between px-5',
        'glass-nav',
        'border-b border-black/[0.04] dark:border-white/[0.06]',
        'shadow-[0_1px_2px_rgba(0,0,0,0.03)]',
      )}
    >
      <div className="flex items-center gap-2 shrink-0">
        {currentMember ? (
          <FamilyAvatar memberId={currentMember} size="sm" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-surface-primary" />
        )}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'מצב בהיר' : 'מצב כהה'}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            'transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.1]',
          )}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-ios-orange" />
          ) : (
            <Moon className="h-4 w-4 text-apple-secondary" />
          )}
        </button>
        <button
          onClick={() =>
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
          }
          aria-label="חיפוש"
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            'transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.1]',
          )}
        >
          <Search className="h-4 w-4 text-apple-secondary" />
        </button>
      </div>

      <div className="flex-1 flex justify-center min-w-0">
        <DualClock />
      </div>

      <div className="flex flex-col items-end shrink-0">
        <h1 className="text-[15px] sm:text-[17px] font-bold tracking-tight text-apple-primary whitespace-nowrap">
          Hey USA
        </h1>
        <span className="text-[9px] font-bold text-black dark:text-white/70 tabular-nums whitespace-nowrap">
          v{APP_VERSION} • {buildTimeFormatted()}
        </span>
      </div>
    </header>
  )
}
