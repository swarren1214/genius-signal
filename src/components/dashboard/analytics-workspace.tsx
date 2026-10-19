"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bookmark, CalendarDays, Download } from "lucide-react";
import { SignalChart } from "@/components/dashboard/signal-chart";
import { PageHero } from "@/components/dashboard/page-hero";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnalyticsResult } from "@/lib/data/analytics";

const featureRows = [
  {
    feature: "Tableside Pay",
    area: "Payments",
    adoption: 47,
    change: 12,
    uses: 3.8,
  },
  {
    feature: "Order management",
    area: "Core workflow",
    adoption: 84,
    change: 2,
    uses: 18.2,
  },
  {
    feature: "Kitchen display",
    area: "Operations",
    adoption: 57,
    change: 5,
    uses: 12.4,
  },
  {
    feature: "Loyalty & rewards",
    area: "Retention",
    adoption: 31,
    change: -3,
    uses: 2.1,
  },
  {
    feature: "Menu management",
    area: "Operations",
    adoption: 68,
    change: 1,
    uses: 4.6,
  },
];

export function AnalyticsWorkspace({
  data,
}: Readonly<{ data: AnalyticsResult }>) {
  const [filter, setFilter] = useState("all");
  const [saved, setSaved] = useState(false);
  const rows = featureRows.filter(
    (row) =>
      filter === "all" ||
      (filter === "opportunity" ? row.adoption < 50 : row.adoption >= 50),
  );
  function exportCsv() {
    const csv = [
      "Feature,Product area,Adoption (%),Weekly change (%),Uses per user,Data source",
      ...rows.map(
        (row) =>
          `${row.feature},${row.area},${row.adoption},${row.change},${row.uses},Illustrative demo data`,
      ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "genius-feature-performance-demo.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  function saveReport() {
    try {
      localStorage.setItem(
        "signal-saved-report",
        JSON.stringify({
          filter,
          period: "Sept 1–8, 2026",
          savedAt: new Date().toISOString(),
        }),
      );
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Product pulse / Sept 1–8, 2026"
        title="Understand what moves your product."
        description="Follow usage, uncover adoption gaps and focus on the workflows that matter."
        actions={
          <Button variant="secondary" size="sm" onClick={saveReport}>
            <Bookmark className="size-3.5" />
            {saved ? "Report saved" : "Save report"}
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs">
            <CalendarDays className="size-3.5 text-muted-foreground" />
            Sept 1–8, 2026
          </span>
          <span className="text-xs text-muted-foreground">
            All restaurant locations
          </span>
        </div>
        <span className="font-mono text-[9px] text-muted-foreground">
          {data.isLive ? "PENDO CONNECTED · LIVE WAU" : "SAMPLE ANALYTICS"} /
          DEMO TRENDS
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Weekly active users"
          value={data.weeklyActiveUsers}
          delta={0}
          icon="users"
          note={data.isLive ? "Current Pendo metric" : "Sample metric"}
        />
        <KpiCard
          label="Feature adoption"
          value={47}
          suffix="%"
          delta={12}
          icon="click"
          note="Tableside Pay · reference week"
        />
        <KpiCard
          label="Sessions / active user"
          value={5.8}
          delta={6}
          icon="trending-up"
          note="Illustrative demo metric"
        />
        <KpiCard
          label="4-week retention"
          value={82.4}
          suffix="%"
          delta={2.1}
          icon="gauge"
          note="Illustrative demo metric"
        />
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[1.65fr_1fr]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Engagement through the week</CardTitle>
            <p className="text-xs text-muted-foreground">
              Daily active users · unique users per day
            </p>
          </CardHeader>
          <CardContent>
            <SignalChart kind="engagement" />
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tableside Pay adoption</CardTitle>
            <Link
              href="/insights"
              aria-label="Investigate Tableside Pay adoption"
            >
              <ArrowUpRight className="size-4 text-primary" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-normal">47%</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-300/80">
                +12% vs last week
              </span>
            </div>
            {[
              { label: "Eligible locations", count: "10,000", percent: 100 },
              { label: "Enabled Tableside Pay", count: "6,200", percent: 62 },
              { label: "Completed first payment", count: "4,700", percent: 47 },
            ].map((step) => (
              <div key={step.label}>
                <div className="mb-2 flex justify-between gap-3 text-[11px] text-muted-foreground">
                  <span>{step.label}</span>
                  <span className="font-mono">
                    {step.count} · {step.percent}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-chart-1"
                    style={{
                      width: `${step.percent}%`,
                      opacity: step.percent === 47 ? 1 : 0.5,
                    }}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs leading-5 text-muted-foreground">
              Largest opportunity: 1,500 enabled locations have not completed a
              first payment.
            </p>
            <p className="text-[10px] text-muted-foreground">
              Illustrative location funnel · denominator: eligible locations
            </p>
          </CardContent>
        </Card>
      </div>
      <Card className="shadow-none">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Feature performance</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Find the workflows driving engagement, and where to look next.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              items={[
                { value: "all", label: "All features" },
                { value: "opportunity", label: "Adoption opportunities" },
                { value: "healthy", label: "High adoption" },
              ]}
              value={filter}
              onValueChange={(value) => setFilter(value ?? "all")}
            >
              <SelectTrigger aria-label="Filter features">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All features</SelectItem>
                <SelectItem value="opportunity">
                  Adoption opportunities
                </SelectItem>
                <SelectItem value="healthy">High adoption</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={exportCsv}>
              <Download className="size-3.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-muted/60 font-mono text-[9px] uppercase text-muted-foreground">
                <tr>
                  {[
                    "Feature",
                    "Product area",
                    "Adoption",
                    "Weekly change",
                    "Uses / user",
                    "Signal",
                  ].map((heading) => (
                    <th key={heading} className="px-3 py-2 font-normal">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-border first:bg-accent/20"
                  >
                    <td className="px-3 py-4 font-medium">{row.feature}</td>
                    <td className="px-3 text-muted-foreground">{row.area}</td>
                    <td className="px-3 tabular-nums">{row.adoption}%</td>
                    <td
                      className={`px-3 tabular-nums ${row.change >= 0 ? "text-emerald-600 dark:text-emerald-300/80" : "text-rose-500"}`}
                    >
                      {row.change > 0 ? "+" : ""}
                      {row.change}%
                    </td>
                    <td className="px-3 tabular-nums">{row.uses}</td>
                    <td className="px-3">
                      {row.adoption < 50 ? (
                        <Link href="/insights" className="text-primary">
                          Investigate activation →
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Healthy</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground">
            Demo feature-level data · weekly change is relative, not percentage
            points.
          </p>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {data.isLive ? "Current Pendo metrics" : "Sample metrics"}:{" "}
            {data.dailyActiveUsers.toLocaleString()} daily active users ·{" "}
            {data.totalVisitors.toLocaleString()} tracked visitors.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
