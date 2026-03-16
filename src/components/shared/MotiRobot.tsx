import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getAvatarPhoto } from '@/lib/avatarStorage'

/**
 * Moti — the family's quirky white robot companion.
 *
 * A playful white robot with blue eyes, rosy cheeks, a tilted hat,
 * and animated personality (blinking, waving, mouth movement).
 *
 * Used in: ChatPage, DashboardPage floating button, anywhere Moti appears.
 */

interface MotiRobotProps {
  size?: number
  /** Which personality pose to show */
  pose?: 'default' | 'waving' | 'cool' | 'thinking'
  /** Enable animations (blinking, waving, etc.) */
  animated?: boolean
}

export function MotiRobot({ size = 64, pose = 'default', animated = true }: MotiRobotProps) {
  const showHat = pose === 'cool' || pose === 'default'
  const showThinkingBubble = pose === 'thinking'
  const isWaving = pose === 'waving' || pose === 'default'

  return (
    <svg
      viewBox="0 0 64 72"
      width={size}
      height={size * (72 / 64)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* === Hat (tilted, playful) === */}
      {showHat && (
        <g transform="rotate(-12, 32, 10)">
          {/* Hat brim */}
          <ellipse cx="32" cy="14" rx="16" ry="3" fill="#2C2C2E" />
          {/* Hat top */}
          <rect x="22" y="3" width="20" height="12" rx="3" fill="#2C2C2E" />
          {/* Hat band */}
          <rect x="22" y="11" width="20" height="2.5" rx="1" fill="#FF6B6B" />
        </g>
      )}

      {/* === Antenna (peeks from under hat) === */}
      <line x1="32" y1="12" x2="32" y2="18" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round" />
      {animated ? (
        <motion.circle
          cx="32" cy="11" r="2.5"
          fill="#FF6B6B"
          animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      ) : (
        <circle cx="32" cy="11" r="2.5" fill="#FF6B6B" />
      )}

      {/* === Head (white, rounded) === */}
      <rect x="14" y="18" width="36" height="26" rx="8" fill="white" stroke="#E5E5EA" strokeWidth="1" />

      {/* Ear bolts */}
      <circle cx="14" cy="30" r="2.5" fill="#E5E5EA" stroke="#D1D1D6" strokeWidth="0.5" />
      <circle cx="50" cy="30" r="2.5" fill="#E5E5EA" stroke="#D1D1D6" strokeWidth="0.5" />

      {/* === Eyes (expressive blue) === */}
      {animated ? (
        <motion.g
          animate={{ scaleY: [1, 0.08, 1] }}
          transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
          style={{ transformOrigin: '32px 29px' }}
        >
          {/* Left eye */}
          <ellipse cx="25" cy="29" rx="4.5" ry="5" fill="#007AFF" />
          <circle cx="26.5" cy="27.5" r="2" fill="white" opacity="0.9" />
          <circle cx="23.5" cy="31" r="1" fill="white" opacity="0.4" />
          {/* Right eye */}
          <ellipse cx="39" cy="29" rx="4.5" ry="5" fill="#007AFF" />
          <circle cx="40.5" cy="27.5" r="2" fill="white" opacity="0.9" />
          <circle cx="37.5" cy="31" r="1" fill="white" opacity="0.4" />
        </motion.g>
      ) : (
        <g>
          <ellipse cx="25" cy="29" rx="4.5" ry="5" fill="#007AFF" />
          <circle cx="26.5" cy="27.5" r="2" fill="white" opacity="0.9" />
          <ellipse cx="39" cy="29" rx="4.5" ry="5" fill="#007AFF" />
          <circle cx="40.5" cy="27.5" r="2" fill="white" opacity="0.9" />
        </g>
      )}

      {/* === Rosy cheeks === */}
      <circle cx="19" cy="34" r="3" fill="#FF6B6B" opacity="0.2" />
      <circle cx="45" cy="34" r="3" fill="#FF6B6B" opacity="0.2" />

      {/* === Mouth (happy smile) === */}
      {animated ? (
        <motion.path
          d="M26 37 Q32 42 38 37"
          stroke="#2C2C2E"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{ d: ['M26 37 Q32 42 38 37', 'M26 37 Q32 40 38 37', 'M26 37 Q32 42 38 37'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <path d="M26 37 Q32 42 38 37" stroke="#2C2C2E" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}

      {/* === Body (white, smaller than head for cute proportions) === */}
      <rect x="20" y="46" width="24" height="16" rx="6" fill="white" stroke="#E5E5EA" strokeWidth="1" />

      {/* Heart on chest */}
      <path
        d="M30 51 C30 49.5 32 48 32 50 C32 48 34 49.5 34 51 C34 53 32 54.5 32 54.5 C32 54.5 30 53 30 51Z"
        fill="#FF6B6B"
        opacity="0.7"
      />

      {/* === Arms === */}
      {/* Left arm */}
      <rect x="8" y="48" width="10" height="5" rx="2.5" fill="white" stroke="#E5E5EA" strokeWidth="1" />

      {/* Right arm (waving!) */}
      {animated && isWaving ? (
        <motion.g
          animate={{ rotate: [0, -25, 5, -25, 0] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
          style={{ transformOrigin: '46px 50px' }}
        >
          <rect x="46" y="48" width="10" height="5" rx="2.5" fill="white" stroke="#E5E5EA" strokeWidth="1" />
          {/* Little hand */}
          <circle cx="57" cy="50.5" r="2" fill="white" stroke="#E5E5EA" strokeWidth="0.5" />
        </motion.g>
      ) : (
        <rect x="46" y="48" width="10" height="5" rx="2.5" fill="white" stroke="#E5E5EA" strokeWidth="1" />
      )}

      {/* === Feet (stubby, cute) === */}
      <rect x="22" y="62" width="8" height="5" rx="2.5" fill="white" stroke="#E5E5EA" strokeWidth="1" />
      <rect x="34" y="62" width="8" height="5" rx="2.5" fill="white" stroke="#E5E5EA" strokeWidth="1" />

      {/* === Thinking bubble === */}
      {showThinkingBubble && (
        <g>
          <circle cx="54" cy="16" r="2" fill="#E5E5EA" />
          <circle cx="58" cy="12" r="3" fill="#E5E5EA" />
          <circle cx="60" cy="6" r="4" fill="#E5E5EA" />
        </g>
      )}
    </svg>
  )
}

/**
 * Moti avatar bubble — used in chat messages, family strips, etc.
 * White/silver gradient background instead of green.
 */
export function MotiAvatar({
  size = 'md',
  animated = true,
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  animated?: boolean
}) {
  const sizeMap = { xs: 'h-6 w-6', sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' }
  const robotSize = { xs: 18, sm: 24, md: 30, lg: 42 }
  const px = sizeMap[size]
  const rs = robotSize[size]
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    setPhotoUrl(getAvatarPhoto('moti'))
  }, [])

  if (photoUrl) {
    return (
      <motion.div
        animate={animated ? { y: [0, -2, 0] } : undefined}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className={`${px} rounded-full shrink-0 overflow-hidden`}
        style={{
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          border: '1.5px solid rgba(0,0,0,0.06)',
        }}
      >
        <img src={photoUrl} alt="מוטי" className="h-full w-full object-cover" />
      </motion.div>
    )
  }

  return (
    <motion.div
      animate={animated ? { y: [0, -2, 0] } : undefined}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      className={`${px} rounded-full flex items-center justify-center shrink-0 overflow-hidden`}
      style={{
        background: 'linear-gradient(145deg, #F5F5F7, #E5E5EA)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255,255,255,0.8)',
        border: '1.5px solid rgba(0,0,0,0.06)',
      }}
    >
      <MotiRobot size={rs} animated={animated} pose="default" />
    </motion.div>
  )
}
