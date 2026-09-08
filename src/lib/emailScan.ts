// ─── Email Scan Client API ────────────────────────────────────────────
// Client-side helpers for triggering email scans and managing OAuth

import { retryWithBackoff } from './retry'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

export interface ScanDiagnostic {
  account: string
  found: number
  imported: number
  errors: string[]
}

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
  diagnostics?: ScanDiagnostic[]
}

/**
 * Accounts whose Gmail authorisation is dead and can only be repaired by
 * signing in again. A revoked or expired refresh token fails silently on the
 * server: the scan still returns 200 and reports how many documents it imported
 * from the accounts that DID work, so the run looks successful while an entire
 * mailbox was never opened. That is how Danit's account sat unscanned from July
 * to the eve of the trip.
 *
 * Only Google's invalid_grant counts here. A 5xx, a rate limit or a failed
 * local decrypt are reported separately: sending someone through a full Google
 * sign-in because a request timed out is worse than useless advice.
 */
export function accountsNeedingReconnect(result: ScanResult): string[] {
  return (result.diagnostics ?? [])
    .filter((d) => d.errors.some((e) => e.startsWith('token_revoked')))
    .map((d) => d.account)
}

/** Accounts that could not be opened this run for a reason a retry may cure. */
export function accountsTemporarilyUnreachable(result: ScanResult): string[] {
  return (result.diagnostics ?? [])
    .filter((d) => d.errors.some((e) => e.startsWith('token_refresh_failed')))
    .map((d) => d.account)
}

export async function triggerEmailScan(
  mode: 'full' | 'targeted',
  query?: string,
): Promise<ScanResult> {
  const res = await retryWithBackoff(
    () =>
      fetch(`${SUPABASE_URL}/functions/v1/email-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ mode, query }),
      }),
    2,
  )

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
    // select_account forces Google's account picker. Without it, a phone already
    // signed in to one Google account is sent straight through it, so trying to
    // reconnect a second mailbox silently re-authorises the signed-in one
    // instead and reports success under the wrong address.
    prompt: 'select_account consent',
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
  const res = await retryWithBackoff(
    () =>
      fetch(`${SUPABASE_URL}/functions/v1/email-oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ code, redirect_uri: redirectUri, label }),
      }),
    2,
  )

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `שגיאת OAuth: ${res.status}`)
  }

  return res.json() as Promise<{ email: string }>
}
