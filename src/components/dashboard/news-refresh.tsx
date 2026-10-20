"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/client-api";

export function NewsRefresh() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            const result = await postJson<{ news?: { status: string } }>(
              "/api/workspace",
              { action: "refresh", source: "news" },
            );
            if (result.news?.status !== "connected")
              setError(
                "Search refresh failed. Previously retrieved coverage remains visible.",
              );
            router.refresh();
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Refresh failed.",
            );
          } finally {
            setPending(false);
          }
        }}
      >
        <RefreshCw
          className={`size-3.5 ${pending ? "animate-spin motion-reduce:animate-none" : ""}`}
        />
        {pending ? "Searching brands" : "Refresh coverage"}
      </Button>
      {error && (
        <p role="alert" className="max-w-sm text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
