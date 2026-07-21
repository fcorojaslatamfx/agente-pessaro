import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("card-premium rounded-lg border border-border bg-card p-4", className)}
      {...props}
    />
  );
}

export function SectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-sm font-semibold uppercase tracking-wide text-muted-foreground", className)}>
      {children}
    </h2>
  );
}
