import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Genius Signal",
  description:
    "Market intelligence and product analytics for the Global Payments Genius restaurant vertical.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const requestHeaders = await headers();
  const isLoginPage = requestHeaders.get("x-signal-login-page") === "1";
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <TooltipProvider>
            {isLoginPage ? (
                children
              ) : (
                <SidebarProvider>
                  <AppSidebar />
                  <SidebarInset>
                    <SiteHeader />
                    <main className="flex-1 space-y-6 p-5 sm:p-8">
                      {children}
                      <footer className="flex flex-wrap items-center justify-between gap-3 pt-2 font-mono text-[9px] text-muted-foreground">
                        <span>GENIUS PRODUCT / RESTAURANT VERTICAL</span>
                        <a
                          href="https://www.logo.dev"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-colors hover:text-foreground"
                        >
                          Logos by Logo.dev
                        </a>
                        <span>
                          Retrieved sources · explicit source health · no synthetic
                          metrics
                        </span>
                      </footer>
                    </main>
                  </SidebarInset>
                </SidebarProvider>
              )}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
