"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { PageHero } from "@/components/dashboard/page-hero";
import { SourceStatus } from "@/components/dashboard/source-status";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { postJson } from "@/lib/client-api";
import type {
  AnalyticsSnapshot,
  Brand,
  SourceHealth,
  WorkspaceAction,
} from "@/lib/types";

interface SettingsProps {
  brands: Brand[];
  sources: { name: string; health: SourceHealth }[];
  appId: string;
  appName: string;
  actions: WorkspaceAction[];
  reports: { id: string; createdAt: string; analytics: AnalyticsSnapshot }[];
  audit: { id: string; action: string; resource: string; createdAt: string }[];
  authenticated: boolean;
}

export function SettingsWorkspace({
  brands,
  sources,
  appId,
  appName,
  actions,
  reports,
  audit,
  authenticated,
}: Readonly<SettingsProps>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const [brandOpen, setBrandOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [name, setName] = useState("");
  const [terms, setTerms] = useState("");
  const [own, setOwn] = useState(false);
  const [scopeId, setScopeId] = useState(appId);
  const [scopeName, setScopeName] = useState(appName);
  async function operation(body: unknown, message: string) {
    setPending(true);
    setStatus("");
    try {
      await postJson("/api/workspace", body);
      setStatus(message);
      router.refresh();
      return true;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Operation failed.");
      return false;
    } finally {
      setPending(false);
    }
  }
  function edit(brand: Brand | null) {
    setEditing(brand);
    setName(brand?.name ?? "");
    setTerms(brand?.newsSearchTerms.join(", ") ?? "");
    setOwn(Boolean(brand?.isOwnBrand));
    setBrandOpen(true);
  }
  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Workspace administration"
        title="Configure the sources behind your decisions."
        description="Persisted watchlists, application scope, source health, saved snapshots, and workspace actions."
        actions={
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() =>
              operation(
                { action: "refresh", source: "all" },
                "Refresh completed. Source health below reflects the result.",
              )
            }
          >
            <RefreshCw
              className={`size-3.5 ${pending ? "animate-spin motion-reduce:animate-none" : ""}`}
            />
            Refresh sources
          </Button>
        }
      />
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Source health</CardTitle>
          <CardDescription>
            Observed source results, not hard-coded connection badges.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {sources.map((source) => (
            <SourceStatus key={source.name} {...source} />
          ))}
          <p className="border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
            API credentials remain on the server. Pendo uses PENDO_API_KEY;
            OpenAI uses OPENAI_API_KEY and optional OPENAI_MODEL; Slack uses
            SLACK_WEBHOOK_URL. Public RSS remains available without a NewsAPI
            key.
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Pendo application scope</CardTitle>
          <CardDescription>
            Every event query uses this application ID. Changing the scope does
            not estimate or combine data from other apps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]"
            onSubmit={async (event) => {
              event.preventDefault();
              await operation(
                {
                  action: "save-pendo-settings",
                  appId: scopeId,
                  appName: scopeName,
                },
                "Application scope saved. Refresh to retrieve this app's metrics.",
              );
            }}
          >
            <label className="block space-y-2 text-xs">
              <span>Application ID</span>
              <Input
                value={scopeId}
                onChange={(event) => setScopeId(event.target.value)}
                required
                pattern="-?[0-9]+"
              />
            </label>
            <label className="block space-y-2 text-xs">
              <span>Display label</span>
              <Input
                value={scopeName}
                onChange={(event) => setScopeName(event.target.value)}
                maxLength={150}
              />
            </label>
            <Button
              className="self-end"
              disabled={pending || !scopeId}
              type="submit"
            >
              Save scope
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Tracked brands</CardTitle>
            <CardDescription>
              Persisted names and exact search terms used for ingestion.
            </CardDescription>
          </div>
          <Button size="sm" variant="secondary" onClick={() => edit(null)}>
            <Plus className="size-3.5" />
            Add brand
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-start justify-between gap-3 border-b border-border pb-4"
            >
              <div>
                <h3 className="text-sm">
                  {brand.name}
                  {brand.isOwnBrand && (
                    <span className="ml-2 text-[10px] text-primary">
                      Own brand
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  {brand.newsSearchTerms.join(", ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Edit ${brand.name}`}
                  title="Edit brand"
                  onClick={() => edit(brand)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={pending}
                  aria-label={`Remove ${brand.name}`}
                  title="Remove brand"
                  onClick={() =>
                    operation(
                      { action: "delete-brand", id: brand.id },
                      "Brand removed from the watchlist.",
                    )
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {!brands.length && (
            <p className="text-xs text-muted-foreground">
              No brands are tracked. Add a watchlist entry to ingest relevant
              news.
            </p>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Workspace actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {actions.map((action) => (
              <div
                className="flex items-start justify-between gap-3 border-b border-border pb-3"
                key={action.id}
              >
                <div>
                  <h3
                    className={`text-xs ${action.status === "done" ? "line-through text-muted-foreground" : ""}`}
                  >
                    {action.title}
                  </h3>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {action.status} · {action.createdAt.slice(0, 10)}
                  </p>
                </div>
                <Button
                  size="icon-sm"
                  variant="secondary"
                  disabled={pending}
                  aria-label={`Toggle completion for ${action.title}`}
                  title={
                    action.status === "open" ? "Mark complete" : "Reopen action"
                  }
                  onClick={() =>
                    operation(
                      {
                        action: "update-action",
                        id: action.id,
                        status: action.status === "open" ? "done" : "open",
                      },
                      "Action status updated.",
                    )
                  }
                >
                  <Check className="size-3.5" />
                </Button>
              </div>
            ))}
            {!actions.length && (
              <p className="text-xs text-muted-foreground">
                No workspace actions have been created.
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Saved analytics snapshots</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border-b border-border pb-3">
                <h3 className="text-xs">{report.analytics.appName}</h3>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Period ending {report.analytics.endDate.slice(0, 10)} · saved{" "}
                  {report.createdAt.slice(0, 10)}
                </p>
                <p className="mt-2 text-xs">
                  {report.analytics.weeklyActiveUsers?.toLocaleString() ??
                    "Unavailable"}{" "}
                  weekly active visitors · {report.analytics.features.length}{" "}
                  tagged features
                </p>
              </div>
            ))}
            {!reports.length && (
              <p className="text-xs text-muted-foreground">
                No real snapshots have been saved.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>
            Successful persisted workspace operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-120 text-left text-[11px]">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-3 font-normal">Time (UTC)</th>
                  <th className="pb-3 font-normal">Operation</th>
                  <th className="pb-3 font-normal">Resource</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((entry) => (
                  <tr key={entry.id} className="border-t border-border">
                    <td className="py-3">
                      {entry.createdAt.slice(0, 19).replace("T", " ")}
                    </td>
                    <td>{entry.action}</td>
                    <td className="max-w-60 truncate font-mono text-[9px]">
                      {entry.resource}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!audit.length && (
            <p className="py-4 text-xs text-muted-foreground">
              No workspace mutations have been recorded.
            </p>
          )}
        </CardContent>
      </Card>
      <p className="text-[10px] leading-5 text-muted-foreground">
        {authenticated
          ? "HTTP authentication is configured for this single-workspace deployment."
          : "Local access only. Network access is blocked until SIGNAL_AUTH_USER and SIGNAL_AUTH_PASSWORD are configured."}{" "}
        SQLite storage requires a persistent server volume; individual user
        roles are not configured.
      </p>
      {status && (
        <output className="block text-xs text-muted-foreground">
          {status}
        </output>
      )}
      <Dialog open={brandOpen} onOpenChange={setBrandOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit tracked brand" : "Add tracked brand"}
            </DialogTitle>
            <DialogDescription>
              Search terms are applied to the next real-news ingestion.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const id =
                editing?.id ??
                name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "")
                  .slice(0, 60);
              const ok = await operation(
                {
                  action: "save-brand",
                  brand: {
                    id,
                    name,
                    isOwnBrand: own,
                    newsSearchTerms: terms
                      .split(",")
                      .map((term) => term.trim())
                      .filter(Boolean),
                  },
                },
                "Watchlist saved to the workspace.",
              );
              if (ok) setBrandOpen(false);
            }}
          >
            <label className="block space-y-2 text-xs">
              <span>Brand name</span>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={150}
              />
            </label>
            <label className="block space-y-2 text-xs">
              <span>Search terms, separated by commas</span>
              <Input
                value={terms}
                onChange={(event) => setTerms(event.target.value)}
                required
              />
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={own}
                onChange={(event) => setOwn(event.target.checked)}
              />
              Own brand
            </label>
            <Button
              type="submit"
              disabled={pending || !name.trim() || !terms.trim()}
            >
              Save brand
            </Button>
            {status && (
              <p className="text-xs text-muted-foreground">{status}</p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
