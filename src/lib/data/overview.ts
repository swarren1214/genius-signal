import { isPendoConfigured } from "@/lib/config";
import { getActiveVisitorCount } from "@/lib/services/pendo";
import { overviewKpis, type KpiDatum } from "@/lib/mock-data";

export interface KpiResult {
  kpis: (KpiDatum & { icon: "trending-up" | "gauge" | "sparkles" | "newspaper" | "users" | "click" | "star" })[];
  isLive: boolean;
}

const overviewKpiIcons = ["trending-up", "gauge", "sparkles", "newspaper"] as const;

/** Weekly active users KPI for the Overview page, live from Pendo when configured. */
export async function getOverviewKpis(): Promise<KpiResult> {
  if (!isPendoConfigured) {
    return {
      kpis: overviewKpis.map((k, i) => ({ ...k, icon: overviewKpiIcons[i % overviewKpiIcons.length] })),
      isLive: false,
    };
  }

  try {
    const weeklyActiveUsers = await getActiveVisitorCount(7);

    return {
      kpis: [
        { label: "Weekly Active Users", value: weeklyActiveUsers, delta: 0, icon: "trending-up" },
        { ...overviewKpis[1], icon: "gauge" },
        { ...overviewKpis[2], icon: "sparkles" },
        { ...overviewKpis[3], icon: "newspaper" },
      ],
      isLive: true,
    };
  } catch (error) {
    console.error("Pendo fetch failed, falling back to sample data:", error);
    return {
      kpis: overviewKpis.map((k, i) => ({ ...k, icon: overviewKpiIcons[i % overviewKpiIcons.length] })),
      isLive: false,
    };
  }
}
