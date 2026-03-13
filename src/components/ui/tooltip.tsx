import * as React from 'react'
import { cn } from '@/lib/cn'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [open, setOpen] = React.useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 pointer-events-none',
            'rounded-apple-sm px-3 py-1.5',
            'bg-dark/90 backdrop-blur-lg text-white text-xs font-medium',
            'shadow-glass-float border border-white/[0.08]',
            'animate-in fade-in-0 zoom-in-95',
            positionClasses[side],
            className,
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
