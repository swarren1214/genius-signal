"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Flag,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import { PageHero } from "@/components/dashboard/page-hero";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSavedItems } from "@/hooks/use-saved-items";
import { digestHighlights } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const insights = [
  {
    id: "activation",
    area: "payments",
    priority: "High priority",
    confidence: 83,
    title: "Close the Tableside Pay activation gap",
    headline: "Turn Tableside Pay momentum into first payments.",
    description:
      "Prioritize activation for locations that have enabled Tableside Pay but have not used it. A guided first-payment experience could help convert interest into a repeatable checkout habit.",
    summary: "1,500 enabled locations have yet to complete a first payment.",
    source: "Pendo + market coverage",
    reach: "1,500 locations",
    productArea: "Payments / onboarding",
    hypothesis:
      "The gap may be onboarding friction, not lack of demand. Segment by enablement date and location size before designing a guided activation test.",
    uncertainty:
      "Coverage does not establish causality. Hardware readiness, training and payment eligibility could also explain the gap.",
    action: "Draft a first-payment activation experiment",
  },
  {
    id: "positioning",
    area: "positioning",
    priority: "Medium priority",
    confidence: 76,
    title: "Lead with value. Back it with reliability.",
    headline: "Make reliability part of your value story.",
    description: digestHighlights[1].body,
    summary:
      "Pricing pushback and service concerns create a positioning hypothesis.",
    source: "Market news + brand signals",
    reach: "Full-service restaurants",
    productArea: "Positioning / reliability",
    hypothesis:
      "A clear value story backed by reliable service may resonate with operators comparing alternatives.",
    uncertainty:
      "Competitor coverage alone does not demonstrate switching intent. Validate the message with customers before changing positioning.",
    action: "Draft a value and reliability messaging test",
  },
  {
    id: "workflow",
    area: "workflows",
    priority: "Medium priority",
    confidence: 71,
    title: "The next battleground is the workflow.",
    headline: "Look beyond the payment moment.",
    description: digestHighlights[2].body,
    summary:
      "Delivery and kitchen partnerships point beyond the payment moment.",
    source: "SpotOn + TouchBistro coverage",
    reach: "Connected restaurant workflows",
    productArea: "Integrations / operations",
    hypothesis:
      "Connected ordering and kitchen workflows may create a stronger product story than isolated payment features.",
    uncertainty:
      "Announcements are not evidence of adoption. Review integration demand and operator feedback before prioritizing delivery.",
    action: "Draft a connected-workflow discovery study",
  },
] as const;

export default function InsightsPage() {
  const [question, setQuestion] = useState("");
  const [selectedId, setSelectedId] = useState("activation");
  const [area, setArea] = useState("all");
  const [view, setView] = useState("all");
  const [sort, setSort] = useState("impact");
  const [askOpen, setAskOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [status, setStatus] = useState("");
  const [answer, setAnswer] = useState("");
  const { saved, toggle } = useSavedItems("signal-saved-insights");
  const filtered = insights
    .filter(
      (item) =>
        (area === "all" || item.area === area) &&
        (view !== "saved" || saved.includes(item.id)),
    )
    .toSorted((first, second) =>
      sort === "impact"
        ? second.confidence - first.confidence
        : first.title.localeCompare(second.title),
    );
  const selected =
    filtered.find((item) => item.id === selectedId) ?? filtered[0];
  const evidenceByInsight = {
    activation: [
      {
        value: "47%",
        source: "PENDO · PRODUCT USAGE",
        label: "Reported metric",
        title: "Tableside Pay adoption is up 12% vs last week",
        detail: "Sept 1–8, 2026 · restaurant vertical · reference digest",
        href: "/analytics",
      },
      {
        value: "1,500",
        source: "PENDO · ACTIVATION FUNNEL",
        label: "Illustrative",
        title: "Enabled locations have not made a first payment",
        detail: "6,200 enabled − 4,700 activated · demo cohort",
        href: "/analytics",
      },
      {
        value: "01",
        source: "PRESS · WEEKLY DIGEST",
        label: "Demo summary",
        title: "AI-assisted checkout launch earns positive coverage",
        detail:
          "Weekly reference digest · expanded source context is illustrative",
        href: "/news?article=2",
      },
    ],
    positioning: [
      {
        value: "−6",
        source: "BRAND SENTIMENT",
        label: "Reference metric",
        title: "Clover sentiment declined after outage reports",
        detail: "Weekly digest · reference brand signal",
        href: "/sentiment",
      },
      {
        value: "02",
        source: "MARKET NEWS",
        label: "Demo summary",
        title: "Toast fee changes draw pushback",
        detail: "Reference market coverage · week of Sept 1–8",
        href: "/news?article=1",
      },
    ],
    workflow: [
      {
        value: "01",
        source: "SPOTON · MARKET COVERAGE",
        label: "Demo summary",
        title: "Delivery partnership expands the ordering workflow",
        detail: "Weekly reference digest",
        href: "/news?article=4",
      },
      {
        value: "02",
        source: "TOUCHBISTRO · MARKET COVERAGE",
        label: "Demo summary",
        title: "Kitchen display integration strengthens operations",
        detail: "Weekly reference digest",
        href: "/news?article=5",
      },
    ],
  };
  const evidence = selected ? evidenceByInsight[selected.id] : [];

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Signal synthesis / Sept 1–8, 2026"
        title="From scattered signals to a clear next move."
        description="Explore prioritized hypotheses, check the evidence and decide what deserves action."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAskOpen(true)}
          >
            <Sparkles className="size-3.5" />
            Ask a product question
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <Select
          items={[
            { value: "all", label: "New insights · 3" },
            { value: "saved", label: `Saved · ${saved.length}` },
          ]}
          value={view}
          onValueChange={(value) => setView(value ?? "all")}
        >
          <SelectTrigger aria-label="Insight view">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">New insights · 3</SelectItem>
            <SelectItem value="saved">Saved · {saved.length}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          items={[
            { value: "all", label: "All product areas" },
            { value: "payments", label: "Payments" },
            { value: "positioning", label: "Positioning" },
            { value: "workflows", label: "Workflows" },
          ]}
          value={area}
          onValueChange={(value) => setArea(value ?? "all")}
        >
          <SelectTrigger aria-label="Product area">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All product areas</SelectItem>
            <SelectItem value="payments">Payments</SelectItem>
            <SelectItem value="positioning">Positioning</SelectItem>
            <SelectItem value="workflows">Workflows</SelectItem>
          </SelectContent>
        </Select>
        <Select
          items={[
            { value: "impact", label: "Sort: impact first" },
            { value: "title", label: "Sort: title" },
          ]}
          value={sort}
          onValueChange={(value) => setSort(value ?? "impact")}
        >
          <SelectTrigger aria-label="Sort insights">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="impact">Sort: impact first</SelectItem>
            <SelectItem value="title">Sort: title</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto font-mono text-[9px] text-muted-foreground">
          DEMO INSIGHTS · REVIEW BEFORE ACTING
        </span>
      </div>
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(230px,0.8fr)_minmax(0,2fr)]">
        <div className="space-y-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm">Recommended for you</h2>
            <span className="font-mono text-[9px] text-muted-foreground">
              {filtered.length} INSIGHTS
            </span>
          </div>
          {filtered.map((item, index) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedId(item.id);
                setStatus("");
              }}
              aria-pressed={selected?.id === item.id}
              className={cn(
                "w-full rounded-lg border border-border bg-card p-5 text-left transition hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-ring",
                selected?.id === item.id && "border-primary/40 bg-accent",
              )}
            >
              <div className="flex justify-between gap-2 text-[10px] text-primary">
                <span>{item.priority}</span>
                <span className="font-mono">0{index + 1}</span>
              </div>
              <h3 className="mt-3 text-sm leading-6">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {item.summary}
              </p>
              <div className="mt-4 flex justify-between gap-3 text-[9px] text-muted-foreground">
                <span>{item.source}</span>
                <span>{item.confidence}%</span>
              </div>
              {selected?.id === item.id && (
                <p className="mt-3 flex justify-between text-[10px] text-primary">
                  Selected insight <ArrowUpRight className="size-3" />
                </p>
              )}
            </button>
          ))}
          <div className="border-t border-border pt-4">
            <h3 className="text-xs">How these are ranked</h3>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
              Potential product impact, evidence strength and recency. All
              scores are illustrative; review before acting.
            </p>
          </div>
        </div>
        <Card className="min-w-0 shadow-none">
          <CardContent className="space-y-6">
            {selected ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Growth opportunity</Badge>
                    <Badge
                      variant="outline"
                      className="text-amber-600 dark:text-amber-200/80"
                    >
                      Needs validation
                    </Badge>
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    AI-GENERATED · REFERENCE WEEK
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-normal leading-snug">
                    {selected.headline}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {selected.description}
                  </p>
                </div>
                <div className="grid gap-4 border-y border-border py-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Evidence confidence{" "}
                      <span className="float-right font-mono text-primary">
                        {selected.confidence} / 100
                      </span>
                    </p>
                    <div className="mt-3 h-1 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${selected.confidence}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[9px] text-muted-foreground">
                      Demo score · not a probability
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Potential reach
                    </p>
                    <p className="mt-2 text-base">{selected.reach}</p>
                    <p className="mt-1 text-[9px] text-muted-foreground">
                      Illustrative opportunity · not a forecast
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Product area
                    </p>
                    <p className="mt-2 text-sm">{selected.productArea}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-base">The signals behind this insight</h3>
                  <div className="mt-4">
                    {evidence.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="flex items-center gap-3 border-b border-border py-4"
                      >
                        <span className="min-w-14 text-center text-xl font-normal tabular-nums">
                          {item.value}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[9px] text-muted-foreground">
                            {item.source} · {item.label}
                          </p>
                          <h4 className="mt-1 text-xs leading-5">
                            {item.title}
                          </h4>
                          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                            {item.detail}
                          </p>
                        </div>
                        <ArrowUpRight className="size-3 shrink-0 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <h3 className="font-mono text-[9px] text-primary">
                      WORKING HYPOTHESIS
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {selected.hypothesis}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-mono text-[9px] text-amber-600 dark:text-amber-200/80">
                      WHAT WE DON&apos;T KNOW
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {selected.uncertainty}
                    </p>
                  </div>
                </div>
                <div className="border-l-2 border-primary bg-accent/50 p-4">
                  <h3 className="flex items-start gap-2 text-xs">
                    <Flag className="size-3.5 shrink-0 text-primary" />
                    {selected.action}
                  </h3>
                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                    Validate the cohort, define success and run a small
                    experiment before committing to a rollout.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setActionTitle(selected.action);
                      setActionNotes("");
                      setActionOpen(true);
                    }}
                  >
                    <Plus className="size-3.5" />
                    Create product action
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    render={<Link href="/analytics" />}
                    nativeButton={false}
                  >
                    <ArrowUpRight className="size-3.5" />
                    Investigate cohort
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-pressed={saved.includes(selected.id)}
                    onClick={() => toggle(selected.id)}
                  >
                    <Bookmark
                      className={cn(
                        "size-3.5",
                        saved.includes(selected.id) &&
                          "fill-primary text-primary",
                      )}
                    />
                    {saved.includes(selected.id)
                      ? "Insight saved"
                      : "Save insight"}
                  </Button>
                </div>
                <p className="text-[9px] leading-5 text-muted-foreground">
                  Provenance: Signal synthesis · weekly market digest · Sept
                  1–8, 2026. Expanded evidence and confidence scores are
                  illustrative. Human review required.
                </p>
              </>
            ) : (
              <div className="py-20 text-center">
                <CardTitle>No insights match these filters.</CardTitle>
                <Button
                  variant="link"
                  onClick={() => {
                    setView("all");
                    setArea("all");
                  }}
                >
                  Show all insights
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {status && (
        <output className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-300">
          <Check className="size-4" />
          {status}
        </output>
      )}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create product action</DialogTitle>
            <DialogDescription>
              Draft for team review. Saved locally in this browser.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              try {
                const key = "signal-product-actions";
                const raw: unknown = JSON.parse(
                  localStorage.getItem(key) ?? "[]",
                );
                const drafts = Array.isArray(raw) ? raw : [];
                localStorage.setItem(
                  key,
                  JSON.stringify([
                    ...drafts,
                    {
                      title: actionTitle,
                      notes: actionNotes,
                      insight: selected?.id,
                      createdAt: new Date().toISOString(),
                    },
                  ]),
                );
                setStatus(
                  "Product action draft saved locally. Review before sharing.",
                );
                setActionOpen(false);
              } catch {
                setStatus(
                  "Could not save the draft. Browser storage is unavailable.",
                );
              }
            }}
          >
            <label className="block space-y-2 text-xs">
              <span>Action title</span>
              <Input
                value={actionTitle}
                onChange={(event) => setActionTitle(event.target.value)}
                required
              />
            </label>
            <label className="block space-y-2 text-xs">
              <span>Notes and success criteria</span>
              <textarea
                className="min-h-28 w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-ring"
                value={actionNotes}
                onChange={(event) => setActionNotes(event.target.value)}
              />
            </label>
            <Button type="submit" disabled={!actionTitle.trim()}>
              <Bookmark className="size-4" />
              Save draft
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={askOpen} onOpenChange={setAskOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ask a product question</DialogTitle>
            <DialogDescription>
              Reference digest responses only. Live AI analysis is not
              connected.
            </DialogDescription>
          </DialogHeader>
          {answer && (
            <div
              aria-live="polite"
              className="space-y-3 border-l-2 border-primary pl-4"
            >
              <p className="text-sm leading-6">{answer}</p>
              <Link href="/news" className="text-xs text-primary">
                Source: weekly reference digest, Sept 1–8, 2026 →
              </Link>
            </div>
          )}
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!question.trim()) {
                return;
              }
              let response =
                "The reference digest does not contain enough evidence to answer that question. Review the available market sources and product analytics before drawing a conclusion.";
              if (/clover|toast|reliability|pricing/i.test(question)) {
                response = digestHighlights[1].body;
              } else if (
                /kitchen|workflow|spoton|touchbistro/i.test(question)
              ) {
                response = digestHighlights[2].body;
              } else if (
                /tableside|payment|adoption|checkout/i.test(question)
              ) {
                response = digestHighlights[0].body;
              }
              setAnswer(response);
              setQuestion("");
            }}
          >
            <Input
              aria-label="Product question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Why did Clover's sentiment drop?"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Send question"
              disabled={!question.trim()}
            >
              <Send className="size-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
