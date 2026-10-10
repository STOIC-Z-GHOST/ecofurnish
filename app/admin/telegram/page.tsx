import { getTelegramAdmins } from "@/app/admin/telegram/actions";
import { TelegramAdminsList } from "@/components/admin/TelegramAdminsList";
import { requireAdminPage } from "@/lib/require-admin";

export default async function AdminTelegramPage() {
  await requireAdminPage();
  const admins = await getTelegramAdmins();

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Telegram Bot Access</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Anyone who messages the bot without access can request it — they type a reason, and it
        shows up here to approve or reject. Whoever&apos;s set in the TELEGRAM_CHAT_ID env
        variable always keeps access no matter what happens on this page.
      </p>
      <TelegramAdminsList admins={admins} />
    </div>
  );
}
