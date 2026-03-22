// capture.ts — Document capture module for the email scan pipeline

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  GmailMessage,
  getAttachments,
  getAttachment,
  getBodyHtml,
} from "./gmail.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CapturedFile {
  fileName: string;
  contentType: string;
  data: Uint8Array;
}

export type SupabaseClient = ReturnType<typeof createClient>;

// ---------------------------------------------------------------------------
// Base64url decode to Uint8Array
// ---------------------------------------------------------------------------

function decodeBase64UrlToBytes(data: string): Uint8Array {
  // Convert base64url to standard base64
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  // Pad if necessary
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// captureDocument
// ---------------------------------------------------------------------------

/**
 * Captures the best available document representation from a Gmail message.
 *
 * Priority order:
 * 1. PDF or image attachments — downloaded and decoded from base64url
 * 2. HTML body — wrapped in a minimal HTML document and UTF-8 encoded
 * 3. Nothing found → returns null
 */
export async function captureDocument(
  accessToken: string,
  messageId: string,
  message: GmailMessage,
): Promise<CapturedFile | null> {
  // ------------------------------------------------------------------
  // Step 1: Look for PDF or image attachments
  // ------------------------------------------------------------------
  const attachments = getAttachments(message);
  const docAttachments = attachments.filter((a) => {
    const mt = a.mimeType.toLowerCase();
    return (
      mt === "application/pdf" ||
      mt.startsWith("image/")
    );
  });

  if (docAttachments.length > 0) {
    const att = docAttachments[0];
    try {
      const rawData = await getAttachment(accessToken, messageId, att.attachmentId);
      const data = decodeBase64UrlToBytes(rawData);
      return {
        fileName: att.filename,
        contentType: att.mimeType,
        data,
      };
    } catch (err) {
      console.error("[capture] Failed to download attachment:", err);
      // Fall through to HTML body capture
    }
  }

  // ------------------------------------------------------------------
  // Step 2: Fall back to HTML body
  // ------------------------------------------------------------------
  const html = getBodyHtml(message);
  if (html) {
    const wrapped = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
${html}
</body>
</html>`;
    const data = new TextEncoder().encode(wrapped);
    // Use messageId to create a stable filename
    const fileName = `email-${messageId}.html`;
    return {
      fileName,
      contentType: "text/html",
      data,
    };
  }

  // ------------------------------------------------------------------
  // Step 3: Nothing to capture
  // ------------------------------------------------------------------
  return null;
}

// ---------------------------------------------------------------------------
// uploadToStorage
// ---------------------------------------------------------------------------

/**
 * Uploads file.data to the Supabase "documents" storage bucket.
 * Returns the public URL, or null on failure.
 */
export async function uploadToStorage(
  supabase: SupabaseClient,
  file: CapturedFile,
): Promise<string | null> {
  const { error } = await supabase.storage
    .from("documents")
    .upload(file.fileName, file.data, {
      contentType: file.contentType,
      upsert: false,
    });

  if (error) {
    // Treat "already exists" as non-fatal — just get the public URL
    if (
      error.message.toLowerCase().includes("already exists") ||
      error.message.toLowerCase().includes("duplicate") ||
      (error as { statusCode?: string }).statusCode === "23505"
    ) {
      console.warn("[capture] File already exists, returning existing URL:", file.fileName);
    } else {
      console.error("[capture] Storage upload error:", error.message);
      return null;
    }
  }

  // Get public URL (works regardless of whether upload was new or existing)
  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(file.fileName);

  return urlData?.publicUrl ?? null;
}
