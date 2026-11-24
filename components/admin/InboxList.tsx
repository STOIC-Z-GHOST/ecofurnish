"use client";

import { useState } from "react";
import { Mail, MailOpen, ChevronDown, ChevronUp, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { markInboundEmailRead, sendInboxReply } from "@/app/admin/actions";

interface InboundEmail {
  id: string;
  fromEmail: string;
  toEmail: string;
  subject: string | null;
  text: string | null;
  html: string | null;
  read: boolean;
  receivedAt: Date;
}

// Wraps an inbound email's HTML for the sandboxed frame above. The CSP in
// here is a second lock behind the sandbox: nothing may run, and nothing is
// fetched from the internet except inline styles and data: images — which
// also means "tracking pixels" and remote images stay blocked, so opening a
// message never tells a sender that the admin read it.
function buildEmailFrameDoc(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">
<base target="_blank">
<style>body{font:14px/1.5 system-ui,sans-serif;color:#111;background:#fff;margin:12px;word-wrap:break-word}img{max-width:100%;height:auto}table{max-width:100%}</style>
</head><body>${html}</body></html>`;
}

export function InboxList({ emails }: { emails: InboundEmail[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [localEmails, setLocalEmails] = useState(emails);
  // Keyed by email id so drafts for different threads don't collide if
  // more than one gets opened/typed-into during a session.
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  async function toggleOpen(email: InboundEmail) {
    const opening = openId !== email.id;
    setOpenId(opening ? email.id : null);

    if (opening && !email.read) {
      setLocalEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, read: true } : e)));
      try {
        await markInboundEmailRead(email.id, true);
      } catch {
        // Not worth a toast for this — worst case it shows unread again
        // on next page load, no data lost.
      }
    }
  }

  async function handleReply(email: InboundEmail) {
    const body = (replyDrafts[email.id] ?? "").trim();
    if (!body) return;

    setSendingId(email.id);
    try {
      const result = await sendInboxReply(email.id, body);
      if (result.success) {
        toast.success(`Reply sent to ${email.fromEmail}`);
        setReplyDrafts((prev) => ({ ...prev, [email.id]: "" }));
        setSentIds((prev) => new Set(prev).add(email.id));
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Couldn't send that — please try again.");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="divide-y divide-border/60 rounded-lg border border-border/60">
      {localEmails.map((email) => {
        const isOpen = openId === email.id;
        return (
          <div key={email.id}>
            <button
              type="button"
              onClick={() => toggleOpen(email)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
            >
              {email.read ? (
                <MailOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <Mail className="h-4 w-4 shrink-0 text-primary" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`truncate text-sm ${email.read ? "font-normal" : "font-semibold"}`}>
                    {email.subject || "(no subject)"}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {email.fromEmail} → {email.toEmail}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(email.receivedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>

            {isOpen && (
              <div className="border-t border-border/60 bg-muted/20 px-4 py-4">
                {email.html ? (
                  <iframe
                    title={`Email from ${email.fromEmail}`}
                    // Inbound mail is written by strangers, and this page runs
                    // inside a signed-in admin session — so it is never put
                    // into the page itself. It lives in a sandboxed frame:
                    // no scripts, no forms, and no access to this page, its
                    // cookies or its storage (the sandbox has no
                    // allow-same-origin). Links may open in a new tab, which
                    // is also sandbox-free so the destination site works.
                    sandbox="allow-popups allow-popups-to-escape-sandbox"
                    referrerPolicy="no-referrer"
                    srcDoc={buildEmailFrameDoc(email.html)}
                    className="h-96 w-full rounded-md border border-border/60 bg-white"
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {email.text || "(empty message)"}
                  </p>
                )}
                <div className="mt-4 space-y-2">
                  <Textarea
                    value={replyDrafts[email.id] ?? ""}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [email.id]: e.target.value }))
                    }
                    placeholder={`Reply to ${email.fromEmail}…`}
                    rows={4}
                    className="bg-background text-sm"
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => handleReply(email)}
                      disabled={sendingId === email.id || !(replyDrafts[email.id] ?? "").trim()}
                    >
                      {sendingId === email.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send reply
                    </Button>
                    {sentIds.has(email.id) && (
                      <span className="text-xs text-muted-foreground">Sent</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
