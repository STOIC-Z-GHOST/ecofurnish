import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Verified domain (Cloudflare-managed DNS). A previous domain on a free
// shared-subdomain service (de5.net) had bounce issues, most likely from
// inherited reputation problems common to that kind of shared domain.
const FROM_ADDRESS = "EcoFurnish <admin@ecofurnish.abrdns.com>";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// Appended to every email that goes to an actual customer/user/driver —
// deliberately left off the two functions that just notify the site
// owner (sendContactMessage, sendLowStockAlertEmail), since those land
// in an inbox the owner already checks directly rather than one where a
// missed spam-folder email could mean a missed account or order update.
// Centralized here (rather than copy-pasted per template) specifically
// so it can't quietly go missing from one template again.
function spamNoticeHtml(): string {
  return `
        <p style="color:#9a9890;font-size:12px;margin-top:24px;border-top:1px solid #e0ddd0;padding-top:16px;">
          Can't find this in your inbox? Check your spam or junk folder — if it's there, mark it
          "Not spam" so future EcoFurnish emails land where you'll see them.
          <a href="${appUrl()}/help/check-spam" style="color:#9a9890;">More help</a>
        </p>`;
}

function spamNoticeText(): string {
  return `\n\nCan't find this in your inbox? Check your spam or junk folder — if it's there, mark it "Not spam" so future EcoFurnish emails land where you'll see them. More help: ${appUrl()}/help/check-spam`;
}

export async function sendNewsletterWelcomeEmail(toEmail: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — newsletter welcome email was not sent.");
    return { success: false as const };
  }

  const unsubscribeUrl = `${appUrl()}/api/newsletter/unsubscribe?email=${encodeURIComponent(toEmail)}`;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: "You're on the list",
      // Gmail/Yahoo require one-click unsubscribe for bulk mail since
      // their 2024 policy changes — this is what makes that work.
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      text: `You're subscribed!\n\nThanks for joining the EcoFurnish newsletter — expect the occasional email about new pieces, offers, and what your plastic-diverted total is doing for the planet.\n\nUnsubscribe: ${unsubscribeUrl}${spamNoticeText()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#33472e;">You're subscribed!</h2>
          <p style="color:#3a3f38;">
            Thanks for joining the EcoFurnish newsletter — expect the occasional email about
            new pieces, offers, and what your plastic-diverted total is doing for the planet.
          </p>
          <p style="color:#9a9890;font-size:12px;margin-top:32px;border-top:1px solid #e0ddd0;padding-top:16px;">
            <a href="${unsubscribeUrl}" style="color:#9a9890;">Unsubscribe</a>
          </p>${spamNoticeHtml()}
        </div>
      `,
    });
    return { success: true as const };
  } catch (err) {
    console.error("Failed to send newsletter welcome email:", err);
    return { success: false as const };
  }
}

export async function sendVerificationEmail(toEmail: string, url: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — verification email was not sent.");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: "Verify your EcoFurnish email",
      text: `Verify your email\n\nClick the link below to verify your email address and activate your EcoFurnish account.\n\n${url}${spamNoticeText()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#33472e;">Verify your email</h2>
          <p style="color:#3a3f38;">
            Click below to verify your email address and activate your EcoFurnish account.
          </p>
          <p style="margin:24px 0;">
            <a href="${url}" style="background:#33472e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
              Verify email
            </a>
          </p>
          <p style="color:#6b6a5c;font-size:13px;">
            If the button doesn't work, copy and paste this link: ${url}
          </p>${spamNoticeHtml()}
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }
}

export async function sendResetPasswordEmail(toEmail: string, url: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — reset-password email was not sent.");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: "Reset your EcoFurnish password",
      text: `Reset your password\n\nSomeone requested a password reset for this EcoFurnish account. If that was you, use the link below — it expires soon.\n\n${url}\n\nIf this wasn't you, ignore this email — your password hasn't been changed.${spamNoticeText()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#33472e;">Reset your password</h2>
          <p style="color:#3a3f38;">
            Someone requested a password reset for this EcoFurnish account. If that was you,
            click below to choose a new one — this link expires soon.
          </p>
          <p style="margin:24px 0;">
            <a href="${url}" style="background:#33472e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
              Reset password
            </a>
          </p>
          <p style="color:#6b6a5c;font-size:13px;">
            If this wasn't you, ignore this email — your password hasn't been changed.
          </p>${spamNoticeHtml()}
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send reset-password email:", err);
  }
}

export async function sendDeleteAccountEmail(toEmail: string, url: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — delete-account email was not sent.");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: "Confirm account deletion",
      text: `Confirm account deletion\n\nSomeone requested to permanently delete this EcoFurnish account. If that was you, use the link below to confirm — this can't be undone.\n\n${url}\n\nIf this wasn't you, ignore this email — your account is safe.${spamNoticeText()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#b3432d;">Confirm account deletion</h2>
          <p style="color:#3a3f38;">
            Someone requested to permanently delete this EcoFurnish account. If that was you,
            click below to confirm — this can't be undone.
          </p>
          <p style="margin:24px 0;">
            <a href="${url}" style="background:#b3432d;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
              Confirm deletion
            </a>
          </p>
          <p style="color:#6b6a5c;font-size:13px;">
            If this wasn't you, ignore this email — your account is safe.
          </p>${spamNoticeHtml()}
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send delete-account email:", err);
  }
}

export async function sendWelcomeEmail(toEmail: string, name: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — welcome email was not sent.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: "Welcome to EcoFurnish",
      text: `Welcome, ${name.split(" ")[0]}!\n\nYour EcoFurnish account is ready. Browse the catalog, save favorites to your wishlist, and your orders will show up in your account once you check out.${spamNoticeText()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#33472e;">Welcome, ${name.split(" ")[0]}!</h2>
          <p style="color:#3a3f38;">
            Your EcoFurnish account is ready. Browse the catalog, save favorites to your
            wishlist, and your orders will show up in your account once you check out.
          </p>${spamNoticeHtml()}
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }
}

export async function sendPasswordChangedEmail(toEmail: string, name: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — password-changed email was not sent.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: "Your EcoFurnish password was changed",
      text: `Password changed\n\nHi ${name.split(" ")[0]}, this confirms your EcoFurnish account password was just changed.\n\nIf this wasn't you, contact us immediately through the site's contact page.${spamNoticeText()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#33472e;">Password changed</h2>
          <p style="color:#3a3f38;">
            Hi ${name.split(" ")[0]}, this confirms your EcoFurnish account password was just changed.
          </p>
          <p style="color:#6b6a5c;font-size:14px;">
            If this wasn't you, contact us immediately through the site's contact page.
          </p>${spamNoticeHtml()}
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send password-changed email:", err);
  }
}

export async function sendExistingAccountSignUpAttemptEmail(toEmail: string, name: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — existing-account notice email was not sent.");
    return;
  }

  const signInUrl = `${appUrl()}/sign-in`;
  const forgotPasswordUrl = `${appUrl()}/forgot-password`;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: "Someone tried to sign up with your EcoFurnish email",
      text: `Hi ${name.split(" ")[0]},\n\nSomeone just tried to create a new EcoFurnish account using this email address, which already has an account.\n\nIf that was you, you don't need a new account — just sign in: ${signInUrl}\n\nForgot your password? Reset it here: ${forgotPasswordUrl}\n\nIf this wasn't you, no action is needed — your account is safe and no new account was created.${spamNoticeText()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#33472e;">Someone tried to sign up with your email</h2>
          <p style="color:#3a3f38;">
            Hi ${name.split(" ")[0]}, someone just tried to create a new EcoFurnish account
            using this email address — but you already have one.
          </p>
          <p style="color:#3a3f38;">
            If that was you, you don't need a new account. Just sign in below:
          </p>
          <p style="margin:24px 0;">
            <a href="${signInUrl}" style="background:#33472e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
              Sign in
            </a>
          </p>
          <p style="color:#6b6a5c;font-size:13px;">
            Forgotten your password? <a href="${forgotPasswordUrl}" style="color:#33472e;">Reset it here</a>.
          </p>
          <p style="color:#6b6a5c;font-size:13px;margin-top:16px;border-top:1px solid #e0ddd0;padding-top:16px;">
            If this wasn't you, no action is needed — your account is safe and no new account was created.
          </p>${spamNoticeHtml()}
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send existing-account notice email:", err);
  }
}

export async function sendContactMessage(input: {
  name: string;
  email: string;
  message: string;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — contact message was not sent.");
    return { success: false as const };
  }

  const ownerEmail = process.env.CONTACT_FORM_TO_EMAIL;
  if (!ownerEmail) {
    console.warn("CONTACT_FORM_TO_EMAIL is not set — contact message was not sent.");
    return { success: false as const };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: ownerEmail,
      replyTo: input.email,
      subject: `New contact form message from ${input.name}`,
      text: `New message from your site\n\n${input.name} (${input.email}) wrote:\n\n${input.message}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#33472e;">New message from your site</h2>
          <p><strong>${input.name}</strong> (${input.email}) wrote:</p>
          <p style="white-space:pre-wrap;color:#3a3f38;">${input.message}</p>
        </div>
      `,
    });
    return { success: true as const };
  } catch (err) {
    console.error("Failed to send contact message:", err);
    return { success: false as const };
  }
}

interface OrderEmailItem {
  productName: string;
  unitPrice: string;
  quantity: number;
}

interface OrderConfirmationEmailInput {
  toEmail: string;
  customerName: string;
  orderId: string;
  totalAmount: string;
  items: OrderEmailItem[];
}

export async function sendOrderConfirmationEmail(input: OrderConfirmationEmailInput) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — skipping order confirmation email.");
    return;
  }

  const itemsHtml = input.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;color:#3a3f38;">${item.productName} × ${item.quantity}</td>
          <td style="padding:8px 0;text-align:right;color:#3a3f38;">Br${(
            parseFloat(item.unitPrice) * item.quantity
          ).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const itemsText = input.items
    .map((item) => `${item.productName} × ${item.quantity} — Br${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}`)
    .join("\n");

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#33472e;">Thanks for your order, ${input.customerName.split(" ")[0]}!</h2>
      <p style="color:#3a3f38;">Your EcoFurnish order <strong>#${input.orderId.slice(0, 8)}</strong> is confirmed.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        ${itemsHtml}
        <tr>
          <td style="padding:12px 0 0;border-top:1px solid #e0ddd0;font-weight:600;">Total</td>
          <td style="padding:12px 0 0;border-top:1px solid #e0ddd0;text-align:right;font-weight:600;">
            Br${parseFloat(input.totalAmount).toFixed(2)}
          </td>
        </tr>
      </table>
      <p style="color:#6b6a5c;font-size:14px;margin-top:24px;">
        We'll be in touch about delivery. Thanks for supporting sustainable furniture.
      </p>${spamNoticeHtml()}
    </div>
  `;

  const text = `Thanks for your order, ${input.customerName.split(" ")[0]}!\n\nYour EcoFurnish order #${input.orderId.slice(0, 8)} is confirmed.\n\n${itemsText}\n\nTotal: Br${parseFloat(input.totalAmount).toFixed(2)}\n\nWe'll be in touch about delivery. Thanks for supporting sustainable furniture.${spamNoticeText()}`;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: input.toEmail,
      subject: `Your EcoFurnish order #${input.orderId.slice(0, 8)} is confirmed`,
      text,
      html,
    });
  } catch (err) {
    // Don't let an email failure break the checkout flow — just log it.
    console.error("Failed to send order confirmation email:", err);
  }
}

/** Fired at the moment a purchase drops a product to low stock — a
 * one-off nudge rather than something that needs its own schedule, since
 * lib/insights.ts's daily digest already covers the broader trend. Reuses
 * CONTACT_FORM_TO_EMAIL (the owner's inbox) rather than adding a new env
 * var for what's conceptually the same "email the owner" destination. */
export async function sendLowStockAlertEmail(productName: string, stock: number) {
  const ownerEmail = process.env.CONTACT_FORM_TO_EMAIL;
  if (!ownerEmail) {
    console.warn("CONTACT_FORM_TO_EMAIL is not set — low-stock alert was not sent.");
    return;
  }
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — low-stock alert was not sent.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: ownerEmail,
      subject: `Low stock: ${productName} (${stock} left)`,
      text: `${productName} just dropped to ${stock} in stock after a purchase. Might be worth reordering soon.`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#33472e;">Low stock alert</h2>
          <p style="color:#3a3f38;"><strong>${productName}</strong> just dropped to
          <strong>${stock}</strong> in stock after a purchase. Might be worth reordering soon.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send low-stock alert email:", err);
  }
}

// Deliberately lean. "processing," "ready_for_delivery," and
// "on_the_road"/"near_destination" all used to have their own email here,
// but that's up to 6 emails for one order on top of the confirmation —
// genuinely excessive. Driver assignment already sends its own email
// with the PIN (see sendDeliveryAssignedEmail, called directly from the
// dispatcher assignment flow) — that one's actionable, so it stays
// outside this map entirely. What's left here is just the two moments
// that actually warrant a written record: the order showing up, and the
// order going away. Anything in between is what the order-tracking
// page's live status + map is for.
const STATUS_EMAIL_COPY = {
  delivered: {
    subject: "Delivered! Thanks for shopping with EcoFurnish",
    heading: "Delivered! 🎉",
    body: (_trackingNote?: string | null) =>
      "Your order has arrived — we hope you love it. Thank you for shopping with EcoFurnish, and for choosing sustainable furniture over something new and disposable. If anything's off, just reply to this email.",
  },
  cancelled: {
    subject: "Your order has been cancelled",
    heading: "Order cancelled",
    body: (_trackingNote?: string | null) =>
      "Your order has been cancelled. If this wasn't expected, just reply to this email.",
  },
} as const;

/** Fired from the admin panel whenever an order's status changes —
 * "pending" is deliberately not in STATUS_EMAIL_COPY (that's the default
 * state right after checkout, already covered by the order-confirmation
 * email above, not a status change an admin triggers). Silently does
 * nothing for any other status, so this is safe to call unconditionally. */
export async function sendOrderStatusUpdateEmail(
  toEmail: string,
  customerName: string,
  orderId: string,
  status: string,
  trackingNote?: string | null
) {
    const copy = STATUS_EMAIL_COPY[status as keyof typeof STATUS_EMAIL_COPY];
  if (!copy) return;

  if (!resend) {
    console.warn("RESEND_API_KEY is not set — order status email was not sent.");
    return;
  }

  const firstName = customerName.split(" ")[0];
  const bodyText = copy.body(trackingNote);

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: `${copy.subject} — order #${orderId.slice(0, 8)}`,
      text: `${copy.heading}\n\nHi ${firstName}, ${bodyText}\n\nOrder #${orderId.slice(0, 8)}${spamNoticeText()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#33472e;">${copy.heading}</h2>
          <p style="color:#3a3f38;">Hi ${firstName}, ${bodyText}</p>
          <p style="color:#6b6a5c;font-size:13px;">Order #${orderId.slice(0, 8)}</p>${spamNoticeHtml()}
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send order status email:", err);
  }
}

// Used for both the admin inbox's reply-in-thread feature and the
// broadcast page's "message one specific customer" option — anywhere an
// admin is sending a single freeform message to one address, rather than
// a templated transactional email or a batch send.
export async function sendAdminMessage(toEmail: string, subject: string, body: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — message was not sent.");
    return { success: false as const, error: "Email sending isn't configured." };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject,
      text: `${body}${spamNoticeText()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <div style="color:#3a3f38;white-space:pre-wrap;">${body.replace(/\n/g, "<br />")}</div>${spamNoticeHtml()}
        </div>
      `,
    });
    if (error) {
      console.error("Admin message failed:", error);
      return { success: false as const, error: "Resend rejected the message." };
    }
    return { success: true as const };
  } catch (err) {
    console.error("Admin message threw:", err);
    return { success: false as const, error: "Something went wrong sending this." };
  }
}

/** Fired the moment an admin promotes an existing account to dispatcher
 * from /admin/dispatchers. Immediate — not an invite-and-accept flow —
 * this is just the heads-up, matching how admin role assignment already
 * works (make-admin.ts is instant too). */
export async function sendDispatcherPromotedEmail(toEmail: string, name: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — dispatcher promotion email was not sent.");
    return;
  }
  const firstName = name.split(" ")[0];
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: "You've been made a dispatcher on EcoFurnish",
      text: `Hi ${firstName}, an admin has given your account dispatcher access on EcoFurnish. You can now review driver applications, assign deliveries, and manage the delivery pipeline — just sign in as usual and you'll see the dispatcher tools.${spamNoticeText()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#33472e;">You're now a dispatcher</h2>
          <p style="color:#3a3f38;">
            Hi ${firstName}, an admin has given your account dispatcher access on EcoFurnish.
            You can now review driver applications, assign deliveries, and manage the delivery
            pipeline — just sign in as usual and you'll see the dispatcher tools.
          </p>${spamNoticeHtml()}
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send dispatcher promotion email:", err);
  }
}

/** Fired when an admin removes someone's dispatcher access. */
export async function sendDispatcherRemovedEmail(toEmail: string, name: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — dispatcher removal email was not sent.");
    return;
  }
  const firstName = name.split(" ")[0];
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: "Your dispatcher access has been removed",
      text: `Hi ${firstName}, your dispatcher access on EcoFurnish has been removed. Your account is otherwise unaffected.${spamNoticeText()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#33472e;">Dispatcher access removed</h2>
          <p style="color:#3a3f38;">
            Hi ${firstName}, your dispatcher access on EcoFurnish has been removed. Your account
            is otherwise unaffected.
          </p>${spamNoticeHtml()}
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send dispatcher removal email:", err);
  }
}

/** Fired to the DRIVER (not the buyer) the moment a dispatcher assigns
 * them to an order — contains their one-time status-portal link. This
 * is best-effort: email is optional on driverApplications (phone is the
 * required contact), so a driver without an email on file gets nothing
 * here — the dispatcher UI also surfaces the link directly so it can be
 * sent by phone/SMS/WhatsApp instead. */
export async function sendDriverAssignmentEmail(
  toEmail: string,
  driverName: string,
  orderId: string,
  portalUrl: string
) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — driver assignment email was not sent.");
    return;
  }
  const firstName = driverName.split(" ")[0];

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: `New delivery — order #${orderId.slice(0, 8)}`,
      text: `Hi ${firstName}, you've been assigned a delivery. Use this link to update your status as you go — no account or app needed: ${portalUrl}${spamNoticeText()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#33472e;">New delivery assigned</h2>
          <p style="color:#3a3f38;">
            Hi ${firstName}, you've been assigned order #${orderId.slice(0, 8)}. Use the link
            below to update your status as you go — no account or app needed.
          </p>
          <p style="margin:24px 0; text-align:center;">
            <a href="${portalUrl}" style="display:inline-block;background:#33472e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
              Open Delivery Status
            </a>
          </p>${spamNoticeHtml()}
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send driver assignment email:", err);
  }
}

/** Fired right after someone submits the driver application form —
 * just a "we got it" receipt, not the approve/reject decision itself
 * (see sendDriverApplicationDecisionEmail below for that). */
export async function sendDriverApplicationReceivedEmail(toEmail: string, fullName: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — driver application receipt was not sent.");
    return;
  }
  const firstName = fullName.split(" ")[0];
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: "We got your driver application",
      text: `Hi ${firstName}, thanks for applying to drive for EcoFurnish. A dispatcher will review your application and email you with a decision soon.${spamNoticeText()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#33472e;">Application received</h2>
          <p style="color:#3a3f38;">
            Hi ${firstName}, thanks for applying to drive for EcoFurnish. A dispatcher will
            review your application and email you with a decision soon.
          </p>${spamNoticeHtml()}
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send driver application receipt:", err);
  }
}

/** Fired when a dispatcher approves or rejects a driver application. */
export async function sendDriverApplicationDecisionEmail(
  toEmail: string,
  fullName: string,
  approved: boolean
) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — driver application decision email was not sent.");
    return;
  }
  const firstName = fullName.split(" ")[0];
  const heading = approved ? "You're approved to drive" : "Application update";
  const body = approved
    ? "Your driver application has been approved. You'll get a link by email whenever you're assigned a delivery — no account or app install needed."
    : "Thanks for your interest, but we're not able to approve your driver application at this time.";

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: heading,
      text: `Hi ${firstName}, ${body}${spamNoticeText()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#33472e;">${heading}</h2>
          <p style="color:#3a3f38;">Hi ${firstName}, ${body}</p>${spamNoticeHtml()}
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send driver application decision email:", err);
  }
}

/** Fired the moment a dispatcher assigns a driver to an order. Sends the
 * buyer their delivery PIN — never printed on the package — which the
 * driver has to collect from them in person to submit a "delivered"
 * claim (see deliveryAssignments.buyerPin in db/schema.ts). */
export async function sendDeliveryAssignedEmail(
  toEmail: string,
  customerName: string,
  orderId: string,
  buyerPin: string
) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — delivery assignment email was not sent.");
    return;
  }
  const firstName = customerName.split(" ")[0];

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: `Your delivery PIN — order #${orderId.slice(0, 8)}`,
      text: `Hi ${firstName}, a driver has been assigned to your order. Your delivery PIN is ${buyerPin} — give this to the driver only once your order actually arrives, so they can confirm the handoff. Don't share it before then.\n\nOrder #${orderId.slice(0, 8)}${spamNoticeText()}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#33472e;">A driver is on the way</h2>
          <p style="color:#3a3f38;">Hi ${firstName}, a driver has been assigned to your order.</p>
          <p style="margin:24px 0; text-align:center;">
            <span style="display:inline-block;background:#f0efe6;color:#33472e;font-size:28px;font-weight:700;letter-spacing:4px;padding:12px 24px;border-radius:8px;">
              ${buyerPin}
            </span>
          </p>
          <p style="color:#3a3f38;">
            Give this PIN to the driver <strong>only once your order actually arrives</strong>,
            so they can confirm the handoff. Don't share it before then.
          </p>
          <p style="color:#6b6a5c;font-size:13px;">Order #${orderId.slice(0, 8)}</p>${spamNoticeHtml()}
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send delivery assignment email:", err);
  }
}
