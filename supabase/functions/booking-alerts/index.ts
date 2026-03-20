// index.ts — Booking Alert Checker Edge Function
// Runs daily via pg_cron. Checks for upcoming booking windows and sends
// notifications via Moti chat + email to all approved Gmail accounts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBookingAlertEmail } from "./email.ts";

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info",
};

function corsResponse(body: BodyInit | null, init: ResponseInit = {}): Response {
  return new Response(body, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...(init.headers ?? {}),
    },
  });
}

// ---------------------------------------------------------------------------
// Moti message helper (same pattern as email-scan/importer.ts)
// ---------------------------------------------------------------------------

async function postMotiMessage(
  supabase: ReturnType<typeof createClient>,
  text: string,
): Promise<void> {
  const messageId = `moti-booking-${Date.now()}`;
  await supabase.from("chat_messages").insert({
    id: messageId,
    role: "assistant",
    content: text,
    has_action: false,
    created_at: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Hebrew date formatter
// ---------------------------------------------------------------------------

function formatDateHebrew(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
  });
}

// ---------------------------------------------------------------------------
// Build notification content
// ---------------------------------------------------------------------------

interface AlertOption {
  id: string;
  name: string;
  night_location: string;
  check_in_date: string;
  platform_url: string | null;
  booking_opens_at: string;
}

function buildMotiText(option: AlertOption): string {
  const dateText = formatDateHebrew(option.check_in_date);
  const link = option.platform_url ? `\n🔗 ${option.platform_url}` : "";
  return [
    `🏕️ תזכורת הזמנת קמפינג!`,
    ``,
    `מחר נפתחת הזמנה עבור:`,
    `⛺ ${option.name} — ${option.night_location}`,
    `📅 ללילה של ${dateText}`,
    link,
    ``,
    `כדאי להיות מוכנים בדיוק בזמן הפתיחה! ⏰`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

function buildEmailHtml(option: AlertOption): string {
  const dateText = formatDateHebrew(option.check_in_date);
  const linkBtn = option.platform_url
    ? `<p><a href="${option.platform_url}" style="display:inline-block;background:#007AFF;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">פתח הזמנה</a></p>`
    : "";
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:20px;max-width:500px;margin:0 auto;">
  <h2 style="color:#333;">🏕️ תזכורת הזמנת קמפינג!</h2>
  <p style="font-size:16px;color:#555;">מחר נפתחת הזמנה עבור:</p>
  <div style="background:#f8f9fa;border-radius:12px;padding:16px;margin:16px 0;">
    <p style="margin:4px 0;font-size:15px;">⛺ <strong>${option.name}</strong> — ${option.night_location}</p>
    <p style="margin:4px 0;font-size:15px;">📅 ללילה של ${dateText}</p>
  </div>
  ${linkBtn}
  <p style="color:#888;font-size:13px;">כדאי להיות מוכנים בדיוק בזמן הפתיחה! ⏰</p>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
  <p style="color:#aaa;font-size:11px;">הודעה אוטומטית מ-Hey USA 🇺🇸</p>
</body>
</html>`.trim();
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return corsResponse(null, { status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID") || "";
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // ── 1. Find options with booking windows opening in next 48 hours ──

    const { data: upcomingOptions, error: fetchError } = await supabase
      .from("campsite_options")
      .select("id, name, night_id, platform_url, booking_opens_at")
      .eq("alert_sent", false)
      .eq("booking_status", "not_yet_open")
      .lte("booking_opens_at", in48h.toISOString())
      .gt("booking_opens_at", now.toISOString());

    if (fetchError) {
      console.error("[booking-alerts] Fetch error:", fetchError.message);
      return corsResponse(JSON.stringify({ error: fetchError.message }), {
        status: 500,
      });
    }

    const alertsSent: string[] = [];

    if (upcomingOptions && upcomingOptions.length > 0) {
      // Get night info for each option
      const nightIds = [...new Set(upcomingOptions.map((o) => o.night_id))];
      const { data: nights } = await supabase
        .from("campsite_nights")
        .select("id, location_name, check_in_date")
        .in("id", nightIds);

      const nightMap = new Map(
        (nights || []).map((n) => [n.id, n]),
      );

      // Get all approved email accounts for sending reminders
      const { data: emailAccounts } = await supabase
        .from("email_accounts")
        .select("id, email, refresh_token")
        .eq("is_approved", true);

      for (const opt of upcomingOptions) {
        const night = nightMap.get(opt.night_id);
        if (!night) continue;

        const alertOption: AlertOption = {
          id: opt.id,
          name: opt.name,
          night_location: night.location_name,
          check_in_date: night.check_in_date,
          platform_url: opt.platform_url,
          booking_opens_at: opt.booking_opens_at,
        };

        // Send Moti chat notification
        const motiText = buildMotiText(alertOption);
        await postMotiMessage(supabase, motiText);

        // Send email to all approved accounts
        const emailSubject = `🏕️ מחר נפתחת הזמנת קמפינג — ${opt.name}`;
        const emailHtml = buildEmailHtml(alertOption);

        if (emailAccounts && emailAccounts.length > 0 && googleClientId && googleClientSecret) {
          for (const account of emailAccounts) {
            try {
              await sendBookingAlertEmail(
                account.refresh_token,
                googleClientId,
                googleClientSecret,
                account.email,
                emailSubject,
                emailHtml,
              );
              console.log(
                `[booking-alerts] Email sent to ${account.email} for ${opt.name}`,
              );
            } catch (emailErr) {
              console.error(
                `[booking-alerts] Failed to send email to ${account.email}:`,
                emailErr instanceof Error ? emailErr.message : emailErr,
              );
            }
          }
        }

        // Mark alert as sent
        await supabase
          .from("campsite_options")
          .update({ alert_sent: true })
          .eq("id", opt.id);

        alertsSent.push(opt.name);
      }
    }

    // ── 2. Update options where booking window has passed ──

    const { data: passedOptions } = await supabase
      .from("campsite_options")
      .select("id")
      .eq("booking_status", "not_yet_open")
      .lte("booking_opens_at", now.toISOString());

    let statusUpdated = 0;
    if (passedOptions && passedOptions.length > 0) {
      const ids = passedOptions.map((o) => o.id);
      await supabase
        .from("campsite_options")
        .update({ booking_status: "open", updated_at: now.toISOString() })
        .in("id", ids);
      statusUpdated = ids.length;
    }

    return corsResponse(
      JSON.stringify({
        alertsSent,
        statusUpdated,
        message: `Sent ${alertsSent.length} alerts, updated ${statusUpdated} statuses`,
      }),
    );
  } catch (err) {
    console.error("[booking-alerts] Error:", err);
    return corsResponse(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500 },
    );
  }
});
