import { isPendoConfigured } from "@/lib/config";
import { getActiveVisitorCount, getTotalVisitorCount } from "@/lib/services/pendo";

export interface FeatureAdoptionRow {
  feature: string;
  adoption: number;
}

export interface AnalyticsResult {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  totalVisitors: number;
  featureAdoption: FeatureAdoptionRow[];
  isLive: boolean;
}

const sampleFeatureAdoption: FeatureAdoptionRow[] = [
  { feature: "Tableside Payments", adoption: 47 },
  { feature: "Online Ordering Sync", adoption: 62 },
  { feature: "Tip/Gratuity Flow", adoption: 71 },
  { feature: "Kitchen Display Integration", adoption: 34 },
  { feature: "Loyalty Program", adoption: 28 },
];

const sampleResult: AnalyticsResult = {
  dailyActiveUsers: 4210,
  weeklyActiveUsers: 18420,
  totalVisitors: 0,
  featureAdoption: sampleFeatureAdoption,
  isLive: false,
};

/**
 * Product Analytics page data. DAU/WAU/total visitors are live from Pendo when configured.
 * Feature-level adoption still uses sample data — ranking features by usage requires a
 * per-subscription pipeline (page/feature event grouping) that hasn't been reverse-engineered
 * for this Pendo instance yet; see src/lib/services/pendo.ts for the currently proven queries.
 */
export async function getAnalyticsData(): Promise<AnalyticsResult> {
  if (!isPendoConfigured) {
    return sampleResult;
  }

  try {
    const [dailyActiveUsers, weeklyActiveUsers, totalVisitors] = await Promise.all([
      getActiveVisitorCount(1),
      getActiveVisitorCount(7),
      getTotalVisitorCount(),
    ]);

    return {
      dailyActiveUsers,
      weeklyActiveUsers,
      totalVisitors,
      featureAdoption: sampleFeatureAdoption,
      isLive: true,
    };
  } catch (error) {
    console.error("Pendo fetch failed, falling back to sample data:", error);
    return sampleResult;
  }
}
