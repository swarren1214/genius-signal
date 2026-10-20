import { newsConfig, isNewsConfigured } from "@/lib/config";
import type { BrandSearchStatus, NewsArticle } from "@/lib/types";
import { getBrands } from "@/lib/database";
import { createHash } from "node:crypto";
import Sentiment from "sentiment";
import { fetchRestaurantRss, type FeedItem } from "@/lib/services/rss";
import {
  canonicalStoryUrl,
  NEWS_WINDOW_DAYS,
  selectNewsStories,
} from "@/lib/services/news-quality";
import { matchArticleBrands } from "@/lib/services/news-relevance";

const NEWS_API_BASE_URL = "https://newsapi.org/v2";

// Restaurant/POS phrasing that is specific to foodservice operations and payments, not generic
// restaurant lifestyle or marketing content. These are strong enough to survive a relevance gate.
const RESTAURANT_POS_CONTEXT = [
  "restaurant pos",
  "point of sale",
  "point-of-sale",
  "restaurant payments",
  "restaurant technology",
  "foodservice pos",
  "online ordering",
  "tableside payments",
  "kitchen display system",
  "restaurant software",
  "restaurant operations",
  "restaurant payment processing",
  "hospitality technology",
];

const DOMAIN_ALLOWLIST = [
  "restaurantdive.com",
  "nrn.com",
  "fooddive.com",
  "pymnts.com",
  "restaurantbusinessonline.com",
  "techcrunch.com",
  "forbes.com",
  "bloomberg.com",
  "bizjournals.com",
];

const IRRELEVANT_TERMS = [
  "travel",
  "fashion",
  "home decor",
  "furniture",
  "lifestyle",
  "real estate",
  "movie",
  "film",
  "sports",
  "auto",
  "automotive",
  "beauty",
  "home improvement",
];

interface NewsApiArticle {
  source: { name: string };
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

function matchBrands(text: string): string[] {
  return matchArticleBrands(text, getBrands());
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
}

function hasRestaurantPosContext(text: string): boolean {
  const normalized = normalizeText(text);
  return RESTAURANT_POS_CONTEXT.some((term) => normalized.includes(term));
}

function hasNoiseTerm(text: string): boolean {
  const normalized = normalizeText(text);
  return IRRELEVANT_TERMS.some((term) => normalized.includes(term));
}

export function isRelevantArticle(text: string): boolean {
  if (
    /\bretailers?|retail stores?\b/i.test(text) &&
    !/\brestaurants?|foodservice|hospitality|dining|ordering\b/i.test(text)
  )
    return false;
  const brands = matchBrands(text);
  const hasRestaurantContext = hasRestaurantPosContext(text);

  if (hasNoiseTerm(text) && !hasRestaurantContext) {
    return false;
  }

  if (!brands.length && !hasRestaurantContext) {
    return false;
  }

  return true;
}

function guessTopic(text: string): string {
  const lower = text.toLowerCase();
  if (/outage|down for|service disruption|breach/.test(lower))
    return "Outage/Incident";
  if (
    /raises? (?:funding|capital)|funding|valuation|acquisition|acquires?\b/.test(
      lower,
    )
  )
    return "Funding";
  if (/partners?|partnership|integrat/.test(lower)) return "Partnership";
  if (/launch|unveils?|announces? new|rolls? out/.test(lower))
    return "Product Launch";
  if (/pricing|fee|price increase|subscription cost/.test(lower))
    return "Pricing";
  return "General";
}

export function classifySentiment(text: string) {
  const result = new Sentiment().analyze(text);
  const label: NewsArticle["sentiment"] =
    result.score > 0 ? "positive" : result.score < 0 ? "negative" : "neutral";
  return { label, score: result.score };
}

function normalizeArticle(item: FeedItem): NewsArticle {
  const text = `${item.title} ${item.snippet}`;
  const sentiment = classifySentiment(text);
  return {
    id: createHash("sha256")
      .update(canonicalStoryUrl(item.url))
      .digest("hex")
      .slice(0, 24),
    ...item,
    fetchedAt: new Date().toISOString(),
    brands: matchBrands(text),
    topic: guessTopic(text),
    sentiment: sentiment.label,
    sentimentScore: sentiment.score,
    whyItMatters: "",
  };
}

/** Builds a compact NewsAPI query that stays under the API's length limit while focusing on
 * brand + restaurant/POS terms. We keep brand names to a single primary term per brand to avoid a
 * query that overflows, and rely on the article-level relevance gate to make a second pass.
 */
function buildQuery(): string {
  const quote = (term: string) => (term.includes(" ") ? `"${term}"` : term);

  const primaryBrandTerms = getBrands()
    .map((brand) => (brand.newsSearchTerms ?? [brand.name])[0])
    .filter(Boolean)
    .map(quote);

  const contextTerms = RESTAURANT_POS_CONTEXT.slice(0, 8).map(quote);

  const query = `${primaryBrandTerms.join(" OR ")} OR (${contextTerms.join(" OR ")})`;
  return query.slice(0, 480);
}

/**
 * Fetches recent news for tracked brands + restaurant-vertical keywords from NewsAPI.org.
 * Server-only — requires NEWS_API_KEY. Falls back should be handled by the caller.
 */
export async function fetchRestaurantNews(
  pageSize = 100,
  refresh = false,
): Promise<{
  articles: NewsArticle[];
  provider: string;
  warnings?: string[];
  brandSearches?: BrandSearchStatus[];
}> {
  if (!getBrands().length)
    return { articles: [], provider: "No tracked brands" };
  const candidates: NewsArticle[] = [];
  const providers: string[] = [];
  const warnings: string[] = [];
  let brandSearches: BrandSearchStatus[] = [];
  if (isNewsConfigured) {
    try {
      const url = new URL(`${NEWS_API_BASE_URL}/everything`);
      url.searchParams.set("q", buildQuery());
      url.searchParams.set("searchIn", "title,description");
      url.searchParams.set("domains", DOMAIN_ALLOWLIST.join(","));
      url.searchParams.set("sortBy", "publishedAt");
      url.searchParams.set("language", "en");
      url.searchParams.set(
        "from",
        new Date(Date.now() - NEWS_WINDOW_DAYS * 86400000).toISOString(),
      );
      url.searchParams.set("pageSize", String(pageSize));

      const res = await fetch(url, {
        headers: { "X-Api-Key": newsConfig.apiKey },
        // Matches the PRD's 15-30 minute refresh cadence for the news feed.
        ...(refresh
          ? { cache: "no-store" as const }
          : { next: { revalidate: 900 } }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`News API error ${res.status}: ${body.slice(0, 300)}`);
      }

      const data = (await res.json()) as NewsApiResponse;
      if (data.status !== "ok" || !Array.isArray(data.articles))
        throw new Error("NewsAPI returned an invalid response.");

      const articles = selectNewsStories(
        data.articles
          .filter((a) => a.title && a.title !== "[Removed]")
          .filter(
            (article) =>
              /^https?:\/\//i.test(article.url) &&
              Number.isFinite(new Date(article.publishedAt).getTime()),
          )
          .map((article) =>
            normalizeArticle({
              title: article.title,
              snippet: article.description ?? "",
              url: article.url,
              source: article.source?.name ?? "Unknown",
              publishedAt: new Date(article.publishedAt).toISOString(),
            }),
          )
          .filter((article) =>
            isRelevantArticle(`${article.title} ${article.snippet}`),
          ),
      );
      candidates.push(...articles);
      providers.push("NewsAPI");
    } catch (error) {
      console.error(
        "NewsAPI ingestion failed; trying public RSS:",
        error instanceof Error ? error.message.slice(0, 180) : "Request failed",
      );
      warnings.push("NewsAPI could not be retrieved.");
    }
  }
  try {
    const rss = await fetchRestaurantRss(refresh);
    brandSearches = rss.brandSearches;
    const articles = selectNewsStories(
      rss.items
        .filter((article) =>
          isRelevantArticle(`${article.title} ${article.snippet}`),
        )
        .map(normalizeArticle),
    );
    candidates.push(...articles);
    providers.push(...rss.providers);
    warnings.push(...rss.warnings);
  } catch {
    warnings.push("RSS sources could not be retrieved.");
  }
  if (!providers.length) throw new Error("No news source could be retrieved.");
  return {
    articles: selectNewsStories(candidates),
    provider: providers.join(" + "),
    warnings,
    brandSearches,
  };
}
