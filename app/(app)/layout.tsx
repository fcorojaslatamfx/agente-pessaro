import Link from "next/link";
import { requireAgentAccess } from "@/lib/auth/dal";
import SignOutButton from "./SignOutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAgentAccess();
  const { profile } = session;

  const navItems = [
    { href: "/dashboard", label: "Panel" },
    { href: "/generate", label: "Generar" },
    { href: "/review", label: "Revisión" },
    { href: "/history", label: "Historial" },
    { href: "/calendar", label: "Calendario" },
    ...(profile.isSuperAdmin ? [{ href: "/admin/permissions", label: "Permisos" }] : []),
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              P
            </div>
            <span className="text-sm font-semibold text-foreground">Pessaro AI Content Agent</span>
          </Link>
          <nav className="flex gap-5 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{profile.displayName ?? session.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
