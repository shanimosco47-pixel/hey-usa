# Email Scan Pipeline — Design Spec

**Date:** 2026-03-20
**Status:** Approved
**Scope:** Automated email scanning, document import, and Moti integration for Hey USA

---

## Overview

An automated pipeline that scans two Gmail accounts for travel-related booking emails, captures documents (PDF attachments or email screenshots), uploads them to Supabase Storage, auto-classifies and links them to app records (documents, budget, locations), and notifies the user via Moti chat.

## Goals

1. Automatically find and import booking confirmations from email
2. Eliminate manual document upload for known bookings
3. Let users ask Moti to find specific documents by description
4. Run on a schedule (every 6 hours) without requiring the app to be open
5. Avoid duplicating existing documents or conflicting with current data

## Architecture

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| `email-scan` Edge Function | Supabase Edge Function (Deno) | Core scanning, capture, classify, import logic |
| `email_accounts` table | Supabase DB | Stores Gmail OAuth tokens for 2 accounts |
| `source_email_id` column | DB migration | New field on `documents` table for dedup |
| `pg_cron` job | Supabase scheduled task | 6-hour automatic trigger |
| Scan button | React UI | Manual trigger on Documents page + Dashboard |
| Moti `SEARCH_EMAIL` action | botEngine extension | Targeted search via chat |
| Settings UI | React UI | Account management, scan history |
| OAuth flow | Google consent screen | Gmail authorization for both accounts |

### Data Flow

```
Trigger (button / cron / Moti command)
  → Edge Function (mode: 'full' | 'targeted')
    → Gmail API (2 accounts via stored OAuth refresh tokens)
      → Pattern match subjects/senders (fast filter)
      → AI classify uncertain emails (Claude via existing moti-chat proxy)
    → Dedup check against existing documents (source_email_id + booking refs)
    → For new matches:
      → Download PDF attachments OR render email HTML to PNG
      → Upload to Supabase Storage (documents bucket)
      → AI extract: title, category, location, amount, dates, notes
      → Insert document record in DB
      → Insert expense record if amount detected
      → Post Moti chat notification
    → Return summary to app
```

---

## Gmail OAuth & Multi-Account Setup

### Database Table

```sql
CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  last_scan_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Authorization Flow

1. User clicks "Connect Gmail" in app settings
2. App opens Google OAuth consent screen (redirect flow)
3. User approves Gmail read-only scope (`gmail.readonly`)
4. App receives auth code, sends to Edge Function
5. Edge Function exchanges code for refresh token, stores in `email_accounts`
6. For the second account: same flow, second person approves on their device

### Token Management

- Edge Function refreshes access tokens from stored refresh tokens on each scan
- Tracks `last_scan_at` to only process new emails since last scan
- If refresh token is revoked, marks account as disconnected and notifies user

---

## Smart Email Identification (Hybrid)

### First Pass — Pattern Matching (free, instant)

**Known senders:**
- `united.com`, `aircanada.com`, `delta.com`, `aa.com`
- `recreation.gov`, `xanterra.com`
- `booking.com`, `airbnb.com`, `hotels.com`
- `cruiseamerica.com`, `rvshare.com`
- `rentalcover.com`, `passportcard.co.il`, `harel-group.co.il`
- `tripit.com`

**Subject keywords:**
- English: `confirmation`, `itinerary`, `reservation`, `booking`, `receipt`, `e-ticket`, `rental agreement`
- Hebrew: `אישור`, `הזמנה`, `קבלה`, `כרטיס`

**Filters:**
- Date: only emails since `last_scan_at` (or last 6 months on first scan)
- Exclude: newsletters, marketing, social notifications

### Second Pass — AI Classification (uncertain emails only)

- Emails that partially match (known sender but unclear subject, or unknown sender with travel keywords)
- Send to Claude: subject + first 500 chars of body
- Prompt: "Is this email related to a USA family trip in Sep 2026? Categories: flight, accommodation, car_rental, national_park, insurance, visa, medical, attraction. Reply with category or 'irrelevant'."
- Cost: ~100 tokens per email, only for the uncertain batch (typically <20 emails per scan)

### Deduplication

Before importing, check against existing data:

1. **`source_email_id`** — Gmail message ID stored on previously imported documents. Exact match = skip.
2. **Booking reference extraction** — Regex extract references from email body (e.g., `HQ51BY`, `137724`, `#75307560`, `#0855014262`). Match against `notes` field of existing documents.
3. **Title similarity** — Fuzzy match against existing document titles to catch manual uploads of the same booking.

---

## Document Capture & Import

### Capture Strategy

Per matched email, in priority order:

1. **PDF/image attachments** — Download via Gmail API `messages.attachments.get`. Preferred format.
2. **HTML body rendering** — If no attachments, render email HTML as PNG screenshot using Deno's image rendering or an HTML-to-image API endpoint.
3. **Storage path** — `documents/{email-message-id}.{pdf|png}`

### Auto-Classification (one Claude call per document)

**Input:** email subject, body text (first 2000 chars), sender, attachment filenames

**Output structured JSON:**
```json
{
  "title": "כרטיסי טיסה TLV → YYZ → DEN",
  "category": "flights",
  "locationId": "denver",
  "amount": 8080.80,
  "currency": "USD",
  "expiry_date": null,
  "family_member_id": null,
  "notes": "United Airlines HQ51BY. 5 נוסעים. TLV 12:05→YYZ 16:55, YYZ 18:20→DEN 20:00, DEN 08:01→BZN 09:47."
}
```

Maps directly to existing `Document` type. If `amount` is present, also creates an `Expense` record.

### Database Changes

```sql
ALTER TABLE documents ADD COLUMN source_email_id TEXT;
CREATE INDEX idx_documents_source_email ON documents (source_email_id);
```

---

## Moti Notifications

After each scan (full or targeted), Moti posts a chat message:

**Full scan with results:**
> 🔍 סריקת אימייל הושלמה! מצאתי 3 מסמכים חדשים:
> ✈️ כרטיסי טיסה TLV→DEN — $8,080
> 🏕️ קמפינג Grant — $52
> 🚐 השכרת קרוואן — $5,202

**Full scan, nothing new:**
> No notification posted (silent).

**Targeted search found:**
> מצאתי! העליתי את אישור הקמפינג ב-Grant Campground. 📄

**Targeted search not found:**
> לא מצאתי מסמך שמתאים ל"קמפינג יילוסטון". אפשר לתאר יותר?

---

## Triggers

### Manual Button

- Location: Documents page header (next to "העלה מסמך") + Dashboard quick action
- Label: "🔍 סרוק אימייל"
- Shows spinner during scan, then results summary
- Calls Edge Function with `{ mode: 'full' }`

### Automatic (6-hour cron)

- Supabase `pg_cron` extension
- Schedule: `SELECT cron.schedule('email-scan', '0 */6 * * *', $$ SELECT net.http_post(...) $$)`
- Posts Moti notification only if new documents found
- Silent on empty scans

### Moti Targeted Search

- New action type in `botEngine.ts`: `SEARCH_EMAIL`
- User says: "תחפש את ההזמנה של הקמפינג ביילוסטון" or "find my Zion shuttle booking"
- Moti extracts search query, calls Edge Function with `{ mode: 'targeted', query: '...' }`
- Same capture/classify/import flow, scoped to specific search results

---

## UI — Settings & Account Management

Minimal UI on the Documents page (collapsible section):

**Connected Accounts card:**
- Shows each linked Gmail: status, email, label, last scan time
- "Connect Gmail" button for adding accounts
- Disconnect option per account

**Scan History card:**
- Last scan timestamp, number of documents found
- "סרוק עכשיו" quick trigger button
- Toggle for auto-scan on/off

---

## Conflict Prevention

The scanner is read-only with respect to existing data:

1. **Never overwrites** — Only inserts new documents, never updates existing ones
2. **Dedup before import** — Three-layer check (email ID, booking refs, title similarity)
3. **Sample data awareness** — Existing sample documents with `booking-*` IDs have booking references in their `notes` field. Scanner extracts refs from incoming emails and matches against these notes to avoid duplicates.
4. **Idempotent** — Running the same scan twice produces no new records
5. **Audit trail** — `source_email_id` tracks provenance of every imported document

---

## Dependencies & Costs

- **Google Cloud project** — Gmail API enabled, OAuth consent screen configured
- **Supabase pg_cron** — Available on free tier
- **Supabase pg_net** — For HTTP calls from cron (available on free tier)
- **Claude API tokens** — ~100 tokens per uncertain email classification, ~500 tokens per document auto-classification. Estimated cost per full scan: <$0.05
- **Supabase Storage** — Documents bucket (already created, public, 50MB limit)

---

## Out of Scope (Future)

- Google Drive scanning
- Following links in emails to capture external booking pages
- Automatic OCR of scanned PDF receipts
- Multi-language email parsing beyond English/Hebrew
- Push notifications (mobile) for scan results
