"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Sparkles, Settings } from "lucide-react";

import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      className="border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-4 group-data-[collapsible=icon]:px-0">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shrink-0">
            <Sparkles className="size-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-2xl font-normal text-foreground">genius</span>
            <span className="font-mono text-[9px] text-muted-foreground">
              S I G N A L
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="mx-3 my-3 rounded-md border border-border px-3 py-2.5 group-data-[collapsible=icon]:hidden">
          <p className="text-xs font-medium text-foreground">Genius Product</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Restaurant vertical
          </p>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 font-mono text-[10px] uppercase text-muted-foreground">
            Intelligence
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems
                .filter((item) => item.url !== "/settings")
                .map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        render={<Link href={item.url} />}
                        isActive={isActive}
                        tooltip={item.description}
                        className={cn(
                          "h-10 rounded-md border border-border/70 bg-card/40 text-xs hover:bg-accent/50",
                          isActive &&
                            "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                        )}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="mx-1 mb-3 rounded-md border border-border p-3 group-data-[collapsible=icon]:hidden">
          <p className="flex items-center gap-2 text-xs">
            <span className="size-1.5 rounded-full bg-emerald-300" />
            Your intelligence, connected
          </p>
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
            Pendo usage, market news and brand signals in one place.
          </p>
          <Link
            href="/settings"
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary"
          >
            Manage sources <ArrowRight className="size-3" />
          </Link>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/settings" />}
              isActive={pathname === "/settings"}
              tooltip="Settings"
            >
              <Settings />
              <span className="text-xs">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Link
          href="/settings"
          className="mt-3 flex items-center gap-2 border-t border-border px-2 py-4"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground">
            GP
          </span>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-xs text-foreground">Genius team</p>
            <p className="text-[10px] text-muted-foreground">Global Payments</p>
          </div>
        </Link>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
