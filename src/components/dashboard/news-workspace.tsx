"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  ExternalLink,
  Search,
  Sparkles,
} from "lucide-react";
import { PageHero } from "@/components/dashboard/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSavedItems } from "@/hooks/use-saved-items";
import { trackedBrands, type NewsArticle } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface NewsWorkspaceProps {
  articles: NewsArticle[];
  isLive: boolean;
  initialSearch?: string;
  initialArticle?: string;
}

export function NewsWorkspace({
  articles,
  isLive,
  initialSearch = "",
  initialArticle,
}: Readonly<NewsWorkspaceProps>) {
  const [search, setSearch] = useState(initialSearch);
  const [brand, setBrand] = useState("all");
  const [topic, setTopic] = useState("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(initialArticle);
  const [limit, setLimit] = useState(6);
  const { saved, toggle } = useSavedItems("signal-saved-stories");
  const topics = [...new Set(articles.map((article) => article.topic))];
  const filtered = articles
    .filter((article) => {
      const brandNames = trackedBrands
        .filter((item) => article.brands.includes(item.id))
        .map((item) => item.name)
        .join(" ");
      return (
        (brand === "all" || article.brands.includes(brand)) &&
        (topic === "all" || article.topic === topic) &&
        (!savedOnly || saved.includes(article.id)) &&
        `${article.title} ${article.snippet} ${article.source} ${brandNames} ${article.topic}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    })
    .toSorted(
      (first, second) =>
        Number(second.brands.includes("genius")) -
        Number(first.brands.includes("genius")),
    );
  const selected =
    filtered.find((article) => article.id === selectedId) ?? filtered[0];
  const selectedBrand = trackedBrands.find((item) =>
    selected?.brands.includes(item.id),
  );
  const savedCount = articles.filter((article) =>
    saved.includes(article.id),
  ).length;
  const sourceUrl =
    selected?.url && /^https?:\/\//i.test(selected.url)
      ? selected.url
      : undefined;

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Market radar / restaurant vertical"
        title="Read the market. Find your opening."
        description="Keep competitor moves, launch coverage and operator needs in product context."
        actions={
          <Button
            variant="secondary"
            size="sm"
            render={<Link href="/settings" />}
            nativeButton={false}
          >
            <Bell className="size-3.5" />
            Create alert
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-56">
          <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            aria-label="Search articles"
            placeholder="Search articles, competitors or topics..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setLimit(6);
            }}
            className="pl-9"
          />
        </div>
        <Select
          items={[
            { value: "all", label: "All brands" },
            ...trackedBrands.map((item) => ({
              value: item.id,
              label: item.name,
            })),
          ]}
          value={brand}
          onValueChange={(value) => setBrand(value ?? "all")}
        >
          <SelectTrigger aria-label="Filter by brand">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {trackedBrands.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={[
            { value: "all", label: "All topics" },
            ...topics.map((item) => ({ value: item, label: item })),
          ]}
          value={topic}
          onValueChange={(value) => setTopic(value ?? "all")}
        >
          <SelectTrigger aria-label="Filter by topic">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All topics</SelectItem>
            {topics.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="ml-auto font-mono text-[9px]">
          {isLive ? "LIVE NEWS" : "REFERENCE NEWS & CONTEXT"}
        </Badge>
      </div>
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Your market, in motion</CardTitle>
            <span className="font-mono text-[9px] text-muted-foreground">
              {articles.length} ARTICLES
            </span>
          </CardHeader>
          <CardContent>
            <fieldset aria-label="Article view" className="mb-3 flex gap-1">
              <Button
                variant={!savedOnly ? "secondary" : "ghost"}
                size="xs"
                aria-pressed={!savedOnly}
                onClick={() => setSavedOnly(false)}
              >
                All signals
              </Button>
              <Button
                variant={savedOnly ? "secondary" : "ghost"}
                size="xs"
                aria-pressed={savedOnly}
                onClick={() => setSavedOnly(true)}
              >
                Saved · {savedCount}
              </Button>
            </fieldset>
            <div className="space-y-1">
              {filtered.slice(0, limit).map((article) => (
                <button
                  key={article.id}
                  onClick={() => setSelectedId(article.id)}
                  aria-pressed={selected?.id === article.id}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md border border-transparent p-3 text-left transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
                    selected?.id === article.id
                      ? "border-primary/30 bg-accent"
                      : "border-b-border",
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] text-primary">
                    {trackedBrands
                      .find((item) => article.brands.includes(item.id))
                      ?.name.charAt(0) ?? article.source.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[9px] text-muted-foreground">
                      {article.source} · {article.topic.toUpperCase()}
                    </p>
                    <h2 className="mt-1 text-xs font-medium leading-5">
                      {article.title}
                    </h2>
                    <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                      {article.snippet}
                    </p>
                    <p className="mt-2 text-[9px] text-muted-foreground">
                      {new Date(article.publishedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "UTC",
                        },
                      )}
                    </p>
                  </div>
                  <ArrowUpRight className="size-3 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <Search className="mx-auto mb-3 size-5 text-muted-foreground" />
                <p className="text-sm">
                  {savedOnly
                    ? "No saved stories match these filters."
                    : "No articles match these filters."}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setBrand("all");
                    setTopic("all");
                    setSavedOnly(false);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-[10px] text-muted-foreground">
              <span>
                Showing {Math.min(limit, filtered.length)} of {filtered.length}{" "}
                articles
              </span>
              {limit < filtered.length && (
                <Button
                  variant="link"
                  size="xs"
                  onClick={() => setLimit(limit + 6)}
                >
                  Load more articles <ArrowRight className="size-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0 shadow-none lg:sticky lg:top-20">
          <CardHeader className="flex flex-row items-center justify-between">
            <p className="font-mono text-[9px] uppercase text-muted-foreground">
              Selected story
            </p>
            {selected && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={
                  saved.includes(selected.id) ? "Unsave story" : "Save story"
                }
                title={
                  saved.includes(selected.id) ? "Unsave story" : "Save story"
                }
                aria-pressed={saved.includes(selected.id)}
                onClick={() => toggle(selected.id)}
              >
                <Bookmark
                  className={cn(
                    "size-4",
                    saved.includes(selected.id) && "fill-primary text-primary",
                  )}
                />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {selected ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {selectedBrand?.name ?? "Market"}
                  </Badge>
                  <Badge variant="outline">{selected.topic}</Badge>
                  <Badge
                    variant="ghost"
                    className="capitalize text-muted-foreground"
                  >
                    {selected.sentiment}
                  </Badge>
                </div>
                <h2 className="text-2xl font-normal leading-snug">
                  {selected.title}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {selected.source} ·{" "}
                  {new Date(selected.publishedAt).toLocaleDateString("en-US", {
                    timeZone: "UTC",
                  })}
                </p>
                <p className="text-sm leading-7 text-muted-foreground">
                  {selected.snippet}
                </p>
                {!isLive && (
                  <p className="rounded-md bg-muted/60 p-3 text-[10px] leading-5 text-muted-foreground">
                    Reference summary from the weekly digest. Publication
                    details and context are illustrative, not verified
                    reporting.
                  </p>
                )}
                <div className="border-t border-border pt-5">
                  <h3 className="flex items-center gap-2 text-base">
                    <Sparkles className="size-4 text-primary" />
                    What this could mean for product
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {selected.whyItMatters}
                  </p>
                  <Link
                    href="/analytics"
                    className="mt-5 flex items-center justify-between gap-3 rounded-md bg-accent p-4"
                  >
                    <span className="text-3xl font-normal">47%</span>
                    <span className="flex-1 text-xs">
                      Tableside Pay adoption
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        +12% vs last week · reference metric
                      </span>
                    </span>
                    <ArrowUpRight className="size-4 text-primary" />
                  </Link>
                  <p className="mt-5 font-mono text-[9px] uppercase text-muted-foreground">
                    Question to investigate
                  </p>
                  <p className="mt-2 text-xs leading-5">
                    Are newly enabled locations completing their first payment
                    after launch?
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      render={<Link href="/insights" />}
                      nativeButton={false}
                    >
                      <Sparkles className="size-3.5" />
                      Interpret in AI Insights
                    </Button>
                    {sourceUrl ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        render={
                          <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="View original article source"
                          />
                        }
                        nativeButton={false}
                      >
                        <ExternalLink className="size-3.5" />
                        View source
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled
                        title="No source URL is available for this reference summary."
                      >
                        <ExternalLink className="size-3.5" />
                        Source unavailable
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Select a story to read its context.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle>Competitors on your radar</CardTitle>
            <Link href="/settings" className="text-xs text-primary">
              Manage tracking →
            </Link>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {trackedBrands
              .filter((item) => !item.isOwnBrand)
              .map((item) => (
                <Button
                  key={item.id}
                  variant={brand === item.id ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() => setBrand(brand === item.id ? "all" : item.id)}
                >
                  {item.name}
                  <span className="ml-2 text-muted-foreground">
                    {
                      articles.filter((article) =>
                        article.brands.includes(item.id),
                      ).length
                    }
                  </span>
                </Button>
              ))}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Topics worth following</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {topics.map((item) => (
              <Button
                key={item}
                variant={topic === item ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setTopic(topic === item ? "all" : item)}
              >
                {item} ·{" "}
                {articles.filter((article) => article.topic === item).length}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
