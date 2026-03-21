// Supabase Edge Function — Gmail OAuth Callback Handler
// Exchanges authorization code for tokens and stores account in email_accounts table

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encrypt } from '../_shared/crypto.ts'

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://shanimosco47-pixel.github.io'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }

  // Read required env vars
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  const tokenEncryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY')

  if (
    !supabaseUrl ||
    !supabaseServiceRoleKey ||
    !googleClientId ||
    !googleClientSecret ||
    !tokenEncryptionKey
  ) {
    return new Response(JSON.stringify({ error: 'Missing required environment variables' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }

  try {
    const { code, redirect_uri, label } = (await req.json()) as {
      code: string
      redirect_uri: string
      label?: string
    }

    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: code, redirect_uri' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        },
      )
    }

    // Step 1: Exchange auth code for tokens
    const tokenParams = new URLSearchParams({
      code,
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri,
      grant_type: 'authorization_code',
    })

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Google token exchange error:', tokenResponse.status, errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to exchange authorization code for tokens' }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        },
      )
    }

    const tokens = await tokenResponse.json()

    if (!tokens.access_token) {
      return new Response(JSON.stringify({ error: 'No access token returned from Google' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    // Step 2: Get user email from Gmail profile
    const profileResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text()
      console.error('Gmail profile fetch error:', profileResponse.status, errorText)
      return new Response(JSON.stringify({ error: 'Failed to fetch Gmail profile' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const profile = await profileResponse.json()
    const email: string = profile.emailAddress

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Could not retrieve email address from Gmail profile' }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        },
      )
    }

    // Step 3: Upsert into email_accounts table
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const accountLabel = label || email.split('@')[0]

    const { error: upsertError } = await supabase.from('email_accounts').upsert(
      {
        email,
        label: accountLabel,
        refresh_token: await encrypt(tokens.refresh_token, tokenEncryptionKey),
        is_approved: true,
      },
      { onConflict: 'email' },
    )

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save email account', details: upsertError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        },
      )
    }

    // Step 4: Return success
    return new Response(JSON.stringify({ email, label: accountLabel }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
