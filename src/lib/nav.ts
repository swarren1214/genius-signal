import {
  LayoutDashboard,
  BarChart3,
  Newspaper,
  Gauge,
  Swords,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  description: string;
}

export const navItems: NavItem[] = [
  {
    title: "Overview",
    url: "/",
    icon: LayoutDashboard,
    description: "KPI summary and daily AI digest",
  },
  {
    title: "Product Analytics",
    url: "/analytics",
    icon: BarChart3,
    description: "Pendo usage, adoption, and NPS trends",
  },
  {
    title: "Market Intelligence",
    url: "/news",
    icon: Newspaper,
    description: "News feed on Genius and competitors",
  },
  {
    title: "Brand Sentiment",
    url: "/sentiment",
    icon: Gauge,
    description: "Sentiment meter for restaurant POS brands",
  },
  {
    title: "Competitor Comparison",
    url: "/competitors",
    icon: Swords,
    description: "Side-by-side competitor cards",
  },
  {
    title: "AI Insights",
    url: "/insights",
    icon: Sparkles,
    description: "Digests, anomalies, and Q&A",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "Data sources, brands, and alerts",
  },
];
