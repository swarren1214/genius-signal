import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}>) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-primary p-6 text-primary-foreground sm:p-8">
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider opacity-80">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm opacity-90">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
    </div>
  );
}
