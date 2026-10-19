"use client";

import { useId, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";

const adoptionTrend = [
  30, 31, 34, 35, 34.5, 37, 38, 43, 41.5, 46, 45, 44, 45.5, 47,
];
const engagementTrend = [440, 520, 500, 630, 590, 710, 660, 690];

export function SignalChart({
  kind = "adoption",
}: Readonly<{ kind?: "adoption" | "engagement" }>) {
  const gradientId = useId().replaceAll(":", "");
  const [weekly, setWeekly] = useState(false);
  const isAdoption = kind === "adoption";
  const engagementValues = weekly ? [390, 465, 540, 625] : engagementTrend;
  const values = isAdoption ? adoptionTrend : engagementValues;
  const data = values.map((value, index) => ({
    date:
      weekly && !isAdoption
        ? `Week ${index + 1}`
        : `Sep ${Math.round((index / (values.length - 1)) * 7) + 1}`,
    value,
    previous: Math.round(value * 0.88),
  }));

  return (
    <div className="min-w-0 space-y-3">
      {!isAdoption && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] text-muted-foreground">
            <span className="text-primary">━</span> Sept 1–8{" "}
            <span className="ml-3">┄ Previous period</span>
          </p>
          <fieldset
            aria-label="Chart interval"
            className="flex rounded-md bg-muted p-0.5"
          >
            <Button
              variant={weekly ? "ghost" : "secondary"}
              size="xs"
              aria-pressed={!weekly}
              onClick={() => setWeekly(false)}
            >
              Daily
            </Button>
            <Button
              variant={weekly ? "secondary" : "ghost"}
              size="xs"
              aria-pressed={weekly}
              onClick={() => setWeekly(true)}
            >
              Weekly
            </Button>
          </fieldset>
        </div>
      )}
      <div
        className="h-52 w-full min-w-0"
        role="img"
        aria-label={`Illustrative ${isAdoption ? "adoption" : "engagement"} trend for September 1–8, 2026`}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 640, height: 208 }}
        >
          <AreaChart
            data={data}
            margin={{ top: 12, right: 8, bottom: 0, left: -20 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.18}
                />
                <stop
                  offset="100%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              minTickGap={45}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={isAdoption ? [25, 50] : [300, 800]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickFormatter={(value: number) =>
                `${value}${isAdoption ? "%" : "k"}`
              }
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                color: "var(--foreground)",
                fontSize: 11,
              }}
              formatter={(value) => `${value}${isAdoption ? "%" : "k users"}`}
            />
            {!isAdoption && (
              <Area
                type="linear"
                dataKey="previous"
                name="Previous period"
                stroke="var(--muted-foreground)"
                strokeDasharray="4 5"
                fill="transparent"
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            )}
            <Area
              type={isAdoption ? "monotone" : "linear"}
              dataKey="value"
              name={isAdoption ? "Adoption" : "Active users"}
              stroke="var(--chart-1)"
              fill={`url(#${gradientId})`}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] leading-5 text-muted-foreground">
        Illustrative{" "}
        {isAdoption
          ? "daily trend; reported adoption: 47%."
          : "engagement series; not live Pendo history."}{" "}
        Week of Sept 1–8, 2026.
      </p>
    </div>
  );
}
