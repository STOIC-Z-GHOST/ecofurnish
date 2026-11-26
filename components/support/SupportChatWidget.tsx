"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { askSupportBot } from "@/app/actions/support-chat";
import LeafBot from "./LeafBot";

interface Message {
  role: "user" | "bot";
  text: string;
}

const GREETING: Message = {
  role: "bot",
  text: "Hi! I'm the EcoFurnish assistant. Ask me about products, delivery, or how ordering works.",
};

const SUGGESTIONS = [
  "How long does delivery take?",
  "How does payment work?",
  "What does kg diverted mean?",
];

const BUBBLE = 56; // px, the size of the leaf
const EDGE = 12; // px gap kept from the screen edge
const TOP_LIMIT = 84; // stay below the header
const BOTTOM_LIMIT = 90; // stay above the bottom tab bar
const VISIBLE_WHEN_DOCKED = 30; // px of the leaf that peek out when minimized
const DOCK_PULL = 18; // how far past the edge a swipe must go to minimize it

/**
 * Floating support chat, shown as a little leaf with a face.
 *
 * On phones (under 768px) the leaf starts fully visible in the bottom-right
 * corner and can be dragged anywhere. Let go near a side and it snaps to that
 * edge. Swipe it further past the edge and it minimizes: only part of the
 * leaf peeks in from the side (not fully in, not fully out). Tap the peeking
 * leaf to bring it back and open the chat. Opening the chat shows a normal
 * chat window, and minimizing that window brings the leaf back. On desktop
 * it stays a fixed leaf in the bottom-right corner.
 */
export default function SupportChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Dragging (phones only)
  const [isMobile, setIsMobile] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dock, setDock] = useState<"left" | "right" | null>(null);
  const [vw, setVw] = useState(0);
  const drag = useRef<{ startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => {
      setIsMobile(mq.matches);
      setVw(window.innerWidth);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Keep the bubble on screen after a rotation or resize.
  useEffect(() => {
    function clampToScreen() {
      setVw(window.innerWidth);
      setPos((p) =>
        p
          ? {
              x: Math.min(Math.max(p.x, EDGE), window.innerWidth - BUBBLE - EDGE),
              y: Math.min(Math.max(p.y, TOP_LIMIT), window.innerHeight - BUBBLE - BOTTOM_LIMIT + 10),
            }
          : p
      );
    }
    window.addEventListener("resize", clampToScreen);
    return () => window.removeEventListener("resize", clampToScreen);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (!isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: rect.left,
      originY: rect.top,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
    }
    setPos({
      // May go past the edge, that is how you push it into the side.
      x: Math.min(Math.max(d.originX + dx, -BUBBLE / 2), window.innerWidth - BUBBLE / 2),
      y: Math.min(Math.max(d.originY + dy, TOP_LIMIT), window.innerHeight - BUBBLE - BOTTOM_LIMIT + 10),
    });
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    suppressClick.current = true;
    setDragging(false);
    setPos((p) => {
      if (!p) return p;
      const rightLimit = window.innerWidth - BUBBLE - EDGE;
      if (p.x > rightLimit + DOCK_PULL) {
        setDock("right");
      } else if (p.x < EDGE - DOCK_PULL) {
        setDock("left");
      } else {
        // Not pushed far enough to minimize: snap to the closer side.
        setDock(null);
        return { x: p.x + BUBBLE / 2 > window.innerWidth / 2 ? rightLimit : EDGE, y: p.y };
      }
      return p;
    });
  }

  function onBubbleClick() {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (dock) {
      // Tapping the peeking leaf brings it back out and opens the chat.
      setPos((p) => ({
        x: dock === "right" ? window.innerWidth - BUBBLE - EDGE : EDGE,
        y: p?.y ?? window.innerHeight - BUBBLE - BOTTOM_LIMIT,
      }));
      setDock(null);
      setOpen(true);
      return;
    }
    setOpen((v) => !v);
  }

  // Where the leaf sits horizontally right now (phones, after the first drag).
  const leftPx = !pos
    ? undefined
    : dock === "right"
      ? vw - VISIBLE_WHEN_DOCKED
      : dock === "left"
        ? -(BUBBLE - VISIBLE_WHEN_DOCKED)
        : pos.x;

  // Names the product the visitor is looking at, so a question like "is this
  // in stock?" has something to refer to.
  function currentProductName(): string | null {
    if (!pathname?.startsWith("/products/")) return null;
    const heading = document.querySelector("h1")?.textContent?.trim();
    return heading ? heading.slice(0, 80) : null;
  }

  async function handleSend(preset?: string) {
    const text = (preset ?? input).trim();
    if (!text || sending) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);
    try {
      const product = currentProductName();
      const reply = await askSupportBot(
        product ? `(The visitor is looking at the product "${product}".) ${text}` : text
      );
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

  const onProduct = pathname?.startsWith("/products/") ?? false;
  const suggestions = onProduct
    ? ["Is this item in stock?", "How long does delivery take?", "How does payment work?"]
    : SUGGESTIONS;
  const showSuggestions = messages.length === 1;

  return (
    <>
      {open && (
        <div className="fixed inset-x-3 bottom-[calc(90px+env(safe-area-inset-bottom))] z-50 flex h-[60vh] max-h-[480px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:right-6 sm:w-96 md:bottom-24">
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <LeafBot className="size-6 text-primary-foreground" halo={false} eyeColor="var(--primary)" />
              EcoFurnish Support
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Minimize support chat"
              className="rounded-md p-1 hover:bg-white/10"
            >
              <ChevronDown className="h-5 w-5 md:hidden" />
              <X className="hidden h-4 w-4 md:block" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.text}
              </div>
            ))}
            {showSuggestions && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs text-primary transition-colors hover:bg-muted"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {sending && (
              <div className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
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
              maxLength={400}
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={sending || !input.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onBubbleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label={open ? "Minimize support chat" : "Open support chat"}
        style={
          isMobile && pos
            ? { left: leftPx, top: pos.y, right: "auto", bottom: "auto" }
            : undefined
        }
        className={`fixed right-4 bottom-[calc(90px+env(safe-area-inset-bottom))] z-50 flex size-14 touch-none items-center justify-center text-primary drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)] select-none ${
          dragging ? "scale-110 cursor-grabbing" : "transition-[left,top,transform] duration-300 ease-out md:hover:scale-105"
        } ${open ? "max-md:hidden" : ""} md:bottom-6 md:right-6 md:touch-auto`}
      >
        <LeafBot className="size-14" />
      </button>
    </>
  );
}
