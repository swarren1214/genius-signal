import { InsightsWorkspace, type EvidenceSource } from "@/components/dashboard/insights-workspace";
import { listRecords } from "@/lib/database";
import { getDigestState } from "@/lib/services/ai";
import type { AnalyticsSnapshot, Digest, NewsArticle, WorkspaceAction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function InsightsPage() {
  const sources: EvidenceSource[] = [
    ...listRecords<NewsArticle>("article").map((article) => ({ id: article.id, title: article.title, detail: `${article.source} · ${article.publishedAt.slice(0, 10)} · retrieved ${article.fetchedAt.slice(0, 10)}`, href: article.url })),
    ...listRecords<AnalyticsSnapshot>("analytics").map((snapshot) => ({ id: `pendo:${snapshot.appId}:${snapshot.endDate.slice(0, 10)}`, title: `Pendo snapshot · ${snapshot.appName}`, detail: `App ${snapshot.appId} · period ending ${snapshot.endDate.slice(0, 10)} · weekly active visitors ${snapshot.weeklyActiveUsers?.toLocaleString() ?? "unavailable"}`, href: "/analytics" })),
  ];
  return <InsightsWorkspace digests={listRecords<Digest>("digest")} health={getDigestState().health} sources={sources} actions={listRecords<WorkspaceAction>("action")} slackConfigured={Boolean(process.env.SLACK_WEBHOOK_URL)} />;
}