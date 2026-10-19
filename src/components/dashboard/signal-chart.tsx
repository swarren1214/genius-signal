"use client";

import { useId, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import type { UsagePoint } from "@/lib/types";

export function SignalChart({ data }: Readonly<{ data: UsagePoint[] }>) {
  const gradientId = useId().replaceAll(":", "");
  const [metric, setMetric] = useState<"visitors" | "events">("visitors");
  if (!data.length) return <p className="flex h-52 items-center justify-center text-xs text-muted-foreground">No retrieved history is available.</p>;
  return <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] text-muted-foreground">{data[0].date} – {data.at(-1)?.date} · UTC</p><fieldset aria-label="Chart metric" className="flex rounded-full bg-muted p-0.5"><Button size="xs" variant={metric === "visitors" ? "secondary" : "ghost"} aria-pressed={metric === "visitors"} onClick={() => setMetric("visitors")}>Active visitors</Button><Button size="xs" variant={metric === "events" ? "secondary" : "ghost"} aria-pressed={metric === "events"} onClick={() => setMetric("events")}>Events</Button></fieldset></div>
    <div className="h-56 w-full min-w-0" role="img" aria-label={`Daily ${metric === "visitors" ? "active visitors" : "events"} from Pendo`}><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 640, height: 224 }}><AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}><defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.2} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="date" tickFormatter={(date: string) => date.slice(5)} minTickGap={30} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} /><YAxis domain={[0, "auto"]} tickFormatter={(value: number) => Intl.NumberFormat("en", { notation: "compact" }).format(value)} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} /><Tooltip contentStyle={{ background: "var(--popover)", color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} formatter={(value) => Number(value).toLocaleString()} /><Area type="monotone" dataKey={metric} name={metric === "visitors" ? "Active visitors" : "Events"} stroke="var(--chart-1)" fill={`url(#${gradientId})`} strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div>
    <p className="text-[10px] leading-5 text-muted-foreground">Completed UTC days. Daily visitors are distinct per day; they are not summed to calculate weekly active users.</p>
  </div>;
}