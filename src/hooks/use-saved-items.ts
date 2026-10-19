"use client";

import { useEffect, useState } from "react";
import { postJson } from "@/lib/client-api";

export function useSavedItems(key: string) {
  const kind = key === "signal-saved-stories" ? "news" : "insights";
  const [saved, setSaved] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/workspace?resource=bookmarks&kind=${kind}`, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Saved items could not be loaded.");
      const result = await response.json();
      setSaved(result.items);
    }).catch((error) => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Saved items could not be loaded."); });
    return () => controller.abort();
  }, [kind]);
  async function toggle(id: string) {
    if (pending) return;
    const isSaved = !saved.includes(id);
    setPending(true); setError("");
    try {
      await postJson("/api/workspace", { action: "bookmark", kind, id, saved: isSaved });
      setSaved((current) => isSaved ? [...current, id] : current.filter((item) => item !== id));
    } catch (error) { setError(error instanceof Error ? error.message : "Save failed."); } finally { setPending(false); }
  }
  return { saved, toggle, pending, error };
}
