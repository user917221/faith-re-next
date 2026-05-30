"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarFallbackStyle, initialsOf } from "@/lib/avatar";

/**
 * AvatarUpload — téléversement d'un portrait (max 5 Mo). L'image est
 * redimensionnée côté client (≤ 512 px) puis stockée en data URL dans
 * `avatarUrl` (pas de backend de fichiers requis). On peut aussi coller une URL.
 */
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DIM = 512;

async function toDownscaledDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("img"));
    img.src = raw;
  });
  const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function AvatarUpload({
  name,
  value,
  onChange,
  disabled,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Fichier image requis");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image trop lourde (5 Mo max)");
      return;
    }
    setBusy(true);
    try {
      onChange(await toDownscaledDataUrl(file));
    } catch {
      toast.error("Impossible de lire l'image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-12 rounded-lg ring-1 ring-border">
        <AvatarImage src={value || undefined} alt="" className="rounded-lg object-cover" />
        <AvatarFallback className="rounded-lg text-sm" style={avatarFallbackStyle(name || "?")}>
          {initialsOf(name || "?")}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-md border border-border bg-background/40 px-2.5 py-1.5 text-xs text-foreground-muted transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-40"
          >
            <Upload size={13} /> {busy ? "Traitement…" : "Téléverser"}
          </button>
          {value && (
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => onChange("")}
              className="flex items-center gap-1 text-xs text-foreground-subtle transition-colors hover:text-hp"
            >
              <X size={12} /> Retirer
            </button>
          )}
        </div>
        <span className="font-mono text-[10px] text-foreground-subtle">
          JPG / PNG · 5 Mo max
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
