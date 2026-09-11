import { describe, it, expect, vi } from 'vitest'
import {
  budgetNotice,
  canRequestMoreTools,
  classifyToolCalls,
  createToolLoopState,
  DEFAULT_LOOP_LIMITS,
  isFailureResult,
  recordRound,
  summarizeLoop,
  toolCallSignature,
  type ToolCall,
  type ToolLoopState,
} from '../toolLoop'

// The single-round version could answer "what are my tasks" and nothing that
// needed two facts at once. These tests pin the budgets that make several
// rounds safe, and the rule that the server never runs a write tool.

const SERVER_TOOLS = new Set(['get_tasks', 'get_daily_plan', 'search_web'])

function call(name: string, args: Record<string, unknown> = {}, id = `c-${name}`) {
  return { id, type: 'function', function: { name, arguments: JSON.stringify(args) } }
}

describe('classifyToolCalls', () => {
  it('sends reads and web search to the server, writes to the client', () => {
    const { serverCalls, writeCalls } = classifyToolCalls(
      [
        call('get_tasks'),
        call('search_web', { query: 'alerts' }),
        call('add_expense', { amount: 5 }),
      ],
      SERVER_TOOLS,
    )
    expect(serverCalls.map((c) => c.name)).toEqual(['get_tasks', 'search_web'])
    expect(writeCalls.map((c) => c.name)).toEqual(['add_expense'])
  })

  it('never routes a write tool to the server, whatever it is called', () => {
    const { serverCalls, writeCalls } = classifyToolCalls(
      [call('add_task'), call('complete_task'), call('toggle_packing_item')],
      SERVER_TOOLS,
    )
    expect(serverCalls).toHaveLength(0)
    expect(writeCalls).toHaveLength(3)
  })

  it('survives malformed arguments instead of throwing', () => {
    const { serverCalls } = classifyToolCalls(
      [{ id: 'x', type: 'function', function: { name: 'get_tasks', arguments: '{broken' } }],
      SERVER_TOOLS,
    )
    expect(serverCalls[0].args).toEqual({})
  })
})

describe('toolCallSignature', () => {
  it('is stable regardless of key order', () => {
    expect(toolCallSignature('search_web', { query: 'a', category: 'roads' })).toBe(
      toolCallSignature('search_web', { category: 'roads', query: 'a' }),
    )
  })

  it('separates different arguments', () => {
    expect(toolCallSignature('search_web', { query: 'a' })).not.toBe(
      toolCallSignature('search_web', { query: 'b' }),
    )
  })
})

describe('isFailureResult', () => {
  it('recognises a tool error', () => {
    expect(isFailureResult(JSON.stringify({ error: 'no access' }))).toBe(true)
  })

  it('recognises a failed web search', () => {
    expect(isFailureResult(JSON.stringify({ web_search: 'failed', reason: 'timeout' }))).toBe(true)
  })

  it('does not treat a declined search as a failure', () => {
    expect(isFailureResult(JSON.stringify({ web_search: 'declined' }))).toBe(false)
  })

  it('treats plain data as success', () => {
    expect(isFailureResult(JSON.stringify([{ id: 1 }]))).toBe(false)
  })
})

describe('budgets', () => {
  it('allows a fresh loop to request tools', () => {
    expect(canRequestMoreTools(createToolLoopState()).ok).toBe(true)
  })

  it('stops at the round limit', () => {
    const state = createToolLoopState({ ...DEFAULT_LOOP_LIMITS, maxRounds: 2 })
    recordRound(state, { tools: ['get_tasks'], results: ['[]'], cachedCount: 0 })
    recordRound(state, { tools: ['get_tasks'], results: ['[]'], cachedCount: 0 })
    expect(canRequestMoreTools(state)).toEqual({ ok: false, reason: 'round_budget' })
  })

  it('stops at the call limit', () => {
    const state = createToolLoopState({ ...DEFAULT_LOOP_LIMITS, maxToolCalls: 2 })
    recordRound(state, { tools: ['a', 'b'], results: ['[]', '[]'], cachedCount: 0 })
    expect(canRequestMoreTools(state)).toEqual({ ok: false, reason: 'call_budget' })
  })

  it('stops at the time limit', () => {
    let clock = 0
    const state = createToolLoopState({ ...DEFAULT_LOOP_LIMITS, maxDurationMs: 1000 }, () => clock)
    clock = 1500
    expect(canRequestMoreTools(state, () => clock)).toEqual({ ok: false, reason: 'time_budget' })
  })

  it('stops after consecutive fully failing rounds', () => {
    const state = createToolLoopState({ ...DEFAULT_LOOP_LIMITS, maxConsecutiveFailures: 2 })
    const failure = JSON.stringify({ error: 'boom' })
    recordRound(state, { tools: ['search_web'], results: [failure], cachedCount: 0 })
    expect(canRequestMoreTools(state).ok).toBe(true)
    recordRound(state, { tools: ['search_web'], results: [failure], cachedCount: 0 })
    expect(canRequestMoreTools(state)).toEqual({ ok: false, reason: 'repeated_failures' })
  })

  it('resets the failure streak when a round partly succeeds', () => {
    const state = createToolLoopState()
    recordRound(state, {
      tools: ['search_web'],
      results: [JSON.stringify({ error: 'x' })],
      cachedCount: 0,
    })
    expect(state.consecutiveFailures).toBe(1)
    recordRound(state, {
      tools: ['search_web', 'get_tasks'],
      results: [JSON.stringify({ error: 'x' }), '[]'],
      cachedCount: 0,
    })
    expect(state.consecutiveFailures).toBe(0)
  })
})

describe('budgetNotice', () => {
  it('tells the model to answer with what it has, and not to guess', () => {
    const notice = JSON.parse(budgetNotice('time_budget'))
    expect(notice.tool_loop).toBe('stopped')
    expect(notice.instruction).toContain('Answer now')
    expect(notice.instruction).toContain('not verified')
  })
})

describe('summarizeLoop', () => {
  it('reports enough to debug a runaway loop without leaking content', () => {
    const state = createToolLoopState()
    recordRound(state, { tools: ['get_daily_plan'], results: ['{}'], cachedCount: 0 })
    recordRound(state, {
      tools: ['search_web'],
      results: [JSON.stringify({ error: 'x' })],
      cachedCount: 1,
    })
    const line = summarizeLoop(state, 'round_budget')
    expect(line).toContain('rounds=2')
    expect(line).toContain('calls=2')
    expect(line).toContain('failures=1')
    expect(line).toContain('cached=1')
    expect(line).toContain('stop=round_budget')
  })
})

// ─── End-to-end simulation of the loop the edge function runs ────────────────
//
// The handler itself imports Deno globals, so the loop is re-implemented here
// exactly as it is wired in index.ts, driven by a scripted model. This is what
// catches "the loop never terminates" and "a write ran on the server".

interface ScriptedTurn {
  content?: string
  tool_calls?: ReturnType<typeof call>[]
}

async function runLoop(
  turns: ScriptedTurn[],
  execute: (name: string, args: Record<string, unknown>) => Promise<string>,
  limits = DEFAULT_LOOP_LIMITS,
): Promise<{ text: string; actions: string[]; state: ToolLoopState; serverRuns: string[] }> {
  const model = vi.fn()
  for (const turn of turns) model.mockResolvedValueOnce(turn)

  const serverRuns: string[] = []
  const actions: string[] = []
  const loop = createToolLoopState(limits)

  let choice: ScriptedTurn = await model()
  let text = choice.content ?? ''

  while (choice.tool_calls && choice.tool_calls.length > 0) {
    const { serverCalls, writeCalls } = classifyToolCalls(choice.tool_calls, SERVER_TOOLS)
    for (const c of writeCalls) actions.push(c.name)

    let cachedCount = 0
    const results = await Promise.all(
      serverCalls.map(async (c: ToolCall) => {
        const signature = toolCallSignature(c.name, c.args)
        const cached = loop.cache.get(signature)
        if (cached !== undefined) {
          cachedCount += 1
          return cached
        }
        serverRuns.push(c.name)
        const content = await execute(c.name, c.args)
        loop.cache.set(signature, content)
        return content
      }),
    )

    recordRound(loop, { tools: serverCalls.map((c) => c.name), results, cachedCount })

    const budget = canRequestMoreTools(loop)
    choice = (await model()) ?? { content: '' }
    text = choice.content ?? ''
    if (!budget.ok) break
  }

  return { text, actions, state: loop, serverRuns }
}

describe('loop behaviour end to end', () => {
  it('case 1: app data then web search, in two rounds', async () => {
    const result = await runLoop(
      [
        { tool_calls: [call('get_daily_plan', { day_number: 3 })] },
        { tool_calls: [call('search_web', { query: 'Yellowstone alerts' })] },
        { content: 'מחר יולוסטון, ויש התראה על סגירה חלקית.' },
      ],
      async (name) => (name === 'get_daily_plan' ? '{"stops":[]}' : '{"web_search":"ok"}'),
    )

    expect(result.serverRuns).toEqual(['get_daily_plan', 'search_web'])
    expect(result.state.rounds).toBe(2)
    expect(result.text).toContain('התראה')
  })

  it('case 3: a write tool is queued for the client and never executed here', async () => {
    const result = await runLoop(
      [
        { tool_calls: [call('get_tasks'), call('add_task', { title: 'לקנות מים' })] },
        { content: 'הוספתי.' },
      ],
      async () => '[]',
    )

    expect(result.actions).toEqual(['add_task'])
    expect(result.serverRuns).toEqual(['get_tasks'])
  })

  it('case 4: terminates when a tool keeps failing', async () => {
    const failing = vi.fn().mockResolvedValue(JSON.stringify({ error: 'upstream down' }))
    const result = await runLoop(
      [
        { tool_calls: [call('search_web', { query: 'a' })] },
        { tool_calls: [call('search_web', { query: 'b' })] },
        { tool_calls: [call('search_web', { query: 'c' })] },
        { content: 'לא הצלחתי לאמת.' },
      ],
      failing,
    )

    expect(result.state.rounds).toBe(2)
    expect(failing).toHaveBeenCalledTimes(2)
    expect(canRequestMoreTools(result.state)).toEqual({
      ok: false,
      reason: 'repeated_failures',
    })
  })

  it('case 5: a simple question uses exactly one round', async () => {
    const result = await runLoop(
      [{ tool_calls: [call('get_tasks')] }, { content: 'נשארו שתי משימות.' }],
      async () => '[{"id":1}]',
    )
    expect(result.state.rounds).toBe(1)
  })

  it('answers with no rounds at all when no tool is needed', async () => {
    const result = await runLoop([{ content: 'שלום!' }], async () => '[]')
    expect(result.state.rounds).toBe(0)
    expect(result.text).toBe('שלום!')
  })

  it('serves a repeated identical call from cache instead of re-running it', async () => {
    const execute = vi.fn().mockResolvedValue('{"ok":true}')
    const result = await runLoop(
      [
        { tool_calls: [call('search_web', { query: 'same' })] },
        { tool_calls: [call('search_web', { query: 'same' }, 'c2')] },
        { content: 'done' },
      ],
      execute,
    )

    expect(execute).toHaveBeenCalledTimes(1)
    expect(result.state.log[1].cached).toBe(1)
  })

  it('stops at the round budget even if the model keeps asking', async () => {
    const turns: ScriptedTurn[] = []
    for (let i = 0; i < 10; i++) turns.push({ tool_calls: [call('get_tasks', { i })] })
    turns.push({ content: 'ok' })

    const result = await runLoop(turns, async () => '[]', {
      ...DEFAULT_LOOP_LIMITS,
      maxRounds: 3,
    })

    expect(result.state.rounds).toBe(3)
  })
})
