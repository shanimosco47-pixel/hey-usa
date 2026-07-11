# Documents Module Instructions

These instructions extend the repository root `AGENTS.md` for all code under `src/modules/documents`.

## Review guidelines

Treat document handling as a sensitive data workflow.

- A delete confirmation must be scoped to the exact current document ID and reset when the document, dialog-open state, route, or selection changes.
- Clear timers and asynchronous callbacks on close, selection change, and unmount. A stale callback must never delete or mutate a newly selected document.
- Do not save a document as file-backed unless the upload completed and produced a valid durable URL.
- Metadata-only documents must be visually and logically distinct from failed uploads.
- Validate that file URLs are absolute trusted URLs or explicitly supported data URLs. Placeholder and relative paths are not real uploaded files.
- HTML and MHT previews must not execute untrusted active content. Require sanitization or sandboxing appropriate to the rendering path.
- Preview, open, download, and delete actions must all target the same current document.
- Errors must be visible and actionable. Do not swallow failures from storage, database persistence, preview creation, download, or deletion.
- UI state should update only after durable success, or use a reversible optimistic update with rollback on failure.
- Verify document-to-booking relationships in both directions when the data model supports both, but do not create conflicting sources of truth.
- Never match unrelated documents because optional fields are simultaneously missing.

## Tests expected

Add focused tests when changing:

- Delete confirmation and document switching.
- Upload failure and metadata-only save behavior.
- Placeholder/relative URL handling.
- Booking/document relationship matching.
- Dialog close/reopen and timer cleanup.
- Rendering behavior for PDF, image, HTML/MHT, unsupported, and fileless documents.

For destructive flows, test the negative case: the wrong document must not be deleted.
