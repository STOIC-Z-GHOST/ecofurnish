import { eq } from "drizzle-orm";
import { db } from "@/db";
import { telegramAdmins } from "@/db/schema";
import { sendTelegramMessage } from "@/lib/telegram";
import { escapeHtml } from "@/lib/escape-html";

async function getRequestRow(chatId: string) {
  const [row] = await db
    .select()
    .from(telegramAdmins)
    .where(eq(telegramAdmins.chatId, chatId))
    .limit(1);
  return row ?? null;
}

/**
 * Called for any plain-text message from a chat that isn't authorized
 * yet. Routes through the whole self-service flow:
 *   first message ever -> explanation + "Request Access" button
 *   (button tap handled separately, see handleAccessRequestButtonTap)
 *   next message after tapping -> treated as their reason, request sent
 *   already pending/rejected -> a short status reply, no spam
 */
export async function handleUnauthorizedTextMessage(chatId: string, text: string) {
  const existing = await getRequestRow(chatId);

  if (!existing) {
    await sendTelegramMessage(
      "This bot is only available for EcoFurnish staff.\n\nIf you believe you should have access, tap below to request it.",
      chatId,
      { inlineKeyboard: [[{ text: "Request Access", callback_data: "request_access" }]] }
    );
    return;
  }

  if (existing.status === "awaiting_reason") {
    const reason = text.trim().slice(0, 500); // keep the admin notification readable
    await db
      .update(telegramAdmins)
      .set({ status: "pending", reason, requestedAt: new Date() })
      .where(eq(telegramAdmins.id, existing.id));

    await sendTelegramMessage(
      "Thanks — your request has been sent. You'll hear back once it's reviewed.",
      chatId
    );
    await sendTelegramMessage(
      `📋 New Telegram bot access request\nChat ID: <code>${chatId}</code>\nReason: ${escapeHtml(reason)}\n\nReview it in the admin panel under Telegram Access.`
    );
    return;
  }

  if (existing.status === "pending") {
    await sendTelegramMessage("Your request is still pending review — hang tight.", chatId);
    return;
  }

  if (existing.status === "rejected") {
    await sendTelegramMessage(
      "Your request wasn't approved. Contact the admin directly if you think this is a mistake.",
      chatId
    );
    return;
  }

  // status === "approved" shouldn't reach here at all (isAuthorizedChat
  // would already be true), but handle it gracefully just in case of a
  // stale read.
  await sendTelegramMessage("You already have access — try /help.", chatId);
}

/** Called when someone taps the "Request Access" inline button. */
export async function handleAccessRequestButtonTap(chatId: string) {
  const existing = await getRequestRow(chatId);

  if (existing?.status === "pending") {
    await sendTelegramMessage("You already have a pending request — hang tight.", chatId);
    return;
  }
  if (existing?.status === "rejected") {
    await sendTelegramMessage(
      "Your previous request wasn't approved. Contact the admin directly if you think this is a mistake.",
      chatId
    );
    return;
  }
  if (existing?.status === "approved") {
    await sendTelegramMessage("You already have access — try /help.", chatId);
    return;
  }

  if (existing) {
    await db
      .update(telegramAdmins)
      .set({ status: "awaiting_reason" })
      .where(eq(telegramAdmins.id, existing.id));
  } else {
    await db.insert(telegramAdmins).values({ chatId, status: "awaiting_reason" });
  }

  await sendTelegramMessage(
    "Please reply with a short reason for wanting access, and I'll pass it to the admin.",
    chatId
  );
}
