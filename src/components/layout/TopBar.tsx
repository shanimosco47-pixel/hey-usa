import { DualClock } from '@/components/shared/DualClock'
import { FamilyAvatar } from '@/components/shared/FamilyAvatar'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/cn'

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
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-lg" aria-hidden>🇺🇸</span>
        <h1 className="text-[15px] sm:text-[17px] font-bold tracking-tight text-apple-primary">
          Hey USA
        </h1>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2">
        <DualClock />
      </div>

      <div className="flex items-center gap-2">
        {currentMember ? (
          <FamilyAvatar memberId={currentMember} size="sm" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-surface-primary" />
        )}
      </div>
    </header>
  )
}
