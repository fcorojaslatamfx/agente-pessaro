"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mapPostizIntegration } from "@/lib/content/social-actions";
import type { MappablePostizIntegration, MyConnection } from "@/lib/content/social-actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn (personal)",
  instagram: "Instagram",
  facebook_page: "Página de Facebook (corporativa)",
};

export default function SocialConnectionsForm({
  integrations,
  connections,
  isSuperAdmin,
}: {
  integrations: MappablePostizIntegration[];
  connections: MyConnection[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleMap(integration: MappablePostizIntegration) {
    if (!integration.platform) return;
    setPending(integration.id);
    setError(null);
    const result = await mapPostizIntegration(integration.platform, integration.id, integration.name);
    setPending(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const mappedIds = new Set(connections.map((c) => c.postiz_integration_id).filter(Boolean));

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {integrations.map((integration) => {
        const isCorporate = integration.platform === "facebook_page";
        const alreadyMapped = mappedIds.has(integration.id);
        const canMap = integration.platform !== null && (!isCorporate || isSuperAdmin);

        return (
          <Card key={integration.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">{integration.name}</p>
              <p className="text-xs text-muted-foreground">
                {integration.platform ? PLATFORM_LABELS[integration.platform] : `Sin soporte (${integration.identifier})`}
              </p>
            </div>
            {alreadyMapped ? (
              <span className="text-xs font-medium text-success">Vinculada</span>
            ) : canMap ? (
              <Button onClick={() => handleMap(integration)} disabled={pending !== null}>
                {pending === integration.id
                  ? "Vinculando…"
                  : isCorporate
                    ? "Vincular como corporativa"
                    : "Vincular a mi cuenta"}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                {isCorporate ? "Solo super_admin" : "Plataforma no soportada"}
              </span>
            )}
          </Card>
        );
      })}
    </div>
  );
}
