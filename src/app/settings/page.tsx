import { PageHero } from "@/components/dashboard/page-hero";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trackedBrands } from "@/lib/mock-data";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Settings"
        title="Data sources, brands, and alerts"
        description="Configure tracked competitor brands, ingestion schedules, and notification preferences. Changes here are recorded in the audit log."
      />

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Tracked Brands</CardTitle>
          <CardDescription>Brands monitored for news and sentiment tracking.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {trackedBrands.map((b) => (
            <Badge key={b.id} variant="secondary" className="text-xs">
              {b.name}
              {b.isOwnBrand && " · Own Brand"}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>Status of each configured ingestion source.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            { name: "Pendo API", status: "Connected" },
            { name: "NewsAPI / GNews", status: "Connected" },
            { name: "Reddit API", status: "Not configured" },
            { name: "App Store Reviews", status: "Not configured" },
          ].map((source, i, arr) => (
            <div key={source.name}>
              <div className="flex items-center justify-between">
                <span>{source.name}</span>
                <Badge
                  variant={source.status === "Connected" ? "default" : "outline"}
                  className="text-xs"
                >
                  {source.status}
                </Badge>
              </div>
              {i < arr.length - 1 && <Separator className="mt-3" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Alert Delivery</CardTitle>
          <CardDescription>Where sentiment/news alerts are sent.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Slack channel: <span className="text-foreground">#genius-restaurant-intel</span>
        </CardContent>
      </Card>
    </div>
  );
}
