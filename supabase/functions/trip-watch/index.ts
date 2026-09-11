// Supabase Edge Function — Daily Trip Watch
//
// Checks tomorrow's itinerary against live external conditions and tells the
// family only when something could materially change the day: a road closure on
// the route, a park closure, severe weather, wildfire impact, an access or
// reservation change.
//
// Runs on a schedule, server-side. Unlike set_reminder (client-side, fires only
// while the app is open) this works with every browser closed.
//
// Detection lives in detect.ts and knows nothing about delivery. Delivery here
// is deliberately the smallest thing that already exists in this project: a
// message from Moti in chat_messages, plus a durable row in trip_alerts. Push
// delivery is documented in docs/moti.md as the next step, not invented here.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  DEFAULT_FALLBACK_SEARCH_MODEL,
  DEFAULT_SEARCH_MODEL,
  DEFAULT_SEARCH_TIMEOUT_MS,
  searchWeb,
  type SearchCategory,
} from '../moti-chat/webSearch.ts'
import {
  buildAlertMessage,
  classifySeverity,
  diffConditions,
  nextState,
  selectRelevant,
  type Finding,
  type KnownCondition,
} from './detect.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

interface ItineraryRow {
  id: string
  date: string
  title: string
  city?: string
  stops?: Array<{ title?: string; location?: string }>
}

interface BookingRow {
  location: string
  area?: string
  check_in: string
  check_out: string
}

/** Place names for tomorrow: city, stop locations, and where we sleep. */
function routePlaces(day: ItineraryRow | null, booking: BookingRow | null): string[] {
  const places: string[] = []
  if (day?.city) places.push(day.city)
  if (day?.title) places.push(day.title)
  for (const stop of day?.stops ?? []) {
    if (stop.location) places.push(stop.location)
    if (stop.title) places.push(stop.title)
  }
  if (booking?.location) places.push(booking.location)
  if (booking?.area) places.push(booking.area)
  return places
}

/** The handful of questions worth asking about tomorrow. */
function buildChecks(
  places: string[],
): Array<{ key: string; category: SearchCategory; query: string }> {
  const primary = places.slice(0, 3)
  const checks: Array<{ key: string; category: SearchCategory; query: string }> = []

  for (const place of primary) {
    checks.push({
      key: `parks:${place}`,
      category: 'parks',
      query: `Current alerts, closures or entry requirements at ${place} today`,
    })
    checks.push({
      key: `roads:${place}`,
      category: 'roads',
      query: `Road closures or travel advisories affecting routes to ${place} today`,
    })
    checks.push({
      key: `weather:${place}`,
      category: 'weather',
      query: `Severe weather warnings or winter storm warnings for ${place} tomorrow`,
    })
    checks.push({
      key: `wildfire:${place}`,
      category: 'wildfire',
      query: `Active wildfires or smoke impacts near ${place} today`,
    })
  }

  return checks
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!apiKey || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'missing configuration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    const body = (await req.json().catch(() => ({}))) as { dryRun?: boolean; date?: string }

    // Which day are we checking? Tomorrow, unless told otherwise.
    const target = body.date
      ? body.date
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const { data: dayRows } = await supabase
      .from('itinerary_days')
      .select('id,date,title,city,stops')
      .eq('date', target)
      .limit(1)

    const day = (dayRows?.[0] as ItineraryRow | undefined) ?? null

    const { data: bookingRows } = await supabase
      .from('campsite_bookings')
      .select('location,area,check_in,check_out')
      .lte('check_in', target)
      .gt('check_out', target)
      .limit(1)

    const booking = (bookingRows?.[0] as BookingRow | undefined) ?? null

    const places = routePlaces(day, booking)
    if (places.length === 0) {
      console.log(`[trip-watch] nothing scheduled for ${target}`)
      return new Response(JSON.stringify({ checked: target, findings: 0, notified: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    // ── Detection ────────────────────────────────────────────────────────────
    const searchConfig = {
      apiKey,
      model: Deno.env.get('MOTI_SEARCH_MODEL') || DEFAULT_SEARCH_MODEL,
      fallbackModel: Deno.env.get('MOTI_SEARCH_FALLBACK_MODEL') || DEFAULT_FALLBACK_SEARCH_MODEL,
      timeoutMs: Number(Deno.env.get('MOTI_SEARCH_TIMEOUT_MS')) || DEFAULT_SEARCH_TIMEOUT_MS,
    }

    const checks = buildChecks(places)
    const findings: Finding[] = []

    for (const check of checks) {
      const result = await searchWeb(
        { query: check.query, category: check.category, location: places[0] },
        searchConfig,
      )
      if (!result.ok) {
        console.warn(`[trip-watch] check failed ${check.key}: ${result.reason}`)
        continue
      }

      findings.push({
        key: check.key,
        category:
          check.category === 'business' || check.category === 'general' ? 'access' : check.category,
        summary: result.answer,
        severity: classifySeverity(result.answer),
        places: [check.key.split(':')[1]],
        source: result.sources[0],
        retrieved_at: result.retrieved_at,
      })
    }

    const relevant = selectRelevant(findings, places)

    const { data: knownRows } = await supabase
      .from('trip_watch_state')
      .select('key,severity,summary,last_seen_at')
      .eq('target_date', target)

    const known = (knownRows ?? []) as KnownCondition[]
    const changes = diffConditions(relevant, known)
    const message = buildAlertMessage(changes, `יום ${target}`)

    console.log(
      `[trip-watch] ${target}: places=${places.length} findings=${findings.length} relevant=${relevant.length} notify=${changes.filter((c) => c.notify).length}`,
    )

    if (body.dryRun) {
      return new Response(JSON.stringify({ checked: target, changes, message }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    // ── Persist state, so the next run compares rather than repeats ──────────
    const rows = nextState(changes).map((c) => ({
      target_date: target,
      key: c.key,
      severity: c.severity,
      summary: c.summary,
      last_seen_at: c.last_seen_at,
      updated_at: new Date().toISOString(),
    }))

    if (rows.length > 0) {
      const { error } = await supabase
        .from('trip_watch_state')
        .upsert(rows, { onConflict: 'target_date,key' })
      if (error) console.error('[trip-watch] state upsert failed:', error.message)
    }

    // ── Notification ────────────────────────────────────────────────────────
    let notified = false
    if (message) {
      const now = new Date().toISOString()

      const { error: alertError } = await supabase.from('trip_alerts').insert(
        changes
          .filter((c) => c.notify && c.finding)
          .map((c) => ({
            id: `watch-${target}-${c.finding!.key}-${Date.now()}`,
            target_date: target,
            key: c.finding!.key,
            severity: c.finding!.severity,
            summary: c.finding!.summary,
            source_url: c.finding!.source?.url ?? null,
            change_kind: c.kind,
            created_at: now,
          })),
      )
      if (alertError) console.error('[trip-watch] alert insert failed:', alertError.message)

      const { error: chatError } = await supabase.from('chat_messages').insert({
        id: `moti-watch-${Date.now()}`,
        role: 'assistant',
        content: message,
        has_action: false,
        created_at: now,
      })
      if (chatError) console.error('[trip-watch] chat insert failed:', chatError.message)

      notified = !alertError && !chatError
    }

    return new Response(
      JSON.stringify({
        checked: target,
        findings: findings.length,
        relevant: relevant.length,
        notified,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    )
  } catch (err) {
    console.error('[trip-watch] error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
