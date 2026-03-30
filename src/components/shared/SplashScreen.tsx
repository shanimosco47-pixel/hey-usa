import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DESTINATIONS = [
  'Denver',
  'Bozeman',
  'Yellowstone',
  'Grand Teton',
  'Jackson',
  'Bryce Canyon',
  'Zion',
  'Las Vegas',
  'Mammoth Lakes',
  'Yosemite',
  'San Francisco',
]

interface SplashScreenProps {
  onFinished: () => void
  /** When true, the splash is allowed to begin its exit animation.
   *  When false (data still loading), the splash keeps looping. */
  dataReady?: boolean
}

export default function SplashScreen({ onFinished, dataReady = true }: SplashScreenProps) {
  const [destinationIndex, setDestinationIndex] = useState(0)
  const [timerElapsed, setTimerElapsed] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  // Cycle through destinations
  useEffect(() => {
    const interval = setInterval(() => {
      setDestinationIndex((prev) => (prev + 1) % DESTINATIONS.length)
    }, 600)
    return () => clearInterval(interval)
  }, [])

  // Mark that the minimum display time (2.5s) has passed
  useEffect(() => {
    const timer = setTimeout(() => setTimerElapsed(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  // Begin exit only when BOTH timer has elapsed AND data is ready
  useEffect(() => {
    if (timerElapsed && dataReady && !isExiting) {
      setIsExiting(true)
    }
  }, [timerElapsed, dataReady, isExiting])

  // Call onFinished after exit animation completes
  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(onFinished, 500)
      return () => clearTimeout(timer)
    }
  }, [isExiting, onFinished])

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(170deg, #1e293b 0%, #0f172a 60%, #92400e 100%)',
          }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
        >
          {/* Subtle warm particles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  backgroundColor: i % 3 === 0 ? '#d97706' : '#FAF8F5',
                }}
                animate={{ opacity: [0.1, 0.5, 0.1] }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Passport stamp decoration */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: -8 }}
            transition={{ duration: 0.6, delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div
              className="flex flex-col items-center justify-center"
              style={{
                width: 88,
                height: 88,
                border: '2.5px solid rgba(217, 119, 6, 0.7)',
                borderRadius: '50%',
                position: 'relative',
              }}
            >
              <div
                className="absolute rounded-full"
                style={{ inset: 5, border: '1px dashed rgba(217, 119, 6, 0.35)' }}
              />
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: '#d97706', fontFamily: "'Playfair Display', serif" }}
              >
                USA
              </span>
              <span
                className="text-[9px] font-medium uppercase tracking-wider mt-0.5"
                style={{ color: 'rgba(217, 119, 6, 0.6)' }}
              >
                SEP 2026
              </span>
            </div>
          </motion.div>

          {/* App name — serif */}
          <motion.h1
            className="mb-1 text-6xl font-bold tracking-tight"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ fontFamily: "'Playfair Display', serif", color: '#FAF8F5' }}
          >
            Hey USA
          </motion.h1>

          {/* Hebrew subtitle */}
          <motion.p
            className="mb-10 text-lg font-medium"
            dir="rtl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{ color: 'rgba(250, 248, 245, 0.55)', fontFamily: "'DM Sans', sans-serif" }}
          >
            &#x1F468;&#x200D;&#x1F469;&#x200D;&#x1F467;&#x200D;&#x1F466; משפחה בדרכים
          </motion.p>

          {/* Road + RV scene */}
          <div className="relative mb-8 w-[320px]">
            {/* RV driving across */}
            <motion.div
              className="relative z-10 text-5xl"
              style={{ scaleX: -1 }}
              initial={{ x: 140 }}
              animate={{ x: -160 }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <span role="img" aria-label="RV">
                &#x1F690;
              </span>
            </motion.div>

            {/* Road line — warm amber dashes */}
            <div className="mt-1 flex items-center justify-center gap-2">
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={i}
                  className="h-[3px] w-4 rounded-full"
                  style={{ backgroundColor: 'rgba(217, 119, 6, 0.5)' }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.08,
                  }}
                />
              ))}
            </div>

            {/* Road surface */}
            <div className="absolute bottom-0 left-0 right-0 h-3 rounded-full bg-white/5" />
          </div>

          {/* Destination names cycling */}
          <div className="h-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={destinationIndex}
                className="flex items-center gap-2 text-lg font-semibold"
                style={{ color: '#d97706', fontFamily: "'Playfair Display', serif" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <span style={{ color: 'rgba(250, 248, 245, 0.3)' }}>&#x2708;&#xFE0F;</span>
                {DESTINATIONS[destinationIndex]}
                {destinationIndex < DESTINATIONS.length - 1 && (
                  <span style={{ color: 'rgba(250, 248, 245, 0.2)' }}>&rarr;</span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Loading indicator */}
          {timerElapsed && !dataReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex items-center gap-2"
            >
              <div
                className="h-4 w-4 animate-spin rounded-full border-2"
                style={{
                  borderColor: 'rgba(217, 119, 6, 0.2)',
                  borderTopColor: 'rgba(217, 119, 6, 0.7)',
                }}
              />
              <span className="text-xs" style={{ color: 'rgba(250, 248, 245, 0.4)' }}>
                טוען נתונים...
              </span>
            </motion.div>
          )}

          {/* Route preview */}
          <motion.p
            className="mt-6 text-xs tracking-widest uppercase"
            style={{ color: 'rgba(217, 119, 6, 0.4)', fontFamily: "'DM Sans', sans-serif" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            CO &bull; MT &bull; WY &bull; UT &bull; NV &bull; CA
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
