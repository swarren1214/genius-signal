import { listRecords, recordAudit, writeRecord } from "@/lib/store";
import { randomUUID } from "node:crypto";
import type { Digest } from "@/lib/types";

export async function sendInsightToSlack(insightId: string) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) throw new Error("Slack is not configured.");
  const url = new URL(webhook);
  if (
    url.protocol !== "https:" ||
    !["hooks.slack.com", "hooks.slack-gov.com"].includes(url.hostname)
  )
    throw new Error("Only official Slack webhook URLs are supported.");
  const insight = listRecords<Digest>("digest")
    .flatMap((digest) => digest.insights)
    .find((item) => item.id === insightId);
  if (!insight) throw new Error("Generated insight not found.");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `Genius Signal\n${insight.title}\n${insight.summary}\nRecommendation: ${insight.recommendation}\nSource IDs: ${insight.sourceIds.join(", ")}`,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(`Slack delivery failed (${response.status}).`);
  const id = randomUUID();
  writeRecord("alert", id, {
    id,
    insightId,
    deliveredAt: new Date().toISOString(),
    channel: "Slack",
  });
  recordAudit("alert.delivered", insightId);
}
