"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { publishToPlatform, type PublishablePlatform } from "@/lib/content/publish-actions";
import { Button } from "@/components/ui/Button";

const PLATFORM_LABELS: Record<PublishablePlatform, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook_page: "Facebook (Página)",
};

export type PlatformPublishState = {
  platform: PublishablePlatform;
  connected: boolean;
  lastStatus: "pending" | "published" | "failed" | null;
  lastError: string | null;
};

export default function PublishActions({
  outputId,
  platforms,
}: {
  outputId: string;
  platforms: PlatformPublishState[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<PublishablePlatform | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handlePublish(platform: PublishablePlatform) {
    setPending(platform);
    setErrors((prev) => ({ ...prev, [platform]: "" }));
    const result = await publishToPlatform(outputId, platform);
    setPending(null);
    if (!result.ok) {
      setErrors((prev) => ({ ...prev, [platform]: result.error }));
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {platforms.map(({ platform, connected, lastStatus, lastError }) => (
        <div key={platform} className="flex flex-col gap-1 rounded-md border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">{PLATFORM_LABELS[platform]}</span>
            {!connected ? (
              <Link href="/settings/connections" className="text-xs text-primary underline">
                Reconecta tu cuenta en Postiz
              </Link>
            ) : lastStatus === "published" || lastStatus === "pending" ? (
              <span className="text-xs font-medium text-success">
                {lastStatus === "pending" ? "Enviado a Postiz" : "Publicado"}
              </span>
            ) : (
              <Button onClick={() => handlePublish(platform)} disabled={pending !== null}>
                {pending === platform ? "Publicando…" : "Publicar ahora"}
              </Button>
            )}
          </div>
          {(errors[platform] || lastError) && (
            <p className="text-xs text-destructive">{errors[platform] || lastError}</p>
          )}
        </div>
      ))}
    </div>
  );
}
