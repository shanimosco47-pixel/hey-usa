# Shared Library and Persistence Instructions

These instructions extend the repository root `AGENTS.md` for code under `src/lib`.

## Review guidelines

Assume shared utilities can affect every screen and every user record.

### Supabase and Dexie

- Verify every persisted field is mapped in both directions with the correct name, nullability, type, and default.
- Flag any `snake_case` ↔ `camelCase` mismatch that can strip data during pull, local caching, queueing, or flush.
- Pull operations must not silently replace known user data with seed, demo, or empty data after a backend error.
- Push and queued-offline writes must expose failure and remain retryable without duplicating or corrupting records.
- Do not report sync success until all required operations have completed successfully.
- Preserve stable IDs, foreign keys, timestamps, and relationship fields across round trips.
- Consider ordering and race conditions when local and remote writes overlap.

### Error handling

- Empty `catch`, `.catch(() => {})`, broad fallback-to-success, and ignored per-record failures are review findings when they can hide incomplete state.
- Distinguish unavailable, degraded, stale, partial, and successful states.
- Batch operations must report partial failure and must not claim complete success after scanning or writing zero usable records.
- Logging alone is insufficient when the user can reasonably believe data was saved, loaded, deleted, or synchronized.

### File and URL helpers

- Centralize the definition of a real file URL and use it consistently.
- Reject relative placeholder paths where a durable uploaded object is required.
- Do not broaden accepted URL schemes without reviewing security and browser behavior.
- Helpers used for preview or HTML content must preserve sanitization and sandbox guarantees.

## Tests expected

For changed mapping or sync code, include round-trip tests that prove:

1. Remote row → application model preserves all sensitive and relationship fields.
2. Application/Dexie model → remote mutation uses correct database column names.
3. Offline queue replay preserves the same data.
4. Backend failure produces an explicit degraded/error result rather than a successful empty result.
5. Partial failures cannot be mistaken for full success.
