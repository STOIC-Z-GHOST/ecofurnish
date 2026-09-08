"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Catches errors thrown in app/layout.tsx itself — most notably the
 * categories query it runs for the navbar. app/error.tsx can't catch
 * those (a layout's own errors aren't caught by that layout's error
 * boundary), so this exists specifically for that case. It replaces the
 * ENTIRE document, including the layout that normally provides fonts,
 * theming, and the navbar/footer — none of that can be trusted to work
 * if we're here, so this stays deliberately minimal and self-contained
 * rather than a full outage page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: "8px", color: "#6b6a5c", maxWidth: "28rem" }}>
            EcoFurnish hit a snag loading this page — it&apos;s probably temporary.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: "24px",
              padding: "8px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#33472e",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
