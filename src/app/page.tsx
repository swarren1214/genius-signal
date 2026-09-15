import { Sparkles, Newspaper, ArrowRight } from "lucide-react";
import Link from "next/link";

import { PageHero } from "@/components/dashboard/page-hero";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { FadeInStagger, FadeInItem } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { navItems } from "@/lib/nav";
import { weeklyDigest } from "@/lib/mock-data";
import { getOverviewKpis } from "@/lib/data/overview";
import { getNewsFeed } from "@/lib/data/news";

export default async function OverviewPage() {
  const [{ kpis, isLive: pendoIsLive }, { articles, isLive: newsIsLive }] = await Promise.all([
    getOverviewKpis(),
    getNewsFeed(3),
  ]);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Genius Product · Restaurant Vertical"
        title="Welcome back — here's what's happening"
        description="A single view of product performance and market context: Pendo usage, competitor news, and brand sentiment, with AI-generated insights layered on top."
        actions={
          <Link href="/insights">
            <Button variant="secondary" size="sm">
              View full digest <ArrowRight className="size-4" />
            </Button>
          </Link>
        }
      />

      <FadeInStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <FadeInItem key={kpi.label} index={index}>
            <KpiCard
              label={kpi.label}
              value={kpi.value}
              suffix={kpi.suffix}
              delta={kpi.delta}
              icon={kpi.icon}
            />
          </FadeInItem>
        ))}
      </FadeInStagger>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="glass-panel lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <CardTitle>AI Daily Digest</CardTitle>
            </div>
            <Badge variant="outline">AI-generated</Badge>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {weeklyDigest}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="size-4 text-primary" />
              Latest Market News
            </CardTitle>
            <Badge variant={newsIsLive ? "default" : "outline"} className="w-fit text-xs">
              {newsIsLive ? "Live" : "Sample data"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {articles.slice(0, 3).map((article) => (
              <div
                key={article.id}
                className="space-y-1 border-b border-border/60 pb-3 last:border-0 last:pb-0"
              >
                <p className="text-sm font-medium leading-snug">{article.title}</p>
                <p className="text-xs text-muted-foreground">
                  {article.source} · {article.topic}
                </p>
              </div>
            ))}
            <Link href="/news" className="block">
              <Button variant="ghost" size="sm" className="w-full">
                View all news <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {!pendoIsLive && (
        <p className="text-xs text-muted-foreground">
          Showing sample product analytics — set <code>PENDO_API_KEY</code> in{" "}
          <code>.env.local</code> to connect live Pendo data.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {navItems.slice(1).map((item) => (
          <Link key={item.url} href={item.url}>
            <Card className="glass-panel h-full transition hover:glow-ring">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                  <item.icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
