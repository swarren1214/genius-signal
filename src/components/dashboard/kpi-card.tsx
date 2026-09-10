"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
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
  value: number;
  suffix?: string;
  delta?: number;
  icon: KpiIconName;
  accent?: "brand" | "positive" | "negative";
}

function CountUp({ value, suffix }: Readonly<{ value: number; suffix?: string }>) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 1.2, bounce: 0 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return (
    <span className="tabular-nums">
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  suffix,
  delta,
  icon,
  accent = "brand",
}: Readonly<KpiCardProps>) {
  const isPositive = (delta ?? 0) >= 0;
  const Icon = iconRegistry[icon];

  return (
    <Card className="glass-panel relative overflow-hidden py-0">
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1 bg-primary",
          accent === "negative" && "opacity-60"
        )}
      />
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">
            <CountUp value={value} suffix={suffix} />
          </p>
          {delta !== undefined && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                isPositive ? "text-emerald-500" : "text-rose-500"
              )}
            >
              {isPositive ? "+" : ""}
              {delta}% vs last week
            </p>
          )}
        </div>
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}
