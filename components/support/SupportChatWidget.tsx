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

// Floating button geometry. On phones the button can be dragged anywhere and
// settles against the nearest side edge when let go (like the assistant
// bubble in the Bitget app). Drag it a little further past the edge and it
// tucks: half in, half out of the screen, out of the way. Tap it to bring
// it back and open the chat. On desktop it stays in the corner.
const SIZE = 56;
const EDGE = 12; // gap kept from the left/right edge after snapping
const TOP_LIMIT = 72; // stays below the navbar
const BOTTOM_LIMIT = 84; // stays above the phone bottom bar
const DRAG_THRESHOLD = 6; // px of movement before a press counts as a drag
const TUCK_PULL = 14; // px past the screen edge that counts as "tuck it away"

function isDesktop() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
}

function clampTop(top: number) {
  const max = Math.max(TOP_LIMIT, window.innerHeight - SIZE - BOTTOM_LIMIT);
  return Math.min(Math.max(top, TOP_LIMIT), max);
}

// Where the button's left edge goes once it has been let go: against the
// nearest side (with a small gap), or half off-screen when it is tucked.
function settleLeft(left: number, tucked: "left" | "right" | null) {
  if (tucked === "left") return -SIZE / 2;
  if (tucked === "right") return window.innerWidth - SIZE / 2;
  return left + SIZE / 2 < window.innerWidth / 2 ? EDGE : window.innerWidth - SIZE - EDGE;
}

// The assistant's face: just a leaf with two eyes that blink now and then.
// Drawn as SVG (not a picture) so it stays sharp at any size. Deep green on
// a light page, soft sage on a dark one so it never disappears; `onDark` is
// for the green chat header, where it is white instead.
function BotLogo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  const body = onDark ? "fill-white" : "fill-[#265A43] dark:fill-[#A5BBA1]";
  const stem = onDark ? "stroke-white" : "stroke-[#265A43] dark:stroke-[#A5BBA1]";
  const eye = onDark ? "fill-[#265A43]" : "fill-white dark:fill-[#121212]";
  return (
    <svg viewBox="12 4 40 42" className={className} aria-hidden="true">
      <path
        d="M15.4 42.8C14.2 36 14.4 28 20 21.5C24 17.5 30 15.5 36 14.8C40 14.4 44 13.4 48 11.3C49 19 48.5 27 44 33C41 37 37 39 33.3 39.2C28 39.6 22 39.8 15.4 42.8Z"
        className={body}
      />
      <path
        d="M32.4 15.4C31.6 11 33.4 8 38.6 7"
        fill="none"
        strokeWidth="2.3"
        strokeLinecap="round"
        className={stem}
      />
      <circle cx="26" cy="26.5" r="2.7" className={`bot-eye ${eye}`} />
      <circle cx="37.9" cy="26.2" r="2.7" className={`bot-eye ${eye}`} />
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
  const [tucked, setTucked] = useState<"left" | "right" | null>(null);
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
      setPos((p) => (p ? { left: settleLeft(p.left, tucked), top: clampTop(p.top) } : p));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos, tucked]);

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
    setTucked(null);
    // The button may slide up to half way off either side while dragging,
    // which is how you "push it into" the edge.
    setPos({
      left: Math.min(Math.max(d.originLeft + dx, -SIZE / 2), window.innerWidth - SIZE / 2),
      top: clampTop(d.originTop + dy),
    });
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    setDragging(false);
    if (!pos) return;
    // Pushed past an edge: tuck it half in, half out. Otherwise settle
    // against the nearer side, fully visible.
    let side: "left" | "right" | null = null;
    if (pos.left < -TUCK_PULL) side = "left";
    else if (pos.left + SIZE > window.innerWidth + TUCK_PULL) side = "right";
    setTucked(side);
    setPos({ left: settleLeft(pos.left, side), top: pos.top });
    // The click that follows a drag must not open the chat.
    justDragged.current = true;
    setTimeout(() => {
      justDragged.current = false;
    }, 0);
  }

  function onButtonClick() {
    if (justDragged.current) return;
    if (tucked) {
      // Tapping a tucked button brings it back out against the edge and
      // opens the chat in one go.
      setPos((p) => (p ? { left: tucked === "left" ? EDGE : window.innerWidth - SIZE - EDGE, top: p.top } : p));
      setTucked(null);
      setOpen(true);
      return;
    }
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
              <BotLogo className="size-7" onDark />
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
          "fixed z-50 flex size-14 touch-none items-center justify-center md:right-6 md:bottom-6",
          pos
            ? "max-md:top-(--chat-top) max-md:right-auto max-md:bottom-auto max-md:left-(--chat-left)"
            : "right-4 bottom-[90px]",
          pos && !dragging ? "max-md:transition-[left,top] max-md:duration-200" : "",
          tucked ? "opacity-80" : "",
          open ? "max-md:hidden" : "",
        ].join(" ")}
      >
        <BotLogo className="size-14 drop-shadow-[0_3px_6px_rgb(0_0_0/0.3)]" />
      </button>
    </>
  );
}
