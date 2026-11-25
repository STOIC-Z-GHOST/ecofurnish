import Link from 'next/link'
import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'You’re offline',
}

export default function OfflinePage() {
  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <WifiOff className="size-6 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight">You&apos;re offline</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This page hasn&apos;t been saved for offline use. Reconnect and try
        again, pages you&apos;ve already visited should still open.
      </p>
      <Button render={<Link href="/" />} className="mt-8">
        Back to home
      </Button>
    </div>
  )
}
