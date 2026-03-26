// capture.ts — Document capture module for the email scan pipeline

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  GmailMessage,
  getAttachments,
  getAttachment,
  getBodyHtml,
  getBodyText,
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
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 20px auto; padding: 0 20px; color: #333; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }
    td, th { padding: 6px 10px; border: 1px solid #ddd; }
    a { color: #0066cc; }
    .gmail_quote { border-left: 3px solid #ccc; padding-left: 12px; margin: 12px 0; }
    .gmail_attr { color: #666; font-size: 0.9em; margin-bottom: 8px; }
    pre { white-space: pre-wrap; font-family: inherit; }
    blockquote { border-left: 3px solid #ccc; padding-left: 12px; margin: 12px 0; color: #555; }
  </style>
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
  // Step 3: Fall back to plain-text body wrapped in HTML
  // ------------------------------------------------------------------
  const plainText = getBodyText(message);
  if (plainText && plainText.trim().length > 0) {
    const escaped = plainText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const wrapped = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
<pre style="white-space:pre-wrap;font-family:sans-serif">${escaped}</pre>
</body>
</html>`;
    const data = new TextEncoder().encode(wrapped);
    const fileName = `email-${messageId}.html`;
    return {
      fileName,
      contentType: "text/html",
      data,
    };
  }

  // ------------------------------------------------------------------
  // Step 4: Nothing to capture
  // ------------------------------------------------------------------
  return null;
}

// ---------------------------------------------------------------------------
// parseEml — extract subject, from, body text, and HTML from a .eml file
// ---------------------------------------------------------------------------

export interface ParsedEml {
  subject: string;
  from: string;
  bodyText: string;
  bodyHtml: string | null;
  /** The original .eml filename from the parent message */
  emlFilename: string;
}

/**
 * Lightweight .eml parser for Deno. Handles base64 and quoted-printable
 * content-transfer-encoding. Returns the first text/html part found
 * (or falls back to text/plain wrapped in <pre>).
 */
function parseEmlContent(raw: string, emlFilename: string): ParsedEml {
  // Split headers and body at the first blank line
  const headerEnd = raw.indexOf("\r\n\r\n");
  const headerBlock = headerEnd > 0 ? raw.slice(0, headerEnd) : raw;
  const bodyRaw = headerEnd > 0 ? raw.slice(headerEnd + 4) : "";

  // Parse headers (unfold continuation lines)
  const unfolded = headerBlock.replace(/\r\n[ \t]+/g, " ");
  const headerLines = unfolded.split("\r\n");
  const headers: Record<string, string> = {};
  for (const line of headerLines) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim().toLowerCase();
      headers[key] = line.slice(idx + 1).trim();
    }
  }

  const subject = decodeRfc2047(headers["subject"] ?? emlFilename);
  const from = headers["from"] ?? "";
  const contentType = (headers["content-type"] ?? "text/plain").toLowerCase();
  const encoding = (headers["content-transfer-encoding"] ?? "").toLowerCase();

  // If multipart, extract parts
  const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/);
  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = splitMimeParts(bodyRaw, boundary);

    // Look for text/html first, then text/plain
    let htmlBody: string | null = null;
    let textBody = "";

    for (const part of parts) {
      const partHeaderEnd = part.indexOf("\r\n\r\n");
      if (partHeaderEnd < 0) continue;
      const partHeaders = part.slice(0, partHeaderEnd).toLowerCase();
      const partBody = part.slice(partHeaderEnd + 4);
      const partEncoding = extractHeaderValue(partHeaders, "content-transfer-encoding");

      // Handle nested multipart
      const nestedBoundary = partHeaders.match(/boundary="?([^";\s]+)"?/);
      if (nestedBoundary) {
        const nestedParts = splitMimeParts(partBody, nestedBoundary[1]);
        for (const np of nestedParts) {
          const npEnd = np.indexOf("\r\n\r\n");
          if (npEnd < 0) continue;
          const npHeaders = np.slice(0, npEnd).toLowerCase();
          const npBody = np.slice(npEnd + 4);
          const npEncoding = extractHeaderValue(npHeaders, "content-transfer-encoding");
          if (npHeaders.includes("text/html") && !htmlBody) {
            htmlBody = decodeBody(npBody, npEncoding);
          } else if (npHeaders.includes("text/plain") && !textBody) {
            textBody = decodeBody(npBody, npEncoding);
          }
        }
        continue;
      }

      if (partHeaders.includes("text/html") && !htmlBody) {
        htmlBody = decodeBody(partBody, partEncoding);
      } else if (partHeaders.includes("text/plain") && !textBody) {
        textBody = decodeBody(partBody, partEncoding);
      }
    }

    return { subject, from, bodyText: textBody || stripHtmlSimple(htmlBody ?? ""), bodyHtml: htmlBody, emlFilename };
  }

  // Single-part message
  const decoded = decodeBody(bodyRaw, encoding);
  if (contentType.includes("text/html")) {
    return { subject, from, bodyText: stripHtmlSimple(decoded), bodyHtml: decoded, emlFilename };
  }
  return { subject, from, bodyText: decoded, bodyHtml: null, emlFilename };
}

function splitMimeParts(body: string, boundary: string): string[] {
  const delim = "--" + boundary;
  const parts = body.split(delim);
  // Skip preamble (first) and epilogue (last, after --boundary--)
  return parts.slice(1).filter((p) => !p.startsWith("--")).map((p) => p.replace(/^\r\n/, ""));
}

function extractHeaderValue(headerBlock: string, name: string): string {
  const re = new RegExp(`${name}:\\s*(.+)`, "i");
  const m = headerBlock.match(re);
  return m ? m[1].trim() : "";
}

function decodeBody(body: string, encoding: string): string {
  if (encoding.includes("base64")) {
    try {
      return atob(body.replace(/\s/g, ""));
    } catch {
      return body;
    }
  }
  if (encoding.includes("quoted-printable")) {
    return body
      .replace(/=\r?\n/g, "")
      .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  return body;
}

function decodeRfc2047(value: string): string {
  // Decode =?charset?encoding?text?= sequences
  return value.replace(/=\?([^?]+)\?([BbQq])\?([^?]+)\?=/g, (_, _charset, enc, text) => {
    if (enc.toUpperCase() === "B") {
      try { return atob(text); } catch { return text; }
    }
    // Q encoding
    return text.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (_2: string, hex: string) =>
      String.fromCharCode(parseInt(hex, 16))
    );
  });
}

function stripHtmlSimple(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// extractEmlDocuments — process .eml attachments from a parent message
// ---------------------------------------------------------------------------

export interface EmlDocument {
  /** Captured file ready for storage upload */
  file: CapturedFile;
  /** Parsed metadata from inside the .eml */
  parsed: ParsedEml;
}

/**
 * Downloads and parses all .eml attachments from a Gmail message.
 * Returns one EmlDocument per .eml that has extractable content.
 */
export async function extractEmlDocuments(
  accessToken: string,
  messageId: string,
  message: GmailMessage,
): Promise<EmlDocument[]> {
  const attachments = getAttachments(message);
  const emlAttachments = attachments.filter(
    (a) => a.mimeType === "message/rfc822" || a.filename.toLowerCase().endsWith(".eml"),
  );

  if (emlAttachments.length === 0) return [];

  const results: EmlDocument[] = [];

  for (const att of emlAttachments) {
    try {
      const rawData = await getAttachment(accessToken, messageId, att.attachmentId);
      const decoded = decodeBase64UrlToString(rawData);
      const parsed = parseEmlContent(decoded, att.filename);

      // Build HTML file from the eml content
      const html = parsed.bodyHtml
        ? `<!DOCTYPE html>\n<html><head><meta charset="utf-8"/></head><body>\n${parsed.bodyHtml}\n</body></html>`
        : parsed.bodyText.trim()
          ? `<!DOCTYPE html>\n<html><head><meta charset="utf-8"/></head><body>\n<pre style="white-space:pre-wrap;font-family:sans-serif">${parsed.bodyText.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>\n</body></html>`
          : null;

      if (!html) {
        console.warn(`[capture] Empty .eml: ${att.filename}`);
        continue;
      }

      const data = new TextEncoder().encode(html);
      const safeFilename = `eml-${messageId}-${results.length}.html`;

      results.push({
        file: { fileName: safeFilename, contentType: "text/html", data },
        parsed,
      });
    } catch (err) {
      console.error(`[capture] Failed to parse .eml attachment ${att.filename}:`, err);
    }
  }

  return results;
}

function decodeBase64UrlToString(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
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
  overwrite = false,
): Promise<string | null> {
  const { error } = await supabase.storage
    .from("documents")
    .upload(file.fileName, file.data, {
      contentType: file.contentType,
      upsert: overwrite,
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
