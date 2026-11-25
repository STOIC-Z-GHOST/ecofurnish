'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, Heart, ShoppingCart, User } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { useWishlist } from '@/lib/wishlist-context'
import { useSession } from '@/lib/auth-client'
import { AvatarDisplay } from '@/components/avatar-display'

interface Tab {
  href: string
  label: string
  icon: typeof Home
  isActive: (pathname: string) => boolean
  badge?: number
}

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { totalItems: cartCount } = useCart()
  const { totalItems: wishlistCount } = useWishlist()
  const { data: session } = useSession()

  // Same SSR-hydration-safe pattern as UserMenu: session/cart/wishlist state
  // only exists client-side, so the badge counts and account link must not
  // render their real values until after mount, or the server-rendered
  // pass (always "empty"/signed-out) won't match the client's first pass.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    // Deliberate post-mount flip for hydration-safe rendering, not a sync bug.
    setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  // Home and Categories both live at "/" — only which section is actually
  // in view tells them apart. Tried tracking window.location.hash directly
  // first, but Next.js Link's same-page hash navigation doesn't reliably
  // fire a native hashchange event, so this watches the #all-products
  // section's real scroll position instead — also just a better match for
  // "which tab am I on" than the URL fragment alone.
  const [categoriesInView, setCategoriesInView] = useState(false)
  useEffect(() => {
    if (pathname !== '/') return
    const el = document.getElementById('all-products')
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setCategoriesInView(entry.isIntersecting),
      { rootMargin: '-40% 0px -40% 0px' } // "in view" once roughly centered on screen
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [pathname])

  const tabs: Tab[] = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
      isActive: (p) => p === '/' && !categoriesInView,
    },
    {
      href: '/#all-products',
      label: 'Categories',
      icon: LayoutGrid,
      isActive: (p) => p === '/' && categoriesInView,
    },
    {
      href: '/wishlist',
      label: 'Wishlist',
      icon: Heart,
      isActive: (p) => p === '/wishlist',
      badge: mounted ? wishlistCount : 0,
    },
    {
      href: '/cart',
      label: 'Cart',
      icon: ShoppingCart,
      isActive: (p) => p === '/cart',
      badge: mounted ? cartCount : 0,
    },
    {
      href: mounted && session?.user ? '/account' : '/sign-in',
      label: 'Account',
      icon: User,
      isActive: (p) => p === '/account' || p === '/sign-in',
    },
  ]

  // Home ("/") and Categories ("/#all-products") both resolve to the same
  // pathname. Next's Link only does a real navigation when the pathname
  // changes, so tapping between two tabs that share a pathname (or tapping
  // a tab you're effectively already on) can silently no-op instead of
  // scrolling. Handle those cases with a manual scroll and let Link do its
  // normal thing for every other (cross-page) tap.
  const handleTabClick = (e: React.MouseEvent, href: string) => {
    const [path, hash] = href.split('#')
    const targetPath = path || '/'
    if (pathname !== targetPath) return // real navigation — let Link handle it

    e.preventDefault()
    if (hash) {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.replaceState(null, '', `${targetPath}#${hash}`)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      window.history.replaceState(null, '', targetPath)
    }
  }

  // Sign-in/sign-up drop all navigation chrome, top and bottom — see
  // Navbar.tsx for the matching change and the reasoning. This has to be
  // an early return placed after all the hooks above (not a top-of-
  // function guard), since conditionally skipping hook calls breaks
  // React's rule that hooks run in the same order every render.
  if (pathname === '/sign-in' || pathname === '/sign-up') return null

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex h-16 items-stretch justify-around">
        {tabs.map((tab) => {
          const active = tab.isActive(pathname)
          const Icon = tab.icon
          // Desktop's account trigger shows a colored avatar (initials, or
          // a chosen preset) even if you've never touched avatar settings —
          // AvatarDisplay picks a color on its own. This tab only ever
          // showed the plain outline User icon, which read as broken/
          // inconsistent once you'd seen the desktop version.
          const showAvatar = tab.label === 'Account' && mounted && session?.user
          return (
            <li key={tab.label} className="flex-1">
              <Link
                href={tab.href}
                onClick={(e) => handleTabClick(e, tab.href)}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  active ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="relative">
                  {showAvatar ? (
                    <AvatarDisplay
                      image={session?.user?.image}
                      name={session?.user?.name ?? '?'}
                      className="h-5 w-5 text-[9px]"
                    />
                  ) : (
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                  )}
                  {!!tab.badge && tab.badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-700 px-1 text-[9px] font-semibold text-white">
                      {tab.badge}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
