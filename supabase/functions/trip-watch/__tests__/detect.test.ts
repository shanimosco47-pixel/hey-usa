import { describe, it, expect } from 'vitest'
import {
  buildAlertMessage,
  classifySeverity,
  diffConditions,
  isMaterial,
  isOnRoute,
  nextState,
  selectRelevant,
  type Finding,
  type KnownCondition,
} from '../detect'

// A watcher that cries "forecast updated" every morning gets muted within a
// week, and then the one message that mattered is muted too. These tests pin
// the bar: material, on tomorrow's route, and actually changed since last time.

const RETRIEVED = '2026-09-12T13:00:00.000Z'

const ROUTE = ['Yellowstone National Park', 'Gardiner, MT', 'US-191']

function finding(over: Partial<Finding> = {}): Finding {
  return {
    key: 'roads:US-191',
    category: 'roads',
    summary: 'US-191 closed between mile 20 and 35',
    severity: 'major',
    places: ['US-191'],
    retrieved_at: RETRIEVED,
    ...over,
  }
}

describe('classifySeverity', () => {
  it('treats an evacuation as critical', () => {
    expect(classifySeverity('Mandatory evacuation ordered for the area')).toBe('critical')
  })

  it('treats a closure or advisory as major', () => {
    expect(classifySeverity('US-191 is closed northbound')).toBe('major')
    expect(classifySeverity('Winter storm warning in effect tonight')).toBe('major')
  })

  it('treats smoke or delays as minor', () => {
    expect(classifySeverity('Light smoke and some construction delays')).toBe('minor')
  })

  it('treats an ordinary forecast as info', () => {
    expect(classifySeverity('Sunny, high near 21C')).toBe('info')
  })
})

describe('isMaterial', () => {
  it('notifies at major and above only', () => {
    expect(isMaterial('critical')).toBe(true)
    expect(isMaterial('major')).toBe(true)
    expect(isMaterial('minor')).toBe(false)
    expect(isMaterial('info')).toBe(false)
  })
})

describe('isOnRoute', () => {
  it('matches a finding about a place on tomorrow’s route', () => {
    expect(isOnRoute(finding({ places: ['Yellowstone'] }), ROUTE)).toBe(true)
  })

  it('4. ignores an alert far from the route', () => {
    expect(isOnRoute(finding({ places: ['Everglades National Park'] }), ROUTE)).toBe(false)
  })

  it('ignores a finding with no place at all', () => {
    expect(isOnRoute(finding({ places: [] }), ROUTE)).toBe(false)
  })
})

describe('selectRelevant', () => {
  it('keeps only material findings that touch the route', () => {
    const kept = selectRelevant(
      [
        finding(),
        finding({ key: 'weather:x', severity: 'info', places: ['Gardiner'] }),
        finding({ key: 'roads:florida', places: ['Miami'] }),
      ],
      ROUTE,
    )
    expect(kept.map((f) => f.key)).toEqual(['roads:US-191'])
  })
})

describe('diffConditions', () => {
  it('1. says nothing when nothing meaningful changed', () => {
    const known: KnownCondition[] = [
      { key: 'roads:US-191', severity: 'major', summary: 'closed', last_seen_at: RETRIEVED },
    ]
    const changes = diffConditions([finding()], known)
    expect(changes.every((c) => !c.notify)).toBe(true)
  })

  it('2. notifies about a new road closure affecting tomorrow', () => {
    const changes = diffConditions([finding()], [])
    expect(changes[0]).toMatchObject({ kind: 'new', notify: true })
  })

  it('3. notifies about severe weather affecting tomorrow', () => {
    const changes = diffConditions(
      [
        finding({
          key: 'weather:Gardiner',
          category: 'weather',
          severity: 'critical',
          summary: 'Blizzard warning overnight',
          places: ['Gardiner, MT'],
        }),
      ],
      [],
    )
    expect(changes[0].notify).toBe(true)
  })

  it('5. does not repeat itself on the second check', () => {
    const first = diffConditions([finding()], [])
    const stored = nextState(first)
    const second = diffConditions([finding()], stored)
    expect(first[0].notify).toBe(true)
    expect(second[0]).toMatchObject({ kind: 'unchanged', notify: false })
  })

  it('6. notifies again when the same condition gets worse', () => {
    const stored = nextState(diffConditions([finding()], []))
    const worse = diffConditions(
      [finding({ severity: 'critical', summary: 'US-191 closed, evacuation in progress' })],
      stored,
    )
    expect(worse[0]).toMatchObject({ kind: 'worsened', notify: true })
    expect(worse[0].reason).toContain('major')
    expect(worse[0].reason).toContain('critical')
  })

  it('records a cleared condition without notifying about it', () => {
    const stored = nextState(diffConditions([finding()], []))
    const cleared = diffConditions([], stored)
    expect(cleared[0]).toMatchObject({ kind: 'resolved', notify: false })
  })

  it('does not notify about a new but immaterial condition', () => {
    const changes = diffConditions([finding({ severity: 'minor' })], [])
    expect(changes[0].notify).toBe(false)
  })
})

describe('buildAlertMessage', () => {
  it('returns nothing when there is nothing to say', () => {
    expect(buildAlertMessage(diffConditions([finding({ severity: 'info' })], []), 'מחר')).toBeNull()
  })

  it('says what changed and what it means, not that a check ran', () => {
    const message = buildAlertMessage(
      diffConditions(
        [
          finding({
            source: { title: 'MDT', url: 'https://mdt.mt.gov/x', source: 'mdt.mt.gov' },
          }),
        ],
        [],
      ),
      'מחר',
    )
    expect(message).toContain('US-191 closed')
    expect(message).toContain('mdt.mt.gov')
    expect(message).toContain('נבדק')
    expect(message).not.toContain('forecast updated')
  })

  it('marks a worsened condition as worsened', () => {
    const stored = nextState(diffConditions([finding()], []))
    const message = buildAlertMessage(
      diffConditions([finding({ severity: 'critical' })], stored),
      'מחר',
    )
    expect(message).toContain('החמיר')
  })
})

describe('nextState', () => {
  it('carries forward what was seen, so the next run can compare', () => {
    const state = nextState(diffConditions([finding()], []))
    expect(state).toEqual([
      {
        key: 'roads:US-191',
        severity: 'major',
        summary: 'US-191 closed between mile 20 and 35',
        last_seen_at: RETRIEVED,
      },
    ])
  })

  it('drops conditions that have cleared', () => {
    const stored = nextState(diffConditions([finding()], []))
    expect(nextState(diffConditions([], stored))).toEqual([])
  })
})
