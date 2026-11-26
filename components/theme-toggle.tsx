"use client";

import { useTheme } from "@teispace/next-themes";
import { Moon, Sun } from "lucide-react";
import { NAV_HOVER_ICON } from "@/components/layout/navbar/nav-hover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          // Same raised pill as the search, wishlist, cart and account
          // buttons next to it, so it reads as a button and not a stray icon.
          <button
            type="button"
            aria-label="Toggle theme"
            className={`${NAV_HOVER_ICON} flex items-center justify-center text-foreground outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 ${compact ? "size-7" : "size-9"}`}
          />
        }
      >
        <Sun
          className={
            compact
              ? "h-3.5 w-3.5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
              : "h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
          }
        />
        <Moon
          className={
            compact
              ? "absolute h-3.5 w-3.5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
              : "absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
          }
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
