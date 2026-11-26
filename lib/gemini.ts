import { computeDailyDigest, type DailyDigest } from "@/lib/insights";

async function callGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    // Google retires Gemini model IDs on their own schedule — this one
    // has already been swapped once (from gemini-2.5-flash-lite, which
    // started 404ing for this project with "no longer available to new
    // users"). If this starts 404ing again, check
    // ai.google.dev/gemini-api/docs/models for the current lite-tier
    // model name and swap it in here — nothing else in this file needs
    // to change.
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch (err) {
    console.error("Failed to call Gemini API:", err);
    return null;
  }
}

// Second free-tier provider (console.groq.com, no card required) — an
// OpenAI-compatible endpoint, so this is a plain chat-completions call.
// llama-3.1-8b-instant specifically because it's the most generous model
// on Groq's free tier (highest daily request cap) — this is only ever a
// fallback for occasional Telegram messages, so headroom matters more
// than raw model quality.
async function callGroq(prompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error("Groq API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch (err) {
    console.error("Failed to call Groq API:", err);
    return null;
  }
}

/** Tries Gemini first, then Groq if that didn't produce anything — a
 * missing key, an outage, a rate limit, or a retired model name (this
 * has already happened once with Gemini) are all treated the same way:
 * move on to the other provider rather than failing outright. Returns
 * null only if neither is configured or both calls failed, in which case
 * callers fall back to their own plain-text version. */
export async function callAI(prompt: string): Promise<string | null> {
  return (await callGemini(prompt)) ?? (await callGroq(prompt));
}

// Optional layer: rephrases the already-computed digest numbers into a
// short natural-language summary. Never asked to calculate anything
// itself — every number it sees is handed to it, so it can't invent one.
//
// Uses free tiers (no card required as of when this was written — verify
// current limits at ai.google.dev / console.groq.com, both have changed
// free-tier terms before). Set GEMINI_API_KEY and/or GROQ_API_KEY to
// enable this; without either, the digest just sends the plain-text
// version from lib/insights.ts.
export async function narrateDigest(digest: DailyDigest): Promise<string | null> {
  const prompt = `You write a short, casual daily business summary for the owner of a small furniture store, to be sent over Telegram. Use plain text with simple emoji, no markdown headers. Keep it under 120 words. Only use the numbers given below, never estimate or invent a number that isn't here.

Data:
${JSON.stringify(digest, null, 2)}
`;

  return callAI(prompt);
}

// Free-form chat for the Telegram bot — anything the owner asks that isn't
// one of the fixed /commands falls through to here. Grounded in the same
// real digest data narrateDigest uses, so it can answer "how's revenue
// this week" conversationally without ever inventing a number that isn't
// actually in the store's data.
export async function chatReply(userMessage: string): Promise<string | null> {
  const digest = await computeDailyDigest();

  const prompt = `You are a helpful assistant for the owner of EcoFurnish, a small sustainable-furniture store, chatting over Telegram. Answer their message conversationally and briefly, a few sentences, plain text, no markdown headers. You only know what's in the store data below; if answering needs a number that isn't there, say plainly that you don't have that figure rather than guessing.

Store data:
${JSON.stringify(digest, null, 2)}

Owner's message: "${userMessage}"`;

  return callAI(prompt);
}
