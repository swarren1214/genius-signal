"use client";

import { useState } from "react";
import Image from "next/image";
import { brandLogoUrl } from "@/lib/brand-logos";
import { cn } from "@/lib/utils";
import type { Brand } from "@/lib/types";

export function BrandLogo({
  brand,
  className,
}: Readonly<{
  brand: Pick<Brand, "id" | "name" | "logoDomain">;
  className?: string;
}>) {
  const src = brandLogoUrl(brand, process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const available = src && src !== failedSource;
  const initials = brand.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border",
        available ? "bg-white" : "bg-muted text-muted-foreground",
        className,
      )}
      title={available ? brand.name : `${brand.name}: logo unavailable`}
    >
      {available ? (
        <Image
          src={src}
          alt={`${brand.name} logo`}
          fill
          sizes="36px"
          unoptimized
          className="object-contain p-1.5"
          onError={() => setFailedSource(src)}
        />
      ) : (
        <span
          role="img"
          aria-label={`${brand.name}: logo unavailable`}
          className="font-mono text-[10px] font-medium"
          data-logo-fallback
        >
          {initials}
        </span>
      )}
    </span>
  );
}
