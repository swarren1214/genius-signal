import { XMLParser } from "fast-xml-parser";
import { getBrands } from "@/lib/store";
import { convert } from "html-to-text";
import { NEWS_WINDOW_DAYS } from "@/lib/services/news-quality";
import { brandNewsQuery } from "@/lib/services/news-relevance";
import type { BrandSearchStatus } from "@/lib/types";

export interface FeedItem {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  snippet: string;
}

export const tradeFeeds = [
  {
    name: "Restaurant Dive",
    url: "https://www.restaurantdive.com/feeds/news/",
  },
  { name: "PYMNTS", url: "https://www.pymnts.com/feed/" },
  {
    name: "Restaurant Technology News",
    url: "https://restauranttechnologynews.com/feed/",
  },
];

export function parseRssFeed(xml: string, provider: string): FeedItem[] {
  const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml);
  if (!parsed?.rss?.channel)
    throw new Error("RSS source returned an invalid feed.");
  const raw = parsed.rss.channel.item;
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return items.flatMap((item): FeedItem[] => {
    if (
      typeof item.title !== "string" ||
      typeof item.link !== "string" ||
      !/^https?:\/\//i.test(item.link)
    )
      return [];
    const date = new Date(String(item.pubDate));
    if (!Number.isFinite(date.getTime())) return [];
    const source =
      typeof item.source === "string" ? item.source : item.source?.["#text"];
    const description =
      typeof item.description === "string" ? item.description : "";
    return [
      {
        title: item.title,
        url: item.link,
        publishedAt: date.toISOString(),
        source: typeof source === "string" ? source : provider,
        snippet: convert(description.slice(0, 20000), {
          wordwrap: false,
          selectors: [
            { selector: "a", options: { ignoreHref: true } },
            { selector: "img", format: "skip" },
          ],
        }).slice(0, 2000),
      },
    ];
  });
}

async function fetchFeed(url: string, name: string, refresh: boolean) {
  const response = await fetch(url, {
    ...(refresh
      ? { cache: "no-store" as const }
      : { next: { revalidate: 900 } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${name} returned ${response.status}.`);
  return parseRssFeed(await response.text(), name);
}

export async function fetchRestaurantRss(
  refresh = false,
): Promise<{
  items: FeedItem[];
  providers: string[];
  warnings: string[];
  brandSearches: BrandSearchStatus[];
}> {
  const brands = getBrands();
  if (!brands.length)
    return { items: [], providers: [], warnings: [], brandSearches: [] };
  const searches = brands.map((brand) => {
    const url = new URL("https://news.google.com/rss/search");
    url.searchParams.set("q", brandNewsQuery(brand, NEWS_WINDOW_DAYS));
    url.searchParams.set("hl", "en-US");
    url.searchParams.set("gl", "US");
    url.searchParams.set("ceid", "US:en");
    return { name: `Google News RSS: ${brand.name}`, url: url.toString() };
  });
  const feeds = [...tradeFeeds, ...searches];
  const results = await Promise.allSettled(
    feeds.map((feed) => fetchFeed(feed.url, feed.name, refresh)),
  );
  const items: FeedItem[] = [];
  const providers: string[] = [];
  const warnings: string[] = [];
  const brandSearches: BrandSearchStatus[] = [];
  results.forEach((result, index) => {
    if (index >= tradeFeeds.length)
      brandSearches.push({
        brandId: brands[index - tradeFeeds.length].id,
        query: new URL(feeds[index].url).searchParams.get("q") ?? "",
        status: result.status === "fulfilled" ? "succeeded" : "failed",
        rawItems: result.status === "fulfilled" ? result.value.length : 0,
        checkedAt: new Date().toISOString(),
      });
    if (result.status === "fulfilled") {
      providers.push(
        index < tradeFeeds.length ? feeds[index].name : "Google News RSS",
      );
      items.push(...result.value);
    } else warnings.push(`${feeds[index].name} could not be retrieved.`);
  });
  if (!providers.length) throw new Error("No RSS source could be retrieved.");
  return { items, providers: [...new Set(providers)], warnings, brandSearches };
}
