import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Delete } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth } from '@/contexts/AuthContext'

const PIN_LENGTH = 4

export function PinScreen() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length >= PIN_LENGTH) return
      const newPin = pin + digit

      setError(false)
      setPin(newPin)

      if (newPin.length === PIN_LENGTH) {
        setTimeout(() => {
          const success = login(newPin)
          if (success) {
            navigate('/auth/select')
          } else {
            setError(true)
            setShaking(true)
            setTimeout(() => {
              setShaking(false)
              setPin('')
            }, 500)
          }
        }, 150)
      }
    },
    [pin, login, navigate],
  )

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1))
    setError(false)
  }, [])

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center bg-surface-primary px-4 overflow-hidden"
      dir="rtl"
    >
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-ios-blue/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-ios-purple/[0.06] blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[18px] bg-gradient-to-br from-ios-blue to-ios-indigo shadow-[0_4px_16px_rgba(0,122,255,0.3)]"
          >
            <span className="text-3xl">🇺🇸</span>
          </motion.div>
          <h1 className="text-hero text-apple-primary mb-2">
            Hey USA
          </h1>
          <p className="text-subhead text-apple-secondary">הכנס קוד משפחתי</p>
        </motion.div>

        {/* PIN Dots */}
        <div
          className={cn(
            'flex gap-4 justify-center',
            shaking && 'animate-shake',
          )}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-4 w-4 rounded-full border-2 transition-all duration-200',
                i < pin.length
                  ? error
                    ? 'bg-ios-red border-ios-red'
                    : 'bg-ios-blue border-ios-blue'
                  : 'border-apple-tertiary bg-transparent',
              )}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-ios-red text-subhead -mt-4">קוד שגוי, נסה שוב</p>
        )}

        {/* Numeric keypad */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.03, delayChildren: 0.2 } },
          }}
          className="grid grid-cols-3 gap-3 w-full max-w-[280px]"
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <motion.button
              key={digit}
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: { opacity: 1, scale: 1 },
              }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => handleDigit(digit)}
              className={cn(
                'h-16 w-full rounded-apple-xl text-title',
                'glass shadow-glass',
                'text-apple-primary',
                'hover:bg-white',
                'transition-colors duration-100',
              )}
            >
              {digit}
            </motion.button>
          ))}

          <div />

          <motion.button
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              visible: { opacity: 1, scale: 1 },
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={() => handleDigit('0')}
            className={cn(
              'h-16 w-full rounded-apple-xl text-title',
              'glass shadow-glass',
              'text-apple-primary',
              'hover:bg-white',
              'transition-colors duration-100',
            )}
          >
            0
          </motion.button>

          <motion.button
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              visible: { opacity: 1, scale: 1 },
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={handleBackspace}
            className={cn(
              'h-16 w-full rounded-apple-xl flex items-center justify-center',
              'bg-white/40 text-apple-secondary',
              'hover:bg-white/60',
              'transition-colors duration-100',
            )}
            aria-label="מחק ספרה"
          >
            <Delete className="h-6 w-6" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
