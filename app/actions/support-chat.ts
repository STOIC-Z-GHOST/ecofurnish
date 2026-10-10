"use server";

import { getSupportFacts } from "@/lib/support";
import { callAI } from "@/lib/gemini";
import { allowRequest } from "@/lib/rate-limit";

const MAX_MESSAGE_LENGTH = 500;

export async function askSupportBot(message: string): Promise<string> {
  if (typeof message !== "string") return "What would you like to know?";
  const trimmed = message.trim();
  if (!trimmed) {
    return "What would you like to know?";
  }
  // Cheap guard against someone pasting a huge block of text at a public,
  // unauthenticated endpoint — bounds cost/abuse without needing a full
  // rate limiter for what's a low-traffic portfolio feature.
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return "That's a bit long for me — could you shorten your question?";
  }

  // Every call here spends paid AI quota, and this endpoint is public.
  if (!(await allowRequest("support-chat", 30, 10 * 60 * 1000))) {
    return "You've asked a lot of questions in a short time — please wait a few minutes and try again.";
  }

  const facts = await getSupportFacts();

  const prompt = `You are the customer-support assistant on ${facts.companyName}'s website, a small sustainable-furniture store ("${facts.tagline}"). Answer the visitor's message conversationally and briefly — a few sentences, plain text, no markdown headers or bullet lists unless it genuinely helps.

You may ONLY talk about: what the store sells, how many products are currently listed, delivery time, how checkout/payment works, the store's mission, and the policy links below. If asked anything else — a specific order's status, account details, a discount, or anything not covered by the facts below — say plainly you can't help with that here, and point to the contact page instead of guessing.

Never invent a fact, price, policy, or promise that isn't given below.

Facts:
${JSON.stringify(facts, null, 2)}

Visitor's message: "${trimmed}"`;

  const reply = await callAI(prompt);
  return (
    reply ??
    `Sorry, I couldn't pull that up right now. You can reach us directly through the contact page: ${facts.links.contact}`
  );
}
