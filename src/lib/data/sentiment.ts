import { getBrands, listRecords, writeRecord } from "@/lib/database";
import type { Brand, NewsArticle } from "@/lib/types";
import { NEWS_POLICY_VERSION } from "@/lib/services/news-quality";

export const MIN_TONE_ARTICLES = 3;
export const MIN_TONE_PUBLISHERS = 2;

export interface BrandSignal {
  brand: Brand;
  score: number | null;
  delta: number | null;
  positive: number;
  negative: number;
  neutral: number;
  publisherCount: number;
  toneReason: string | null;
  articles: NewsArticle[];
}

export function calculateNewsScore(
  articles: Pick<NewsArticle, "sentiment">[],
): number | null {
  if (!articles.length) return null;
  const total = articles.reduce(
    (sum, article) =>
      sum +
      (article.sentiment === "positive"
        ? 100
        : article.sentiment === "negative"
          ? 0
          : 50),
    0,
  );
  return Math.round(total / articles.length);
}

export function getBrandSignals(articles: NewsArticle[]): BrandSignal[] {
  const date = new Date().toISOString().slice(0, 10);
  const history = listRecords<{
    brandId: string;
    date: string;
    score: number;
    policy?: string;
  }>("sentiment");
  return getBrands().map((brand) => {
    const related = articles.filter((article) =>
      article.brands.includes(brand.id),
    );
    const publisherCount = new Set(
      related.map((article) => article.source.trim().toLowerCase()),
    ).size;
    const sufficient =
      related.length >= MIN_TONE_ARTICLES &&
      publisherCount >= MIN_TONE_PUBLISHERS;
    const score = sufficient ? calculateNewsScore(related) : null;
    const previous = history
      .filter(
        (item) =>
          item.brandId === brand.id &&
          item.date < date &&
          item.policy === NEWS_POLICY_VERSION,
      )
      .sort((first, second) => second.date.localeCompare(first.date))[0];
    if (score !== null)
      writeRecord("sentiment", `${brand.id}:${date}`, {
        brandId: brand.id,
        date,
        score,
        count: related.length,
        policy: NEWS_POLICY_VERSION,
      });
    return {
      brand,
      score,
      publisherCount,
      toneReason: sufficient
        ? null
        : related.length
          ? `Requires at least ${MIN_TONE_ARTICLES} stories from ${MIN_TONE_PUBLISHERS} publishers; currently ${related.length} from ${publisherCount}.`
          : "No qualifying coverage in the selected window.",
      delta: score !== null && previous ? score - previous.score : null,
      positive: related.filter((article) => article.sentiment === "positive")
        .length,
      negative: related.filter((article) => article.sentiment === "negative")
        .length,
      neutral: related.filter((article) => article.sentiment === "neutral")
        .length,
      articles: related,
    };
  });
}
