import { motion } from 'framer-motion'
import { History, Undo2, Trash2, Bot, Zap } from 'lucide-react'
import { useTripData } from '@/contexts/TripDataContext'
import { Button } from '@/components/ui/button'

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function formatPreviousValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') return `₪${value.toLocaleString()}`
  if (typeof value === 'string') return value || '(ריק)'
  return JSON.stringify(value)
}

export default function MotiLogPage() {
  const { changeLog, undoLastChange, clearChangeLog } = useTripData()

  const handleUndo = () => {
    const success = undoLastChange()
    if (!success) {
      alert('אין שינויים לביטול')
    }
  }

  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* Header */}
      <motion.div
        className="px-4 pt-4 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <History className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-apple-primary">יומן שינויים — מוטי</h1>
            <p className="text-xs text-apple-secondary">
              כל השינויים שמוטי ביצע באתר
            </p>
          </div>
        </div>
      </motion.div>

      {/* Actions bar */}
      <div className="flex gap-2 px-4 py-3">
        <Button
          onClick={handleUndo}
          disabled={changeLog.length === 0}
          variant="secondary"
          className="flex items-center gap-1.5"
        >
          <Undo2 className="h-4 w-4" />
          בטל אחרון
        </Button>
        <Button
          onClick={() => {
            if (confirm('למחוק את כל היומן? (זה לא יבטל את השינויים עצמם)')) {
              clearChangeLog()
            }
          }}
          disabled={changeLog.length === 0}
          variant="secondary"
          className="flex items-center gap-1.5 text-ios-red"
        >
          <Trash2 className="h-4 w-4" />
          נקה יומן
        </Button>
      </div>

      {/* Empty state */}
      {changeLog.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 mb-4">
            <Bot className="h-8 w-8 text-purple-400" />
          </div>
          <p className="text-apple-secondary text-sm">
            מוטי עדיין לא ביצע שינויים.
          </p>
          <p className="text-apple-tertiary text-xs mt-1">
            כשתבקשו ממוטי לעדכן תקציב, מסלול או כל דבר אחר — השינויים יופיעו כאן.
          </p>
        </div>
      )}

      {/* Log entries */}
      <div className="px-4 space-y-2">
        {changeLog.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            className="glass rounded-apple-lg p-3 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                <Zap className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-apple-primary">
                  {entry.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-apple-tertiary">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                  {entry.previousValue !== null && entry.previousValue !== undefined && (
                    <span className="text-[11px] text-apple-secondary">
                      מ-{formatPreviousValue(entry.previousValue)}
                    </span>
                  )}
                </div>
              </div>
              {index === 0 && (
                <button
                  onClick={handleUndo}
                  className="shrink-0 rounded-lg p-1.5 text-purple-400 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                  title="בטל שינוי"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
