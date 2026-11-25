'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const DISMISS_KEY = 'ecofurnish:install-banner-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function safeGetLocalStorageItem(key: string) {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorageItem(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
  } catch {
    // Some browsers restrict storage access in private mode or locked-down
    // contexts; the banner should never crash the page if that happens.
  }
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari's non-standard flag for "launched from home screen"
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIos() {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

// Desktop Safari (macOS) also has no beforeinstallprompt event — Chrome/Edge
// on any platform, and Firefox, are the only browsers this banner needs to
// actively guide, since Firefox currently has no install UI at all to guide
// someone toward.
function isDesktopSafari() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  return !isIos() && /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|Edg|Android/.test(ua)
}

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [manualHint, setManualHint] = useState<'ios' | 'safari' | null>(null)
  // Starts hidden on every render that happens before mount — the server
  // render, and (critically) the client's first hydration pass too, since
  // that pass must produce the same output as the server or React treats it
  // as a hydration error. Only the effect below, which runs strictly after
  // mount, is allowed to flip this based on window/localStorage/user-agent.
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    // Deliberately deferred to an effect rather than computed during render:
    // isStandalone/localStorage/user-agent only exist in the browser, so
    // evaluating them during the initial render would make the client's
    // first pass disagree with the server-rendered (window-less) output —
    // exactly the hydration mismatch this structure exists to avoid.
    if (isStandalone() || safeGetLocalStorageItem(DISMISS_KEY)) return

    // Deliberate post-mount flip for hydration-safe rendering, not a sync bug.
    setDismissed(false) // eslint-disable-line react-hooks/set-state-in-effect

    if (isIos()) {
      setManualHint('ios')
      return
    }

    if (isDesktopSafari()) {
      setManualHint('safari')
      return
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  const dismiss = () => {
    safeSetLocalStorageItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDismissed(true)
    setDeferredPrompt(null)
  }

  if (dismissed || (!deferredPrompt && !manualHint)) return null

  // A slim bar (50px) at the very top of the page. It sits in the normal
  // flow, so it pushes the header and everything below it down by its own
  // height instead of floating over the logo. Dismiss with the X.
  return (
    <div
      className="flex h-[50px] w-full items-center gap-3 border-b border-border bg-muted px-3 sm:px-6"
      role="region"
      aria-label="Install EcoFurnish"
    >
      <Image
        src="/icon-192.png"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-md"
      />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium">Add EcoFurnish to your Home Screen</p>
        {manualHint === 'ios' && (
          <p className="truncate text-[11px] text-muted-foreground">
            Tap Share, then Add to Home Screen
          </p>
        )}
        {manualHint === 'safari' && (
          <p className="truncate text-[11px] text-muted-foreground">
            Click Share in the toolbar, then Add to Dock
          </p>
        )}
      </div>
      {!manualHint && (
        <Button size="sm" className="shrink-0" onClick={handleInstall}>
          Install
        </Button>
      )}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
