"use client";

import { useEffect } from "react";
import { purgeSiteCaches } from "@/lib/stale-cache";

// Open /reset-cache on any device that shows odd errors: it clears this
// site's saved copies on that device and sends the visitor to the homepage.
export default function ResetCachePage() {
  useEffect(() => {
    purgeSiteCaches().finally(() => window.location.replace("/"));
  }, []);

  return (
    <div className="container mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Refreshing the site</h1>
      <p className="mt-2 text-sm text-muted-foreground">Clearing old saved data, one moment…</p>
    </div>
  );
}
