"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CopyReferralLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex gap-2">
      <Input readOnly value={link} onFocus={(e) => e.target.select()} className="font-mono text-xs sm:text-sm" />
      <Button type="button" variant="outline" onClick={handleCopy} className="shrink-0">
        {copied ? <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
