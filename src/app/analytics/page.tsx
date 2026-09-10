import { LineChart as LineChartIcon } from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { FadeInStagger, FadeInItem } from "@/components/motion/fade-in";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAnalyticsData } from "@/lib/data/analytics";

export default async function AnalyticsPage() {
  const { dailyActiveUsers, weeklyActiveUsers, totalVisitors, featureAdoption, isLive } =
    await getAnalyticsData();

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Pendo · Product Analytics"
        title="Product Analytics"
        description="Usage trends, adoption funnels, and feature engagement for the restaurant vertical, sourced from Pendo."
        actions={
          <Badge variant={isLive ? "default" : "outline"} className="text-xs">
            {isLive ? "Live" : "Sample data"}
          </Badge>
        }
      />

      <FadeInStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FadeInItem index={0}>
          <KpiCard label="Daily Active Users" value={dailyActiveUsers} delta={3} icon="users" />
        </FadeInItem>
        <FadeInItem index={1}>
          <KpiCard label="Weekly Active Users" value={weeklyActiveUsers} delta={6} icon="users" />
        </FadeInItem>
        <FadeInItem index={2}>
          <KpiCard label="Total Tracked Visitors" value={totalVisitors} delta={0} icon="click" />
        </FadeInItem>
        <FadeInItem index={3}>
          <KpiCard label="NPS Score" value={41} delta={5} icon="star" />
        </FadeInItem>
      </FadeInStagger>

      <Card className="glass-panel">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="size-4 text-primary" />
              Feature Adoption
            </CardTitle>
            <CardDescription>
              Share of active restaurant accounts using each feature in the last 30 days.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Sample data
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {featureAdoption.map((f) => (
            <div key={f.feature} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>{f.feature}</span>
                <span className="text-muted-foreground">{f.adoption}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${f.adoption}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
