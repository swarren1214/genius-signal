"use client";

import { useState } from "react";
import { Send, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { FadeInStagger, FadeInItem } from "@/components/motion/fade-in";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { weeklyDigest } from "@/lib/mock-data";

const anomalies = [
  {
    id: "1",
    type: "positive" as const,
    text: "Tableside payment feature adoption jumped 12% week-over-week, correlating with this week's product launch coverage.",
  },
  {
    id: "2",
    type: "negative" as const,
    text: "Clover's sentiment score dropped 6 points, driven by weekend outage reports.",
  },
];

export default function InsightsPage() {
  const [question, setQuestion] = useState("");

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="AI Insights"
        title="Digests, anomalies, and ask-the-dashboard Q&A"
        description="AI-generated summaries combining Pendo trends, news, and sentiment — all outputs are labeled and link back to source data."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="glass-panel lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Weekly Digest
            </CardTitle>
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
            <CardTitle>Anomaly Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {anomalies.map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-sm">
                {a.type === "positive" ? (
                  <TrendingUp className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                ) : (
                  <TrendingDown className="mt-0.5 size-4 shrink-0 text-rose-500" />
                )}
                <p className="text-muted-foreground">{a.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <FadeInStagger>
        <FadeInItem index={0}>
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Ask the Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ask a question scoped to your aggregated Pendo, news, and sentiment data. Answers
                cite the underlying source records and never fabricate figures not present in the data.
              </p>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setQuestion("");
                }}
              >
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Why did Clover's sentiment drop this week?"
                />
                <Button type="submit" size="icon" disabled={!question}>
                  <Send className="size-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </FadeInItem>
      </FadeInStagger>
    </div>
  );
}
