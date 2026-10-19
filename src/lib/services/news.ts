import { newsConfig, isNewsConfigured } from "@/lib/config";
import type { NewsArticle } from "@/lib/mock-data";
import { trackedBrands } from "@/lib/mock-data";

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
  const lower = text.toLowerCase();
  return trackedBrands
    .filter((b) => (b.newsSearchTerms ?? [b.name]).some((t) => lower.includes(t.toLowerCase())))
    .map((b) => b.id);
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

function isRelevantArticle(text: string): boolean {
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
  if (/outage|down for|service disruption|breach/.test(lower)) return "Outage/Incident";
  if (/raises?\s|funding|valuation|acquisition|acquires?\b/.test(lower)) return "Funding";
  if (/partners?|partnership|integrat/.test(lower)) return "Partnership";
  if (/launch|unveils?|announces? new|rolls? out/.test(lower)) return "Product Launch";
  if (/pricing|fee|price increase|subscription cost/.test(lower)) return "Pricing";
  return "General";
}

function guessSentiment(text: string): NewsArticle["sentiment"] {
  const negative = /outage|lawsuit|breach|complaint|fee increase|down|fail/i;
  const positive = /launch|partnership|award|growth|expands|raises funding/i;
  if (negative.test(text)) return "negative";
  if (positive.test(text)) return "positive";
  return "neutral";
}

/** Builds a compact NewsAPI query that stays under the API's length limit while focusing on
 * brand + restaurant/POS terms. We keep brand names to a single primary term per brand to avoid a
 * query that overflows, and rely on the article-level relevance gate to make a second pass.
 */
function buildQuery(): string {
  const quote = (term: string) => (term.includes(" ") ? `"${term}"` : term);

  const primaryBrandTerms = trackedBrands
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
export async function fetchRestaurantNews(pageSize = 20): Promise<NewsArticle[]> {
  if (!isNewsConfigured) {
    throw new Error("News API is not configured: missing NEWS_API_KEY");
  }

  const url = new URL(`${NEWS_API_BASE_URL}/everything`);
  url.searchParams.set("q", buildQuery());
  url.searchParams.set("searchIn", "title,description");
  url.searchParams.set("domains", DOMAIN_ALLOWLIST.join(","));
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("language", "en");
  url.searchParams.set("pageSize", String(pageSize));

  const res = await fetch(url, {
    headers: { "X-Api-Key": newsConfig.apiKey },
    // Matches the PRD's 15-30 minute refresh cadence for the news feed.
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`News API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as NewsApiResponse;

  return data.articles
    .filter((a) => a.title && a.title !== "[Removed]")
    .map((a, i) => {
      const text = `${a.title} ${a.description ?? ""}`;
      return {
        id: `${a.publishedAt}-${i}`,
        url: a.url,
        source: a.source?.name ?? "Unknown",
        title: a.title,
        snippet: a.description ?? "",
        publishedAt: a.publishedAt,
        brands: matchBrands(text),
        topic: guessTopic(text),
        sentiment: guessSentiment(text),
        whyItMatters: "AI-generated context is not yet wired up for live articles.",
      } satisfies NewsArticle;
    })
    .filter((article) => isRelevantArticle(`${article.title} ${article.snippet}`));
}

