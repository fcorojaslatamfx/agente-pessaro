import { redirect } from "next/navigation";
import { requireAgentAccess } from "@/lib/auth/dal";
import GenerateForm from "./GenerateForm";

export default async function GeneratePage() {
  const session = await requireAgentAccess();
  if (!session.profile.permissions.can_generate_content && !session.profile.isSuperAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Generar contenido</h1>
        <p className="text-sm text-muted-foreground">
          El agente redacta blog, LinkedIn, Instagram, Facebook y brief visual en un solo borrador.
          Queda en estado &quot;pending_review&quot; hasta que sea aprobado.
        </p>
      </div>
      <GenerateForm />
    </div>
  );
}
