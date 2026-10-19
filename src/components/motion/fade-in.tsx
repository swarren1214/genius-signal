"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FadeInStagger({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return <div className={className}>{children}</div>;
}

export function FadeInItem({
  children,
  className,
  index = 0,
}: Readonly<{
  children: ReactNode;
  className?: string;
  index?: number;
}>) {
  return (
    <div
      className={cn("signal-reveal", className)}
      style={{ animationDelay: `${Math.min(index, 7) * 45}ms` }}
    >
      {children}
    </div>
  );
}
