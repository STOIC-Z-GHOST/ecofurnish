import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { products } from '@/db/schema'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from "@teispace/next-themes";
import Navbar from '@/components/layout/navbar/Navbar'
import Footer from '@/components/layout/footer/Footer'
import { CartProvider } from '@/lib/cart-context'
import { WishlistProvider } from '@/lib/wishlist-context'
import { RecentlyViewedProvider } from '@/lib/recently-viewed-context'
import { CurrencyProvider } from '@/lib/currency-context'
import { siteConfig } from '@/config/site'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'
import InstallAppBanner from '@/components/pwa/InstallAppBanner'
import MobileBottomNav from '@/components/layout/navbar/MobileBottomNav'
import SupportChatWidget from '@/components/support/SupportChatWidget'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// No dynamic APIs (headers/cookies) here, so this stays static/ISR —
// same reasoning and window as the homepage's own revalidate (see
// app/page.tsx). This doesn't force any OTHER route dynamic either:
// Next.js determines static/dynamic per route based on that route's own
// chain of layouts+page, so /admin's `force-dynamic` (and similar) still
// takes full effect independently.
export const revalidate = 300

const title = `${siteConfig.name} — Sustainable furniture from recycled materials`
const description =
  'Furniture built from recycled plastic and reclaimed wood, shipped from Addis Ababa.'

export const metadata: Metadata = {
  // Lets every relative OG/Twitter image URL below resolve to an absolute
  // one at build time — swap siteConfig.url once the real domain is live.
  metadataBase: new URL(siteConfig.url),
  title,
  description,
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: 'default',
  },
  openGraph: {
    title,
    description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: title }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-image.jpg'],
  },
  verification: { google: 'Nv1AodlIgORBiVZofXQKStI7Du3CVf-srjJRoJS8jNg' },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Distinct, real category values that actually exist on products right
  // now — same source of truth catalog-view.tsx derives client-side from
  // already-loaded products (Array.from(new Set(products.map(p =>
  // p.category)))), just computed here in SQL instead since the layout
  // doesn't have the full product list loaded.
  const categoryRows = await db
    .selectDistinct({ category: products.category })
    .from(products)
    .orderBy(sql`${products.category} asc`)
  const categories = categoryRows.map((r) => r.category)

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <CurrencyProvider>
            <CartProvider>
              <WishlistProvider>
                <RecentlyViewedProvider>
                  <Navbar categories={categories} />
                  <div className="flex-1">{children}</div>
                  <Footer />
                  <Toaster />
                  <InstallAppBanner />
                  <MobileBottomNav />
                  <SupportChatWidget />
                </RecentlyViewedProvider>
              </WishlistProvider>
            </CartProvider>
          </CurrencyProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
