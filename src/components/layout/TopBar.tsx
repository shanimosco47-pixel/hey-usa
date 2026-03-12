import { DualClock } from '@/components/shared/DualClock'
import { FamilyAvatar } from '@/components/shared/FamilyAvatar'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/cn'

export function TopBar() {
  const { currentMember } = useAuth()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between px-4',
        'bg-cream/95 backdrop-blur-sm border-b border-sand-dark/30',
        'font-hebrew',
      )}
    >
      {/* Right side (RTL): App name */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-brown">
          Hey USA
        </h1>
      </div>

      {/* Center: Dual Clock */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <DualClock />
      </div>

      {/* Left side (RTL): Avatar + offline indicator */}
      <div className="flex items-center gap-2">
        {currentMember ? (
          <FamilyAvatar memberId={currentMember} size="sm" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-sand-dark" />
        )}
      </div>
    </header>
  )
}
