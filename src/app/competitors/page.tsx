import Link from "next/link";
import { PageHero } from "@/components/dashboard/page-hero";
import { SourceStatus } from "@/components/dashboard/source-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getNewsFeed } from "@/lib/data/news";
import { getBrandSignals } from "@/lib/data/sentiment";
import { NEWS_WINDOW_DAYS } from "@/lib/services/news-quality";
import { NewsRefresh } from "@/components/dashboard/news-refresh";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

export default async function CompetitorsPage() {
  const news = await getNewsFeed();
  const signals = getBrandSignals(news.articles);
  const active = signals
    .filter((signal) => signal.articles.length > 0)
    .sort((first, second) => second.articles.length - first.articles.length);
  const quiet = signals.filter((signal) => signal.articles.length === 0);
  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Competitive landscape / monitored reporting"
        title="What is changing across the competition?"
        description="Recent reporting by competitor, with publisher attribution and visible search coverage. Sparse coverage is not treated as a confident brand score."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <NewsRefresh />
            <Link href="/settings" className="text-xs text-primary">
              Edit tracked brands →
            </Link>
          </div>
        }
      />
      <SourceStatus name={news.provider} health={news} />
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-y border-border py-4 text-xs">
        <span>
          <strong className="text-lg font-normal">{active.length}</strong>{" "}
          brands with recent coverage
        </span>
        <span>
          <strong className="text-lg font-normal">
            {news.articles.length}
          </strong>{" "}
          qualifying stories · {NEWS_WINDOW_DAYS} days
        </span>
        <span className="text-muted-foreground">
          {quiet.length} monitored without qualifying matches
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {active.map((signal) => (
          <Card key={signal.brand.id} className="shadow-none">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <BrandLogo brand={signal.brand} />
                <CardTitle>{signal.brand.name}</CardTitle>
              </div>
              {signal.brand.isOwnBrand && (
                <Badge variant="secondary">Own brand</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
                <div>
                  <p className="text-2xl font-normal">
                    {signal.articles.length}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Retrieved articles · {NEWS_WINDOW_DAYS} days
                  </p>
                </div>
                <div>
                  <p
                    className={
                      signal.score === null
                        ? "text-xs leading-6 text-muted-foreground"
                        : "text-2xl font-normal"
                    }
                  >
                    {signal.score === null
                      ? "Not enough coverage"
                      : `${signal.score}/100`}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    News tone · {signal.publisherCount} publishers
                  </p>
                </div>
              </div>
              {signal.toneReason && (
                <p className="text-[10px] leading-5 text-muted-foreground">
                  {signal.toneReason}
                </p>
              )}
              {signal.articles.slice(0, 3).map((article) => (
                <Link
                  href={`/news?article=${article.id}`}
                  key={article.id}
                  className="block"
                >
                  <p className="font-mono text-[9px] text-muted-foreground">
                    {article.source} · {article.topic} ·{" "}
                    {article.publishedAt.slice(0, 10)}
                  </p>
                  <h3 className="mt-1 text-xs font-medium leading-5">
                    {article.title}
                  </h3>
                </Link>
              ))}
              <Link
                href={`/news?search=${encodeURIComponent(signal.brand.name)}`}
                className="inline-block border-t border-border pt-3 text-xs text-primary"
              >
                View all {signal.articles.length} stories →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      {!active.length && (
        <Card className="shadow-none">
          <CardContent className="py-8 text-center">
            <h2 className="text-base">
              No qualifying competitor reporting is available.
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Review the search status below or refresh coverage. Empty results
              are not proof that nothing happened.
            </p>
          </CardContent>
        </Card>
      )}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Monitoring coverage</CardTitle>
          <p className="text-xs text-muted-foreground">
            Targeted searches are run separately for each tracked brand.
            Candidate results still pass relevance, recency, and duplicate
            checks.
          </p>
        </CardHeader>
        <CardContent>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-160 text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-3 font-normal">Tracked brand</th>
                  <th className="pb-3 font-normal">Qualifying stories</th>
                  <th className="pb-3 font-normal">Latest targeted search</th>
                  <th className="pb-3 font-normal">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((signal) => {
                  const search = news.brandSearches?.find(
                    (item) => item.brandId === signal.brand.id,
                  );
                  return (
                    <tr
                      key={signal.brand.id}
                      className="border-t border-border"
                    >
                      <td className="py-4 pr-3">
                        <span className="flex items-center gap-2">
                          <BrandLogo brand={signal.brand} className="size-7" />
                          <span className="font-medium">
                            {signal.brand.name}
                          </span>
                        </span>
                        {signal.brand.isOwnBrand && (
                          <span className="ml-2 text-[9px] text-primary">
                            Own brand
                          </span>
                        )}
                      </td>
                      <td>
                        {signal.articles.length ? (
                          signal.articles.length
                        ) : (
                          <span className="text-muted-foreground">
                            No matches · {NEWS_WINDOW_DAYS} days
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={
                            search?.status === "failed"
                              ? "text-amber-600 dark:text-amber-200"
                              : "text-muted-foreground"
                          }
                        >
                          {search?.status === "succeeded"
                            ? `Completed · ${search.rawItems} candidates`
                            : search?.status === "failed"
                              ? "Search failed"
                              : "Not checked yet"}
                        </span>
                        {search && (
                          <time
                            dateTime={search.checkedAt}
                            className="mt-1 block text-[9px] text-muted-foreground"
                          >
                            {new Date(search.checkedAt).toLocaleString(
                              "en-US",
                              { timeZone: "UTC" },
                            )}{" "}
                            UTC
                          </time>
                        )}
                      </td>
                      <td className="py-3">
                        {search ? (
                          <a
                            href={`https://news.google.com/search?q=${encodeURIComponent(search.query)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary"
                          >
                            Inspect search ↗
                          </a>
                        ) : (
                          <Link href="/settings" className="text-primary">
                            Review setup →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[10px] leading-5 text-muted-foreground">
            A successful request does not imply complete market coverage.
            No-match brands remain tracked; counts describe retrieved reporting,
            not the entire web. News tone requires at least three stories from
            two publishers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
