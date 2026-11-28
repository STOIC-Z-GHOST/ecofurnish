"use client";

import { useState } from "react";
import { X } from "lucide-react";

// A slim message bar for a sale or a delay, set in Admin > Settings. It sits
// in the normal page flow (like the install bar), so it never covers the
// logo. A visitor can close it until their next visit.
export default function AnnouncementBar({ text }: { text: string }) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  return (
    <div
      role="status"
      className="flex min-h-10 items-center gap-3 bg-primary px-4 py-2 text-primary-foreground"
    >
      <p className="flex-1 text-center text-sm font-medium">{text}</p>
      <button
        type="button"
        onClick={() => setClosed(true)}
        aria-label="Close announcement"
        className="shrink-0 rounded-md p-1 hover:bg-white/15"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
