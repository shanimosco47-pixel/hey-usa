import { cn } from '@/lib/cn'
import { FAMILY_MEMBERS } from '@/constants'
import type { FamilyMemberId } from '@/types'

interface FamilyAvatarProps {
  memberId: FamilyMemberId
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-base',
  md: 'h-10 w-10 text-xl',
  lg: 'h-16 w-16 text-3xl',
} as const

const ringClasses = {
  sm: 'ring-2',
  md: 'ring-2',
  lg: 'ring-[3px]',
} as const

export function FamilyAvatar({ memberId, size = 'md' }: FamilyAvatarProps) {
  const member = FAMILY_MEMBERS[memberId]

  if (!member) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-[#f5f5f7]',
          sizeClasses[size],
        )}
      >
        ?
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full shrink-0 ring-offset-1',
        sizeClasses[size],
        ringClasses[size],
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${member.color} 12%, white)`,
        '--tw-ring-color': member.color,
      } as React.CSSProperties}
      title={member.name}
    >
      <span role="img" aria-label={member.name}>
        {member.emoji}
      </span>
    </div>
  )
}
