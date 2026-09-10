import { isNewsConfigured } from "@/lib/config";
import { fetchRestaurantNews } from "@/lib/services/news";
import { newsArticles, type NewsArticle } from "@/lib/mock-data";

export interface NewsResult {
  articles: NewsArticle[];
  isLive: boolean;
}

/** News feed articles, live from NewsAPI.org when NEWS_API_KEY is configured, else sample data. */
export async function getNewsFeed(limit = 20): Promise<NewsResult> {
  if (!isNewsConfigured) {
    return { articles: newsArticles, isLive: false };
  }

  try {
    const articles = await fetchRestaurantNews(limit);
    return { articles, isLive: true };
  } catch (error) {
    console.error("News API fetch failed, falling back to sample data:", error);
    return { articles: newsArticles, isLive: false };
  }
}
