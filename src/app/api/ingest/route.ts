import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { getPendoAnalytics } from "@/lib/services/pendo-analytics";
import { getNewsFeed } from "@/lib/data/news";
import { getBrandSignals } from "@/lib/data/sentiment";
import { recordAudit, writeRecord } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Scheduled ingestion is not configured." }, { status: 503 });
  const actual = createHash("sha256").update(request.headers.get("authorization") ?? "").digest();
  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  if (!timingSafeEqual(actual, expected)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const [pendo, news] = await Promise.all([getPendoAnalytics(true), getNewsFeed(100, true)]);
  getBrandSignals(news.articles);
  recordAudit("scheduled.ingestion", "all");
  writeRecord("source", "scheduler", { status: "connected", fetchedAt: new Date().toISOString() });
  return NextResponse.json({ pendo: pendo.health, news: { status: news.status, fetchedAt: news.fetchedAt, provider: news.provider } });
}