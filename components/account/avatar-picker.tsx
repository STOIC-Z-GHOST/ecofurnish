"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { AVATAR_COLORS, AVATAR_ICONS, encodeAvatarPreset, parseAvatarPreset } from "@/lib/avatar-presets";
import { AvatarDisplay } from "@/components/avatar-display";

export function AvatarPicker({
  initialImage,
  name,
}: {
  initialImage: string | null | undefined;
  name: string;
}) {
  const existing = parseAvatarPreset(initialImage);
  const [colorId, setColorId] = useState(existing?.colorId || AVATAR_COLORS[0].id);
  const [icon, setIcon] = useState<string | null>(existing?.icon || null);
  const [saving, setSaving] = useState(false);

  const previewValue = encodeAvatarPreset(colorId, icon);
  const isUnchanged = initialImage === previewValue || (!initialImage && icon === null && colorId === AVATAR_COLORS[0].id && !existing);

  async function handleSave() {
    setSaving(true);
    await authClient.updateUser(
      { image: previewValue },
      {
        onSuccess: () => {
          toast.success("Avatar updated");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Couldn't save your avatar.");
        },
        onResponse: () => setSaving(false),
      }
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <AvatarDisplay image={previewValue} name={name} className="h-16 w-16 text-xl" />
        <p className="text-sm text-muted-foreground">
          Pick a color and, if you like, an icon, no file to upload, and it
          looks the same on every device you sign in from.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Color</p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => setColorId(color.id)}
              aria-label={color.label}
              title={color.label}
              className={`relative h-9 w-9 rounded-full ${color.className} ${
                colorId === color.id ? "ring-2 ring-offset-2 ring-foreground" : ""
              }`}
            >
              {colorId === color.id && (
                <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Icon (optional, otherwise your initials)</p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_ICONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setIcon(opt.emoji)}
              title={opt.label}
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-base transition-colors ${
                icon === opt.emoji
                  ? "border-foreground bg-muted"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              {opt.emoji ?? <span className="text-xs font-semibold">Aa</span>}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving || isUnchanged}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save avatar
      </Button>
    </div>
  );
}
