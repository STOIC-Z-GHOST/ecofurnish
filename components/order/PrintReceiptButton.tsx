"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Opens the browser's print dialog — "Save as PDF" is one of its choices. */
export function PrintReceiptButton() {
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
      <Printer className="mr-1.5 h-4 w-4" />
      Print / save as PDF
    </Button>
  );
}
