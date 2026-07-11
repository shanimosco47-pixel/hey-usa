# Hey-USA Agent Instructions

These instructions apply to the entire repository. More specific `AGENTS.md` files override or extend them for their folders.

## Project context

Hey-USA is a Hebrew, mobile-first travel application built with React, TypeScript, Vite, Supabase, and Dexie. User data includes bookings, trip plans, documents, uploaded files, confirmations, and locally cached/offline state. Treat apparent data loss, incorrect associations, silent failures, and accidental destructive actions as high-severity defects.

## Review guidelines

Prioritize correctness and user-data safety over style. Report concrete defects introduced by the pull request, especially:

1. **Data loss or false data loss**
   - Writes that can be dropped, partially saved, or silently fail.
   - Backend failures that cause seed/sample data or empty state to appear as real user state.
   - Pull/sync logic that overwrites newer local or remote records.
   - Upload metadata being saved when the selected file itself failed to upload.

2. **Supabase and Dexie synchronization**
   - Missing fields in either sync direction.
   - `snake_case` ↔ `camelCase` mapping drift.
   - Queued offline mutations that cannot be replayed correctly.
   - Incorrect conflict, retry, ordering, or fallback behavior.
   - Error handling that turns an unavailable backend into a successful-looking state.

3. **Relationship integrity**
   - Documents attached to the wrong booking, campsite, date, location, or category.
   - Matching based on broad fallbacks when a stable ID exists.
   - One-sided links where `document.booking_id` and `booking.document_id` become inconsistent.
   - `undefined === undefined`, missing-date, or missing-location matches that unintentionally associate unrelated records.

4. **Destructive actions**
   - Deletion, replacement, or bulk updates without confirmation tied to the currently displayed record.
   - Stale confirmation state, stale closures, timers, or component reuse that can act on a different item.
   - UI success before the destructive operation is durably completed.
   - Failure paths that leave the UI and database inconsistent.

5. **Files and document security**
   - Broken, relative, placeholder, expired, or untrusted file URLs treated as real files.
   - Unsafe HTML/MHT rendering, missing sanitization, unsafe iframe behavior, or script execution.
   - Exposure of private travel documents, Supabase keys, tokens, or personal data.
   - File type, size, content, upload, preview, and download behavior that differs from what the UI claims.

6. **React state and asynchronous behavior**
   - State leaking between dialogs, documents, bookings, or routes.
   - Effects with missing dependencies, uncleaned timers/listeners, or race conditions.
   - Updates after unmount, double submission, stale request results, or out-of-order responses.
   - Optimistic UI that does not roll back or clearly surface failure.

7. **Offline and degraded operation**
   - Offline mode must never masquerade as a successful server sync.
   - Cached data must not be discarded merely because another table is empty.
   - Seed/demo data must never overwrite, hide, or be confused with real user data.
   - Users must receive a visible, accurate degraded-state indication when data may be stale.

8. **Hebrew, RTL, mobile, and accessibility**
   - Verify changed flows remain usable in RTL and on narrow mobile screens.
   - Flag clipped controls, reversed navigation meaning, inaccessible dialogs, missing labels, or keyboard traps when introduced by the PR.
   - Do not report cosmetic preferences unless they impair use or conceal state.

9. **Claims versus evidence**
   - Compare the PR description with the actual diff.
   - Flag claims of successful persistence, safety, migration, cleanup, or verification that are not supported by code or tests.
   - A direct production database change is not validated by a code-only test and must be described separately.

## Severity guidance

Treat the following as at least P1/P2 depending on impact and reach:

- Possible deletion of the wrong user record or file.
- Silent loss of an upload, booking, confirmation, or document link.
- Real data being hidden and replaced by sample/empty data.
- Cross-booking or cross-document association.
- Private document exposure or unsafe rendering.
- A failure path that reports success or healthy state.

Do not dilute review quality with minor naming, formatting, or refactoring suggestions unless they directly create a correctness or maintenance hazard.

## Required verification for implementation agents

Before declaring a change complete, run the relevant commands:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

For focused changes, add or update Vitest coverage for the failure path, not only the happy path. When browser behavior matters, state what was manually verified and what was not.

## Change constraints

- Do not invent, rotate, or commit secrets or production credentials.
- Do not perform production Supabase data cleanup as an undocumented side effect of a code change.
- Do not weaken validation or error visibility merely to keep the UI flowing.
- Preserve stable IDs and explicit relationships over heuristic matching.
- Prefer fail-visible behavior to silent fallback when user data may be incomplete or stale.
- Keep fixes scoped; do not mix unrelated product changes into a defect-repair PR.

## Pull request expectations

Every PR should state:

- The user-visible problem and root cause.
- Exact files and behavior changed.
- Data migration or production-data actions, if any, separated from code changes.
- Tests and commands actually run.
- Remaining risks and unverified environment assumptions.
- Whether the change affects persistence, deletion, authentication, storage, synchronization, or offline behavior.
