import {
  ArrowRight,
  ArrowUpRight,
  Gauge,
  Settings2,
  Sparkles,
  Swords,
} from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/dashboard/page-hero";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SignalChart } from "@/components/dashboard/signal-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { digestHighlights, newsArticles } from "@/lib/mock-data";
import { getOverviewKpis } from "@/lib/data/overview";
import { getNewsFeed } from "@/lib/data/news";

export default async function OverviewPage() {
  const [{ kpis, isLive }, news] = await Promise.all([
    getOverviewKpis(),
    getNewsFeed(3),
  ]);
  const articles = news.articles.length ? news.articles : newsArticles;
  const newsIsLive = news.isLive && news.articles.length > 0;
  const shortcuts = [
    {
      title: "Compare the competitive landscape",
      description: "Genius, Toast, Clover, SpotOn & TouchBistro",
      url: "/competitors",
      label: "Open Competitor Comparison",
      icon: Swords,
    },
    {
      title: "Ask a better product question",
      description: "Digests, anomalies and answers in one place",
      url: "/insights",
      label: "Open AI Insights",
      icon: Sparkles,
    },
    {
      title: "Make this workspace yours",
      description: "Manage data sources, brands and alerts",
      url: "/settings",
      label: "Open Settings",
      icon: Settings2,
    },
  ];
  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Your week, in focus / Sept 1–8, 2026"
        title="Welcome back. Find your next advantage."
        description="Product performance, market context and the signals that deserve your attention this week."
        actions={
          <Button
            size="sm"
            render={<Link href="/insights" />}
            nativeButton={false}
          >
            View full digest <ArrowRight className="size-3.5" />
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>
      {!isLive && (
        <p className="text-[10px] text-muted-foreground">
          Sample product analytics · Configure Pendo in Settings to connect live
          data.
        </p>
      )}
      <div className="grid min-w-0 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="gap-3 shadow-none">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">
              Product pulse
            </p>
            <Link
              href="/analytics"
              className="inline-flex items-center gap-1 text-xs text-primary"
            >
              Product Analytics <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h2 className="text-lg">Tableside Pay is gaining ground</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Feature adoption · week of Sept 1–8, 2026
              </p>
            </div>
            <SignalChart />
            <p className="flex items-start gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 shrink-0 text-primary" />
              Launch coverage may be translating into real product engagement.
            </p>
          </CardContent>
        </Card>
        <Card className="gap-4 shadow-none">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              AI Daily Digest
            </CardTitle>
            <Badge
              variant="ghost"
              className="font-mono text-[9px] text-primary"
            >
              AI-GENERATED
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <p className="mb-5 font-mono text-[9px] uppercase text-muted-foreground">
              Week of Sept 1–8, 2026 · 3 AI-generated insights
            </p>
            <ol className="space-y-5">
              {digestHighlights.map((item, index) => (
                <li key={item.title} className="flex gap-3">
                  <span className="pt-0.5 font-mono text-[10px] text-primary">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="text-xs font-medium">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
              <Link
                href="/insights"
                className="inline-flex items-center gap-1 text-xs text-primary"
              >
                Open AI Insights <ArrowUpRight className="size-3" />
              </Link>
              <span className="font-mono text-[9px] text-muted-foreground">
                2 MIN READ
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Latest Market News</CardTitle>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {newsIsLive
                  ? "Latest coverage from tracked sources"
                  : "Reference summaries · week of Sept 1–8, 2026"}
              </p>
            </div>
            <Link
              href="/news"
              className="inline-flex items-center gap-1 text-xs text-primary"
            >
              View all articles <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {articles.slice(0, 3).map((article) => (
              <Link
                href={`/news?article=${encodeURIComponent(article.id)}`}
                key={article.id}
                className="flex gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-primary">
                  {article.source.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[9px] text-muted-foreground">
                    {article.source} · {article.topic.toUpperCase()}
                  </p>
                  <h3 className="mt-1 text-xs font-medium leading-5">
                    {article.title}
                  </h3>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    {article.whyItMatters}
                  </p>
                </div>
                <ArrowUpRight className="mt-1 size-3 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">
              The brand signal
            </p>
            <Gauge className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base">Own-brand sentiment</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Genius · restaurant vertical
                </p>
                <p className="mt-2 font-mono text-[10px] text-emerald-600 dark:text-emerald-300/80">
                  +4% vs last week
                </p>
              </div>
              <div
                role="img"
                aria-label="Brand sentiment: 74 out of 100"
                className="relative size-28 shrink-0 rounded-full border-[5px] border-muted border-l-chart-1 border-t-chart-1 border-r-chart-1"
              >
                <span className="absolute inset-0 flex items-center justify-center text-4xl font-normal">
                  74
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Reported score: 74 · illustrative gauge on a 0–100 scale.
            </p>
            <div className="border-t border-border pt-4">
              <h3 className="text-xs font-medium">
                What is driving the conversation?
              </h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Pair the improving brand signal with launch coverage. Explore
                the underlying conversation before choosing your next move.
              </p>
              <Link
                href="/sentiment"
                className="mt-4 inline-flex items-center gap-1 text-xs text-primary"
              >
                Explore Brand Sentiment <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {shortcuts.map((item) => (
          <Link
            href={item.url}
            key={item.url}
            className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-4 transition-colors hover:bg-muted"
          >
            <item.icon className="size-5 shrink-0 text-primary" />
            <div>
              <h3 className="text-xs font-medium">{item.title}</h3>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {item.description}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-primary">
                {item.label}
                <ArrowRight className="size-3" />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
