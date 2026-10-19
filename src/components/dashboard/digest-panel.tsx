"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SourceStatus } from "@/components/dashboard/source-status";
import { postJson } from "@/lib/client-api";
import type { Digest, SourceHealth } from "@/lib/types";

export function DigestPanel({ digest, health }: Readonly<{ digest: Digest | null; health: SourceHealth }>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function generate() {
    setPending(true); setError("");
    try { await postJson("/api/ai", { action: "generate" }); router.refresh(); } catch (error) { setError(error instanceof Error ? error.message : "Generation failed."); } finally { setPending(false); }
  }
  return <Card className="shadow-none"><CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-primary" />Product digest</CardTitle><Button variant="secondary" size="xs" disabled={pending || health.status === "unconfigured"} onClick={generate}><RefreshCw className={`size-3 ${pending ? "animate-spin motion-reduce:animate-none" : ""}`} />{pending ? "Generating" : digest ? "Regenerate" : "Generate"}</Button></CardHeader><CardContent className="space-y-5"><SourceStatus name="OpenAI" health={health} />{digest ? <><p className="text-sm leading-6">{digest.summary}</p><ol className="space-y-4">{digest.insights.slice(0, 3).map((insight, index) => <li key={insight.id} className="flex gap-3"><span className="font-mono text-xs text-primary">0{index + 1}</span><div><h3 className="text-sm font-medium">{insight.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{insight.summary}</p></div></li>)}</ol><Link href="/insights" className="inline-flex items-center gap-1 text-xs text-primary">Review evidence <ArrowUpRight className="size-3" /></Link></> : <div className="py-6"><p className="text-sm">No generated digest.</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Only responses grounded in retrieved Pendo snapshots and article IDs will appear here.</p><Link href="/settings" className="mt-4 inline-flex items-center gap-1 text-xs text-primary">Source configuration <ArrowUpRight className="size-3" /></Link></div>}{error && <p role="alert" className="text-xs text-destructive">{error}</p>}</CardContent></Card>;
}