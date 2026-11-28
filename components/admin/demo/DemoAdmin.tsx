"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DEMO_AUDIENCE,
  DEMO_DISPATCHERS,
  DEMO_DISPATCHER_CANDIDATES,
  DEMO_EMAILS,
  DEMO_GUESTS,
  DEMO_TELEGRAM_REQUESTS,
} from "@/lib/demo-data";
import {
  DEFAULT_ABOUT,
  DEFAULT_MARKDOWN_PAGES,
  PAGE_LABELS,
  PAGE_SLUGS,
  isSitePageSlug,
} from "@/lib/site-page-defaults";

/**
 * The guest versions of the admin screens that are not products or orders.
 * Every one of them runs on made-up data from lib/demo-data.ts, keeps its
 * changes in this component's own state (gone when the page reloads), and
 * calls no server action and no database. They exist so a guest can see what
 * the screen is like without anything real being behind it.
 */

const demoNote = (what: string) => toast.info(`Demo only: ${what}`);

function Heading({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold">{children}</h2>
      {note && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

/* ------------------------------ Inbox ------------------------------ */
export function DemoInbox() {
  const [emails, setEmails] = useState(DEMO_EMAILS);
  const [open, setOpen] = useState<string | null>(null);
  const unread = emails.filter((e) => !e.read).length;

  return (
    <div>
      <Heading>
        Inbox ({emails.length}
        {unread > 0 ? `, ${unread} unread` : ""})
      </Heading>
      {emails.length === 0 ? (
        <p className="text-muted-foreground">Nothing here (sample inbox).</p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
          {emails.map((e) => (
            <li key={e.id} className="p-4">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-4 text-left"
                onClick={() => {
                  setOpen(open === e.id ? null : e.id);
                  setEmails((list) => list.map((m) => (m.id === e.id ? { ...m, read: true } : m)));
                }}
              >
                <span>
                  <span className={e.read ? "" : "font-semibold"}>{e.subject}</span>
                  <span className="block text-sm text-muted-foreground">{e.from}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(e.receivedAt).toLocaleDateString()}
                </span>
              </button>
              {open === e.id && (
                <div className="mt-3 space-y-3">
                  <p className="text-sm">{e.body}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setEmails((list) => list.map((m) => (m.id === e.id ? { ...m, read: false } : m)))
                      }
                    >
                      Mark unread
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEmails((list) => list.filter((m) => m.id !== e.id))}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ----------------------------- Broadcast ----------------------------- */
export function DemoBroadcast() {
  const [audience, setAudience] = useState<keyof typeof DEMO_AUDIENCE>("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div>
      <Heading note="Write a message to your customers. In this demo nothing is ever sent.">Broadcast</Heading>
      <div className="max-w-xl space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="demo-audience" className="text-sm font-medium">Who gets it</label>
          <select
            id="demo-audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value as keyof typeof DEMO_AUDIENCE)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="all">All customers ({DEMO_AUDIENCE.all})</option>
            <option value="recent">Ordered recently ({DEMO_AUDIENCE.recent})</option>
            <option value="repeat">Repeat customers ({DEMO_AUDIENCE.repeat})</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="demo-subject" className="text-sm font-medium">Subject</label>
          <Input id="demo-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="demo-message" className="text-sm font-medium">Message</label>
          <Textarea id="demo-message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <Button onClick={() => demoNote(`no email was sent to the ${DEMO_AUDIENCE[audience]} sample customers.`)}>
          Send
        </Button>
      </div>
    </div>
  );
}

/* --------------------------- Dispatchers --------------------------- */
export function DemoDispatchers() {
  const [dispatchers, setDispatchers] = useState(DEMO_DISPATCHERS);
  const [candidates, setCandidates] = useState(DEMO_DISPATCHER_CANDIDATES);

  return (
    <div>
      <Heading note="Dispatchers review driver applications and assign deliveries. These are sample people: promoting or removing them here changes nothing real.">
        Dispatchers
      </Heading>
      <h3 className="mb-2 text-sm font-semibold">Current dispatchers</h3>
      <ul className="mb-8 divide-y divide-border/60 rounded-lg border border-border/60">
        {dispatchers.length === 0 && <li className="p-4 text-sm text-muted-foreground">None.</li>}
        {dispatchers.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-4 p-4">
            <span>
              {p.name}
              <span className="block text-sm text-muted-foreground">{p.email}</span>
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDispatchers((l) => l.filter((x) => x.id !== p.id));
                setCandidates((l) => [...l, p]);
              }}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
      <h3 className="mb-2 text-sm font-semibold">Make someone a dispatcher</h3>
      <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
        {candidates.length === 0 && <li className="p-4 text-sm text-muted-foreground">No one left.</li>}
        {candidates.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-4 p-4">
            <span>
              {p.name}
              <span className="block text-sm text-muted-foreground">{p.email}</span>
            </span>
            <Button
              size="sm"
              onClick={() => {
                setCandidates((l) => l.filter((x) => x.id !== p.id));
                setDispatchers((l) => [...l, p]);
              }}
            >
              Promote
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------- Telegram Access ------------------------- */
export function DemoTelegram() {
  const [rows, setRows] = useState(DEMO_TELEGRAM_REQUESTS.map((r) => ({ ...r, status: r.status as string })));
  const set = (id: string, status: string) =>
    setRows((l) => l.map((r) => (r.id === id ? { ...r, status } : r)));

  return (
    <div>
      <Heading note="People who message the bot without access can ask for it. These requests are samples; approving or rejecting changes nothing real.">
        Telegram Bot Access
      </Heading>
      <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <span>
              {r.name}
              <span className="block text-sm text-muted-foreground">{r.reason}</span>
            </span>
            {r.status === "pending" ? (
              <span className="flex gap-2">
                <Button size="sm" onClick={() => set(r.id, "approved")}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => set(r.id, "rejected")}>Reject</Button>
              </span>
            ) : (
              <Badge variant={r.status === "approved" ? "default" : "outline"}>{r.status}</Badge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------ Pages ------------------------------ */
export function DemoPagesList() {
  return (
    <div>
      <Heading note="Edit the wording of these pages. Guests can try the editor, but nothing is ever saved.">Pages</Heading>
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="p-3">Page</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {PAGE_SLUGS.map((slug) => (
              <tr key={slug} className="border-t border-border/60">
                <td className="p-3 font-medium">{PAGE_LABELS[slug]}</td>
                <td className="p-3"><Badge variant="outline">built-in text</Badge></td>
                <td className="p-3 text-right">
                  <Button variant="outline" size="sm" render={<Link href={`/admin/pages/${slug}`} />} nativeButton={false}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DemoPageEditor({ slug }: { slug: string }) {
  const valid = isSitePageSlug(slug);
  const initial: Record<string, string> = {};
  if (valid) {
    if (slug === "about") {
      for (const [k, v] of Object.entries(DEFAULT_ABOUT)) if (typeof v === "string") initial[k] = v;
    } else {
      initial.title = DEFAULT_MARKDOWN_PAGES[slug].title;
      initial.body = DEFAULT_MARKDOWN_PAGES[slug].body;
    }
  }
  const [values, setValues] = useState(initial);
  if (!valid) return null;

  return (
    <div>
      <Link href="/admin/pages" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All pages
      </Link>
      <Heading note="You can change the text, but Save only pretends. The real page is never changed.">
        Edit: {PAGE_LABELS[slug]}
      </Heading>
      <div className="max-w-2xl space-y-4">
        {Object.entries(values).map(([key, value]) => (
          <div key={key} className="space-y-1.5">
            <label htmlFor={`demo-${key}`} className="text-sm font-medium capitalize">{key}</label>
            {value.length > 120 || key === "body" ? (
              <Textarea id={`demo-${key}`} rows={key === "body" ? 14 : 4} value={value} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))} />
            ) : (
              <Input id={`demo-${key}`} value={value} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))} />
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <Button onClick={() => demoNote("saved on this screen only. The real page is unchanged.")}>Save</Button>
          <Button variant="outline" onClick={() => setValues(initial)}>Use the built-in text</Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Guests ------------------------------ */
export function DemoGuests() {
  const [guests, setGuests] = useState(DEMO_GUESTS);
  const [email, setEmail] = useState("");

  return (
    <div>
      <Heading note="Invite someone for a short, read-only look around. These are sample guests: no email is sent and nobody is really invited.">
        Guest access
      </Heading>
      <form
        className="mb-8 flex max-w-xl gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.trim()) return;
          setGuests((l) => [{ email: email.trim(), expiresAt: new Date(Date.now() + 86400000).toISOString(), active: true }, ...l]);
          setEmail("");
          demoNote("no invitation was sent.");
        }}
      >
        <Input type="email" placeholder="guest@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit">Invite</Button>
      </form>
      <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
        {guests.map((g) => (
          <li key={g.email} className="flex items-center justify-between gap-4 p-4">
            <span>
              {g.email}
              <span className="block text-sm text-muted-foreground">
                {g.active ? "Ends" : "Ended"} {new Date(g.expiresAt).toLocaleDateString()}
              </span>
            </span>
            {g.active ? (
              <Button size="sm" variant="outline" onClick={() => setGuests((l) => l.map((x) => (x.email === g.email ? { ...x, active: false } : x)))}>
                Revoke
              </Button>
            ) : (
              <Badge variant="outline">ended</Badge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
