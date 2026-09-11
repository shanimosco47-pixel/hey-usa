// toolLoop.ts — budget and bookkeeping for Moti's multi-round tool loop.
//
// Moti used to get exactly one tool round, then an answer-only turn. That is
// enough for "what are my tasks" and useless for "what should we do tomorrow",
// which needs the day plan, then alerts for the places in it, then weather,
// then drive times. This module holds the policy for running several rounds
// without letting the model spin: round, call, time and repetition budgets.
//
// Deno-free on purpose so vitest can cover it.

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
}

export interface LoopLimits {
  /** Model turns that may request tools. */
  maxRounds: number
  /** Total server-side tool executions across all rounds. */
  maxToolCalls: number
  /** Wall-clock budget for the whole loop. */
  maxDurationMs: number
  /** Consecutive failing rounds before we stop asking for more tools. */
  maxConsecutiveFailures: number
}

export const DEFAULT_LOOP_LIMITS: LoopLimits = {
  maxRounds: 4,
  maxToolCalls: 12,
  maxDurationMs: 45_000,
  maxConsecutiveFailures: 2,
}

export interface ToolLoopState {
  limits: LoopLimits
  startedAt: number
  rounds: number
  calls: number
  consecutiveFailures: number
  /** signature → previous result, so a repeated call costs nothing. */
  cache: Map<string, string>
  /** Ordered log of what happened, for debugging a runaway loop. */
  log: Array<{ round: number; tools: string[]; ms: number; failures: number; cached: number }>
}

export type StopReason =
  | 'round_budget'
  | 'call_budget'
  | 'time_budget'
  | 'repeated_failures'
  | 'no_more_tools'

export function createToolLoopState(
  limits: LoopLimits = DEFAULT_LOOP_LIMITS,
  now: () => number = Date.now,
): ToolLoopState {
  return {
    limits,
    startedAt: now(),
    rounds: 0,
    calls: 0,
    consecutiveFailures: 0,
    cache: new Map(),
    log: [],
  }
}

/** Whether the next model turn may still be offered tools. */
export function canRequestMoreTools(
  state: ToolLoopState,
  now: () => number = Date.now,
): { ok: true } | { ok: false; reason: StopReason } {
  if (state.rounds >= state.limits.maxRounds) return { ok: false, reason: 'round_budget' }
  if (state.calls >= state.limits.maxToolCalls) return { ok: false, reason: 'call_budget' }
  if (now() - state.startedAt >= state.limits.maxDurationMs) {
    return { ok: false, reason: 'time_budget' }
  }
  if (state.consecutiveFailures >= state.limits.maxConsecutiveFailures) {
    return { ok: false, reason: 'repeated_failures' }
  }
  return { ok: true }
}

/** Stable signature for a tool call, so re-asking the same thing is detectable. */
export function toolCallSignature(name: string, args: Record<string, unknown>): string {
  const sorted = Object.keys(args ?? {})
    .sort()
    .map((k) => `${k}=${JSON.stringify((args as Record<string, unknown>)[k])}`)
    .join('&')
  return `${name}(${sorted})`
}

export interface ClassifiedCalls {
  /** Tools the server runs: reads and web search. */
  serverCalls: ToolCall[]
  /** Write tools, returned to the browser as actions — never run here. */
  writeCalls: ToolCall[]
}

/**
 * Splits a model's tool calls into what the server may execute and what must go
 * back to the client. Malformed arguments degrade to `{}` rather than crashing
 * the request, which is what the single-round version did too.
 */
export function classifyToolCalls(
  rawCalls: Array<{ id: string; type?: string; function?: { name: string; arguments: string } }>,
  serverToolNames: Set<string>,
): ClassifiedCalls {
  const serverCalls: ToolCall[] = []
  const writeCalls: ToolCall[] = []

  for (const call of rawCalls ?? []) {
    if (call.type && call.type !== 'function') continue
    const name = call.function?.name
    if (!name) continue

    let args: Record<string, unknown> = {}
    try {
      args = JSON.parse(call.function?.arguments || '{}')
    } catch {
      console.error('[moti-chat] malformed tool arguments for', name)
    }

    const entry: ToolCall = { id: call.id, name, args }
    if (serverToolNames.has(name)) serverCalls.push(entry)
    else writeCalls.push(entry)
  }

  return { serverCalls, writeCalls }
}

/** A tool result counts as a failure when it carries an error or a failed search. */
export function isFailureResult(content: string): boolean {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>
    return Boolean(parsed.error) || parsed.web_search === 'failed'
  } catch {
    return false
  }
}

/** Records a completed round and updates every budget. */
export function recordRound(
  state: ToolLoopState,
  round: { tools: string[]; results: string[]; cachedCount: number },
  now: () => number = Date.now,
): void {
  state.rounds += 1
  state.calls += round.tools.length

  const failures = round.results.filter(isFailureResult).length
  // A round is "failing" only when nothing in it succeeded; one bad tool
  // alongside a good one is not a reason to stop reasoning.
  if (round.results.length > 0 && failures === round.results.length) {
    state.consecutiveFailures += 1
  } else {
    state.consecutiveFailures = 0
  }

  state.log.push({
    round: state.rounds,
    tools: round.tools,
    ms: now() - state.startedAt,
    failures,
    cached: round.cachedCount,
  })
}

/** One-line summary for the function logs. */
export function summarizeLoop(state: ToolLoopState, stop: StopReason | 'answered'): string {
  const tools = state.log.flatMap((l) => l.tools).join(',')
  const failures = state.log.reduce((n, l) => n + l.failures, 0)
  const cached = state.log.reduce((n, l) => n + l.cached, 0)
  return `rounds=${state.rounds} calls=${state.calls} failures=${failures} cached=${cached} stop=${stop} tools=[${tools}]`
}

/** Note handed to the model when the budget runs out mid-investigation. */
export function budgetNotice(reason: StopReason): string {
  const detail: Record<StopReason, string> = {
    round_budget: 'the tool round limit',
    call_budget: 'the tool call limit',
    time_budget: 'the time limit',
    repeated_failures: 'repeated tool failures',
    no_more_tools: 'no further tools being needed',
  }
  return JSON.stringify({
    tool_loop: 'stopped',
    reason,
    instruction:
      `No further tool calls are available (${detail[reason]}). Answer now with what you already have. ` +
      `If something could not be checked, say plainly that it was not verified rather than guessing.`,
  })
}
