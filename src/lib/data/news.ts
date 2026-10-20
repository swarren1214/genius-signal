import { fetchRestaurantNews, isRelevantArticle } from "@/lib/services/news";
import { matchArticleBrands } from "@/lib/services/news-relevance";
import type { BrandSearchStatus, NewsArticle } from "@/lib/types";
import {
  NEWS_POLICY_VERSION,
  selectNewsStories,
} from "@/lib/services/news-quality";
import {
  getBrands,
  listRecords,
  readRecord,
  writeRecord,
} from "@/lib/store";

export interface NewsResult {
  articles: NewsArticle[];
  isLive: boolean;
  status: "connected" | "unconfigured" | "unavailable" | "stale";
  fetchedAt: string | null;
  provider: string;
  error?: string;
  policy?: string;
  brandSearches?: BrandSearchStatus[];
}

export async function getNewsFeed(
  limit = 500,
  refresh = false,
): Promise<NewsResult> {
  const fetchedAt = new Date().toISOString();
  const last = readRecord<Omit<NewsResult, "articles">>("source", "news");
  const brands = getBrands();
  const tracked = new Set(brands.map((brand) => brand.id));
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
    selectNewsStories(
      listRecords<NewsArticle>("article")
        .map((article) => ({
          ...article,
          brands: matchArticleBrands(
            `${article.title} ${article.snippet}`,
            brands,
          ),
        }))
        .filter(
          (article) =>
            isRelevantArticle(`${article.title} ${article.snippet}`) &&
            (!article.brands.length ||
              article.brands.some((id) => tracked.has(id))) &&
            Number.isFinite(new Date(article.publishedAt).getTime()),
        ),
    ).slice(0, limit);
  if (
    !refresh &&
    last?.policy === NEWS_POLICY_VERSION &&
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
      policy: NEWS_POLICY_VERSION,
      brandSearches: result.brandSearches,
      error: result.warnings?.length
        ? `Partial ingestion: ${result.warnings.join(" ")}`
        : undefined,
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
      policy: NEWS_POLICY_VERSION,
      brandSearches: last?.brandSearches,
      error:
        "News ingestion failed. Previously retrieved articles are labeled stale.",
    };
    writeRecord("source", "news", health);
    return { ...health, articles };
  }
}
