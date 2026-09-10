import { Newspaper, Sparkles } from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { FadeInStagger, FadeInItem } from "@/components/motion/fade-in";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackedBrands } from "@/lib/mock-data";
import { getNewsFeed } from "@/lib/data/news";

function sentimentBadgeVariant(sentiment: string) {
  if (sentiment === "positive") return "default" as const;
  if (sentiment === "negative") return "destructive" as const;
  return "secondary" as const;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function NewsPage() {
  const { articles, isLive } = await getNewsFeed();

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Market Intelligence"
        title="News Feed"
        description="Real-time coverage of Global Payments Genius and tracked restaurant POS competitors, with AI-generated context for why each story matters."
      />

      <div className="flex flex-wrap items-center gap-2">
        {trackedBrands.map((b) => (
          <Badge key={b.id} variant="outline" className="text-xs">
            {b.name}
          </Badge>
        ))}
        <Badge variant={isLive ? "default" : "secondary"} className="ml-auto text-xs">
          {isLive ? "Live" : "Sample data"}
        </Badge>
      </div>

      <FadeInStagger className="space-y-4">
        {articles.map((article, index) => (
          <FadeInItem key={article.id} index={index}>
            <Card className="glass-panel">
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Newspaper className="size-3.5" />
                    <span>{article.source}</span>
                    <span>·</span>
                    <span>{timeAgo(article.publishedAt)}</span>
                    <span>·</span>
                    <span>{article.topic}</span>
                  </div>
                  <Badge variant={sentimentBadgeVariant(article.sentiment)} className="capitalize">
                    {article.sentiment}
                  </Badge>
                </div>

                <h3 className="text-base font-semibold leading-snug">{article.title}</h3>
                <p className="text-sm text-muted-foreground">{article.snippet}</p>

                <div className="flex items-start gap-2 rounded-lg bg-accent/60 p-3 text-xs text-accent-foreground">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    <span className="font-medium">Why this matters: </span>
                    {article.whyItMatters}
                  </span>
                </div>
              </CardContent>
            </Card>
          </FadeInItem>
        ))}
      </FadeInStagger>
    </div>
  );
}
