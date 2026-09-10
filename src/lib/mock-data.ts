export interface Brand {
  id: string;
  name: string;
  isOwnBrand?: boolean;
  sentiment: number; // 0-100
  sentimentDelta: number;
  rationale: string;
  /**
   * Precise phrases to use when querying news APIs, for brands whose plain name is a common
   * word (e.g. "Toast", "Clover") that would otherwise match unrelated articles. Defaults to
   * [name] when omitted.
   */
  newsSearchTerms?: string[];
}

export const trackedBrands: Brand[] = [
  {
    id: "genius",
    name: "Global Payments Genius",
    isOwnBrand: true,
    sentiment: 74,
    sentimentDelta: 4,
    rationale: "Positive coverage of new tableside payment rollout.",
  },
  {
    id: "toast",
    name: "Toast",
    newsSearchTerms: ["Toast POS", "Toast Inc"],
    sentiment: 68,
    sentimentDelta: -3,
    rationale: "Mixed reaction to pricing changes announced this week.",
  },
  {
    id: "square",
    name: "Square for Restaurants",
    sentiment: 61,
    sentimentDelta: 1,
    rationale: "Steady sentiment; minor complaints about support wait times.",
  },
  {
    id: "clover",
    name: "Clover",
    newsSearchTerms: ["Clover POS", "Clover Network"],
    sentiment: 55,
    sentimentDelta: -6,
    rationale: "Reports of a regional outage drove negative coverage.",
  },
  {
    id: "touchbistro",
    name: "TouchBistro",
    sentiment: 63,
    sentimentDelta: 2,
    rationale: "Well-received new kitchen display system integration.",
  },
  {
    id: "lightspeed",
    name: "Lightspeed Restaurant",
    sentiment: 58,
    sentimentDelta: 0,
    rationale: "Neutral quarter; no major news events.",
  },
  {
    id: "spoton",
    name: "SpotOn",
    sentiment: 66,
    sentimentDelta: 5,
    rationale: "Positive press around new online ordering partnership.",
  },
];

export interface NewsArticle {
  id: string;
  source: string;
  title: string;
  snippet: string;
  publishedAt: string;
  brands: string[];
  topic: string;
  sentiment: "positive" | "neutral" | "negative";
  whyItMatters: string;
}

export const newsArticles: NewsArticle[] = [
  {
    id: "1",
    source: "Restaurant Business",
    title: "Toast raises transaction fees for full-service restaurants",
    snippet:
      "Toast is adjusting its pricing structure for full-service accounts starting next quarter...",
    publishedAt: "2026-09-08T14:30:00Z",
    brands: ["toast"],
    topic: "Pricing",
    sentiment: "negative",
    whyItMatters:
      "Pricing dissatisfaction could open a competitive window for Genius sales conversations.",
  },
  {
    id: "2",
    source: "PYMNTS",
    title: "Global Payments Genius launches AI-assisted tableside checkout",
    snippet:
      "The new feature lets servers process payments directly from a tablet with AI-suggested upsells...",
    publishedAt: "2026-09-08T09:00:00Z",
    brands: ["genius"],
    topic: "Product Launch",
    sentiment: "positive",
    whyItMatters:
      "Strong launch coverage — good moment to amplify via marketing channels.",
  },
  {
    id: "3",
    source: "Nation's Restaurant News",
    title: "Clover users report regional outage during weekend rush",
    snippet:
      "Multiple restaurants reported payment processing failures over the weekend...",
    publishedAt: "2026-09-07T20:15:00Z",
    brands: ["clover"],
    topic: "Outage/Incident",
    sentiment: "negative",
    whyItMatters:
      "Reliability concerns are a recurring competitor weakness worth tracking over time.",
  },
  {
    id: "4",
    source: "TechCrunch",
    title: "SpotOn partners with regional delivery network for restaurants",
    snippet:
      "The partnership expands SpotOn's online ordering reach into new metro markets...",
    publishedAt: "2026-09-06T11:45:00Z",
    brands: ["spoton"],
    topic: "Partnership",
    sentiment: "positive",
    whyItMatters: "Signals SpotOn is investing in online ordering — a key battleground feature.",
  },
  {
    id: "5",
    source: "Nation's Restaurant News",
    title: "TouchBistro integrates with new kitchen display systems",
    snippet:
      "The update aims to reduce ticket times during peak hours for full-service restaurants...",
    publishedAt: "2026-09-05T16:00:00Z",
    brands: ["touchbistro"],
    topic: "Product Launch",
    sentiment: "positive",
    whyItMatters: "Kitchen efficiency features are gaining traction as a differentiator.",
  },
];

export const weeklyDigest = `**Week of Sept 1–8, 2026**

Genius' new AI-assisted tableside checkout launch generated strong, positive press coverage this week (PYMNTS), while **Toast** faced pushback over a transaction fee increase for full-service accounts — a potential opening for competitive positioning.

On the reliability front, **Clover** experienced a regional outage during peak weekend hours, continuing a pattern of intermittent reliability complaints. Meanwhile, **SpotOn** and **TouchBistro** both announced feature partnerships (delivery network integration and kitchen display systems, respectively), signaling continued investment in online ordering and kitchen efficiency across the competitive set.

Product usage: feature adoption for tableside payments is up 12% week-over-week, likely tied to this week's launch coverage.`;

export interface KpiDatum {
  label: string;
  value: number;
  suffix?: string;
  delta: number;
}

export const overviewKpis: KpiDatum[] = [
  { label: "Weekly Active Users", value: 18420, delta: 6 },
  { label: "Feature Adoption (Tableside Pay)", value: 47, suffix: "%", delta: 12 },
  { label: "Own Brand Sentiment", value: 74, delta: 4 },
  { label: "Tracked News Articles (7d)", value: 132, delta: -8 },
];
