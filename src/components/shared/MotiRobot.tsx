import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getAvatarPhoto } from '@/lib/avatarStorage'

/**
 * Moti — the family's quirky WHITE robot companion.
 *
 * A playful pure-white robot with bold outlines, blue eyes, rosy cheeks,
 * and tons of personality — random hats, poses, accessories (cigar, sunglasses,
 * peace signs), funny expressions, and animated quirks.
 *
 * Used in: ChatPage, DashboardPage floating button, anywhere Moti appears.
 */

type MotiHat = 'fedora' | 'cowboy' | 'chef' | 'party' | 'propeller' | 'tophat' | 'beanie' | 'crown' | 'none'
type MotiExpression = 'happy' | 'cool' | 'wink' | 'tongue' | 'surprised' | 'smirk' | 'laughing'
type MotiAccessory = 'none' | 'cigar' | 'pipe' | 'flower' | 'lollipop'

const HATS: MotiHat[] = ['fedora', 'cowboy', 'chef', 'party', 'propeller', 'tophat', 'beanie', 'crown', 'none']
const EXPRESSIONS: MotiExpression[] = ['happy', 'cool', 'wink', 'tongue', 'surprised', 'smirk', 'laughing']
const ACCESSORIES: MotiAccessory[] = ['none', 'none', 'none', 'cigar', 'pipe', 'flower', 'lollipop']

interface MotiRobotProps {
  size?: number
  /** Which personality pose to show */
  pose?: 'default' | 'waving' | 'cool' | 'thinking' | 'celebrating' | 'dabbing' | 'peace'
  /** Enable animations (blinking, waving, etc.) */
  animated?: boolean
  /** Force a specific hat */
  hat?: MotiHat
  /** Force a specific expression */
  expression?: MotiExpression
  /** Force a specific accessory */
  accessory?: MotiAccessory
}

/* ── Colour constants ── */
const WHITE = '#FFFFFF'
const OUTLINE = '#6E6E73'
const OUTLINE_LIGHT = '#AEAEB2'
const BOLT = '#D1D1D6'
const CHEEK = '#FF6B6B'
const EYE_BLUE = '#007AFF'
const DARK = '#1C1C1E'

export function MotiRobot({
  size = 64,
  pose = 'default',
  animated = true,
  hat: forcedHat,
  expression: forcedExpression,
  accessory: forcedAccessory,
}: MotiRobotProps) {
  const [randomHat, setRandomHat] = useState<MotiHat>('fedora')
  const [randomExpr, setRandomExpr] = useState<MotiExpression>('happy')
  const [randomAccessory, setRandomAccessory] = useState<MotiAccessory>('none')

  // Randomly switch hats, expressions, and accessories every 8-15 seconds
  useEffect(() => {
    if (!animated) return
    const interval = setInterval(() => {
      setRandomHat(HATS[Math.floor(Math.random() * HATS.length)])
      setRandomExpr(EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)])
      setRandomAccessory(ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)])
    }, 8000 + Math.random() * 7000)
    return () => clearInterval(interval)
  }, [animated])

  const hat = forcedHat ?? randomHat
  const expr = forcedExpression ?? randomExpr
  const accessory = forcedAccessory ?? randomAccessory
  const isWaving = pose === 'waving' || pose === 'default'
  const isCelebrating = pose === 'celebrating'
  const isDabbing = pose === 'dabbing'
  const isPeace = pose === 'peace'
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
          <rect x="21" y="11" width="22" height="2.5" rx="1" fill={CHEEK} />
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
          <circle cx="32" cy="8" r="8" fill="white" stroke={OUTLINE_LIGHT} strokeWidth="1" />
          <circle cx="26" cy="6" r="5" fill="white" stroke={OUTLINE_LIGHT} strokeWidth="0.5" />
          <circle cx="38" cy="6" r="5" fill="white" stroke={OUTLINE_LIGHT} strokeWidth="0.5" />
          <rect x="24" y="12" width="16" height="4" rx="1" fill="white" stroke={OUTLINE_LIGHT} strokeWidth="0.8" />
        </g>
      )}
      {hat === 'party' && (
        <g transform="rotate(-15, 32, 10)">
          <polygon points="32,0 24,16 40,16" fill={CHEEK} stroke="#E55555" strokeWidth="0.5" />
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
              <ellipse cx="24" cy="7" rx="7" ry="2" fill={CHEEK} opacity="0.9" />
              <ellipse cx="40" cy="9" rx="7" ry="2" fill="#4ECDC4" opacity="0.9" />
            </motion.g>
          ) : (
            <g>
              <ellipse cx="24" cy="7" rx="7" ry="2" fill={CHEEK} opacity="0.9" />
              <ellipse cx="40" cy="9" rx="7" ry="2" fill="#4ECDC4" opacity="0.9" />
            </g>
          )}
        </g>
      )}
      {hat === 'tophat' && (
        <g transform="rotate(-5, 32, 10)">
          <ellipse cx="32" cy="16" rx="15" ry="3" fill={DARK} />
          <rect x="24" y="0" width="16" height="17" rx="2" fill={DARK} />
          <rect x="24" y="12" width="16" height="2" rx="0.5" fill="#FFD700" />
        </g>
      )}
      {hat === 'beanie' && (
        <g>
          <ellipse cx="32" cy="18" rx="16" ry="6" fill="#E74C3C" />
          <rect x="16" y="12" width="32" height="7" rx="4" fill="#E74C3C" />
          <rect x="18" y="14" width="28" height="3" rx="1" fill="#C0392B" />
          <circle cx="32" cy="6" r="3" fill="#E74C3C" />
          <line x1="32" y1="6" x2="32" y2="13" stroke="#E74C3C" strokeWidth="2" />
        </g>
      )}
      {hat === 'crown' && (
        <g transform="translate(0, -1)">
          <path d="M20 18 L22 6 L27 12 L32 4 L37 12 L42 6 L44 18Z" fill="#FFD700" stroke="#DAA520" strokeWidth="0.8" />
          <circle cx="27" cy="10" r="1.5" fill="#E74C3C" />
          <circle cx="32" cy="6" r="1.5" fill="#4ECDC4" />
          <circle cx="37" cy="10" r="1.5" fill="#E74C3C" />
        </g>
      )}

      {/* === Antenna === */}
      <line x1="32" y1="14" x2="32" y2="20" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />
      {animated ? (
        <motion.circle
          cx="32" cy="13" r="2.5"
          fill={CHEEK}
          animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      ) : (
        <circle cx="32" cy="13" r="2.5" fill={CHEEK} />
      )}

      {/* === Head (pure WHITE with solid outline) === */}
      <rect x="13" y="20" width="38" height="28" rx="9" fill={WHITE} stroke={OUTLINE} strokeWidth="1.5" />
      {/* Subtle shine on forehead */}
      <rect x="18" y="22" width="14" height="3" rx="1.5" fill="white" opacity="0.6" />

      {/* Ear bolts */}
      <circle cx="13" cy="33" r="3" fill={BOLT} stroke={OUTLINE} strokeWidth="1" />
      <circle cx="13" cy="33" r="1" fill={OUTLINE_LIGHT} />
      <circle cx="51" cy="33" r="3" fill={BOLT} stroke={OUTLINE} strokeWidth="1" />
      <circle cx="51" cy="33" r="1" fill={OUTLINE_LIGHT} />

      {/* === Eyes === */}
      {expr === 'cool' ? (
        /* Sunglasses */
        <g>
          <rect x="17" y="27" width="12" height="7" rx="2" fill={DARK} stroke="#3A3A3C" strokeWidth="0.5" />
          <rect x="35" y="27" width="12" height="7" rx="2" fill={DARK} stroke="#3A3A3C" strokeWidth="0.5" />
          <line x1="29" y1="30" x2="35" y2="30" stroke="#3A3A3C" strokeWidth="1.5" />
          <rect x="17" y="28" width="12" height="2" rx="1" fill="white" opacity="0.15" />
          <rect x="35" y="28" width="12" height="2" rx="1" fill="white" opacity="0.15" />
        </g>
      ) : expr === 'wink' ? (
        <g>
          <ellipse cx="25" cy="31" rx="5" ry="5.5" fill={EYE_BLUE} />
          <circle cx="27" cy="29" r="2" fill="white" opacity="0.9" />
          <path d="M35 31 Q39 28 43 31" stroke="#3A3A3C" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
      ) : expr === 'surprised' ? (
        <g>
          <circle cx="25" cy="31" r="6" fill={EYE_BLUE} />
          <circle cx="26" cy="29" r="2.5" fill="white" opacity="0.9" />
          <circle cx="39" cy="31" r="6" fill={EYE_BLUE} />
          <circle cx="40" cy="29" r="2.5" fill="white" opacity="0.9" />
        </g>
      ) : expr === 'smirk' ? (
        <g>
          <ellipse cx="25" cy="31" rx="5" ry="5.5" fill={EYE_BLUE} />
          <circle cx="27" cy="29" r="2" fill="white" opacity="0.9" />
          {/* Raised eyebrow */}
          <path d="M34 26 Q39 23 44 26" stroke="#3A3A3C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <ellipse cx="39" cy="31" rx="5" ry="4" fill={EYE_BLUE} />
          <circle cx="41" cy="29.5" r="2" fill="white" opacity="0.9" />
        </g>
      ) : expr === 'laughing' ? (
        <g>
          {/* Squinting happy eyes */}
          <path d="M19 30 Q25 26 30 30" stroke={EYE_BLUE} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M34 30 Q39 26 44 30" stroke={EYE_BLUE} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Tear of joy */}
          <circle cx="45" cy="33" r="1.5" fill="#4ECDC4" opacity="0.6" />
        </g>
      ) : (
        /* Default / happy / tongue eyes */
        animated ? (
          <motion.g
            animate={{ scaleY: [1, 0.08, 1] }}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
            style={{ transformOrigin: '32px 31px' }}
          >
            <ellipse cx="25" cy="31" rx="5" ry="5.5" fill={EYE_BLUE} />
            <circle cx="27" cy="29" r="2" fill="white" opacity="0.9" />
            <circle cx="23.5" cy="33" r="1" fill="white" opacity="0.4" />
            <ellipse cx="39" cy="31" rx="5" ry="5.5" fill={EYE_BLUE} />
            <circle cx="41" cy="29" r="2" fill="white" opacity="0.9" />
            <circle cx="37.5" cy="33" r="1" fill="white" opacity="0.4" />
          </motion.g>
        ) : (
          <g>
            <ellipse cx="25" cy="31" rx="5" ry="5.5" fill={EYE_BLUE} />
            <circle cx="27" cy="29" r="2" fill="white" opacity="0.9" />
            <ellipse cx="39" cy="31" rx="5" ry="5.5" fill={EYE_BLUE} />
            <circle cx="41" cy="29" r="2" fill="white" opacity="0.9" />
          </g>
        )
      )}

      {/* === Rosy cheeks === */}
      <circle cx="18" cy="37" r="3.5" fill={CHEEK} opacity="0.25" />
      <circle cx="46" cy="37" r="3.5" fill={CHEEK} opacity="0.25" />

      {/* === Mouth === */}
      {expr === 'tongue' ? (
        <g>
          <path d="M25 39 Q32 45 39 39" stroke="#3A3A3C" strokeWidth="2" strokeLinecap="round" fill="none" />
          <ellipse cx="32" cy="43" rx="3" ry="2.5" fill={CHEEK} />
        </g>
      ) : expr === 'surprised' ? (
        <ellipse cx="32" cy="41" rx="4" ry="3.5" fill="#3A3A3C" />
      ) : expr === 'smirk' ? (
        <path d="M26 40 Q35 44 40 38" stroke="#3A3A3C" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : expr === 'laughing' ? (
        <g>
          <path d="M23 38 Q32 48 41 38" stroke="#3A3A3C" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M24 38 Q32 46 40 38" fill="#3A3A3C" opacity="0.3" />
        </g>
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

      {/* === Accessory (mouth area) === */}
      {accessory === 'cigar' && (
        <g>
          {/* Cigar sticking out of mouth */}
          <rect x="40" y="38" width="14" height="3.5" rx="1.5" fill="#8B6914" />
          <rect x="40" y="38" width="3" height="3.5" rx="1" fill="#CD853F" />
          <rect x="51" y="37.5" width="3" height="4.5" rx="1" fill="#D4D4D4" />
          {/* Smoke wisps */}
          {animated && (
            <>
              <motion.path
                d="M54 37 Q56 33 54 29 Q52 25 54 21"
                stroke="#C7C7CC"
                strokeWidth="1"
                fill="none"
                opacity="0.4"
                animate={{ opacity: [0, 0.4, 0], y: [0, -3, -6] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.path
                d="M56 36 Q58 31 56 27"
                stroke="#C7C7CC"
                strokeWidth="0.8"
                fill="none"
                opacity="0.3"
                animate={{ opacity: [0, 0.3, 0], y: [0, -4, -8] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
              />
            </>
          )}
        </g>
      )}
      {accessory === 'pipe' && (
        <g>
          {/* Fancy smoking pipe */}
          <path d="M40 40 L48 40 L48 44 Q52 48 50 50 Q48 52 46 50 L46 44 L42 44Z" fill="#8B4513" stroke="#6B3410" strokeWidth="0.5" />
          <ellipse cx="48" cy="41" rx="4" ry="3" fill="#A0522D" stroke="#6B3410" strokeWidth="0.5" />
          {animated && (
            <motion.path
              d="M48 38 Q50 34 48 30 Q46 26 48 22"
              stroke="#C7C7CC"
              strokeWidth="1"
              fill="none"
              opacity="0.3"
              animate={{ opacity: [0, 0.4, 0], y: [0, -3, -6] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </g>
      )}
      {accessory === 'flower' && (
        <g transform="translate(42, 36)">
          <line x1="0" y1="4" x2="0" y2="10" stroke="#4CAF50" strokeWidth="1.5" />
          <circle cx="0" cy="2" r="3" fill="#FF6B6B" />
          <circle cx="-2" cy="1" r="2" fill="#FF8A80" />
          <circle cx="2" cy="1" r="2" fill="#FF8A80" />
          <circle cx="0" cy="4" r="2" fill="#FF8A80" />
          <circle cx="0" cy="2" r="1.5" fill="#FFD700" />
        </g>
      )}
      {accessory === 'lollipop' && (
        <g>
          <line x1="41" y1="40" x2="54" y2="48" stroke="#D4A574" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="54" cy="48" r="4" fill="none" stroke="#E74C3C" strokeWidth="2" />
          <path d="M51 46 Q54 44 57 46" stroke="#4ECDC4" strokeWidth="1.5" fill="none" />
          <path d="M51 50 Q54 52 57 50" stroke="#FFD700" strokeWidth="1.5" fill="none" />
        </g>
      )}

      {/* === Body (pure WHITE, solid outline) === */}
      <rect x="19" y="50" width="26" height="16" rx="6" fill={WHITE} stroke={OUTLINE} strokeWidth="1.5" />
      {/* Subtle body shine */}
      <rect x="22" y="52" width="8" height="2" rx="1" fill="white" opacity="0.5" />

      {/* Heart on chest */}
      <path
        d="M30 55 C30 53.5 32 52 32 54 C32 52 34 53.5 34 55 C34 57 32 58.5 32 58.5 C32 58.5 30 57 30 55Z"
        fill={CHEEK}
        opacity="0.8"
      />

      {/* Belly button bolt */}
      <circle cx="32" cy="61" r="1.5" fill={BOLT} stroke={OUTLINE} strokeWidth="0.5" />

      {/* === Arms === */}
      {isDabbing ? (
        /* Dabbing pose! Left arm up, right arm across */
        <>
          <g transform="rotate(-60, 17, 54)">
            <rect x="7" y="52" width="10" height="5.5" rx="2.5" fill={WHITE} stroke={OUTLINE} strokeWidth="1" />
            <circle cx="7" cy="54.5" r="2.5" fill={WHITE} stroke={OUTLINE} strokeWidth="0.5" />
          </g>
          <g transform="rotate(30, 47, 54)">
            <rect x="47" y="52" width="12" height="5.5" rx="2.5" fill={WHITE} stroke={OUTLINE} strokeWidth="1" />
            <circle cx="59" cy="54.5" r="2.5" fill={WHITE} stroke={OUTLINE} strokeWidth="0.5" />
          </g>
        </>
      ) : isPeace ? (
        /* Peace sign pose - right hand up with V */
        <>
          <rect x="7" y="52" width="10" height="5.5" rx="2.5" fill={WHITE} stroke={OUTLINE} strokeWidth="1" />
          <circle cx="7" cy="54.5" r="2.5" fill={WHITE} stroke={OUTLINE} strokeWidth="0.5" />
          {animated ? (
            <motion.g
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '47px 54px' }}
            >
              <rect x="47" y="46" width="10" height="5.5" rx="2.5" fill={WHITE} stroke={OUTLINE} strokeWidth="1" transform="rotate(-30, 52, 48)" />
              {/* Peace V fingers */}
              <line x1="55" y1="44" x2="53" y2="36" stroke={OUTLINE} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="57" y1="44" x2="59" y2="36" stroke={OUTLINE} strokeWidth="1.5" strokeLinecap="round" />
            </motion.g>
          ) : (
            <g>
              <rect x="47" y="46" width="10" height="5.5" rx="2.5" fill={WHITE} stroke={OUTLINE} strokeWidth="1" transform="rotate(-30, 52, 48)" />
              <line x1="55" y1="44" x2="53" y2="36" stroke={OUTLINE} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="57" y1="44" x2="59" y2="36" stroke={OUTLINE} strokeWidth="1.5" strokeLinecap="round" />
            </g>
          )}
        </>
      ) : (
        <>
          {/* Left arm */}
          <rect x="7" y="52" width="10" height="5.5" rx="2.5" fill={WHITE} stroke={OUTLINE} strokeWidth="1" />
          <circle cx="7" cy="54.5" r="2.5" fill={WHITE} stroke={OUTLINE} strokeWidth="0.5" />

          {/* Right arm (waving!) */}
          {animated && isWaving ? (
            <motion.g
              animate={{ rotate: [0, -30, 5, -30, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
              style={{ transformOrigin: '47px 54px' }}
            >
              <rect x="47" y="52" width="10" height="5.5" rx="2.5" fill={WHITE} stroke={OUTLINE} strokeWidth="1" />
              <circle cx="58" cy="54.5" r="2.5" fill={WHITE} stroke={OUTLINE} strokeWidth="0.5" />
            </motion.g>
          ) : (
            <g>
              <rect x="47" y="52" width="10" height="5.5" rx="2.5" fill={WHITE} stroke={OUTLINE} strokeWidth="1" />
              <circle cx="58" cy="54.5" r="2.5" fill={WHITE} stroke={OUTLINE} strokeWidth="0.5" />
            </g>
          )}
        </>
      )}

      {/* === Feet (stubby, cute) === */}
      <rect x="21" y="66" width="9" height="6" rx="3" fill={WHITE} stroke={OUTLINE} strokeWidth="1" />
      <rect x="34" y="66" width="9" height="6" rx="3" fill={WHITE} stroke={OUTLINE} strokeWidth="1" />

      {/* === Thinking bubble === */}
      {showThinkingBubble && (
        <g>
          <circle cx="55" cy="18" r="2" fill={BOLT} stroke={OUTLINE} strokeWidth="0.5" />
          <circle cx="59" cy="13" r="3" fill={BOLT} stroke={OUTLINE} strokeWidth="0.5" />
          <circle cx="61" cy="6" r="4.5" fill={BOLT} stroke={OUTLINE} strokeWidth="0.5" />
          <text x="61" y="8" textAnchor="middle" fontSize="4" fill={OUTLINE}>?</text>
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
 * Clean white background with subtle shadow for contrast on any bg.
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
        background: 'linear-gradient(145deg, #F5F5F7, #E8E8ED)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12), inset 0 1px 2px rgba(255,255,255,0.8)',
        border: '1.5px solid rgba(0,0,0,0.08)',
      }}
    >
      <MotiRobot size={rs} animated={animated} pose="default" />
    </motion.div>
  )
}
