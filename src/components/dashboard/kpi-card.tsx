"use client";

import {
  Gauge,
  MousePointerClick,
  Newspaper,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Icons are resolved by key rather than accepting a component reference, so this card
// can be used from Server Components without passing a function across the RSC boundary.
const iconRegistry = {
  "trending-up": TrendingUp,
  gauge: Gauge,
  sparkles: Sparkles,
  newspaper: Newspaper,
  users: Users,
  click: MousePointerClick,
  star: Star,
} satisfies Record<string, LucideIcon>;

export type KpiIconName = keyof typeof iconRegistry;

interface KpiCardProps {
  label: string;
  value: number | null;
  suffix?: string;
  delta?: number | null;
  icon: KpiIconName;
  note?: string;
  accent?: "brand" | "positive" | "negative";
}

function CountUp({ value, suffix }: Readonly<{ value: number | null; suffix?: string }>) {
  return (
    <span className="tabular-nums">
      {value === null ? "Unavailable" : value.toLocaleString(undefined, { minimumFractionDigits: value % 1 ? 1 : 0, maximumFractionDigits: value % 1 ? 1 : 0 })}
      {value !== null && suffix}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  suffix,
  delta,
  icon,
  note = "vs last week",
  accent = "brand",
}: Readonly<KpiCardProps>) {
  const isPositive = (delta ?? 0) >= 0;
  const Icon = iconRegistry[icon];

  return (
    <Card className={cn("glass-panel relative overflow-hidden py-0 shadow-none", accent === "negative" && "border-destructive/30")}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <p className="text-3xl font-normal">
            <CountUp value={value} suffix={suffix} />
          </p>
          {delta !== undefined && delta !== null && (
            <p
              className={cn(
                "font-mono text-[11px]",
                isPositive ? "text-emerald-600 dark:text-emerald-300/80" : "text-rose-600 dark:text-rose-300/80"
              )}
            >
              {isPositive ? "+" : ""}
              {delta}%
            </p>
          )}
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
