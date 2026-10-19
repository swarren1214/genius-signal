export const NEWS_WINDOW_DAYS = 14;
export const NEWS_POLICY_VERSION = "market-news-v1";

interface Story {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
}

const evergreenPatterns = [
  /^(?:the\s+)?(?:\d+\s+)?(?:best|top)\b.{0,80}\b(?:pos|point.of.sale|software|systems?|platforms?)\b/i,
  /\b(?:buying|buyers?|buyer's|ultimate|complete|definitive)\b.{0,80}\bguide\b/i,
  /\bhow to (?:choose|pick|select|buy)\b/i,
  /\breviews?\s+(?:and|&)\s+pricing\b/i,
  /\b(?:pos|software|system|platform)\b.{0,40}\breviews?\b.{0,40}\b20\d{2}\b/i,
];

export function isTimelyNews(story: Story, now = Date.now()): boolean {
  const publishedAt = new Date(story.publishedAt).getTime();
  return (
    Number.isFinite(publishedAt) &&
    publishedAt <= now + 300000 &&
    publishedAt >= now - NEWS_WINDOW_DAYS * 86400000 &&
    !evergreenPatterns.some((pattern) => pattern.test(story.title))
  );
}

export function canonicalStoryUrl(value: string): string {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password)
    throw new Error("Invalid article URL.");
  url.hash = "";
  url.hostname = url.hostname.replace(/^www\./, "");
  for (const key of [...url.searchParams.keys()])
    if (/^(?:utm_.+|fbclid|gclid|mc_cid|mc_eid)$/i.test(key))
      url.searchParams.delete(key);
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/$/, "") || "/";
  return url.toString();
}

function headline(story: Story): string {
  let title = story.title;
  const suffix = ` - ${story.source}`;
  if (title.toLowerCase().endsWith(suffix.toLowerCase()))
    title = title.slice(0, -suffix.length);
  return title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function duplicateHeadline(first: Story, second: Story): boolean {
  if (
    Math.abs(
      new Date(first.publishedAt).getTime() -
        new Date(second.publishedAt).getTime(),
    ) >
    3 * 86400000
  )
    return false;
  const firstTitle = headline(first);
  const secondTitle = headline(second);
  if (firstTitle === secondTitle) return true;
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "for",
    "of",
    "to",
    "in",
    "with",
    "its",
    "new",
  ]);
  const tokens = (title: string) =>
    new Set(
      title
        .split(" ")
        .filter((word) => word.length > 1 && !stopWords.has(word)),
    );
  const firstTokens = tokens(firstTitle);
  const secondTokens = tokens(secondTitle);
  if (Math.min(firstTokens.size, secondTokens.size) < 5) return false;
  const numbers = (title: string) =>
    (title.match(/\d+/g) ?? []).sort().join(",");
  if (numbers(firstTitle) !== numbers(secondTitle)) return false;
  const overlap = [...firstTokens].filter((word) =>
    secondTokens.has(word),
  ).length;
  return overlap / new Set([...firstTokens, ...secondTokens]).size >= 0.82;
}

export function selectNewsStories<T extends Story>(
  stories: T[],
  now = Date.now(),
): T[] {
  const selected: T[] = [];
  const urls = new Set<string>();
  for (const story of stories
    .filter((item) => isTimelyNews(item, now))
    .sort((first, second) =>
      second.publishedAt.localeCompare(first.publishedAt),
    )) {
    let url: string;
    try {
      url = canonicalStoryUrl(story.url);
    } catch {
      continue;
    }
    if (
      urls.has(url) ||
      selected.some((item) => duplicateHeadline(item, story))
    )
      continue;
    urls.add(url);
    selected.push(story);
  }
  return selected;
}
