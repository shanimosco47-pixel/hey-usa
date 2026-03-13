import { motion, type TargetAndTransition } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

interface AnimatedIconProps {
  icon: LucideIcon
  className?: string
  animation?: 'bounce' | 'pulse' | 'spin' | 'wiggle' | 'none'
  trigger?: 'hover' | 'always' | 'mount'
}

const animations: Record<string, TargetAndTransition> = {
  bounce: {
    y: [0, -3, 0],
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
  pulse: {
    scale: [1, 1.15, 1],
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
  spin: {
    rotate: 360,
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
  wiggle: {
    rotate: [0, -8, 8, -5, 5, 0],
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
}

export function AnimatedIcon({
  icon: Icon,
  className,
  animation = 'bounce',
  trigger = 'hover',
}: AnimatedIconProps) {
  const anim = animation !== 'none' ? animations[animation] : undefined

  if (trigger === 'always') {
    return (
      <motion.div
        animate={anim}
        transition={{ repeat: Infinity, repeatDelay: 2 }}
        className="inline-flex"
      >
        <Icon className={className} />
      </motion.div>
    )
  }

  if (trigger === 'mount') {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className="inline-flex"
      >
        <Icon className={className} />
      </motion.div>
    )
  }

  return (
    <motion.div
      whileHover={anim}
      whileTap={{ scale: 0.9 }}
      className="inline-flex"
    >
      <Icon className={className} />
    </motion.div>
  )
}

// iOS App Icon-style gradient icon with motion
interface MotionGradientIconProps {
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

export function MotionGradientIcon({
  icon: Icon,
  gradient,
  size = 'md',
  className,
  strokeWidth = 2,
}: MotionGradientIconProps) {
  const sizes = sizeMap[size]

  return (
    <motion.div
      whileHover={{ scale: 1.08, rotate: 2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
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
      {/* Inner shine overlay — top highlight like iOS icons */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 50%)',
          borderRadius: sizes.radius,
        }}
      />
      {/* Subtle edge border */}
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
    </motion.div>
  )
}
