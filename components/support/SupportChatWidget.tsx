"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { askSupportBot } from "@/app/actions/support-chat";

interface Message {
  role: "user" | "bot";
  text: string;
}

const GREETING: Message = {
  role: "bot",
  text: "Hi! I'm the EcoFurnish assistant. Ask me about products, delivery, or how ordering works.",
};

// Tap-to-ask questions, shown until the first message is sent (like the
// suggested questions in Amazon's assistant). They go through exactly the
// same path as a typed question.
const SUGGESTIONS = [
  "How long does delivery take?",
  "How does checkout work?",
  "What is your furniture made from?",
];

// Floating button geometry. On phones the button can be dragged anywhere
// and snaps to the nearest side edge when let go (the way the assistant
// bubble works in the Bitget app). On desktop it stays in the corner.
const SIZE = 56;
const EDGE = 12; // gap kept from the left/right edge after snapping
const TOP_LIMIT = 72; // stays below the navbar
const BOTTOM_LIMIT = 84; // stays above the phone bottom bar
const DRAG_THRESHOLD = 6; // px of movement before a press counts as a drag

function isDesktop() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
}

function clampTop(top: number) {
  const max = Math.max(TOP_LIMIT, window.innerHeight - SIZE - BOTTOM_LIMIT);
  return Math.min(Math.max(top, TOP_LIMIT), max);
}

// A speech bubble holding a leaf with two eyes, so it reads as "tap to talk
// to the assistant" rather than as a decorative leaf.
function LeafChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M6 4h20a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H15.5L9 28.5V23H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"
        fill="white"
      />
      <path
        d="M16 6.5c-4.5 0-7.2 2.9-7.2 6.4 0 3.4 2.7 5.6 7.2 5.6s7.2-2.2 7.2-5.6c0-3.5-2.7-6.4-7.2-6.4z"
        fill="currentColor"
      />
      <path d="M16 6.5c.6-1.7 2-2.7 4-2.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <circle cx="13" cy="12.6" r="1.35" fill="white" />
      <circle cx="19" cy="12.6" r="1.35" fill="white" />
    </svg>
  );
}

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Where the user dragged the button to (phones only). null = default spot.
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    startX: number;
    startY: number;
    originLeft: number;
    originTop: number;
    moved: boolean;
  } | null>(null);
  const justDragged = useRef(false);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Keep a dragged button on screen when the phone is rotated or resized.
  useEffect(() => {
    if (!pos) return;
    const onResize = () => {
      setPos((p) =>
        p
          ? {
              left: p.left + SIZE / 2 < window.innerWidth / 2 ? EDGE : window.innerWidth - SIZE - EDGE,
              top: clampTop(p.top),
            }
          : p
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos]);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || sending) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);
    try {
      const reply = await askSupportBot(text);
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Something went wrong on my end, please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleSend() {
    send(input);
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (isDesktop()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      originLeft: rect.left,
      originTop: rect.top,
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Some browsers refuse capture; dragging still works while the finger
      // stays over the button.
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    d.moved = true;
    setDragging(true);
    setPos({
      left: Math.min(Math.max(d.originLeft + dx, 0), window.innerWidth - SIZE),
      top: clampTop(d.originTop + dy),
    });
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    // Let go: settle against whichever side edge is closer.
    setDragging(false);
    setPos((p) =>
      p
        ? {
            left: p.left + SIZE / 2 < window.innerWidth / 2 ? EDGE : window.innerWidth - SIZE - EDGE,
            top: p.top,
          }
        : p
    );
    // The click that follows a drag must not open the chat.
    justDragged.current = true;
    setTimeout(() => {
      justDragged.current = false;
    }, 0);
  }

  function onButtonClick() {
    if (justDragged.current) return;
    setOpen((v) => !v);
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="EcoFurnish support chat"
          className="fixed inset-x-3 bottom-20 z-50 flex h-[min(70dvh,520px)] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl duration-200 animate-in fade-in-0 slide-in-from-bottom-4 md:inset-x-auto md:right-6 md:bottom-24 md:w-96"
        >
          <div className="flex items-center justify-between border-b border-border bg-emerald-700 px-4 py-3 text-white">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <LeafChatIcon className="size-6 text-emerald-700" />
              EcoFurnish assistant
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Minimize chat"
              className="rounded-md p-1 hover:bg-white/10"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-emerald-700 text-white"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.text}
              </div>
            ))}

            {messages.length === 1 && !sending && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {sending && (
              <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking…
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a question…"
              maxLength={500}
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-emerald-700"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Phones: 56px circle, 90px above the bottom, draggable. It hides
          while the chat is open (the chat has its own minimize button).
          Desktop: same button in the bottom right corner, not draggable. */}
      <button
        type="button"
        onClick={onButtonClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label={open ? "Minimize support chat" : "Open support chat"}
        style={
          pos
            ? ({ "--chat-left": `${pos.left}px`, "--chat-top": `${pos.top}px` } as React.CSSProperties)
            : undefined
        }
        className={[
          "fixed z-50 flex size-14 touch-none items-center justify-center rounded-full bg-emerald-700/90 text-white ring-1 ring-white/25 backdrop-blur-md",
          "shadow-[0_4px_14px_rgb(0_0_0/0.28)] transition-shadow active:shadow-[0_2px_8px_rgb(0_0_0/0.3)] md:right-6 md:bottom-6 md:hover:bg-emerald-700",
          pos
            ? "max-md:top-(--chat-top) max-md:right-auto max-md:bottom-auto max-md:left-(--chat-left)"
            : "right-4 bottom-[90px]",
          pos && !dragging ? "max-md:transition-[left,top] max-md:duration-200" : "",
          open ? "max-md:hidden" : "",
        ].join(" ")}
      >
        <LeafChatIcon className="size-8 text-emerald-700" />
      </button>
    </>
  );
}
