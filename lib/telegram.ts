import { eq } from "drizzle-orm";
import { db } from "@/db";
import { telegramAdmins } from "@/db/schema";

// Sends messages to your personal Telegram chat via the Bot API.
//
// Initial setup (one-time, gets you the first/failsafe admin):
// 1. Message @BotFather on Telegram, run /newbot, copy the token it gives
//    you into TELEGRAM_BOT_TOKEN.
// 2. Message your new bot anything (e.g. "hi") so it's allowed to message
//    you back — bots can't message a chat first.
// 3. Get your chat ID: visit
//    https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates in a browser
//    right after step 2, and read the numeric "id" under "chat" in the
//    JSON response. Put that in TELEGRAM_CHAT_ID (comma-separated if
//    you want more than one permanent, undeletable admin this way).
//
// Adding MORE admins after that never needs Vercel again: anyone who
// isn't authorized gets a "Request Access" button when they message the
// bot, types a reason, and the request lands on /admin/telegram for you
// to approve or reject — see lib/telegram-access-requests.ts.
export async function sendTelegramMessage(
  text: string,
  chatId?: string,
  options?: { inlineKeyboard?: { text: string; callback_data: string }[][] }
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = chatId ?? process.env.TELEGRAM_CHAT_ID?.split(",")[0]?.trim();

  if (!token || !targetChatId) {
    console.warn("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set, Telegram message not sent.");
    return { success: false as const };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        parse_mode: "HTML",
        ...(options?.inlineKeyboard
          ? { reply_markup: { inline_keyboard: options.inlineKeyboard } }
          : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Telegram API error:", res.status, body);
      return { success: false as const };
    }
    return { success: true as const };
  } catch (err) {
    console.error("Failed to send Telegram message:", err);
    return { success: false as const };
  }
}

/** Dismisses the loading spinner on a tapped inline button. Telegram
 * expects this call within a few seconds of any callback_query,
 * whether or not the tap actually led anywhere. */
export async function answerCallbackQuery(callbackQueryId: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    });
  } catch (err) {
    console.error("Failed to answer Telegram callback query:", err);
  }
}

/** True if this chat ID is allowed to use the bot's commands — either
 * it's in the TELEGRAM_CHAT_ID env var (the original failsafe admin(s),
 * never removable from anywhere in the app) or it's an "approved" row
 * in telegram_admins (added via /admin/telegram, no Vercel/deploy step
 * needed). Async because of that second check. */
export async function isAuthorizedChat(chatId: string): Promise<boolean> {
  const envAllowed = (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (envAllowed.includes(chatId)) return true;

  const [row] = await db
    .select({ status: telegramAdmins.status })
    .from(telegramAdmins)
    .where(eq(telegramAdmins.chatId, chatId))
    .limit(1);
  return row?.status === "approved";
}
