"use client";

import { useEffect, useId, useRef } from "react";
import Script from "next/script";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  // Bump this number to make the widget issue a fresh token. A Turnstile
  // token can only be verified ONCE, so after every submit attempt —
  // successful or not (wrong password, validation error…) — the form
  // needs a new one before it can try again.
  resetSignal?: number;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
    __onTurnstileLoad?: () => void;
  }
}

export function TurnstileWidget({ onVerify, onExpire, resetSignal }: TurnstileWidgetProps) {
  const widgetIdRef = useRef<string | undefined>(undefined);
  const containerId = `turnstile-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // Either name works (see lib/turnstile-keys.ts). Each is written out in full
  // because Next only inlines NEXT_PUBLIC_ variables it can see by exact name.
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;

    function render() {
      if (cancelled || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
        sitekey: siteKey,
        callback: onVerify,
        "expired-callback": onExpire,
      });
    }

    if (window.turnstile) {
      render();
    } else {
      window.__onTurnstileLoad = render;
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey, containerId]);

  useEffect(() => {
    if (resetSignal === undefined || !widgetIdRef.current || !window.turnstile) return;
    window.turnstile.reset(widgetIdRef.current);
  }, [resetSignal]);

  if (!siteKey) {
    return (
      <p className="text-xs text-muted-foreground">
        Captcha isn&apos;t configured yet — add NEXT_PUBLIC_TURNSTILE_SITE_KEY (or NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY) to .env.
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__onTurnstileLoad"
        async
        defer
      />
      <div id={containerId} />
    </>
  );
}
