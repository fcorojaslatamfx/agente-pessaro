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
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold">Pessaro AI Content Agent</span>
          <nav className="flex gap-4 text-sm">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span>{profile.displayName ?? session.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
