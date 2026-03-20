// dedup.ts — Deduplication checks for the email scan pipeline

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractBookingRefs } from "./patterns.ts";

// Re-export the SupabaseClient type alias used by callers
export type SupabaseClient = ReturnType<typeof createClient>;

// ---------------------------------------------------------------------------
// isAlreadyImported
// ---------------------------------------------------------------------------

/**
 * Returns true if the email has already been imported into the documents table.
 * Three checks are performed in order:
 *   1. Exact match on source_email_id column
 *   2. Booking reference overlap in the notes column
 *   3. Subject title similarity (cleaned, case-insensitive ilike)
 */
export async function isAlreadyImported(
  supabase: SupabaseClient,
  emailMessageId: string,
  emailBodyText: string,
  emailSubject: string,
): Promise<boolean> {
  // ------------------------------------------------------------------
  // Check 1: source_email_id exact match
  // ------------------------------------------------------------------
  const { data: byId, error: idError } = await supabase
    .from("documents")
    .select("id")
    .eq("source_email_id", emailMessageId)
    .limit(1);

  if (idError) {
    console.error("[dedup] source_email_id check error:", idError.message);
  } else if (byId && byId.length > 0) {
    return true;
  }

  // ------------------------------------------------------------------
  // Check 2: booking reference overlap in notes
  // ------------------------------------------------------------------
  const refs = extractBookingRefs(emailBodyText);

  if (refs.length > 0) {
    for (const ref of refs) {
      const { data: byRef, error: refError } = await supabase
        .from("documents")
        .select("id")
        .ilike("notes", `%${ref}%`)
        .limit(1);

      if (refError) {
        console.error("[dedup] booking ref check error:", refError.message);
        continue;
      }

      if (byRef && byRef.length > 0) {
        return true;
      }
    }
  }

  // ------------------------------------------------------------------
  // Check 3: cleaned subject title similarity
  // ------------------------------------------------------------------
  const cleanedSubject = emailSubject
    .replace(/^(re|fwd?|fw)\s*:\s*/gi, "")
    .trim();

  if (cleanedSubject.length > 0) {
    const { data: byTitle, error: titleError } = await supabase
      .from("documents")
      .select("id")
      .ilike("title", `%${cleanedSubject}%`)
      .limit(1);

    if (titleError) {
      console.error("[dedup] title check error:", titleError.message);
    } else if (byTitle && byTitle.length > 0) {
      return true;
    }
  }

  return false;
}
