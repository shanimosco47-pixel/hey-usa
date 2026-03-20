// email.ts — Send booking alert emails via Gmail API
// Requires gmail.send scope on the connected email accounts

import { refreshAccessToken } from "../email-scan/gmail.ts";

/**
 * Encode a UTF-8 string as base64url (RFC 4648 §5), suitable for Gmail API.
 */
function base64url(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Build a MIME message with UTF-8 subject + HTML body.
 */
function buildMimeMessage(to: string, subject: string, htmlBody: string): string {
  const boundary = `boundary_${Date.now()}`;
  return [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${base64url(subject)}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    base64url(htmlBody.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim()),
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    base64url(htmlBody),
    ``,
    `--${boundary}--`,
  ].join("\r\n");
}

/**
 * Send an email via Gmail API using a refresh token.
 */
export async function sendBookingAlertEmail(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  toEmail: string,
  subject: string,
  htmlBody: string,
): Promise<void> {
  const accessToken = await refreshAccessToken(refreshToken, clientId, clientSecret);

  const raw = base64url(buildMimeMessage(toEmail, subject, htmlBody));

  const res = await fetch(
    "https://www.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail send failed (${res.status}): ${err}`);
  }
}
