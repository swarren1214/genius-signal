"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { navItems } from "@/lib/nav";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const title =
    navItems.find((item) => item.url === pathname)?.title ?? "Overview";
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur-md sm:gap-3 sm:px-8">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-6" />

      <div className="hidden items-center gap-3 text-xs sm:flex">
        <span className="text-muted-foreground">Workspace</span>
        <span className="text-muted-foreground">/</span>
        <span>{title}</span>
      </div>
      <div className="relative ml-auto min-w-0 flex-1 max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search news, brands, features..."
          aria-label="Search news, brands, features"
          onKeyDown={(event) => {
            if (event.key === "Enter")
              router.push(
                `/news?search=${encodeURIComponent(event.currentTarget.value)}`,
              );
          }}
          className="bg-muted/40 pl-9 shadow-none"
        />
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle />
        <Link
          href="/insights"
          aria-label="Notifications"
          className="relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Bell className="size-4" />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
        </Link>
        <Link
          href="/settings"
          aria-label="Team settings"
          className="hidden size-7 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground sm:flex"
        >
          GP
        </Link>
      </div>
    </header>
  );
}
