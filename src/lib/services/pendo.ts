import { pendoConfig, isPendoConfigured } from "@/lib/config";

const PENDO_BASE_URL = "https://app.pendo.io/api/v1";

/**
 * Low-level client for Pendo's REST API. Server-only — never import this from a Client Component.
 * Requires PENDO_API_KEY (Integration Key) in the environment; PENDO_APP_ID is optional and scopes
 * queries to a single application when set.
 */
async function pendoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isPendoConfigured) {
    throw new Error("Pendo is not configured: missing PENDO_API_KEY");
  }

  const res = await fetch(`${PENDO_BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-pendo-integration-key": pendoConfig.apiKey,
      ...init?.headers,
    },
    // Cache for 15 minutes server-side, matching the PRD's ingestion refresh cadence.
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Pendo API error ${res.status}: ${body.slice(0, 300)}`);
  }

  return res.json() as Promise<T>;
}

async function pendoAggregate<T>(pipeline: unknown[]): Promise<T[]> {
  const data = await pendoFetch<{ results: T[] }>("/aggregation", {
    method: "POST",
    body: JSON.stringify({
      response: { mimeType: "application/json" },
      request: { pipeline },
    }),
  });
  return data.results ?? [];
}

export interface PendoApp {
  id: number;
  name: string;
  displayName?: string;
}

/** Lists applications visible to the integration key, useful for finding the restaurant-vertical app ID. */
export async function listApps(): Promise<PendoApp[]> {
  return pendoFetch<PendoApp[]>("/app");
}

/**
 * Total distinct visitors ever tracked in this Pendo subscription.
 * Confirmed working query shape: a global (unkeyed) group over the visitors source.
 */
export async function getTotalVisitorCount(): Promise<number> {
  const [row] = await pendoAggregate<{ totalVisitors: number }>([
    { source: { visitors: null } },
    { group: { group: [], fields: { totalVisitors: { count: null } } } },
  ]);
  return row?.totalVisitors ?? 0;
}

/**
 * Distinct visitors with a `lastvisit` within the trailing `days` days.
 * The visitors source only supports string-expression filters (not structured filter objects)
 * for this subscription's Pendo API version — confirmed via manual testing against the live API.
 */
export async function getActiveVisitorCount(days: number): Promise<number> {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const [row] = await pendoAggregate<{ activeVisitors: number }>([
    { source: { visitors: null } },
    { filter: `metadata.auto.lastvisit >= ${since}` },
    { group: { group: [], fields: { activeVisitors: { count: null } } } },
  ]);
  return row?.activeVisitors ?? 0;
}

