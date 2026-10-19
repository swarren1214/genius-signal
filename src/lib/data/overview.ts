import { getAnalyticsData } from "@/lib/data/analytics";
import { getNewsFeed } from "@/lib/data/news";
import { getBrandSignals } from "@/lib/data/sentiment";
import { getDigestState } from "@/lib/services/ai";

export async function getOverviewData() {
  const [analytics, news] = await Promise.all([
    getAnalyticsData(),
    getNewsFeed(),
  ]);
  return {
    analytics,
    news,
    signals: getBrandSignals(news.articles),
    ai: getDigestState(),
  };
}
