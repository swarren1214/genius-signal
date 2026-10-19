import { pendoConfig, isPendoConfigured } from "@/lib/config";
import { readRecord, writeRecord } from "@/lib/database";
import { pendoAggregate, pendoFetch } from "@/lib/services/pendo";
import type { AnalyticsSnapshot, FeatureMetric } from "@/lib/types";

const DAY = 86400000;

export function changePercent(current: number, previous: number): number | null {
  return previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null;
}

export function eventSource(appId: string, first: number, days: number, features = false) {
  if (!/^-?\d+$/.test(appId)) throw new Error("A numeric Pendo application ID is required.");
  return { source: { [features ? "featureEvents" : "events"]: { appId: Number(appId) }, timeSeries: { period: "dayRange", first, count: days } } };
}

async function totals(appId: string, first: number, days: number, refresh: boolean) {
  const rows = await pendoAggregate<{ visitors: number; events: number }>([
    eventSource(appId, first, days),
    { group: { group: ["visitorId"], fields: { events: { sum: "numEvents" } } } },
    { group: { group: [], fields: { visitors: { count: null }, events: { sum: "events" } } } },
  ], refresh);
  return { visitors: Number(rows[0]?.visitors ?? 0), events: Number(rows[0]?.events ?? 0) };
}

async function features(appId: string, first: number, denominator: number, refresh: boolean): Promise<FeatureMetric[]> {
  const [definitions, rows] = await Promise.all([
    pendoFetch<{ id: string; name: string; appId?: number }[]>(`/feature?appId=${encodeURIComponent(appId)}`, refresh ? { cache: "no-store" } : undefined),
    pendoAggregate<{ featureId: string; visitors: number; events: number }>([
      eventSource(appId, first, 7, true),
      { group: { group: ["featureId", "visitorId"], fields: { events: { sum: "numEvents" } } } },
      { group: { group: ["featureId"], fields: { visitors: { count: null }, events: { sum: "events" } } } },
    ], refresh),
  ]);
  const names = new Map(definitions.map((definition) => [definition.id, definition.name]));
  return rows.map((row) => ({ id: row.featureId, name: names.get(row.featureId) ?? row.featureId, visitors: Number(row.visitors), events: Number(row.events), adoption: denominator > 0 ? Math.round((Number(row.visitors) / denominator) * 1000) / 10 : null })).sort((firstRow, secondRow) => secondRow.visitors - firstRow.visitors).slice(0, 20);
}

export async function getPendoAnalytics(refresh = false): Promise<AnalyticsSnapshot> {
  const settings = readRecord<{ appId: string; appName: string }>("settings", "pendo");
  const appId = settings?.appId ?? pendoConfig.appId;
  const end = Date.now() - Date.now() % DAY;
  const start = end - 14 * DAY;
  const empty: AnalyticsSnapshot = { appId, appName: appId || "No application selected", startDate: new Date(start).toISOString(), endDate: new Date(end - 1).toISOString(), dailyActiveUsers: null, weeklyActiveUsers: null, previousWeeklyActiveUsers: null, weeklyChange: null, activeAccounts: null, totalEvents: null, daily: [], features: [], health: { status: "unconfigured", fetchedAt: null, error: "Configure PENDO_API_KEY and PENDO_APP_ID to enable scoped analytics." } };
  if (!isPendoConfigured || !appId) return empty;
  const cacheKey = `${appId}:${empty.endDate.slice(0, 10)}`;
  const cached = readRecord<AnalyticsSnapshot>("analytics", cacheKey);
  if (!refresh && cached?.health.fetchedAt && Date.now() - new Date(cached.health.fetchedAt).getTime() < 900000) return { ...cached, appName: settings?.appName || cached.appName };
  try {
    const currentStart = end - 7 * DAY;
    const [current, previous, dailyRows, accountRows] = await Promise.all([
      totals(appId, currentStart, 7, refresh),
      totals(appId, start, 7, refresh),
      pendoAggregate<{ day: number; visitors: number; events: number }>([
        eventSource(appId, start, 14),
        { group: { group: ["day", "visitorId"], fields: { events: { sum: "numEvents" } } } },
        { group: { group: ["day"], fields: { visitors: { count: null }, events: { sum: "events" } } } },
      ], refresh),
      pendoAggregate<{ accounts: number }>([
        eventSource(appId, currentStart, 7),
        { filter: "accountId != null && accountId != \"\"" },
        { group: { group: ["accountId"], fields: {} } },
        { group: { group: [], fields: { accounts: { count: null } } } },
      ], refresh),
    ]);
    const dailyMap = new Map(dailyRows.map((row) => [new Date(Number(row.day)).toISOString().slice(0, 10), row]));
    const daily = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(start + index * DAY).toISOString().slice(0, 10);
      const row = dailyMap.get(date);
      return { date, visitors: Number(row?.visitors ?? 0), events: Number(row?.events ?? 0) };
    });
    let featureMetrics: FeatureMetric[] = [];
    let featureError: string | undefined;
    try { featureMetrics = await features(appId, currentStart, current.visitors, refresh); } catch (error) { console.error("Pendo feature query failed:", error); featureError = "Feature metrics could not be retrieved for this application."; }
    const result: AnalyticsSnapshot = { ...empty, appName: settings?.appName || process.env.PENDO_APP_NAME || `Application ${appId}`, dailyActiveUsers: daily.at(-1)?.visitors ?? 0, weeklyActiveUsers: current.visitors, previousWeeklyActiveUsers: previous.visitors, weeklyChange: changePercent(current.visitors, previous.visitors), activeAccounts: Number(accountRows[0]?.accounts ?? 0), totalEvents: current.events, daily, features: featureMetrics, featureError, health: { status: "connected", fetchedAt: new Date().toISOString() } };
    writeRecord("analytics", cacheKey, result);
    writeRecord("source", "pendo", result.health);
    return result;
  } catch (error) {
    console.error("Scoped Pendo analytics failed:", error instanceof Error ? error.message : "Request failed");
    const result: AnalyticsSnapshot = cached ? { ...cached, health: { status: "stale", fetchedAt: cached.health.fetchedAt, error: "Pendo is unavailable. These are the last successfully retrieved metrics." } } : { ...empty, health: { status: "unavailable", fetchedAt: null, error: "Pendo could not return scoped analytics. No estimates are substituted." } };
    writeRecord("source", "pendo", result.health);
    if (cached) writeRecord("analytics", cacheKey, result);
    return result;
  }
}