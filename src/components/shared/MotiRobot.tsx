import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getAvatarPhoto } from '@/lib/avatarStorage'

/**
 * Moti — the family's quirky robot companion.
 *
 * A playful light-gray robot with clear outlines, blue eyes, rosy cheeks,
 * and animated personality — random hats, poses, flips, and expressions.
 * Visible and distinct on any background thanks to solid outlines and fills.
 *
 * Used in: ChatPage, DashboardPage floating button, anywhere Moti appears.
 */

type MotiHat = 'fedora' | 'cowboy' | 'chef' | 'party' | 'propeller' | 'none'
type MotiExpression = 'happy' | 'cool' | 'wink' | 'tongue' | 'surprised'

const HATS: MotiHat[] = ['fedora', 'cowboy', 'chef', 'party', 'propeller', 'none']
const EXPRESSIONS: MotiExpression[] = ['happy', 'cool', 'wink', 'tongue', 'surprised']

interface MotiRobotProps {
  size?: number
  /** Which personality pose to show */
  pose?: 'default' | 'waving' | 'cool' | 'thinking' | 'celebrating'
  /** Enable animations (blinking, waving, etc.) */
  animated?: boolean
  /** Force a specific hat */
  hat?: MotiHat
  /** Force a specific expression */
  expression?: MotiExpression
}

export function MotiRobot({
  size = 64,
  pose = 'default',
  animated = true,
  hat: forcedHat,
  expression: forcedExpression,
}: MotiRobotProps) {
  const [randomHat, setRandomHat] = useState<MotiHat>('fedora')
  const [randomExpr, setRandomExpr] = useState<MotiExpression>('happy')

  // Randomly switch hats and expressions every 8-15 seconds
  useEffect(() => {
    if (!animated) return
    const interval = setInterval(() => {
      setRandomHat(HATS[Math.floor(Math.random() * HATS.length)])
      setRandomExpr(EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)])
    }, 8000 + Math.random() * 7000)
    return () => clearInterval(interval)
  }, [animated])

  const hat = forcedHat ?? randomHat
  const expr = forcedExpression ?? randomExpr
  const isWaving = pose === 'waving' || pose === 'default'
  const isCelebrating = pose === 'celebrating'
  const showThinkingBubble = pose === 'thinking'

  return (
    <svg
      viewBox="0 0 64 76"
      width={size}
      height={size * (76 / 64)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* === Hat === */}
      {hat === 'fedora' && (
        <g transform="rotate(-10, 32, 10)">
          <ellipse cx="32" cy="14" rx="17" ry="3.5" fill="#3A3A3C" />
          <rect x="21" y="3" width="22" height="12" rx="3" fill="#3A3A3C" />
          <rect x="21" y="11" width="22" height="2.5" rx="1" fill="#FF6B6B" />
        </g>
      )}
      {hat === 'cowboy' && (
        <g transform="rotate(-8, 32, 10)">
          <ellipse cx="32" cy="15" rx="20" ry="3" fill="#8B6914" />
          <path d="M22 15 Q24 3 32 6 Q40 3 42 15" fill="#CD853F" stroke="#8B6914" strokeWidth="0.8" />
          <rect x="25" y="10" width="14" height="2" rx="1" fill="#D4A574" />
        </g>
      )}
      {hat === 'chef' && (
        <g transform="translate(0, -2)">
          <circle cx="32" cy="8" r="8" fill="white" stroke="#D1D1D6" strokeWidth="1" />
          <circle cx="26" cy="6" r="5" fill="white" stroke="#D1D1D6" strokeWidth="0.5" />
          <circle cx="38" cy="6" r="5" fill="white" stroke="#D1D1D6" strokeWidth="0.5" />
          <rect x="24" y="12" width="16" height="4" rx="1" fill="white" stroke="#D1D1D6" strokeWidth="0.8" />
        </g>
      )}
      {hat === 'party' && (
        <g transform="rotate(-15, 32, 10)">
          <polygon points="32,0 24,16 40,16" fill="#FF6B6B" stroke="#E55555" strokeWidth="0.5" />
          <circle cx="32" cy="0" r="2.5" fill="#FFD700" />
          <rect x="27" y="5" width="2" height="4" rx="0.5" fill="#4ECDC4" transform="rotate(15, 28, 7)" />
          <rect x="33" y="3" width="2" height="5" rx="0.5" fill="#FFD700" transform="rotate(-10, 34, 5.5)" />
        </g>
      )}
      {hat === 'propeller' && (
        <g>
          <rect x="28" y="8" width="8" height="8" rx="2" fill="#4A90D9" stroke="#357ABD" strokeWidth="0.5" />
          <line x1="28" y1="12" x2="36" y2="12" stroke="white" strokeWidth="1" />
          {animated ? (
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '32px 8px' }}
            >
              <ellipse cx="24" cy="7" rx="7" ry="2" fill="#FF6B6B" opacity="0.9" />
              <ellipse cx="40" cy="9" rx="7" ry="2" fill="#4ECDC4" opacity="0.9" />
            </motion.g>
          ) : (
            <g>
              <ellipse cx="24" cy="7" rx="7" ry="2" fill="#FF6B6B" opacity="0.9" />
              <ellipse cx="40" cy="9" rx="7" ry="2" fill="#4ECDC4" opacity="0.9" />
            </g>
          )}
        </g>
      )}

      {/* === Antenna === */}
      <line x1="32" y1="14" x2="32" y2="20" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" />
      {animated ? (
        <motion.circle
          cx="32" cy="13" r="2.5"
          fill="#FF6B6B"
          animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      ) : (
        <circle cx="32" cy="13" r="2.5" fill="#FF6B6B" />
      )}

      {/* === Head (light gray with solid outline) === */}
      <rect x="13" y="20" width="38" height="28" rx="9" fill="#F0F0F5" stroke="#8E8E93" strokeWidth="1.5" />

      {/* Ear bolts */}
      <circle cx="13" cy="33" r="3" fill="#D1D1D6" stroke="#8E8E93" strokeWidth="1" />
      <circle cx="51" cy="33" r="3" fill="#D1D1D6" stroke="#8E8E93" strokeWidth="1" />

      {/* === Eyes === */}
      {expr === 'cool' ? (
        /* Sunglasses */
        <g>
          <rect x="17" y="27" width="12" height="7" rx="2" fill="#1C1C1E" stroke="#3A3A3C" strokeWidth="0.5" />
          <rect x="35" y="27" width="12" height="7" rx="2" fill="#1C1C1E" stroke="#3A3A3C" strokeWidth="0.5" />
          <line x1="29" y1="30" x2="35" y2="30" stroke="#3A3A3C" strokeWidth="1.5" />
          <rect x="17" y="28" width="12" height="2" rx="1" fill="white" opacity="0.15" />
          <rect x="35" y="28" width="12" height="2" rx="1" fill="white" opacity="0.15" />
        </g>
      ) : expr === 'wink' ? (
        <g>
          {/* Left eye normal */}
          <ellipse cx="25" cy="31" rx="5" ry="5.5" fill="#007AFF" />
          <circle cx="27" cy="29" r="2" fill="white" opacity="0.9" />
          {/* Right eye winking */}
          <path d="M35 31 Q39 28 43 31" stroke="#3A3A3C" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
      ) : expr === 'surprised' ? (
        <g>
          <circle cx="25" cy="31" r="6" fill="#007AFF" />
          <circle cx="26" cy="29" r="2.5" fill="white" opacity="0.9" />
          <circle cx="39" cy="31" r="6" fill="#007AFF" />
          <circle cx="40" cy="29" r="2.5" fill="white" opacity="0.9" />
        </g>
      ) : (
        /* Default / happy / tongue eyes */
        animated ? (
          <motion.g
            animate={{ scaleY: [1, 0.08, 1] }}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
            style={{ transformOrigin: '32px 31px' }}
          >
            <ellipse cx="25" cy="31" rx="5" ry="5.5" fill="#007AFF" />
            <circle cx="27" cy="29" r="2" fill="white" opacity="0.9" />
            <circle cx="23.5" cy="33" r="1" fill="white" opacity="0.4" />
            <ellipse cx="39" cy="31" rx="5" ry="5.5" fill="#007AFF" />
            <circle cx="41" cy="29" r="2" fill="white" opacity="0.9" />
            <circle cx="37.5" cy="33" r="1" fill="white" opacity="0.4" />
          </motion.g>
        ) : (
          <g>
            <ellipse cx="25" cy="31" rx="5" ry="5.5" fill="#007AFF" />
            <circle cx="27" cy="29" r="2" fill="white" opacity="0.9" />
            <ellipse cx="39" cy="31" rx="5" ry="5.5" fill="#007AFF" />
            <circle cx="41" cy="29" r="2" fill="white" opacity="0.9" />
          </g>
        )
      )}

      {/* === Rosy cheeks === */}
      <circle cx="18" cy="37" r="3.5" fill="#FF6B6B" opacity="0.25" />
      <circle cx="46" cy="37" r="3.5" fill="#FF6B6B" opacity="0.25" />

      {/* === Mouth === */}
      {expr === 'tongue' ? (
        <g>
          <path d="M25 39 Q32 45 39 39" stroke="#3A3A3C" strokeWidth="2" strokeLinecap="round" fill="none" />
          <ellipse cx="32" cy="43" rx="3" ry="2.5" fill="#FF6B6B" />
        </g>
      ) : expr === 'surprised' ? (
        <ellipse cx="32" cy="41" rx="4" ry="3.5" fill="#3A3A3C" />
      ) : animated ? (
        <motion.path
          d="M25 39 Q32 45 39 39"
          stroke="#3A3A3C"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{ d: ['M25 39 Q32 45 39 39', 'M25 39 Q32 43 39 39', 'M25 39 Q32 45 39 39'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <path d="M25 39 Q32 45 39 39" stroke="#3A3A3C" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}

      {/* === Body (light gray, solid outline) === */}
      <rect x="19" y="50" width="26" height="16" rx="6" fill="#F0F0F5" stroke="#8E8E93" strokeWidth="1.5" />

      {/* Heart on chest */}
      <path
        d="M30 55 C30 53.5 32 52 32 54 C32 52 34 53.5 34 55 C34 57 32 58.5 32 58.5 C32 58.5 30 57 30 55Z"
        fill="#FF6B6B"
        opacity="0.8"
      />

      {/* Belly button bolt */}
      <circle cx="32" cy="61" r="1.5" fill="#D1D1D6" stroke="#8E8E93" strokeWidth="0.5" />

      {/* === Arms === */}
      {/* Left arm */}
      <rect x="7" y="52" width="10" height="5.5" rx="2.5" fill="#F0F0F5" stroke="#8E8E93" strokeWidth="1" />
      <circle cx="7" cy="54.5" r="2.5" fill="#F0F0F5" stroke="#8E8E93" strokeWidth="0.5" />

      {/* Right arm (waving!) */}
      {animated && isWaving ? (
        <motion.g
          animate={{ rotate: [0, -30, 5, -30, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
          style={{ transformOrigin: '47px 54px' }}
        >
          <rect x="47" y="52" width="10" height="5.5" rx="2.5" fill="#F0F0F5" stroke="#8E8E93" strokeWidth="1" />
          <circle cx="58" cy="54.5" r="2.5" fill="#F0F0F5" stroke="#8E8E93" strokeWidth="0.5" />
        </motion.g>
      ) : (
        <g>
          <rect x="47" y="52" width="10" height="5.5" rx="2.5" fill="#F0F0F5" stroke="#8E8E93" strokeWidth="1" />
          <circle cx="58" cy="54.5" r="2.5" fill="#F0F0F5" stroke="#8E8E93" strokeWidth="0.5" />
        </g>
      )}

      {/* === Feet (stubby, cute) === */}
      <rect x="21" y="66" width="9" height="6" rx="3" fill="#F0F0F5" stroke="#8E8E93" strokeWidth="1" />
      <rect x="34" y="66" width="9" height="6" rx="3" fill="#F0F0F5" stroke="#8E8E93" strokeWidth="1" />

      {/* === Thinking bubble === */}
      {showThinkingBubble && (
        <g>
          <circle cx="55" cy="18" r="2" fill="#D1D1D6" stroke="#8E8E93" strokeWidth="0.5" />
          <circle cx="59" cy="13" r="3" fill="#D1D1D6" stroke="#8E8E93" strokeWidth="0.5" />
          <circle cx="61" cy="6" r="4.5" fill="#D1D1D6" stroke="#8E8E93" strokeWidth="0.5" />
          <text x="61" y="8" textAnchor="middle" fontSize="4" fill="#8E8E93">?</text>
        </g>
      )}

      {/* === Celebrating sparkles === */}
      {isCelebrating && animated && (
        <>
          <motion.text
            x="8" y="15" fontSize="7"
            animate={{ opacity: [0, 1, 0], y: [15, 8, 15] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          >✨</motion.text>
          <motion.text
            x="52" y="12" fontSize="6"
            animate={{ opacity: [0, 1, 0], y: [12, 5, 12] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          >🎉</motion.text>
          <motion.text
            x="2" y="45" fontSize="5"
            animate={{ opacity: [0, 1, 0], y: [45, 38, 45] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
          >⭐</motion.text>
        </>
      )}
    </svg>
  )
}

/**
 * Moti avatar bubble — used in chat messages, family strips, etc.
 * Silver gradient background with subtle shadow for contrast on any bg.
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
        background: 'linear-gradient(145deg, #E8E8ED, #D1D1D6)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255,255,255,0.6)',
        border: '1.5px solid rgba(0,0,0,0.1)',
      }}
    >
      <MotiRobot size={rs} animated={animated} pose="default" />
    </motion.div>
  )
}
