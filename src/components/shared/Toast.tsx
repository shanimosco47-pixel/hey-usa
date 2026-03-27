import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToast } from './ToastContext'
import { cn } from '@/lib/cn'

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const

const colors = {
  success: 'text-ios-green',
  error: 'text-ios-red',
  info: 'text-ios-blue',
} as const

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col items-center gap-2 pointer-events-none md:bottom-8">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="glass-float rounded-apple px-4 py-3 flex items-center gap-3 shadow-glass-float pointer-events-auto max-w-sm w-full"
            >
              <Icon className={cn('h-5 w-5 shrink-0', colors[toast.type])} />
              <span className="text-body text-apple-primary flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-full hover:bg-black/[0.04]"
              >
                <X className="h-4 w-4 text-apple-secondary" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
