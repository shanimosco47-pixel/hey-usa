import { cn } from '@/lib/cn'
import type { LucideIcon } from 'lucide-react'

interface GradientIconProps {
  icon: LucideIcon
  gradient: [string, string]
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { container: 'h-7 w-7 rounded-[6px]', icon: 'h-4 w-4' },
  md: { container: 'h-8 w-8 rounded-apple-sm', icon: 'h-[18px] w-[18px]' },
  lg: { container: 'h-10 w-10 rounded-[10px]', icon: 'h-5 w-5' },
} as const

export function GradientIcon({
  icon: Icon,
  gradient,
  size = 'md',
  className,
}: GradientIconProps) {
  const sizes = sizeMap[size]

  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0',
        sizes.container,
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        boxShadow: `0 2px 8px color-mix(in srgb, ${gradient[0]} 30%, transparent)`,
      }}
    >
      <Icon className={cn(sizes.icon, 'text-white')} />
    </div>
  )
}
