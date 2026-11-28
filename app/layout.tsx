import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { DM_Sans, Geist_Mono, Playfair_Display } from 'next/font/google'
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
import AnnouncementBar from '@/components/AnnouncementBar'
import MaintenanceScreen from '@/components/MaintenanceScreen'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import SiteModeSync from '@/components/SiteModeSync'
import { getSiteSettings } from '@/lib/site-settings'
import SupportChatWidget from '@/components/support/SupportChatWidget'
import './globals.css'

// Headings use a serif (Playfair Display), body text a clean sans (DM Sans).
// Geist Mono stays only for the few monospaced bits in the admin screens.
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
})
const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
})
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

const title = `${siteConfig.name}: Sustainable furniture from recycled materials`
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
    { media: '(prefers-color-scheme: light)', color: '#F9F9F6' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
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
  const settings = await getSiteSettings()

  // Maintenance mode: visitors get a "back soon" page. Left alone on purpose:
  // /admin and sign-in (so the owner can always get in), and the page a
  // customer lands on after paying (it confirms their payment).
  const requestHeaders = await headers()
  const pathname = (requestHeaders.get('x-pathname') ?? '/').toLowerCase()
  const maintenanceExempt = /^\/(admin|sign-in|forgot-password|reset-password|reset-cache|order-confirmation)(\/|$)/.test(pathname)
  let showMaintenance = false
  let adminSeesMaintenance = false
  if (settings.maintenance && !maintenanceExempt) {
    const session = await auth.api.getSession({ headers: requestHeaders })
    if (session?.user?.role === 'admin') adminSeesMaintenance = true
    else showMaintenance = true
  }

  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {showMaintenance ? (
            <MaintenanceScreen message={settings.maintenanceMessage} />
          ) : (
          <CurrencyProvider>
            <CartProvider>
              <WishlistProvider>
                <RecentlyViewedProvider>
                  {/* A slim bar in the normal page flow: when it shows, it
                      pushes the navbar and everything below it down. */}
                  {settings.installBanner && <InstallAppBanner />}
                  {settings.announcement && settings.announcementText.trim() && (
                    <AnnouncementBar text={settings.announcementText} />
                  )}
                  {adminSeesMaintenance && (
                    <div className="bg-destructive px-4 py-1.5 text-center text-sm font-medium text-white">
                      Maintenance mode is ON: visitors see a &quot;back soon&quot; page. You can see the site because you are signed in as admin.
                    </div>
                  )}
                  <SiteModeSync realStock={settings.realStock} />
                  <Navbar categories={categories} />
                  <div className="flex-1">{children}</div>
                  <Footer />
                  <Toaster />
                  <MobileBottomNav />
                  {settings.chatbot && <SupportChatWidget />}
                </RecentlyViewedProvider>
              </WishlistProvider>
            </CartProvider>
          </CurrencyProvider>
          )}
        </ThemeProvider>
        <ServiceWorkerRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
