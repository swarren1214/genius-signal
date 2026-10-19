import { pendoConfig, isPendoConfigured } from "@/lib/config";
import { readRecord, writeRecord } from "@/lib/database";
import { pendoAggregate, pendoFetch } from "@/lib/services/pendo";
import type {
  AnalyticsSnapshot,
  AppCoverage,
  FeatureMetric,
} from "@/lib/types";
import {
  pendoAppIdSchema,
  resolvePendoScope,
  scopeAppIds,
  type PendoScope,
} from "@/lib/pendo-scope";

const DAY = 86400000;

export function changePercent(
  current: number,
  previous: number,
): number | null {
  return previous > 0
    ? Math.round(((current - previous) / previous) * 1000) / 10
    : null;
}

export function eventSource(
  appId: string | string[],
  first: number,
  days: number,
  features = false,
) {
  const ids = Array.isArray(appId) ? appId : [appId];
  if (!ids.length || new Set(ids).size !== ids.length)
    throw new Error("Select at least one distinct application.");
  const numericIds = ids.map((id) => Number(pendoAppIdSchema.parse(id)));
  return {
    source: {
      [features ? "featureEvents" : "events"]: {
        appId: numericIds.length === 1 ? numericIds[0] : numericIds,
      },
      timeSeries: { period: "dayRange", first, count: days },
    },
  };
}

async function totals(
  appId: string[],
  first: number,
  days: number,
  refresh: boolean,
) {
  const rows = await pendoAggregate<{ visitors: number; events: number }>(
    [
      eventSource(appId, first, days),
      {
        group: {
          group: ["visitorId"],
          fields: { events: { sum: "numEvents" } },
        },
      },
      {
        group: {
          group: [],
          fields: { visitors: { count: null }, events: { sum: "events" } },
        },
      },
    ],
    refresh,
  );
  return {
    visitors: Number(rows[0]?.visitors ?? 0),
    events: Number(rows[0]?.events ?? 0),
  };
}

async function features(
  apps: AppCoverage[],
  first: number,
  refresh: boolean,
): Promise<FeatureMetric[]> {
  const [definitions, rows] = await Promise.all([
    Promise.all(
      apps.map(async (app) => ({
        appId: app.appId,
        features: await pendoFetch<{ id: string; name: string }[]>(
          `/feature?appId=${encodeURIComponent(app.appId)}`,
          refresh ? { cache: "no-store" } : undefined,
        ),
      })),
    ),
    pendoAggregate<{
      appId: number;
      featureId: string;
      visitors: number;
      events: number;
    }>(
      [
        eventSource(
          apps.map((app) => app.appId),
          first,
          7,
          true,
        ),
        {
          group: {
            group: ["appId", "featureId", "visitorId"],
            fields: { events: { sum: "numEvents" } },
          },
        },
        {
          group: {
            group: ["appId", "featureId"],
            fields: { visitors: { count: null }, events: { sum: "events" } },
          },
        },
      ],
      refresh,
    ),
  ]);
  const names = new Map(
    definitions.flatMap((app) =>
      app.features.map((definition) => [
        `${app.appId}:${definition.id}`,
        definition.name,
      ]),
    ),
  );
  const denominators = new Map(apps.map((app) => [app.appId, app.visitors]));
  return rows
    .map((row) => ({
      appId: String(row.appId),
      id: row.featureId,
      name: names.get(`${row.appId}:${row.featureId}`) ?? row.featureId,
      visitors: Number(row.visitors),
      events: Number(row.events),
      adoption:
        (denominators.get(String(row.appId)) ?? 0) > 0
          ? Math.round(
              (Number(row.visitors) / denominators.get(String(row.appId))!) *
                1000,
            ) / 10
          : null,
    }))
    .sort((firstRow, secondRow) => secondRow.visitors - firstRow.visitors)
    .slice(0, 20);
}

export async function getPendoAnalytics(
  refresh = false,
): Promise<AnalyticsSnapshot> {
  let settings: PendoScope | null = null;
  try {
    settings = resolvePendoScope(readRecord("settings", "pendo"), {
      appId: process.env.PENDO_APP_IDS ?? pendoConfig.appId,
      appName: process.env.PENDO_APP_NAME ?? "",
    });
  } catch {
    settings = null;
  }
  const appIds = settings ? scopeAppIds(settings) : [];
  const appId = appIds.join(",");
  const appName =
    settings?.appName ||
    (settings?.apps.length === 1 ? settings.apps[0].appName : "") ||
    (appIds.length > 1
      ? `${appIds.length} selected applications`
      : `Application ${appId}`);
  const end = Date.now() - (Date.now() % DAY);
  const start = end - 14 * DAY;
  const empty: AnalyticsSnapshot = {
    appId,
    appIds,
    apps: [],
    appName: appIds.length ? appName : "No valid application scope selected",
    startDate: new Date(start).toISOString().slice(0, 10),
    endDate: new Date(end - 1).toISOString().slice(0, 10),
    dailyActiveUsers: null,
    weeklyActiveUsers: null,
    previousWeeklyActiveUsers: null,
    weeklyChange: null,
    activeAccounts: null,
    totalEvents: null,
    daily: [],
    features: [],
    health: {
      status: "unconfigured",
      fetchedAt: null,
      error:
        "Configure PENDO_API_KEY and PENDO_APP_ID to enable scoped analytics.",
    },
  };
  if (!isPendoConfigured || !appId) return empty;
  const cacheKey = `scope-v2:${appId}:${empty.endDate.slice(0, 10)}`;
  const cached = readRecord<AnalyticsSnapshot>("analytics", cacheKey);
  if (
    !refresh &&
    cached?.health.fetchedAt &&
    Date.now() - new Date(cached.health.fetchedAt).getTime() < 900000
  )
    return {
      ...cached,
      appName,
      apps: cached.apps?.map((app) => ({
        ...app,
        appName:
          settings?.apps.find((selection) => selection.appId === app.appId)
            ?.appName || `Application ${app.appId}`,
      })),
    };
  try {
    const queryStart = start + DAY / 2;
    const currentStart = end - 7 * DAY + DAY / 2;
    const [current, previous, dailyRows, accountRows, appRows] =
      await Promise.all([
        totals(appIds, currentStart, 7, refresh),
        totals(appIds, queryStart, 7, refresh),
        pendoAggregate<{ day: number; visitors: number; events: number }>(
          [
            eventSource(appIds, queryStart, 14),
            {
              group: {
                group: ["day", "visitorId"],
                fields: { events: { sum: "numEvents" } },
              },
            },
            {
              group: {
                group: ["day"],
                fields: {
                  visitors: { count: null },
                  events: { sum: "events" },
                },
              },
            },
          ],
          refresh,
        ),
        pendoAggregate<{ accounts: number }>(
          [
            eventSource(appIds, currentStart, 7),
            { filter: 'accountId != null && accountId != ""' },
            { group: { group: ["accountId"], fields: {} } },
            { group: { group: [], fields: { accounts: { count: null } } } },
          ],
          refresh,
        ),
        pendoAggregate<{ appId: number; visitors: number; events: number }>(
          [
            eventSource(appIds, currentStart, 7),
            {
              group: {
                group: ["appId", "visitorId"],
                fields: { events: { sum: "numEvents" } },
              },
            },
            {
              group: {
                group: ["appId"],
                fields: {
                  visitors: { count: null },
                  events: { sum: "events" },
                },
              },
            },
          ],
          refresh,
        ),
      ]);
    const apps: AppCoverage[] = appIds.map((id) => {
      const row = appRows.find((item) => String(item.appId) === id);
      return {
        appId: id,
        appName:
          settings?.apps.find((app) => app.appId === id)?.appName ||
          `Application ${id}`,
        visitors: Number(row?.visitors ?? 0),
        events: Number(row?.events ?? 0),
      };
    });
    const dailyMap = new Map(
      dailyRows.map((row) => [
        new Date(Number(row.day)).toISOString().slice(0, 10),
        row,
      ]),
    );
    const daily = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(start + index * DAY).toISOString().slice(0, 10);
      const row = dailyMap.get(date);
      return {
        date,
        visitors: Number(row?.visitors ?? 0),
        events: Number(row?.events ?? 0),
      };
    });
    let featureMetrics: FeatureMetric[] = [];
    let featureError: string | undefined;
    try {
      featureMetrics = await features(apps, currentStart, refresh);
    } catch (error) {
      console.error("Pendo feature query failed:", error);
      featureError =
        "Feature metrics could not be retrieved for this application.";
    }
    const result: AnalyticsSnapshot = {
      ...empty,
      appName,
      apps,
      dailyActiveUsers: daily.at(-1)?.visitors ?? 0,
      weeklyActiveUsers: current.visitors,
      previousWeeklyActiveUsers: previous.visitors,
      weeklyChange: changePercent(current.visitors, previous.visitors),
      activeAccounts: Number(accountRows[0]?.accounts ?? 0),
      totalEvents: current.events,
      daily,
      features: featureMetrics,
      featureError,
      health: { status: "connected", fetchedAt: new Date().toISOString() },
    };
    writeRecord("analytics", cacheKey, result);
    writeRecord("source", "pendo", result.health);
    return result;
  } catch (error) {
    console.error(
      "Scoped Pendo analytics failed:",
      error instanceof Error ? error.message : "Request failed",
    );
    const result: AnalyticsSnapshot = cached
      ? {
          ...cached,
          health: {
            status: "stale",
            fetchedAt: cached.health.fetchedAt,
            error:
              "Pendo is unavailable. These are the last successfully retrieved metrics.",
          },
        }
      : {
          ...empty,
          health: {
            status: "unavailable",
            fetchedAt: null,
            error:
              "Pendo could not return scoped analytics. No estimates are substituted.",
          },
        };
    writeRecord("source", "pendo", result.health);
    if (cached) writeRecord("analytics", cacheKey, result);
    return result;
  }
}
