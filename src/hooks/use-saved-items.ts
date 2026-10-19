"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("signal-saved-items", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("signal-saved-items", callback);
  };
}

export function useSavedItems(key: string) {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key) ?? "[]";
      } catch {
        return "[]";
      }
    },
    () => "[]",
  );
  let saved: string[] = [];
  try {
    const parsed: unknown = JSON.parse(snapshot);
    if (Array.isArray(parsed))
      saved = parsed.filter((item): item is string => typeof item === "string");
  } catch {}
  function toggle(id: string) {
    const updated = saved.includes(id)
      ? saved.filter((item) => item !== id)
      : [...saved, id];
    try {
      localStorage.setItem(key, JSON.stringify(updated));
      window.dispatchEvent(new Event("signal-saved-items"));
    } catch {}
  }
  return { saved, toggle };
}
