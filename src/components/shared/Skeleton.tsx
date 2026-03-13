import { cn } from '@/lib/cn'

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'card' | 'rect'
  width?: string | number
  height?: string | number
  lines?: number
  className?: string
}

const defaultHeights = {
  text: 14,
  circle: 40,
  card: 120,
  rect: 40,
} as const

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
}: SkeletonProps) {
  const h = height ?? defaultHeights[variant]
  const w = width ?? (variant === 'circle' ? defaultHeights.circle : '100%')

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{
              height: h,
              width: i === lines - 1 ? '75%' : w,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'skeleton-shimmer',
        variant === 'circle' && 'rounded-full',
        className,
      )}
      style={{ width: w, height: h }}
    />
  )
}
