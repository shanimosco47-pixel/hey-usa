import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, ChevronDown, ChevronUp, Trash2, Plus, Loader2 } from 'lucide-react'
import { fetchEmailAccounts, deleteEmailAccount } from '@/lib/database'
import { getGoogleOAuthUrl } from '@/lib/emailScan'
import { useToast } from '@/components/shared/ToastContext'

interface EmailAccount {
  id: string
  email: string
  label: string
  last_scan_at: string | null
  created_at: string
}

export function EmailAccountSettings() {
  const [expanded, setExpanded] = useState(false)
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { addToast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchEmailAccounts()
      setAccounts(data as EmailAccount[])
    } catch {
      // silently ignore — supabase may not be configured
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (expanded) {
      load()
    }
  }, [expanded, load])

  function handleConnect() {
    const base = import.meta.env.BASE_URL || '/'
    const redirectUri = `${window.location.origin}${base}oauth/callback`
    const url = getGoogleOAuthUrl(redirectUri)
    window.location.href = url
  }

  async function handleDisconnect(id: string) {
    setDeletingId(id)
    try {
      await deleteEmailAccount(id)
      setAccounts((prev) => prev.filter((a) => a.id !== id))
    } catch {
      addToast('שגיאה בניתוק החשבון', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'לא נסרק עדיין'
    return new Date(dateStr).toLocaleDateString('he-IL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="mb-4 overflow-hidden rounded-apple-lg border border-black/[0.06] glass">
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-black/[0.02]"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ios-indigo/10">
          <Mail className="h-4 w-4 text-ios-indigo" />
        </div>
        <span className="flex-1 text-sm font-semibold text-apple-primary">
          חשבונות אימייל מחוברים
        </span>
        {accounts.length > 0 && !expanded && (
          <span className="rounded-full bg-ios-indigo px-2 py-0.5 text-caption font-bold text-white">
            {accounts.length}
          </span>
        )}
        {loading && !expanded ? (
          <Loader2 className="h-4 w-4 animate-spin text-apple-secondary" />
        ) : expanded ? (
          <ChevronUp className="h-4 w-4 text-apple-secondary" />
        ) : (
          <ChevronDown className="h-4 w-4 text-apple-secondary" />
        )}
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="email-settings-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-black/[0.04] px-4 pb-4 pt-3">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-apple-secondary" />
                </div>
              ) : accounts.length === 0 ? (
                <p className="py-2 text-center text-sm text-apple-secondary">אין חשבונות מחוברים</p>
              ) : (
                <ul className="mb-3 flex flex-col gap-2">
                  {accounts.map((account) => (
                    <li
                      key={account.id}
                      className="flex items-center gap-3 rounded-lg border border-black/[0.04] bg-white/40 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-apple-primary">
                          {account.email}
                        </p>
                        <div className="flex items-center gap-1.5 text-caption font-bold text-black">
                          {account.label && (
                            <>
                              <span>{account.label}</span>
                              <span className="text-apple-tertiary">·</span>
                            </>
                          )}
                          <span>סריקה אחרונה: {formatDate(account.last_scan_at)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDisconnect(account.id)}
                        disabled={deletingId === account.id}
                        aria-label={`נתק חשבון ${account.email}`}
                        className="shrink-0 rounded-lg p-1.5 text-apple-secondary transition-colors hover:bg-ios-red/10 hover:text-ios-red disabled:opacity-40"
                      >
                        {deletingId === account.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Connect button */}
              <button
                type="button"
                onClick={handleConnect}
                className="flex w-full items-center justify-center gap-2 rounded-apple-lg border border-dashed border-ios-indigo/40 py-2.5 text-sm font-medium text-ios-indigo transition-colors hover:border-ios-indigo/70 hover:bg-ios-indigo/5"
              >
                <Plus className="h-4 w-4" />
                חבר חשבון Gmail
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
