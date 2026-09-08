import { describe, it, expect } from 'vitest'
import { accountsNeedingReconnect, type ScanResult } from '../emailScan'

// The scan returns 200 and a document count even when an account's Gmail
// authorisation is dead, so "success" is not proof that every mailbox was read.
// Danit's account failed on every run from 11 July onward and nothing said so.

function result(diagnostics: ScanResult['diagnostics']): ScanResult {
  return { results: [], message: 'Scan complete.', diagnostics }
}

describe('accountsNeedingReconnect', () => {
  it('names an account whose refresh token was revoked or expired', () => {
    expect(
      accountsNeedingReconnect(
        result([
          { account: 'shanimosco47@gmail.com', found: 494, imported: 14, errors: [] },
          {
            account: 'mdanit75@gmail.com',
            found: 0,
            imported: 0,
            errors: ['token_refresh_failed: Error: Token refresh failed (400): invalid_grant'],
          },
        ]),
      ),
    ).toEqual(['mdanit75@gmail.com'])
  })

  it('stays quiet when every account authenticated', () => {
    expect(
      accountsNeedingReconnect(
        result([{ account: 'shanimosco47@gmail.com', found: 494, imported: 14, errors: [] }]),
      ),
    ).toEqual([])
  })

  it('does not confuse an unfinished scan with a broken login', () => {
    expect(
      accountsNeedingReconnect(
        result([
          {
            account: 'shanimosco47@gmail.com',
            found: 494,
            imported: 14,
            errors: ['budget_exhausted: 300 message(s) not processed this run'],
          },
        ]),
      ),
    ).toEqual([])
  })

  it('tolerates a response with no diagnostics at all', () => {
    expect(accountsNeedingReconnect(result(undefined))).toEqual([])
  })
})
