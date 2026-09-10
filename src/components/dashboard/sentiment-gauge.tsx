"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface SentimentGaugeProps {
  score: number; // 0-100
  label: string;
  rationale?: string;
}

function scoreColor(score: number) {
  if (score >= 66) return "oklch(0.72 0.19 165)"; // positive - green
  if (score >= 40) return "oklch(0.75 0.18 60)"; // neutral - amber
  return "oklch(0.62 0.22 25)"; // negative - red
}

export function SentimentGauge({ score, label, rationale }: Readonly<SentimentGaugeProps>) {
  const radius = 46;
  const circumference = Math.PI * radius; // half circle
  const clamped = Math.min(100, Math.max(0, score));
  const offset = circumference - (clamped / 100) * circumference;
  const color = scoreColor(clamped);

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="relative h-17.5 w-27.5">
        <svg width="110" height="70" viewBox="0 0 110 70" className="overflow-visible">
          <path
            d="M 7 63 A 46 46 0 0 1 103 63"
            fill="none"
            stroke="var(--muted)"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <motion.path
            d="M 7 63 A 46 46 0 0 1 103 63"
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="text-xl font-semibold tabular-nums">{clamped}</span>
        </div>
      </div>
      <p className="text-sm font-medium">{label}</p>
      {rationale && (
        <p className={cn("max-w-40 text-xs text-muted-foreground")}>
          {rationale}
        </p>
      )}
    </div>
  );
}
