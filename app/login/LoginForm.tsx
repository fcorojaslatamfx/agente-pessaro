"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const noAccess = searchParams.get("error") === "no_access";
  const next = searchParams.get("next") ?? "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Credenciales inválidas.");
      setPending(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm p-8 shadow-lg shadow-black/20">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          P
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Pessaro AI Content Agent</h1>
          <p className="text-xs text-muted-foreground">Inicia sesión con tu cuenta del CRM de Pessaro.</p>
        </div>
      </div>

      {noAccess && (
        <p className="mb-4 rounded-md border border-gold/30 bg-gold/10 p-3 text-sm text-gold-light">
          Tu cuenta no tiene acceso a este módulo. Contacta a un super admin.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>
    </Card>
  );
}
