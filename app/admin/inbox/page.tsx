import { desc } from "drizzle-orm";
import { db } from "@/db";
import { inboundEmails } from "@/db/schema";
import { InboxList } from "@/components/admin/InboxList";
import { requireAdminPage } from "@/lib/require-admin";

export default async function AdminInboxPage() {
  await requireAdminPage();
  const emails = await db.select().from(inboundEmails).orderBy(desc(inboundEmails.receivedAt));
  const unreadCount = emails.filter((e) => !e.read).length;

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold">
        Inbox ({emails.length}
        {unreadCount > 0 ? `, ${unreadCount} unread` : ""})
      </h2>

      {emails.length === 0 ? (
        <p className="text-muted-foreground">
          Nothing here yet — emails sent to your @ecofurnish.abrdns.com addresses will show up
          once someone writes in.
        </p>
      ) : (
        <InboxList emails={emails} />
      )}
    </div>
  );
}
