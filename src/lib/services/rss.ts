import { XMLParser } from "fast-xml-parser";
import { getBrands } from "@/lib/database";

export interface FeedItem {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  snippet: string;
}

export async function fetchRestaurantRss(refresh = false): Promise<FeedItem[]> {
  const query = getBrands().flatMap((brand) => brand.newsSearchTerms.slice(0, 1)).map((term) => `"${term}"`).join(" OR ");
  if (!query) return [];
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", `(${query}) (restaurant OR POS OR payments) when:30d`);
  url.searchParams.set("hl", "en-US");
  url.searchParams.set("gl", "US");
  url.searchParams.set("ceid", "US:en");
  const response = await fetch(url, { ...(refresh ? { cache: "no-store" as const } : { next: { revalidate: 900 } }), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`RSS source returned ${response.status}`);
  const parsed = new XMLParser({ ignoreAttributes: false }).parse(await response.text());
  const raw = parsed?.rss?.channel?.item;
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return items.flatMap((item): FeedItem[] => {
    if (typeof item.title !== "string" || typeof item.link !== "string" || !/^https?:\/\//i.test(item.link)) return [];
    const date = new Date(String(item.pubDate));
    if (!Number.isFinite(date.getTime())) return [];
    const source = typeof item.source === "string" ? item.source : item.source?.["#text"];
    return [{ title: item.title, url: item.link, publishedAt: date.toISOString(), source: typeof source === "string" ? source : "Google News RSS", snippet: "" }];
  });
}