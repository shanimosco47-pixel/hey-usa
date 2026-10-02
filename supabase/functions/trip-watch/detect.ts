// detect.ts — decides whether tomorrow's conditions changed enough to be worth
// waking the family for.
//
// Detection is deliberately separate from notification: this module answers
// "has something materially changed?" and knows nothing about how anyone is
// told. Everything here is pure so it can be tested without a database.
//
// The bar is high on purpose. "Weather forecast updated" is noise. "Snow
// forecast increased and US-191 is under a travel advisory" is the message.

export type Severity = 'critical' | 'major' | 'minor' | 'info'

/** What a check found about one condition, at one moment. */
export interface Finding {
  /** Stable identity of the condition, e.g. "roads:US-191" or "parks:yellowstone". */
  key: string
  category: 'roads' | 'parks' | 'weather' | 'wildfire' | 'access'
  /** One line, already sanitised, as it would be shown to a person. */
  summary: string
  severity: Severity
  /** Place names this finding concerns, matched against tomorrow's route. */
  places: string[]
  source?: { title: string; url: string; source: string }
  retrieved_at: string
}

/** What we already knew, loaded from trip_watch_state. */
export interface KnownCondition {
  key: string
  severity: Severity
  summary: string
  last_seen_at: string
}

export type ChangeKind = 'new' | 'worsened' | 'unchanged' | 'resolved'

export interface Change {
  kind: ChangeKind
  finding?: Finding
  previous?: KnownCondition
  /** Only new/worsened changes are worth telling anyone about. */
  notify: boolean
  reason: string
}

const SEVERITY_RANK: Record<Severity, number> = { info: 0, minor: 1, major: 2, critical: 3 }

/** Severity at or above which a condition can materially change the day. */
export const NOTIFY_THRESHOLD: Severity = 'major'

export function isMaterial(severity: Severity): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[NOTIFY_THRESHOLD]
}

// "National" and "Park" are shared by Yellowstone and the Everglades, so they
// carry no location information and must never cause a match on their own.
const GENERIC_PLACE_TOKENS = new Set([
  'national',
  'park',
  'state',
  'forest',
  'monument',
  'recreation',
  'area',
  'county',
  'city',
  'town',
  'road',
  'highway',
  'route',
  'the',
  'and',
])

/** Distinctive tokens of a place name, for route matching. */
function placeTokens(name: string): string[] {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9֐-׿]+/g, ' ')
    .split(' ')
    .filter((t) => t.length > 2 && !GENERIC_PLACE_TOKENS.has(t))
}

/**
 * A finding matters only if it touches somewhere we are actually going
 * tomorrow. A closure two hundred miles off the route is someone else's problem.
 */
export function isOnRoute(finding: Finding, routePlaces: string[]): boolean {
  if (finding.places.length === 0) return false
  const routeTokens = new Set(routePlaces.flatMap(placeTokens))
  return finding.places.some((place) => {
    const tokens = placeTokens(place)
    return tokens.length > 0 && tokens.some((t) => routeTokens.has(t))
  })
}

/**
 * Compares what a check found against what we already knew. New and worsened
 * conditions notify; the same condition seen again does not, however alarming
 * it is — the family was already told once.
 */
export function diffConditions(findings: Finding[], known: KnownCondition[]): Change[] {
  const knownByKey = new Map(known.map((k) => [k.key, k]))
  const changes: Change[] = []

  for (const finding of findings) {
    const previous = knownByKey.get(finding.key)

    if (!previous) {
      changes.push({
        kind: 'new',
        finding,
        notify: isMaterial(finding.severity),
        reason: isMaterial(finding.severity)
          ? 'new condition affecting tomorrow'
          : 'new but not material',
      })
      continue
    }

    if (SEVERITY_RANK[finding.severity] > SEVERITY_RANK[previous.severity]) {
      changes.push({
        kind: 'worsened',
        finding,
        previous,
        notify: isMaterial(finding.severity),
        reason: `severity rose from ${previous.severity} to ${finding.severity}`,
      })
      continue
    }

    changes.push({
      kind: 'unchanged',
      finding,
      previous,
      notify: false,
      reason: 'already reported',
    })
  }

  // A condition we knew about and no longer see has cleared. Worth recording,
  // not worth a notification: nobody needs waking to be told a road reopened.
  const seen = new Set(findings.map((f) => f.key))
  for (const previous of known) {
    if (!seen.has(previous.key)) {
      changes.push({ kind: 'resolved', previous, notify: false, reason: 'no longer reported' })
    }
  }

  return changes
}

/** Findings worth checking at all: material, and on tomorrow's route. */
export function selectRelevant(findings: Finding[], routePlaces: string[]): Finding[] {
  return findings.filter((f) => isMaterial(f.severity) && isOnRoute(f, routePlaces))
}

// Severity is derived from the words authoritative sources actually use.
// Deterministic on purpose: a model deciding what counts as an emergency is a
// model that can be talked into one by a web page.
const SEVERITY_RULES: Array<{ severity: Severity; pattern: RegExp }> = [
  {
    severity: 'critical',
    pattern:
      /\b(evacuat\w*|mandatory closure|road closed|closed to all|park closed|emergency closure|life[- ]threatening)\b/i,
  },
  {
    severity: 'major',
    pattern:
      /\b(clos\w+|travel advisory|warning|restrict\w+|chain control|no entry|permit required|reservation required|red flag|winter storm|flood)\b/i,
  },
  { severity: 'minor', pattern: /\b(delay|watch|advisory|smoke|haze|construction|congestion)\b/i },
]

/** Severity of a finding, read from the language of the source text. */
export function classifySeverity(text: string): Severity {
  for (const rule of SEVERITY_RULES) {
    if (rule.pattern.test(text || '')) return rule.severity
  }
  return 'info'
}

const SEVERITY_EMOJI: Record<Severity, string> = {
  critical: '🛑',
  major: '⚠️',
  minor: 'ℹ️',
  info: 'ℹ️',
}

/**
 * The Hebrew message for the chat. Says what changed and what it means for
 * tomorrow, never just that something was checked.
 */
export function buildAlertMessage(changes: Change[], dateLabel: string): string | null {
  const notifiable = changes.filter((c) => c.notify && c.finding)
  if (notifiable.length === 0) return null

  const lines = [`🔔 בדיקת תנאים ל${dateLabel}: משהו השתנה ועשוי להשפיע על התכנון.`, '']

  for (const change of notifiable) {
    const f = change.finding!
    const prefix = SEVERITY_EMOJI[f.severity]
    const worsened =
      change.kind === 'worsened' ? ` (החמיר מ-${change.previous?.severity} ל-${f.severity})` : ''
    lines.push(`${prefix} ${f.summary}${worsened}`)
    if (f.source) {
      lines.push(`   מקור: ${f.source.source} — ${f.source.url}`)
    }
    lines.push(`   נבדק: ${f.retrieved_at}`)
  }

  lines.push('')
  lines.push('בדקו את זה לפני שיוצאים. אם צריך לשנות תכנית, אני כאן.')
  return lines.join('\n')
}

/** Rows to persist so the next check can compare against this one. */
export function nextState(changes: Change[]): KnownCondition[] {
  return changes
    .filter((c) => c.finding && c.kind !== 'resolved')
    .map((c) => ({
      key: c.finding!.key,
      severity: c.finding!.severity,
      summary: c.finding!.summary,
      last_seen_at: c.finding!.retrieved_at,
    }))
}
