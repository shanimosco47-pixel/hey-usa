// ─── Email Scan Client API ────────────────────────────────────────────
// Client-side helpers for triggering email scans and managing OAuth

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

export interface ScanResult {
  results: Array<{
    documentId: string
    title: string
    category: string
    amount: number | null
    currency: string | null
  }>
  message: string
  motiMessage?: string
}

export async function triggerEmailScan(
  mode: 'full' | 'targeted',
  query?: string,
): Promise<ScanResult> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/email-scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ mode, query }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `שגיאת שרת: ${res.status}`)
  }

  return res.json() as Promise<ScanResult>
}

export function getGoogleOAuthUrl(redirectUri: string, loginHint?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    access_type: 'offline',
    prompt: 'consent',
  })
  if (loginHint) {
    params.set('login_hint', loginHint)
  }
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeOAuthCode(
  code: string,
  redirectUri: string,
  label?: string,
): Promise<{ email: string }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/email-oauth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ code, redirect_uri: redirectUri, label }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `שגיאת OAuth: ${res.status}`)
  }

  return res.json() as Promise<{ email: string }>
}
