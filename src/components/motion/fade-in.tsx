"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Simple layout wrapper; entrance animation lives on each FadeInItem below. */
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.06 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
