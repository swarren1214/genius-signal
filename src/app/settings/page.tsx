import { SettingsWorkspace } from "@/components/dashboard/settings-workspace";
import { getPendoAnalytics } from "@/lib/services/pendo-analytics";
import { getNewsFeed } from "@/lib/data/news";
import { getDigestState } from "@/lib/services/ai";
import { resolvePendoScope } from "@/lib/pendo-scope";
import {
  getAuditLog,
  getBrands,
  listRecords,
  readRecord,
} from "@/lib/store";
import type {
  AnalyticsSnapshot,
  SourceHealth,
  WorkspaceAction,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [pendo, news] = await Promise.all([getPendoAnalytics(), getNewsFeed()]);
  let scopeApps: { appId: string; appName: string }[];
  try {
    scopeApps = resolvePendoScope(readRecord("settings", "pendo"), {
      appId: process.env.PENDO_APP_IDS ?? process.env.PENDO_APP_ID ?? "",
      appName: process.env.PENDO_APP_NAME ?? "",
    }).apps;
  } catch {
    scopeApps = [{ appId: "", appName: "" }];
  }
  const alert = listRecords<{ deliveredAt: string }>("alert")[0];
  const slack: SourceHealth = process.env.SLACK_WEBHOOK_URL
    ? {
        status: alert ? "connected" : "unavailable",
        fetchedAt: alert?.deliveredAt ?? null,
        error: alert
          ? undefined
          : "A webhook is configured, but no delivery has been confirmed.",
      }
    : {
        status: "unconfigured",
        fetchedAt: null,
        error: "SLACK_WEBHOOK_URL is not configured.",
      };
  const scheduler = readRecord<SourceHealth>("source", "scheduler") ?? {
    status: "unconfigured" as const,
    fetchedAt: null,
    error: process.env.CRON_SECRET
      ? "An ingestion token is configured; no scheduler invocation has been recorded."
      : "CRON_SECRET and an external scheduler are not configured.",
  };
  return (
    <SettingsWorkspace
      brands={getBrands()}
      apps={scopeApps}
      appName={pendo.appName}
      sources={[
        { name: "Pendo", health: pendo.health },
        { name: news.provider, health: news },
        { name: "OpenAI", health: getDigestState().health },
        { name: "Slack delivery", health: slack },
        { name: "Scheduled ingestion", health: scheduler },
      ]}
      actions={listRecords<WorkspaceAction>("action")}
      reports={listRecords<{
        id: string;
        createdAt: string;
        analytics: AnalyticsSnapshot;
      }>("report")}
      audit={getAuditLog()}
      authenticated={Boolean(
        process.env.SIGNAL_AUTH_USER && process.env.SIGNAL_AUTH_PASSWORD,
      )}
    />
  );
}
