"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bookmark,
  ExternalLink,
  RefreshCw,
  Search,
} from "lucide-react";
import { PageHero } from "@/components/dashboard/page-hero";
import { SourceStatus } from "@/components/dashboard/source-status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { postJson } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import type { Brand } from "@/lib/types";
import type { NewsResult } from "@/lib/data/news";

export function NewsWorkspace({
  news,
  brands,
  initialSearch = "",
  initialArticle,
}: Readonly<{
  news: NewsResult;
  brands: Brand[];
  initialSearch?: string;
  initialArticle?: string;
}>) {
  const [search, setSearch] = useState(initialSearch);
  const [brand, setBrand] = useState("all");
  const [topic, setTopic] = useState("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(initialArticle);
  const [limit, setLimit] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState("");
  const { saved, toggle, pending, error } = useSavedItems(
    "signal-saved-stories",
  );
  const router = useRouter();
  const topics = [...new Set(news.articles.map((article) => article.topic))];
  const filtered = news.articles.filter(
    (article) =>
      (brand === "all" || article.brands.includes(brand)) &&
      (topic === "all" || article.topic === topic) &&
      (!savedOnly || saved.includes(article.id)) &&
      `${article.title} ${article.snippet} ${article.source} ${article.topic} ${brands
        .filter((item) => article.brands.includes(item.id))
        .map((item) => item.name)
        .join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const selected =
    filtered.find((article) => article.id === selectedId) ?? filtered[0];
  const savedCount = news.articles.filter((article) =>
    saved.includes(article.id),
  ).length;
  async function refresh() {
    setRefreshing(true);
    setStatus("");
    try {
      const result = await postJson<{ news?: { status: string } }>(
        "/api/workspace",
        { action: "refresh", source: "news" },
      );
      setStatus(`News source: ${result.news?.status ?? "unavailable"}.`);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  }
  function clearFilters() {
    setSearch("");
    setBrand("all");
    setTopic("all");
    setSavedOnly(false);
    setLimit(10);
  }

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Market intelligence / retrieved coverage"
        title="Read the market. Find your opening."
        description="Reporting from tracked sources, with transparent publisher attribution and saved stories."
        actions={
          <Button
            variant="secondary"
            size="sm"
            disabled={refreshing}
            onClick={refresh}
          >
            <RefreshCw
              className={`size-3.5 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
            />
            Refresh news
          </Button>
        }
      />
      <SourceStatus name={news.provider} health={news} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-56">
          <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            aria-label="Search articles"
            placeholder="Search retrieved articles..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setLimit(10);
            }}
            className="pl-9"
          />
        </div>
        <Select
          items={[
            { value: "all", label: "All brands" },
            ...brands.map((item) => ({ value: item.id, label: item.name })),
          ]}
          value={brand}
          onValueChange={(value) => setBrand(value ?? "all")}
        >
          <SelectTrigger aria-label="Filter by brand">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {brands.map((item) => (
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
      </div>
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row justify-between">
            <CardTitle>Your market, in motion</CardTitle>
            <span className="font-mono text-[9px] text-muted-foreground">
              {news.articles.length} ARTICLES
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
                All stories
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
                    "signal-choice flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
                    selected?.id === article.id
                      ? "border-primary/30 bg-accent"
                      : "border-b-border",
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] text-primary">
                    {article.source.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[9px] text-muted-foreground">
                      {article.source} · {article.topic}
                    </p>
                    <h2 className="mt-1 text-xs font-medium leading-5">
                      {article.title}
                    </h2>
                    {article.snippet && (
                      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                        {article.snippet}
                      </p>
                    )}
                    <time
                      className="mt-2 block text-[9px] text-muted-foreground"
                      dateTime={article.publishedAt}
                    >
                      {new Date(article.publishedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "UTC",
                        },
                      )}
                    </time>
                  </div>
                  <ArrowUpRight className="size-3 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
            {!filtered.length && (
              <div className="py-12 text-center">
                <p className="text-sm">
                  {news.articles.length
                    ? "No articles match these filters."
                    : "No articles have been retrieved for this watchlist."}
                </p>
                <Button variant="link" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground">
              <span>
                Showing {Math.min(limit, filtered.length)} of {filtered.length}
              </span>
              {limit < filtered.length && (
                <Button
                  variant="link"
                  size="xs"
                  onClick={() => setLimit(limit + 10)}
                >
                  Load more
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0 shadow-none lg:sticky lg:top-20">
          <CardHeader className="flex flex-row items-center justify-between">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">
              Selected story
            </p>
            {selected && (
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pending}
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
          <CardContent
            key={selected?.id ?? "empty"}
            className="signal-detail-enter space-y-5"
          >
            {selected ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {brands
                    .filter((item) => selected.brands.includes(item.id))
                    .map((item) => (
                      <Badge variant="secondary" key={item.id}>
                        {item.name}
                      </Badge>
                    ))}
                  <Badge variant="outline">{selected.topic}</Badge>
                </div>
                <h2 className="text-2xl font-normal leading-snug">
                  {selected.title}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {selected.source} ·{" "}
                  {new Date(selected.publishedAt).toLocaleString("en-US", {
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </p>
                {selected.snippet ? (
                  <p className="text-sm leading-7 text-muted-foreground">
                    {selected.snippet}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    The feed supplied a headline and source link, but no
                    publisher summary.
                  </p>
                )}
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm">Measured news tone</h3>
                  <p className="mt-2 text-xs capitalize">
                    {selected.sentiment} · lexical score{" "}
                    {selected.sentimentScore}
                  </p>
                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                    Calculated from the headline and available summary using a
                    sentiment lexicon. This is a text-tone estimate, not an AI
                    interpretation or customer sentiment measure.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    render={
                      <a
                        href={selected.url}
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
                  <Button
                    variant="secondary"
                    size="sm"
                    render={<Link href="/insights" />}
                    nativeButton={false}
                  >
                    Product insights <ArrowUpRight className="size-3.5" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Retrieved{" "}
                  {new Date(selected.fetchedAt).toLocaleString("en-US", {
                    timeZone: "UTC",
                  })}{" "}
                  UTC · publisher links retain their original attribution.
                </p>
              </>
            ) : (
              <p className="py-12 text-center text-xs text-muted-foreground">
                Select a retrieved story to inspect its source.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tracked brands</CardTitle>
          <Link href="/settings" className="text-xs text-primary">
            Edit watchlist →
          </Link>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {brands.map((item) => (
            <Button
              key={item.id}
              size="xs"
              variant={brand === item.id ? "secondary" : "ghost"}
              onClick={() => setBrand(brand === item.id ? "all" : item.id)}
            >
              {item.name} ·{" "}
              {
                news.articles.filter((article) =>
                  article.brands.includes(item.id),
                ).length
              }
            </Button>
          ))}
        </CardContent>
      </Card>
      {(status || error) && (
        <output className="block text-xs text-muted-foreground">
          {error || status}
        </output>
      )}
    </div>
  );
}
