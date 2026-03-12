import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
        // Small delay so the user sees the last dot fill in
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
      className="flex min-h-screen flex-col items-center justify-center bg-sand font-hebrew px-4"
      dir="rtl"
    >
      {/* Desert gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-sand via-sand to-sand-dark/30 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-brown mb-2">
            Hey USA 🇺🇸
          </h1>
          <p className="text-brown-light text-lg">הכנס קוד משפחתי</p>
        </div>

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
                    ? 'bg-red-500 border-red-500'
                    : 'bg-terracotta border-terracotta'
                  : 'border-brown-light/40 bg-transparent',
              )}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-500 text-sm -mt-4">קוד שגוי, נסה שוב</p>
        )}

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className={cn(
                'h-16 w-full rounded-2xl text-2xl font-semibold',
                'bg-white/70 text-brown shadow-sm',
                'hover:bg-white active:bg-sand-dark/40',
                'transition-colors duration-100',
              )}
            >
              {digit}
            </button>
          ))}

          {/* Empty cell */}
          <div />

          {/* Zero */}
          <button
            onClick={() => handleDigit('0')}
            className={cn(
              'h-16 w-full rounded-2xl text-2xl font-semibold',
              'bg-white/70 text-brown shadow-sm',
              'hover:bg-white active:bg-sand-dark/40',
              'transition-colors duration-100',
            )}
          >
            0
          </button>

          {/* Backspace */}
          <button
            onClick={handleBackspace}
            className={cn(
              'h-16 w-full rounded-2xl flex items-center justify-center',
              'bg-white/40 text-brown-light',
              'hover:bg-white/60 active:bg-sand-dark/40',
              'transition-colors duration-100',
            )}
            aria-label="מחק ספרה"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
