// classifier.ts — AI-powered email classifier using Anthropic API

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClassifyResult {
  category: string | null;
}

export interface DocumentMeta {
  title: string;
  category: string;
  locationId: string | null;
  amount: number | null;
  currency: string | null;
  expiry_date: string | null;
  family_member_id: string | null;
  notes: string;
}

const VALID_LOCATION_IDS = [
  "denver",
  "bozeman",
  "yellowstone",
  "grand-teton",
  "jackson",
  "bryce-canyon",
  "zion",
  "las-vegas",
  "mammoth-lakes",
  "yosemite",
  "san-francisco",
];

// ---------------------------------------------------------------------------
// Anthropic API helper
// ---------------------------------------------------------------------------

async function callClaude(
  apiKey: string,
  prompt: string,
  maxTokens = 512,
): Promise<string> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${err}`);
  }

  const json = await res.json();
  const content = json.content?.[0];
  if (!content || content.type !== "text") {
    throw new Error("Unexpected Anthropic response shape");
  }
  return content.text as string;
}

// ---------------------------------------------------------------------------
// JSON extraction helper
// ---------------------------------------------------------------------------

function extractJson(text: string): Record<string, unknown> {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Extract first {...} block
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
  }
  return {};
}

// ---------------------------------------------------------------------------
// classifyEmail
// ---------------------------------------------------------------------------

export async function classifyEmail(
  apiKey: string,
  subject: string,
  bodySnippet: string,
): Promise<ClassifyResult> {
  const prompt = `You are a travel document classifier. Determine whether the following email is related to a travel booking or trip document (flight, hotel, car rental, RV rental, campsite, travel insurance, attraction ticket, etc.).

Subject: ${subject}
Body snippet: ${bodySnippet.slice(0, 800)}

If the email IS travel-related, respond with a JSON object like:
{"category": "flight_booking"}

Valid categories: flight_booking, hotel_booking, car_rental, rv_rental, campsite_reservation, travel_insurance, attraction_ticket, itinerary, receipt, other_travel

If the email is NOT travel-related (newsletter, marketing, unrelated), respond with:
{"category": null}

Respond ONLY with the JSON object, no other text.`;

  try {
    const raw = await callClaude(apiKey, prompt, 128);
    const parsed = extractJson(raw);
    const category = parsed.category as string | null | undefined;

    if (category === undefined || category === null) {
      return { category: null };
    }
    return { category: String(category) };
  } catch (err) {
    console.error("[classifier] classifyEmail error:", err);
    return { category: null };
  }
}

// ---------------------------------------------------------------------------
// extractDocumentMeta
// ---------------------------------------------------------------------------

export async function extractDocumentMeta(
  apiKey: string,
  subject: string,
  bodyText: string,
  sender: string,
  attachmentNames: string[],
): Promise<DocumentMeta> {
  const validLocations = VALID_LOCATION_IDS.join(", ");
  const attachmentsStr =
    attachmentNames.length > 0 ? attachmentNames.join(", ") : "none";

  const prompt = `You are a travel document metadata extractor. Extract structured metadata from the following email.

From: ${sender}
Subject: ${subject}
Attachments: ${attachmentsStr}
Body:
${bodyText.slice(0, 2000)}

Return a JSON object with these fields:
- title: string (concise document title, e.g. "United Airlines Confirmation #ABC123")
- category: string (one of: flight_booking, hotel_booking, car_rental, rv_rental, campsite_reservation, travel_insurance, attraction_ticket, itinerary, receipt, other_travel)
- locationId: string or null (one of the valid IDs below, or null if unknown/multiple)
- amount: number or null (total cost as numeric value, e.g. 245.50)
- currency: string or null (3-letter ISO code, e.g. "USD", "ILS")
- expiry_date: string or null (ISO date YYYY-MM-DD, for tickets/insurance expiry or check-out date)
- family_member_id: string or null (name/identifier if clearly for a specific person)
- notes: string (booking references, important details, 1-3 sentences max)

Valid locationIds: ${validLocations}

Respond ONLY with the JSON object, no other text.`;

  const defaults: DocumentMeta = {
    title: subject.trim() || "Travel Document",
    category: "other_travel",
    locationId: null,
    amount: null,
    currency: null,
    expiry_date: null,
    family_member_id: null,
    notes: "",
  };

  try {
    const raw = await callClaude(apiKey, prompt, 512);
    const parsed = extractJson(raw);

    const locationId =
      typeof parsed.locationId === "string" &&
      VALID_LOCATION_IDS.includes(parsed.locationId)
        ? parsed.locationId
        : null;

    const amount =
      typeof parsed.amount === "number"
        ? parsed.amount
        : parsed.amount !== null && parsed.amount !== undefined
        ? parseFloat(String(parsed.amount)) || null
        : null;

    return {
      title:
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim()
          : defaults.title,
      category:
        typeof parsed.category === "string" && parsed.category.trim()
          ? parsed.category.trim()
          : defaults.category,
      locationId,
      amount,
      currency:
        typeof parsed.currency === "string" && parsed.currency.trim()
          ? parsed.currency.trim().toUpperCase()
          : null,
      expiry_date:
        typeof parsed.expiry_date === "string" && parsed.expiry_date.trim()
          ? parsed.expiry_date.trim()
          : null,
      family_member_id:
        typeof parsed.family_member_id === "string" &&
        parsed.family_member_id.trim()
          ? parsed.family_member_id.trim()
          : null,
      notes:
        typeof parsed.notes === "string" ? parsed.notes.trim() : defaults.notes,
    };
  } catch (err) {
    console.error("[classifier] extractDocumentMeta error:", err);
    return defaults;
  }
}
