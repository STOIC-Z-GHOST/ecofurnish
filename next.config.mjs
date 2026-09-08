/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Next.js caps Server Action request bodies at 1MB by default. Product
      // image uploads go through a Server Action (app/admin/actions.ts) and
      // the app's own check allows images up to 4MB (MAX_IMAGE_BYTES) — so
      // without this, any photo over ~1MB was rejected by Next.js itself,
      // before uploadProductImage ever ran. That rejection doesn't reach the
      // browser as a normal error either, which is why it looked like the
      // upload was just hanging rather than failing outright.
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        // Vercel Blob — each store gets its own subdomain, hence the wildcard.
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      // Social sign-in avatars — session.user.image comes back as a real
      // photo URL from these providers (see components/avatar-display.tsx's
      // "legacy support" branch), and Next's Image component 400s on any
      // remote host not explicitly listed here. Microsoft/Entra is
      // deliberately not included: it doesn't hand back a plain public
      // image URL the way these three do (photo retrieval goes through a
      // separate authenticated Graph API call), so there's nothing at a
      // fixed hostname to allow here — Microsoft sign-ins fall back to the
      // initials avatar instead, which isn't a bug.
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    // Built from what the app actually loads client-side: Turnstile is the
    // only cross-origin script/frame, Leaflet's OSM tiles are the only
    // extra image host, and every other external call (Chapa, Gemini/Groq,
    // Telegram, geocoding, FX rates) happens from Server Actions/route
    // handlers, never the browser — none of those belong in a
    // browser-facing CSP. Chapa's checkout itself is a full top-level
    // redirect (window.location.href in app/checkout/page.tsx), not a
    // fetch/frame/form-post, so it needs no entry either.
    //
    // NOT nonce-based, deliberately: app/page.tsx is statically generated
    // (`export const revalidate = 300`) and served from cache to every
    // visitor, but a nonce has to be unique per request. A per-request
    // middleware nonce doesn't match the nonce baked into that cached
    // HTML's inline hydration scripts, so the browser silently refuses to
    // run them — the page renders its skeleton shell and never hydrates.
    // (Confirmed this the hard way — see chat.) Next's own CSP guide notes
    // this exact limitation: "pages must be dynamically rendered to use
    // nonces." Forcing the homepage dynamic just to enable nonces would
    // undo the ISR caching it was deliberately built with, so script-src
    // keeps 'unsafe-inline' instead — a real but smaller relaxation than
    // it sounds, since the origin allowlisting below still does most of
    // CSP's actual work (blocking exfiltration to and execution of
    // scripts from anywhere not explicitly listed here).
    //
    // Vercel's preview-only Toolbar/Live-Feedback overlay
    // (https://vercel.com/docs/vercel-toolbar/managing-toolbar#using-a-content-security-policy)
    // needs a few extra sources; VERCEL_ENV is fixed per-deployment (not
    // per-request), so resolving it here — instead of per-request in
    // middleware — is both correct and one less moving part. Production
    // visitors never load vercel.live at all, so this never widens the
    // production policy.
    const isPreview = process.env.VERCEL_ENV === "preview";
    const csp = [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com${isPreview ? " https://vercel.live" : ""}`,
      `style-src 'self' 'unsafe-inline'${isPreview ? " https://vercel.live" : ""}`,
      `img-src 'self' data: blob: https://images.unsplash.com https://*.public.blob.vercel-storage.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://cdn.discordapp.com https://*.tile.openstreetmap.org${isPreview ? " https://vercel.live https://vercel.com" : ""}`,
      `font-src 'self' data:${isPreview ? " https://vercel.live https://assets.vercel.com" : ""}`,
      `connect-src 'self' https://challenges.cloudflare.com https://vitals.vercel-insights.com https://static.cloudflareinsights.com${isPreview ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
      `frame-src https://challenges.cloudflare.com${isPreview ? " https://vercel.live" : ""}`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'self'`,
      `upgrade-insecure-requests`,
    ].join("; ");

    return [
      {
        // Applies to every route, including API routes — none of these
        // headers are safe to skip just because a request isn't a page.
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Belt-and-suspenders with frame-ancestors above: XFO is what
          // the Observatory/older browsers actually check for, so it
          // stays even though frame-ancestors is the modern equivalent.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Never let a CDN or browser cache the service worker file itself —
        // that's how updates get stuck and old cached versions calcify.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
    ];
  },
};

export default nextConfig;