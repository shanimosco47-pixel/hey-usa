import { useState, useEffect } from 'react'
import { cn } from '@/lib/cn'
import { FAMILY_MEMBERS } from '@/constants'
import { motion } from 'framer-motion'
import type { FamilyMemberId } from '@/types'
import { getAvatarPhoto, getMemberName } from '@/lib/avatarStorage'

interface FamilyAvatarProps {
  memberId: FamilyMemberId
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showRoleIcon?: boolean
  className?: string
}

const sizeConfig = {
  xs: { box: 'h-6 w-6', text: 'text-[9px]', icon: 'text-[7px] -bottom-0.5 -right-0.5 h-3 w-3', ring: 'ring-[1.5px]' },
  sm: { box: 'h-8 w-8', text: 'text-[11px]', icon: 'text-[8px] -bottom-0.5 -right-0.5 h-3.5 w-3.5', ring: 'ring-2' },
  md: { box: 'h-10 w-10', text: 'text-[13px]', icon: 'text-[9px] -bottom-0.5 -right-0.5 h-4 w-4', ring: 'ring-2' },
  lg: { box: 'h-14 w-14', text: 'text-[17px]', icon: 'text-[11px] -bottom-0.5 -right-0.5 h-5 w-5', ring: 'ring-[2.5px]' },
} as const

const roleIcons: Record<string, string> = {
  aba: '🧢',
  ima: '👑',
  kid1: '⭐',
  kid2: '⭐',
  kid3: '⭐',
  moti: '🤖',
}

export function FamilyAvatar({
  memberId,
  size = 'md',
  showRoleIcon = false,
  className,
}: FamilyAvatarProps) {
  const member = FAMILY_MEMBERS[memberId]
  const cfg = sizeConfig[size]
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const displayName = getMemberName(memberId) || member?.name || '?'
  const displayInitials = displayName.slice(0, 2)

  useEffect(() => {
    setPhotoUrl(getAvatarPhoto(memberId))
  }, [memberId])

  if (!member) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-[#e5e5ea]',
          cfg.box,
          className,
        )}
      >
        <span className={cn('font-semibold text-apple-secondary', cfg.text)}>?</span>
      </div>
    )
  }

  return (
    <motion.div
      className={cn('relative inline-flex shrink-0', className)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Main avatar circle */}
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-bold text-white overflow-hidden',
          'ring-white/80 ring-offset-1 ring-offset-white/50',
          cfg.box,
          cfg.text,
          cfg.ring,
        )}
        style={{
          background: `linear-gradient(145deg, ${member.color}, ${member.colorEnd || member.color})`,
          boxShadow: `0 2px 10px ${member.color}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
        }}
        title={displayName}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)] select-none">
            {displayInitials}
          </span>
        )}
      </div>

      {/* Role icon badge */}
      {showRoleIcon && roleIcons[memberId] && (
        <span
          className={cn(
            'absolute flex items-center justify-center rounded-full',
            'bg-white shadow-sm border border-black/5',
            cfg.icon,
          )}
          aria-hidden
        >
          {roleIcons[memberId]}
        </span>
      )}
    </motion.div>
  )
}
