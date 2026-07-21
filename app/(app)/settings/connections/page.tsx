import { requireAgentAccess } from "@/lib/auth/dal";
import { getPostizIntegrationsForMapping, getVisibleSocialConnections } from "@/lib/content/social-actions";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import SocialConnectionsForm from "./SocialConnectionsForm";

export default async function SocialConnectionsPage() {
  const session = await requireAgentAccess();
  const [integrationsResult, connections] = await Promise.all([
    getPostizIntegrationsForMapping(),
    getVisibleSocialConnections(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Conexiones de RRSS</h1>
        <p className="text-sm text-muted-foreground">
          Las cuentas se conectan en el panel de Postiz Cloud (ahí ocurre el OAuth con LinkedIn/Meta).
          Acá solo vinculas el canal ya conectado a tu usuario para poder publicar desde el agente.
        </p>
      </div>

      {!integrationsResult.ok ? (
        <Card className="flex flex-col gap-2">
          <p className="text-sm text-destructive">{integrationsResult.error}</p>
          <p className="text-sm text-muted-foreground">
            Si el error es de configuración, un super_admin debe agregar <code>POSTIZ_API_KEY</code> en Vercel.
          </p>
        </Card>
      ) : integrationsResult.integrations.length === 0 ? (
        <EmptyState
          title="Sin canales conectados en Postiz"
          description="Conecta LinkedIn, Instagram o la Página de Facebook desde el panel de Postiz Cloud primero."
        />
      ) : (
        <SocialConnectionsForm
          integrations={integrationsResult.integrations}
          connections={connections}
          isSuperAdmin={session.profile.isSuperAdmin}
        />
      )}
    </div>
  );
}
