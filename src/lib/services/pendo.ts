import { pendoConfig, isPendoConfigured } from "@/lib/config";

const PENDO_BASE_URL = "https://app.pendo.io/api/v1";

/**
 * Low-level client for Pendo's REST API. Server-only — never import this from a Client Component.
 * Requires PENDO_API_KEY (Integration Key) in the environment; PENDO_APP_ID is optional and scopes
 * queries to a single application when set.
 */
export async function pendoFetch<T>(path: string, init?: RequestInit): Promise<T> {
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
    ...(init?.cache === "no-store" ? {} : { next: { revalidate: 900 } }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Pendo API error ${res.status}: ${body.slice(0, 300)}`);
  }

  return res.json() as Promise<T>;
}

export async function pendoAggregate<T>(pipeline: unknown[], refresh = false): Promise<T[]> {
  const data = await pendoFetch<{ results: T[] }>("/aggregation", {
    method: "POST",
    ...(refresh ? { cache: "no-store" as const } : {}),
    body: JSON.stringify({
      response: { mimeType: "application/json" },
      request: { pipeline },
    }),
  });
  return data.results ?? [];
}


