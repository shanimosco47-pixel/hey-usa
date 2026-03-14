import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DESTINATIONS = [
  'Los Angeles',
  'Las Vegas',
  'Grand Canyon',
  'Yosemite',
  'San Francisco',
]

export default function SplashScreen({ onFinished }: { onFinished: () => void }) {
  const [destinationIndex, setDestinationIndex] = useState(0)
  const [isExiting, setIsExiting] = useState(false)

  // Cycle through destinations
  useEffect(() => {
    const interval = setInterval(() => {
      setDestinationIndex((prev) => (prev + 1) % DESTINATIONS.length)
    }, 600)
    return () => clearInterval(interval)
  }, [])

  // Trigger exit after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

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
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #e94560 100%)',
          }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
        >
          {/* Stars / dots background decoration */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{
                  duration: Math.random() * 2 + 1,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* App name */}
          <motion.h1
            className="mb-1 text-6xl font-black tracking-tight text-white"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            Hey USA
          </motion.h1>

          {/* Hebrew subtitle */}
          <motion.p
            className="mb-10 text-xl font-medium text-white/70"
            dir="rtl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            &#x1F468;&#x200D;&#x1F469;&#x200D;&#x1F467;&#x200D;&#x1F466; משפחה בדרכים
          </motion.p>

          {/* Road + RV scene */}
          <div className="relative mb-8 w-[320px]">
            {/* RV driving across — RTL: starts right, ends left */}
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
              <span role="img" aria-label="RV">&#x1F690;</span>
            </motion.div>

            {/* Road line */}
            <div className="mt-1 flex items-center justify-center gap-2">
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={i}
                  className="h-[3px] w-4 rounded-full bg-yellow-400/60"
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
                className="flex items-center gap-2 text-lg font-semibold text-amber-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <span className="text-white/40">&#x2708;&#xFE0F;</span>
                {DESTINATIONS[destinationIndex]}
                {destinationIndex < DESTINATIONS.length - 1 && (
                  <span className="text-white/30">&rarr;</span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Route preview (small text) */}
          <motion.p
            className="mt-6 text-xs tracking-widest text-white/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            LA &bull; LV &bull; GC &bull; YS &bull; SF
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
