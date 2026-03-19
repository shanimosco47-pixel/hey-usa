import { DualClock } from '@/components/shared/DualClock'
import { FamilyAvatar } from '@/components/shared/FamilyAvatar'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/cn'
import { APP_VERSION, buildTimeFormatted } from '@/lib/version'

export function TopBar() {
  const { currentMember } = useAuth()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center justify-between px-5',
        'glass-nav',
        'border-b border-black/[0.04]',
        'shadow-[0_1px_2px_rgba(0,0,0,0.03)]',
      )}
    >
      <div className="flex items-center gap-2 shrink-0">
        {currentMember ? (
          <FamilyAvatar memberId={currentMember} size="sm" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-surface-primary" />
        )}
      </div>

      <div className="flex-1 flex justify-center min-w-0">
        <DualClock />
      </div>

      <div className="flex flex-col items-end shrink-0">
        <h1 className="text-[15px] sm:text-[17px] font-bold tracking-tight text-apple-primary whitespace-nowrap">
          Hey USA
        </h1>
        <span className="text-[9px] text-apple-tertiary font-medium tabular-nums whitespace-nowrap">
          v{APP_VERSION} • {buildTimeFormatted()}
        </span>
      </div>
    </header>
  )
}
