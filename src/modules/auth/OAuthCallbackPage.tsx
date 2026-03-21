import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { exchangeOAuthCode } from '@/lib/emailScan'

type Status = 'loading' | 'success' | 'error'

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('loading')
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const redirectUri = `${window.location.origin}${import.meta.env.BASE_URL}oauth/callback`

    if (!code) {
      setErrorMessage('לא נמצא קוד אימות בכתובת ה-URL')
      setStatus('error')
      return
    }

    exchangeOAuthCode(code, redirectUri)
      .then(({ email: connectedEmail }) => {
        setEmail(connectedEmail)
        setStatus('success')
        setTimeout(() => navigate('/documents', { replace: true }), 2000)
      })
      .catch((err: Error) => {
        setErrorMessage(err.message || 'אירעה שגיאה בחיבור החשבון')
        setStatus('error')
      })
  }, [navigate])

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-surface-primary"
      dir="rtl"
    >
      <div className="flex flex-col items-center gap-4 text-center px-6">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-ios-blue" />
            <p className="text-[17px] font-medium text-apple-primary">מחבר את החשבון...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-[17px] font-medium text-apple-primary">
              חשבון {email} חובר בהצלחה!
            </p>
            <p className="text-[14px] text-apple-secondary">מעביר אותך לדוקומנטים...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 text-red-500" />
            <p className="text-[17px] font-medium text-apple-primary">שגיאה בחיבור החשבון</p>
            <p className="text-[14px] text-apple-secondary">{errorMessage}</p>
          </>
        )}
      </div>
    </div>
  )
}
