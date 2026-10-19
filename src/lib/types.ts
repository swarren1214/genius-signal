export interface Brand {
  id: string;
  name: string;
  isOwnBrand?: boolean;
  newsSearchTerms: string[];
}

export interface NewsArticle {
  id: string;
  url: string;
  source: string;
  title: string;
  snippet: string;
  publishedAt: string;
  fetchedAt: string;
  brands: string[];
  topic: string;
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
  whyItMatters: string;
}

export interface SourceHealth {
  status: "connected" | "unconfigured" | "unavailable" | "stale";
  fetchedAt: string | null;
  error?: string;
}

export interface UsagePoint {
  date: string;
  visitors: number;
  events: number;
}

export interface FeatureMetric {
  id: string;
  name: string;
  visitors: number;
  events: number;
  adoption: number | null;
}

export interface AnalyticsSnapshot {
  appId: string;
  appName: string;
  startDate: string;
  endDate: string;
  dailyActiveUsers: number | null;
  weeklyActiveUsers: number | null;
  previousWeeklyActiveUsers: number | null;
  weeklyChange: number | null;
  activeAccounts: number | null;
  totalEvents: number | null;
  daily: UsagePoint[];
  features: FeatureMetric[];
  featureError?: string;
  health: SourceHealth;
}

export interface Insight {
  id: string;
  title: string;
  summary: string;
  recommendation: string;
  sourceIds: string[];
}

export interface Digest {
  id: string;
  generatedAt: string;
  summary: string;
  insights: Insight[];
}

export interface WorkspaceAction {
  id: string;
  title: string;
  notes: string;
  insightId?: string;
  status: "open" | "done";
  createdAt: string;
}