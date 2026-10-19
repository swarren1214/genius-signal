"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Download, RefreshCw } from "lucide-react";
import { PageHero } from "@/components/dashboard/page-hero";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SignalChart } from "@/components/dashboard/signal-chart";
import { SourceStatus } from "@/components/dashboard/source-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { postJson } from "@/lib/client-api";
import type { AnalyticsSnapshot } from "@/lib/types";

export function AnalyticsWorkspace({
  data,
}: Readonly<{ data: AnalyticsSnapshot }>) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const rows = data.features.filter(
    (row) =>
      filter === "all" ||
      (filter === "opportunity"
        ? row.adoption !== null && row.adoption < 50
        : row.adoption !== null && row.adoption >= 50),
  );
  const available = data.weeklyActiveUsers !== null;
  async function run(action: "refresh" | "save-report") {
    setPending(true);
    setStatus("");
    try {
      await postJson(
        "/api/workspace",
        action === "refresh" ? { action, source: "pendo" } : { action, filter },
      );
      setStatus(
        action === "refresh"
          ? "Refresh completed."
          : "Snapshot saved to the workspace database.",
      );
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setPending(false);
    }
  }
  function exportCsv() {
    const escape = (value: string | number) =>
      `"${String(value).replaceAll('"', '""')}"`;
    const csv = [
      "Feature ID,Feature,Visitors,Events,Per-app visitor adoption (%),Feature app ID,Selected scope IDs,Period end",
      ...rows.map((row) =>
        [
          row.id,
          row.name,
          row.visitors,
          row.events,
          row.adoption ?? "",
          row.appId,
          data.appId,
          data.endDate,
        ]
          .map(escape)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `pendo-features-${data.endDate.slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="space-y-5">
      <PageHero
        eyebrow={`Pendo / ${data.appName}`}
        title="Understand what moves your product."
        description="Application-scoped usage from completed Pendo reporting days, with source health and real feature activity."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => run("refresh")}
            >
              <RefreshCw
                className={`size-3.5 ${pending ? "animate-spin motion-reduce:animate-none" : ""}`}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending || !available}
              onClick={() => run("save-report")}
            >
              <Bookmark className="size-3.5" />
              Save snapshot
            </Button>
          </div>
        }
      />
      <SourceStatus name="Pendo" health={data.health} />
      <p className="break-words font-mono text-[10px] text-muted-foreground">
        SELECTED APPS{" "}
        {(data.appIds ?? [data.appId]).filter(Boolean).join(" · ") || "NOT SET"}{" "}
        · {data.startDate.slice(0, 10)} – {data.endDate.slice(0, 10)}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Weekly active visitors"
          value={data.weeklyActiveUsers}
          delta={data.weeklyChange}
          icon="users"
          note="Distinct visitors · last 7 completed days"
        />
        <KpiCard
          label="Daily active visitors"
          value={data.dailyActiveUsers}
          icon="click"
          note="Last completed Pendo reporting day"
        />
        <KpiCard
          label="Weekly active accounts"
          value={data.activeAccounts}
          icon="gauge"
          note="Distinct nonempty account IDs"
        />
        <KpiCard
          label="Weekly events"
          value={data.totalEvents}
          icon="trending-up"
          note="Observed events · last 7 completed days"
        />
      </div>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Coverage and metric definitions</CardTitle>
          <p className="text-xs text-muted-foreground">
            Every visitor in the selected apps. No restaurant-type or
            customer-segment filter is configured.
          </p>
        </CardHeader>
        <CardContent>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-120 text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-3 font-normal">Application</th>
                  <th className="pb-3 font-normal">ID</th>
                  <th className="pb-3 font-normal">Weekly visitors</th>
                  <th className="pb-3 font-normal">Weekly events</th>
                </tr>
              </thead>
              <tbody>
                {data.apps?.map((app) => (
                  <tr key={app.appId} className="border-t border-border">
                    <td className="py-3">{app.appName}</td>
                    <td className="font-mono text-[10px]">{app.appId}</td>
                    <td className="tabular-nums">
                      {app.visitors.toLocaleString()}
                    </td>
                    <td className="tabular-nums">
                      {app.events.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[10px] leading-5 text-muted-foreground">
            Overall visitors and accounts count each ID once across selected
            apps. Per-app visitors can overlap and must not be added together.
            Events are observed activity across the selected apps. Weekly
            comparisons use two consecutive completed 7-day reporting windows.
          </p>
          <Link
            href="/settings"
            className="mt-3 inline-block text-xs text-primary"
          >
            Change selected applications →
          </Link>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Daily application activity</CardTitle>
          <p className="text-xs text-muted-foreground">
            Fourteen completed days of app-scoped events
          </p>
        </CardHeader>
        <CardContent>
          <SignalChart data={data.daily} />
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Tagged feature performance</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Top features by distinct users in the last 7 completed days.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              items={[
                { value: "all", label: "All features" },
                { value: "opportunity", label: "Adoption below 50%" },
                { value: "healthy", label: "Adoption 50% or higher" },
              ]}
              value={filter}
              onValueChange={(value) => setFilter(value ?? "all")}
            >
              <SelectTrigger aria-label="Filter features">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All features</SelectItem>
                <SelectItem value="opportunity">Adoption below 50%</SelectItem>
                <SelectItem value="healthy">Adoption 50% or higher</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              disabled={!rows.length}
              onClick={exportCsv}
            >
              <Download className="size-3.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.featureError ? (
            <p className="text-xs text-amber-600 dark:text-amber-200">
              {data.featureError}
            </p>
          ) : rows.length ? (
            <div className="max-w-full overflow-x-auto">
              <table className="w-full min-w-160 text-left text-xs">
                <thead className="bg-muted/50 font-mono text-[9px] uppercase text-muted-foreground">
                  <tr>
                    {[
                      "Feature",
                      "Application",
                      "Distinct visitors",
                      "Events",
                      "App adoption",
                      "Source ID",
                    ].map((heading) => (
                      <th key={heading} className="px-3 py-3 font-normal">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={`${row.appId}:${row.id}`}
                      className="border-b border-border"
                    >
                      <td className="px-3 py-4 font-medium">{row.name}</td>
                      <td className="px-3 text-muted-foreground">
                        {data.apps?.find((app) => app.appId === row.appId)
                          ?.appName ?? row.appId}
                      </td>
                      <td className="px-3 tabular-nums">
                        {row.visitors.toLocaleString()}
                      </td>
                      <td className="px-3 tabular-nums">
                        {row.events.toLocaleString()}
                      </td>
                      <td className="px-3 tabular-nums">
                        {row.adoption === null
                          ? "Unavailable"
                          : `${row.adoption}%`}
                      </td>
                      <td className="px-3 font-mono text-[9px] text-muted-foreground">
                        {row.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-xs text-muted-foreground">
              No retrieved features match this filter.
            </p>
          )}
          <p className="mt-4 text-[10px] leading-5 text-muted-foreground">
            Adoption is feature visitors divided by distinct visitors in the
            associated application, not visitors across the full selected scope
            or eligible restaurant locations. No activation funnel, sessions, or
            retention are inferred.
          </p>
          <Link
            href="/settings"
            className="mt-3 inline-block text-xs text-primary"
          >
            Saved snapshots and source settings →
          </Link>
        </CardContent>
      </Card>
      {status && (
        <output className="block text-xs text-muted-foreground">
          {status}
        </output>
      )}
    </div>
  );
}
