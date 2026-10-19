import Link from "next/link";
import { PageHero } from "@/components/dashboard/page-hero";
import { SourceStatus } from "@/components/dashboard/source-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getNewsFeed } from "@/lib/data/news";
import { getBrandSignals } from "@/lib/data/sentiment";
import { NEWS_WINDOW_DAYS } from "@/lib/services/news-quality";

export const dynamic = "force-dynamic";

export default async function CompetitorsPage() {
  const news = await getNewsFeed();
  const signals = getBrandSignals(news.articles);
  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Competitive landscape / monitored reporting"
        title="Compare the signals you can verify."
        description="Tracked brands, actual recent coverage, and transparent news-tone measurements. No invented company facts or launch timelines."
        actions={
          <Link href="/settings" className="text-xs text-primary">
            Edit tracked brands →
          </Link>
        }
      />
      <SourceStatus name={news.provider} health={news} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {signals.map((signal) => (
          <Card key={signal.brand.id} className="shadow-none">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <CardTitle>{signal.brand.name}</CardTitle>
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
                  <p className="text-2xl font-normal">{signal.score ?? "—"}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Calculated news tone
                  </p>
                </div>
              </div>
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
              {!signal.articles.length && (
                <p className="py-6 text-xs text-muted-foreground">
                  No recent reporting has been retrieved for this brand.
                </p>
              )}
              <p className="border-t border-border pt-3 text-[10px] text-muted-foreground">
                Search terms: {signal.brand.newsSearchTerms.join(", ")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
