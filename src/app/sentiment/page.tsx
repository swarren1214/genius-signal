import Link from "next/link";
import { PageHero } from "@/components/dashboard/page-hero";
import { SentimentGauge } from "@/components/dashboard/sentiment-gauge";
import { SourceStatus } from "@/components/dashboard/source-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getNewsFeed } from "@/lib/data/news";
import { getBrandSignals } from "@/lib/data/sentiment";
import { NEWS_WINDOW_DAYS } from "@/lib/services/news-quality";

export const dynamic = "force-dynamic";

export default async function SentimentPage() {
  const news = await getNewsFeed();
  const signals = getBrandSignals(news.articles);
  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Brand signals / news-derived tone"
        title="Inspect the conversation, not an invented score."
        description="Transparent lexical analysis of retrieved headlines and publisher summaries. News is the only connected sentiment source."
      />
      <SourceStatus name={news.provider} health={news} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {signals.map((signal) => (
          <Card key={signal.brand.id} className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{signal.brand.name}</CardTitle>
              {signal.brand.isOwnBrand && (
                <Badge variant="secondary">Own brand</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {signal.score === null ? (
                <p className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                  No retrieved coverage. Score unavailable.
                </p>
              ) : (
                <SentimentGauge score={signal.score} label="News tone, 0–100" />
              )}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-300">
                    {signal.positive}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Positive
                  </p>
                </div>
                <div>
                  <p>{signal.neutral}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Neutral
                  </p>
                </div>
                <div>
                  <p className="text-rose-600 dark:text-rose-300">
                    {signal.negative}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Negative
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {signal.articles.length} articles · last {NEWS_WINDOW_DAYS} days
                {signal.delta !== null
                  ? ` · ${signal.delta > 0 ? "+" : ""}${signal.delta} points since the previous stored day`
                  : " · no prior-day comparison yet"}
              </p>
              {signal.articles.slice(0, 2).map((article) => (
                <Link
                  key={article.id}
                  href={`/news?article=${article.id}`}
                  className="block border-t border-border pt-3 text-xs leading-5"
                >
                  {article.title}
                  <span className="mt-1 block text-[9px] text-muted-foreground">
                    {article.source} · {article.publishedAt.slice(0, 10)}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Methodology and limitations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs leading-6 text-muted-foreground">
          <p>
            A standard sentiment lexicon classifies each retrieved headline and
            available summary as positive, neutral, or negative. The score is
            the mean of those labels, mapped to 100, 50, and 0 respectively. A
            brand with no retrieved articles has no score.
          </p>
          <p>
            This is a news-tone estimate, not NPS or a measure of customer
            satisfaction. There is no Reddit, review-site, or app-store
            weighting. Small samples and ambiguous language can skew results;
            inspect the linked reporting before making decisions.
          </p>
          <p>
            Historical changes compare stored daily observations. No historical
            values are backfilled or fabricated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
