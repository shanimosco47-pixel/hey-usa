import { cn } from '@/lib/cn'
import type { LucideIcon } from 'lucide-react'

interface GradientIconProps {
  icon: LucideIcon
  gradient: [string, string]
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  strokeWidth?: number
}

const sizeMap = {
  sm: { container: 'h-8 w-8', icon: 'h-4 w-4', radius: 8 },
  md: { container: 'h-11 w-11', icon: 'h-5 w-5', radius: 12 },
  lg: { container: 'h-14 w-14', icon: 'h-7 w-7', radius: 16 },
  xl: { container: 'h-16 w-16', icon: 'h-8 w-8', radius: 18 },
} as const

export function GradientIcon({
  icon: Icon,
  gradient,
  size = 'md',
  className,
  strokeWidth = 2,
}: GradientIconProps) {
  const sizes = sizeMap[size]

  return (
    <div
      className={cn(
        'relative flex items-center justify-center shrink-0 overflow-hidden',
        sizes.container,
        className,
      )}
      style={{
        background: `linear-gradient(145deg, ${gradient[0]}, color-mix(in srgb, ${gradient[1]} 85%, ${gradient[0]}), ${gradient[1]})`,
        borderRadius: sizes.radius,
        boxShadow: [
          `0 4px 12px color-mix(in srgb, ${gradient[0]} 35%, transparent)`,
          `0 1px 3px rgba(0,0,0,0.12)`,
          `inset 0 1px 0 rgba(255,255,255,0.25)`,
        ].join(', '),
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 50%)',
          borderRadius: sizes.radius,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          border: '0.5px solid rgba(255,255,255,0.2)',
          borderRadius: sizes.radius,
        }}
      />
      <Icon
        className={cn(sizes.icon, 'text-white relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]')}
        strokeWidth={strokeWidth}
      />
    </div>
  )
}
