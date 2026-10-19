import { CircleCheck, CircleAlert, Clock } from "lucide-react";
import type { SourceHealth } from "@/lib/types";

export function SourceStatus({
  name,
  health,
}: Readonly<{ name: string; health: SourceHealth }>) {
  const Icon =
    health.status === "connected"
      ? CircleCheck
      : health.status === "stale"
        ? Clock
        : CircleAlert;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      <span
        className={`inline-flex items-center gap-1.5 ${health.status === "connected" ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-200"}`}
      >
        <Icon className="size-3.5" />
        {name} · {health.status}
      </span>
      {health.fetchedAt && (
        <time dateTime={health.fetchedAt}>
          Retrieved{" "}
          {new Date(health.fetchedAt).toLocaleString("en-US", {
            timeZone: "UTC",
          })}{" "}
          UTC
        </time>
      )}
      {health.error && <span>{health.error}</span>}
    </div>
  );
}
