"use client";

import { Check, X } from "lucide-react";
import {
  PASSWORD_CHECKS,
  getPasswordStrength,
  STRENGTH_LABELS,
  STRENGTH_COLORS,
  STRENGTH_SEGMENTS,
} from "@/lib/password-strength";

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const filledSegments = STRENGTH_SEGMENTS[strength];

  return (
    <div className="space-y-3">
      <div>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < filledSegments ? STRENGTH_COLORS[strength] : "bg-muted"
              }`}
            />
          ))}
        </div>
        {strength !== "empty" && (
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">
            {STRENGTH_LABELS[strength]}
          </p>
        )}
      </div>

      <ul className="space-y-1">
        {PASSWORD_CHECKS.map((check) => {
          const passed = check.test(password);
          return (
            <li
              key={check.id}
              className={`flex items-center gap-1.5 text-xs ${
                passed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              }`}
            >
              {passed ? (
                <Check className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0" />
              )}
              {check.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
