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

// Wrapper for the GradientIcon that adds motion
interface MotionGradientIconProps {
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

export function MotionGradientIcon({
  icon: Icon,
  gradient,
  size = 'md',
  className,
}: MotionGradientIconProps) {
  const sizes = sizeMap[size]

  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: 3 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
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
    </motion.div>
  )
}
