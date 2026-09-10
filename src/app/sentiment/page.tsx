import { PageHero } from "@/components/dashboard/page-hero";
import { SentimentGauge } from "@/components/dashboard/sentiment-gauge";
import { FadeInStagger, FadeInItem } from "@/components/motion/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackedBrands } from "@/lib/mock-data";

export default function SentimentPage() {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Brand Sentiment Meter"
        title="How the market feels about restaurant POS brands"
        description="A normalized sentiment score (0–100) per brand, blended from news coverage, review sites, and community discussion, updated on each ingestion cycle."
      />

      <FadeInStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {trackedBrands.map((brand, index) => (
          <FadeInItem key={brand.id} index={index}>
            <Card className="glass-panel h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-0">
                {brand.isOwnBrand && (
                  <Badge className="bg-primary text-primary-foreground">Own Brand</Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3 pt-2">
                <SentimentGauge
                  score={brand.sentiment}
                  label={brand.name}
                  rationale={brand.rationale}
                />
                <span
                  className={
                    brand.sentimentDelta >= 0
                      ? "text-xs font-medium text-emerald-500"
                      : "text-xs font-medium text-rose-500"
                  }
                >
                  {brand.sentimentDelta >= 0 ? "+" : ""}
                  {brand.sentimentDelta} pts this week
                </span>
              </CardContent>
            </Card>
          </FadeInItem>
        ))}
      </FadeInStagger>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Score Methodology</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Each score blends news sentiment (40%), community discussion such as Reddit (30%),
          and app/review-site sentiment (30%). Day-over-day movement is capped at ±10 points
          unless driven by a high-confidence event (e.g., a confirmed outage or funding news),
          to avoid noisy single-article swings.
        </CardContent>
      </Card>
    </div>
  );
}
