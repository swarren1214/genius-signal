import { Gauge } from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { FadeInStagger, FadeInItem } from "@/components/motion/fade-in";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trackedBrands } from "@/lib/mock-data";

const competitorDetails: Record<string, { founded: string; hq: string; notableFeature: string }> = {
  genius: { founded: "—", hq: "Atlanta, GA", notableFeature: "AI-assisted tableside checkout" },
  toast: { founded: "2012", hq: "Boston, MA", notableFeature: "All-in-one restaurant platform" },
  square: { founded: "2009", hq: "San Francisco, CA", notableFeature: "Integrated hardware + software" },
  clover: { founded: "2010", hq: "Sunnyvale, CA", notableFeature: "App marketplace ecosystem" },
  touchbistro: { founded: "2010", hq: "Toronto, ON", notableFeature: "iPad-native POS for full-service" },
  lightspeed: { founded: "2005", hq: "Montreal, QC", notableFeature: "Multi-location reporting" },
  spoton: { founded: "2017", hq: "San Francisco, CA", notableFeature: "Online ordering + delivery network" },
};

export default function CompetitorsPage() {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Competitive Landscape"
        title="Competitor Comparison"
        description="Side-by-side view of tracked restaurant POS brands: company facts, current sentiment, and notable recent moves."
      />

      <FadeInStagger className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {trackedBrands.map((brand, index) => {
          const details = competitorDetails[brand.id];
          return (
            <FadeInItem key={brand.id} index={index}>
              <Card className="glass-panel h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{brand.name}</CardTitle>
                  {brand.isOwnBrand && (
                    <Badge className="bg-primary text-primary-foreground">Own Brand</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Founded</span>
                    <span className="text-foreground">{details.founded}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>HQ</span>
                    <span className="text-foreground">{details.hq}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Notable Feature</span>
                    <span className="text-right text-foreground">{details.notableFeature}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Gauge className="size-3.5" /> Sentiment
                    </span>
                    <span className="font-semibold">{brand.sentiment}/100</span>
                  </div>
                </CardContent>
              </Card>
            </FadeInItem>
          );
        })}
      </FadeInStagger>
    </div>
  );
}
