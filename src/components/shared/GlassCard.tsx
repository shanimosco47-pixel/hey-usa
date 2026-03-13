import { cn } from '@/lib/cn'

interface GlassCardProps {
  elevation?: 1 | 2
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
} as const

export function GlassCard({
  elevation = 1,
  padding = 'md',
  className,
  children,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'motion-reduce:transition-none',
        elevation === 1
          ? 'glass rounded-apple-lg shadow-glass'
          : 'glass-float rounded-apple-xl shadow-glass-float',
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  )
}
