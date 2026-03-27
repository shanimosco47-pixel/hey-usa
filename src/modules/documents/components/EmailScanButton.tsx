import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { triggerEmailScan } from '@/lib/emailScan'

type ToastState =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null

export function EmailScanButton() {
  const [scanning, setScanning] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  async function handleScan() {
    if (scanning) return
    setScanning(true)
    setToast(null)

    try {
      const result = await triggerEmailScan('full')
      const count = result.results.length
      const countText =
        count === 0
          ? 'לא נמצאו מסמכים חדשים'
          : count === 1
            ? 'נמצא מסמך אחד חדש'
            : `נמצאו ${count} מסמכים חדשים`
      setToast({ type: 'success', message: countText })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה בסריקה'
      setToast({ type: 'error', message: msg })
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleScan}
        disabled={scanning}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-apple-lg bg-ios-indigo px-4 py-2 text-subhead font-semibold text-white shadow-glass transition-all hover:bg-ios-indigo/90 hover:shadow-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ios-indigo/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]"
      >
        {scanning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        {scanning ? 'סורק...' : 'סרוק אימייל'}
      </button>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="email-scan-toast"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`absolute start-0 top-full z-50 mt-2 flex min-w-max items-center gap-2 rounded-apple-lg px-3.5 py-2.5 text-subhead font-medium shadow-glass-hover ${
              toast.type === 'success'
                ? 'bg-ios-green/10 text-ios-green ring-1 ring-ios-green/20'
                : 'bg-ios-red/10 text-ios-red ring-1 ring-ios-red/20'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
