import { cn } from '@/lib/cn'
import { STATUS_MAP } from '@/constants'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_MAP[status]

  if (!config) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full font-hebrew',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
          'bg-gray-200 text-gray-600',
        )}
      >
        {status}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-hebrew',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.bg,
        config.color,
      )}
    >
      {config.label}
    </span>
  )
}
