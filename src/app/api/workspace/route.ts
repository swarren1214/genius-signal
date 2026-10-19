import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { checkWriteOrigin, parseBody } from "@/lib/api";
import { deleteRecord, getAuditLog, getBrands, listRecords, readRecord, recordAudit, writeRecord } from "@/lib/database";
import { getPendoAnalytics } from "@/lib/services/pendo-analytics";
import { getNewsFeed } from "@/lib/data/news";
import { getDigestState } from "@/lib/services/ai";
import type { Digest, WorkspaceAction } from "@/lib/types";
import { sendInsightToSlack } from "@/lib/services/alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const id = z.string().min(1).max(200);
const brandSchema = z.object({ id: z.string().regex(/^[a-z0-9-]{1,60}$/), name: z.string().trim().min(1).max(150), isOwnBrand: z.boolean().optional(), newsSearchTerms: z.array(z.string().trim().min(1).max(100)).min(1).max(10) });
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("bookmark"), kind: z.enum(["news", "insights"]), id, saved: z.boolean() }),
  z.object({ action: z.literal("create-action"), title: z.string().trim().min(1).max(200), notes: z.string().max(4000), insightId: id.optional() }),
  z.object({ action: z.literal("update-action"), id, status: z.enum(["open", "done"]) }),
  z.object({ action: z.literal("save-report"), filter: z.enum(["all", "opportunity", "healthy"]) }),
  z.object({ action: z.literal("save-brand"), brand: brandSchema }),
  z.object({ action: z.literal("delete-brand"), id }),
  z.object({ action: z.literal("save-pendo-settings"), appId: z.string().regex(/^-?\d+$/).max(30), appName: z.string().trim().max(150) }),
  z.object({ action: z.literal("send-alert"), insightId: id }),
  z.object({ action: z.literal("refresh"), source: z.enum(["all", "news", "pendo"]) }),
]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource");
  if (resource === "bookmarks") {
    const kind = url.searchParams.get("kind");
    if (kind !== "news" && kind !== "insights") return NextResponse.json({ error: "Invalid bookmark kind." }, { status: 400 });
    return NextResponse.json({ items: listRecords<{ id: string }>(`bookmark:${kind}`).map((item) => item.id) });
  }
  if (resource === "actions") return NextResponse.json({ items: listRecords<WorkspaceAction>("action") });
  if (resource === "reports") return NextResponse.json({ items: listRecords("report") });
  if (resource === "settings") return NextResponse.json({ brands: getBrands(), audit: getAuditLog() });
  return NextResponse.json({ error: "Unknown resource." }, { status: 400 });
}

export async function POST(request: Request) {
  const rejected = checkWriteOrigin(request);
  if (rejected) return rejected;
  try {
    const input = await parseBody(request, schema);
    if (input.action === "bookmark") {
      const exists = input.kind === "news" ? readRecord("article", input.id) : listRecords<Digest>("digest").some((digest) => digest.insights.some((insight) => insight.id === input.id));
      if (!exists) return NextResponse.json({ error: "Source item not found." }, { status: 404 });
      if (input.saved) writeRecord(`bookmark:${input.kind}`, input.id, { id: input.id, createdAt: new Date().toISOString() });
      else deleteRecord(`bookmark:${input.kind}`, input.id);
      recordAudit(input.saved ? "bookmark.saved" : "bookmark.removed", input.id);
    } else if (input.action === "create-action") {
      if (input.insightId && !listRecords<Digest>("digest").some((digest) => digest.insights.some((insight) => insight.id === input.insightId))) return NextResponse.json({ error: "Generated insight not found." }, { status: 404 });
      const value: WorkspaceAction = { id: randomUUID(), title: input.title, notes: input.notes, insightId: input.insightId, status: "open", createdAt: new Date().toISOString() };
      writeRecord("action", value.id, value);
      recordAudit("action.created", value.id);
      return NextResponse.json({ item: value }, { status: 201 });
    } else if (input.action === "update-action") {
      const value = readRecord<WorkspaceAction>("action", input.id);
      if (!value) return NextResponse.json({ error: "Action not found." }, { status: 404 });
      writeRecord("action", input.id, { ...value, status: input.status });
      recordAudit("action.updated", input.id);
    } else if (input.action === "save-report") {
      const analytics = await getPendoAnalytics();
      if (analytics.health.status !== "connected" && analytics.health.status !== "stale") return NextResponse.json({ error: "There is no real analytics snapshot to save." }, { status: 409 });
      const reportId = randomUUID();
      writeRecord("report", reportId, { id: reportId, filter: input.filter, analytics, createdAt: new Date().toISOString() });
      recordAudit("report.saved", reportId);
    } else if (input.action === "save-brand") {
      if (input.brand.isOwnBrand) for (const brand of getBrands()) if (brand.isOwnBrand && brand.id !== input.brand.id) writeRecord("brand", brand.id, { ...brand, isOwnBrand: false });
      writeRecord("brand", input.brand.id, input.brand);
      deleteRecord("source", "news");
      recordAudit("brand.saved", input.brand.id);
    } else if (input.action === "delete-brand") {
      deleteRecord("brand", input.id);
      deleteRecord("source", "news");
      recordAudit("brand.removed", input.id);
    } else if (input.action === "save-pendo-settings") {
      writeRecord("settings", "pendo", { appId: input.appId, appName: input.appName });
      recordAudit("pendo.scope.updated", input.appId);
    } else if (input.action === "send-alert") {
      if (!process.env.SLACK_WEBHOOK_URL) return NextResponse.json({ error: "Slack delivery is not configured." }, { status: 503 });
      await sendInsightToSlack(input.insightId);
    } else {
      const last = readRecord<{ at: number }>("system", "refresh");
      if (last && Date.now() - last.at < 10000) return NextResponse.json({ error: "Wait a few seconds before refreshing again." }, { status: 429 });
      writeRecord("system", "refresh", { at: Date.now() });
      const [pendo, news] = await Promise.all([input.source !== "news" ? getPendoAnalytics(true) : null, input.source !== "pendo" ? getNewsFeed(100, true) : null]);
      recordAudit("sources.refreshed", input.source);
      return NextResponse.json({ pendo: pendo?.health, news: news ? { status: news.status, fetchedAt: news.fetchedAt, provider: news.provider } : null, ai: getDigestState().health });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
    console.error("Workspace operation failed:", error);
    return NextResponse.json({ error: "The operation could not be completed." }, { status: 500 });
  }
}