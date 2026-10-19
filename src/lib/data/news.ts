import { fetchRestaurantNews } from "@/lib/services/news";
import type { NewsArticle } from "@/lib/types";
import {
  getBrands,
  listRecords,
  readRecord,
  writeRecord,
} from "@/lib/database";

export interface NewsResult {
  articles: NewsArticle[];
  isLive: boolean;
  status: "connected" | "unconfigured" | "unavailable" | "stale";
  fetchedAt: string | null;
  provider: string;
  error?: string;
}

export async function getNewsFeed(
  limit = 100,
  refresh = false,
): Promise<NewsResult> {
  const fetchedAt = new Date().toISOString();
  const last = readRecord<Omit<NewsResult, "articles">>("source", "news");
  const tracked = new Set(getBrands().map((brand) => brand.id));
  if (!tracked.size)
    return {
      articles: [],
      isLive: false,
      status: "unconfigured",
      fetchedAt: null,
      provider: "News watchlist",
      error: "Add a tracked brand to enable news ingestion.",
    };
  const cached = () =>
    listRecords<NewsArticle>("article")
      .filter(
        (article) =>
          (!article.brands.length ||
            article.brands.some((id) => tracked.has(id))) &&
          new Date(article.publishedAt).getTime() >= Date.now() - 30 * 86400000,
      )
      .sort((first, second) =>
        second.publishedAt.localeCompare(first.publishedAt),
      )
      .slice(0, limit);
  if (
    !refresh &&
    last?.fetchedAt &&
    Date.now() - new Date(last.fetchedAt).getTime() < 900000
  )
    return { ...last, articles: cached() };

  try {
    const result = await fetchRestaurantNews(100, refresh);
    for (const article of result.articles)
      writeRecord("article", article.id, article);
    const health: Omit<NewsResult, "articles"> = {
      isLive: true,
      status: "connected",
      fetchedAt,
      provider: result.provider,
    };
    writeRecord("source", "news", health);
    return { ...health, articles: cached() };
  } catch (error) {
    console.error("News API fetch failed:", error);
    const articles = cached();
    const health: Omit<NewsResult, "articles"> = {
      isLive: false,
      status: articles.length ? "stale" : "unavailable",
      fetchedAt: last?.fetchedAt ?? null,
      provider: last?.provider ?? "NewsAPI / RSS",
      error:
        "News ingestion failed. Previously retrieved articles are labeled stale.",
    };
    writeRecord("source", "news", health);
    return { ...health, articles };
  }
}
