import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { FAMILY_MEMBERS } from '@/constants'
import type { FamilyMemberId } from '@/types'

const memberIds = Object.keys(FAMILY_MEMBERS) as FamilyMemberId[]

/* Role labels and fun subtitles per member id */
const MEMBER_META: Record<string, { role: string; subtitle: string }> = {
  aba: { role: 'אבא', subtitle: 'הנהג הראשי 🚗' },
  ima: { role: 'אמא', subtitle: 'מנהלת הטיול 📋' },
  kid1: { role: 'ילד 1', subtitle: 'חוקר הרפתקאות 🔭' },
  kid2: { role: 'ילד 2', subtitle: 'צלמ/ת המשפחה 📸' },
  kid3: { role: 'ילד 3', subtitle: 'DJ של הדרך 🎵' },
}

export function FamilySelectScreen() {
  const { selectMember } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<FamilyMemberId | null>(null)

  function handleSelect(id: FamilyMemberId) {
    setSelected(id)
    // Small delay so the bounce animation is visible before navigating
    setTimeout(() => {
      selectMember(id)
      navigate('/')
    }, 400)
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center bg-surface-primary px-4 overflow-hidden"
      dir="rtl"
    >
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-64 w-64 rounded-full bg-ios-green/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-ios-orange/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-ios-blue/[0.05] blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="text-[48px] mb-3"
          >
            🚐
          </motion.div>
          <h1 className="text-title text-apple-primary mb-2">
            מי נוסע/ת?
          </h1>
          <p className="text-subhead text-apple-secondary">בחר/י את עצמך כדי להתחיל</p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
          }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-5 w-full"
        >
          {memberIds.map((id) => {
            const member = FAMILY_MEMBERS[id]
            const meta = MEMBER_META[id] || { role: member.name, subtitle: '' }
            const isSelected = selected === id

            return (
              <motion.button
                key={id}
                variants={{
                  hidden: { opacity: 0, y: 24, scale: 0.85 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { type: 'spring', stiffness: 300, damping: 20 },
                  },
                }}
                animate={isSelected ? {
                  scale: [1, 1.12, 0.95, 1.05, 1],
                  transition: { duration: 0.4, ease: 'easeOut' },
                } : {}}
                whileHover={{ scale: 1.06, y: -4 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleSelect(id)}
                className="text-center focus:outline-none"
              >
                <div
                  className="relative flex flex-col items-center gap-3 rounded-[20px] py-6 px-3 transition-all duration-300"
                  style={{
                    background: isSelected
                      ? `linear-gradient(145deg, ${member.color}20, ${member.colorEnd || member.color}15)`
                      : 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: isSelected
                      ? `0 8px 32px ${member.color}30, 0 0 0 2px ${member.color}60`
                      : '0 2px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Avatar circle with gradient border */}
                  <div
                    className="relative flex h-24 w-24 items-center justify-center rounded-full"
                    style={{
                      background: `linear-gradient(145deg, ${member.color}18, ${member.colorEnd || member.color}12)`,
                    }}
                  >
                    {/* Gradient ring */}
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${member.color}, ${member.colorEnd || member.color})`,
                        padding: 3,
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                      }}
                    />
                    <span className="text-[44px] leading-none" role="img" aria-label={member.name}>
                      {member.emoji}
                    </span>
                  </div>

                  {/* Name */}
                  <span className="text-[17px] font-bold text-apple-primary leading-tight">
                    {member.name}
                  </span>

                  {/* Role label */}
                  <span
                    className="text-[12px] font-semibold px-3 py-1 rounded-full"
                    style={{
                      color: member.color,
                      backgroundColor: `${member.color}12`,
                    }}
                  >
                    {meta.subtitle}
                  </span>
                </div>
              </motion.button>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
