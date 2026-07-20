"use client";

import { useState } from "react";

export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
    >
      {copied ? "Copiado ✓" : `Copiar ${label}`}
    </button>
  );
}
