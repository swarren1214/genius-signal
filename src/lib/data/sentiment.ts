import { getBrands, listRecords, writeRecord } from "@/lib/database";
import type { Brand, NewsArticle } from "@/lib/types";

export interface BrandSignal {
  brand: Brand;
  score: number | null;
  delta: number | null;
  positive: number;
  negative: number;
  neutral: number;
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
  const history = listRecords<{ brandId: string; date: string; score: number }>(
    "sentiment",
  );
  return getBrands().map((brand) => {
    const related = articles.filter((article) =>
      article.brands.includes(brand.id),
    );
    const score = calculateNewsScore(related);
    const previous = history
      .filter((item) => item.brandId === brand.id && item.date < date)
      .sort((first, second) => second.date.localeCompare(first.date))[0];
    if (score !== null)
      writeRecord("sentiment", `${brand.id}:${date}`, {
        brandId: brand.id,
        date,
        score,
        count: related.length,
      });
    return {
      brand,
      score,
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
