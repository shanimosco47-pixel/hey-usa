import { cn } from '@/lib/cn'
import { FAMILY_MEMBERS } from '@/constants'
import type { FamilyMemberId } from '@/types'

interface FamilyAvatarProps {
  memberId: FamilyMemberId
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-[13px]',
  lg: 'h-14 w-14 text-[17px]',
} as const

export function FamilyAvatar({ memberId, size = 'md' }: FamilyAvatarProps) {
  const member = FAMILY_MEMBERS[memberId]

  if (!member) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-[#e5e5ea]',
          sizeClasses[size],
        )}
      >
        <span className="font-semibold text-apple-secondary">?</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full shrink-0 font-semibold tracking-tight text-white',
        sizeClasses[size],
      )}
      style={{
        background: `linear-gradient(145deg, ${member.color}, ${member.colorEnd || member.color})`,
        boxShadow: `0 2px 8px ${member.color}33`,
      }}
      title={member.name}
    >
      {member.initials}
    </div>
  )
}
