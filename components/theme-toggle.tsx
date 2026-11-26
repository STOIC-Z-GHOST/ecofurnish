"use client";

import { useTheme } from "@teispace/next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            className={
              compact
                ? "size-7 border-transparent bg-transparent hover:bg-muted"
                : "size-9 rounded-full border-transparent bg-muted text-foreground hover:bg-accent"
            }
          />
        }
      >
        <Sun
          className={
            compact
              ? "h-3.5 w-3.5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
              : "h-[18px] w-[18px] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
          }
        />
        <Moon
          className={
            compact
              ? "absolute h-3.5 w-3.5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
              : "absolute h-[18px] w-[18px] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
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
