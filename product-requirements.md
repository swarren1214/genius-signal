# Genius Product Dashboard — Product Requirements & Implementation Plan

## 1. Overview

The Genius Product Dashboard is a web-based analytics and intelligence hub for the **Global Payments Genius Product team, focused on the restaurant vertical**. It aggregates data from multiple sources — starting with Pendo product usage analytics, live market/news data, and competitor brand sentiment — and layers AI-driven insights on top, so the team has a single, real-time view of product performance and market context specific to restaurant POS/payments.

### Goals
- Centralize fragmented data sources (Pendo, web/news, social/review sentiment) into one dashboard.
- Surface AI-generated insights and summaries instead of requiring manual analysis.
- Give the team real-time market awareness: what's happening with Genius and with competing restaurant POS brands.
- Provide an at-a-glance brand sentiment signal for the competitive landscape.
- Ship a visually polished, modern UI that the team will actually want to use daily.

### Non-Goals (v1)
- Replacing Pendo itself as the analytics system of record (we consume its data, not rebuild it).
- Building a general-purpose BI tool — this is purpose-built for the Genius Product team's restaurant vertical.
- Real-time (sub-minute) news ingestion — "real-time" here means periodic refresh (e.g., every 15–30 min), not streaming.
- Covering non-restaurant verticals (retail, salon, etc.) — out of scope unless a future phase explicitly expands.

---

## 2. Target Users & Roles

| Role | Primary Use | Access Level |
|---|---|---|
| Restaurant vertical PM (primary owner) | Daily monitoring, configures tracked brands/keywords, reviews AI digests | Admin |
| Product marketing / competitive intelligence | Competitor comparison, news feed, sentiment trends for positioning | Editor (can curate watchlists, cannot change system-wide data source config) |
| Leadership (Genius Product org) | Weekly/monthly digest consumption, executive export | Viewer |
| Customer success / sales enablement | News feed, competitor comparison for objection handling | Viewer |
| Engineering/Platform admin | Data source configuration, API keys, ingestion job health | Super Admin |

**Role definitions (functional detail):**
- **Viewer**: read-only access to all pages; can create *personal* watchlists/pins; cannot edit tracked brand list, data sources, or thresholds.
- **Editor**: Viewer permissions + can add/remove tracked competitor brands and keywords, tag/annotate news articles, request AI digest regeneration.
- **Admin**: Editor permissions + can configure alert thresholds, notification channels, and refresh schedules.
- **Super Admin**: Admin permissions + manages API keys/secrets, data source integrations, and user role assignments.

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript) |
| UI Library | React + shadcn/ui (Radix primitives + Tailwind CSS) |
| Styling | Tailwind CSS with custom gradient theme tokens |
| Icons | lucide-react |
| Animation | Framer Motion |
| Charts | Recharts or Tremor (built on shadcn/Tailwind) |
| Data fetching | Next.js Server Components + Route Handlers, TanStack Query for client-side caching |
| AI | OpenAI/Azure OpenAI (or Copilot-compatible LLM endpoint) via a server-side AI service layer |
| Database | PostgreSQL (e.g., Supabase or Neon) for cached aggregated data, sentiment history, news cache |
| ORM | Drizzle or Prisma |
| Job scheduling | Vercel Cron / background worker (e.g., Inngest, Trigger.dev, or a simple cron service) for periodic ingestion jobs |
| Auth | NextAuth.js / Auth.js (SSO if available internally) |
| Hosting | Vercel (or internal cloud) |

---

## 4. Information Architecture / Pages

1. **Overview (Home)** — hero KPI summary cards, AI daily digest, quick links.
2. **Product Analytics (Pendo)** — usage trends, adoption funnels, feature engagement, NPS/sentiment from Pendo.
3. **Market Intelligence (News Feed)** — real-time news feed about Genius and competitors, filterable and AI-summarized.
4. **Brand Sentiment Meter** — sentiment scores/trends for top restaurant POS brands (Genius + competitors).
5. **Competitor Comparison** — side-by-side competitor cards (funding, feature launches, pricing changes, sentiment).
6. **AI Insights / Digest** — chat-style or feed-style AI-generated insights, weekly summary reports, anomaly alerts.
7. **Settings** — data source configuration, refresh intervals, tracked competitor list, notification preferences.

---

## 5. Feature Requirements

Each feature is tagged with a MoSCoW priority for v1 planning: **Must Have**, **Should Have**, **Could Have**, **Won't Have (v1)**.

### 5.1 Pendo Data Integration `[Must Have]`
- Pull product usage metrics via Pendo API/MCP (active users, feature adoption, guide engagement, NPS), scoped to the restaurant vertical's segments/apps in Pendo.
- Display trend charts (DAU/WAU/MAU, feature usage, funnel drop-off) filterable by restaurant sub-segment (e.g., QSR vs. full-service, if Pendo segments support it).
- Cache Pendo responses server-side (data doesn't need to be queried live on every page load).
- AI layer summarizes week-over-week changes in plain language ("Feature X adoption dropped 12% this week, driven by...").
- **Restaurant-specific framing**: KPI cards should default to metrics most relevant to the vertical (e.g., online ordering feature adoption, tableside payment usage, tip/gratuity flow engagement) rather than generic product-wide numbers.

### 5.2 Market Intelligence / News Feed `[Must Have]`
- Aggregate news mentioning Global Payments Genius and configured competitor brands (e.g., Toast, Square for Restaurants, Clover, TouchBistro, Lightspeed, SpotOn).
- Sources: News APIs (e.g., NewsAPI, GNews, Bing News Search), RSS feeds, press release feeds, industry publications (Restaurant Business, Nation's Restaurant News, PYMNTS).
- Each article card shows: source, headline, snippet, published date, sentiment tag, related brand(s), and an AI one-line "why this matters."
- Filters: by brand, date range, sentiment, topic (funding, product launch, partnership, outage/incident, pricing).
- Deduplicate near-identical stories across sources.
- Refresh on a schedule (e.g., every 15–30 minutes) via background job; store in DB with a `fetchedAt` timestamp.
- **Restaurant-vertical keyword set**: ingestion queries should include restaurant-specific terms (e.g., "restaurant POS", "tableside payments", "online ordering platform", "kitchen display system", "restaurant tech") in addition to brand names, so industry-wide trend stories (not just brand-named articles) are captured.
- Article-to-brand tagging uses simple keyword/entity matching in v1 (brand name + known aliases); NLP-based entity extraction is a Phase 4+ enhancement.

### 5.3 Brand Sentiment Meter `[Must Have]`
- Track a defined list of top restaurant POS brands (see default list in section 5.6).
- **Default tracked list for restaurant vertical**: Global Payments Genius (own brand), Toast, Square for Restaurants, Clover, TouchBistro, Lightspeed Restaurant, SpotOn — configurable by Admins in Settings.
- Sentiment sources: news articles (from 5.2), app store reviews, G2/Capterra reviews, Reddit/X mentions (if accessible within ToS), Pendo NPS/feedback for our own brand.
- Compute a normalized sentiment score per brand (e.g., -100 to +100 or 0–100), updated on ingestion schedule.
- Visual "meter" component (gauge/dial via Framer Motion animated arc) per brand, plus historical sentiment trend line.
- AI generates a short rationale for each brand's current score ("Sentiment dipped due to reported outage coverage").
- Respect each source's Terms of Service and rate limits; prefer official APIs over scraping where available. Flag any raw web-scraping component as needing legal/compliance review before production use.
- **Sentiment scoring detail**: each brand's score is a weighted blend of source-level sentiment (e.g., news 40%, Reddit 30%, app reviews 30% — weights configurable); a `sourceBreakdown` JSON field records the contribution of each source so the score is explainable, not a black box.
- **Score volatility guardrail**: cap day-over-day score movement (e.g., ±10 points) unless driven by a high-confidence event (major outage, funding news) to avoid noisy single-article swings.

### 5.4 AI Insights Layer `[Should Have]`
- Daily/weekly digest combining Pendo trends + news + sentiment into a narrative summary, written with restaurant-industry context (e.g., calling out seasonal patterns like holiday dining volume, patio-season ordering trends).
- Anomaly detection: flag unusual spikes/drops in usage or sentiment.
- Natural-language Q&A ("ask the dashboard") over the aggregated dataset, scoped to internal data only.
- All AI outputs clearly labeled as AI-generated, with links back to source data.
- **Prompt injection defense**: news articles, reviews, and other externally sourced text are untrusted input. All such content passed to an LLM must be wrapped as clearly delimited "data," never as instructions; the system prompt must explicitly instruct the model to ignore any directives found inside ingested content. Outputs are validated (e.g., checked against expected schema/length) before rendering.
- **Grounding**: digests and Q&A answers must cite source article IDs/Pendo metric snapshots; the model is instructed to answer only from provided context and to say "I don't have data on that" rather than fabricate.

### 5.5 Additional Ideas (proposed, not committed)
- **Competitor feature-launch tracker** `[Could Have]`: timeline of publicly announced competitor features, sourced from news/changelogs.
- **Win/loss signal integration** `[Could Have]`: pull in CRM win/loss reasons if available, correlate with sentiment/news events.
- **Alerting** `[Should Have]`: Slack/Teams/email notification when a competitor sentiment score crosses a threshold or a major news event is detected.
- **Executive PDF/slide export** `[Could Have]`: one-click export of the weekly digest for leadership decks.
- **Custom watchlists** `[Should Have]`: let users pin specific keywords, brands, or Pendo segments to a personal dashboard view.
- **Correlation view** `[Could Have]`: overlay our sentiment/news events against our own Pendo usage trends to spot causal patterns.
- **Seasonality overlay** `[Could Have]` *(restaurant-specific)*: annotate charts with restaurant-industry seasonal markers (holidays, patio season, back-to-school) to contextualize usage/sentiment swings.
- **Won't Have (v1)**: multi-vertical support (retail, salon, etc.), mobile native app, real-time (sub-minute) streaming ingestion, public-facing/customer version of the dashboard.

### 5.6 Recommended Data Sources (beyond Pendo)

**News & market intelligence**
| Source | Purpose | Notes |
|---|---|---|
| NewsAPI.org or GNews | Primary news ingestion | Cheap dev tier; recommended v1 starting point |
| Curated RSS feeds (PYMNTS, Restaurant Business, Nation's Restaurant News) | High-signal industry coverage | Manually curated feed list |
| Google News RSS (per keyword) | Free fallback/backup source | Less structured, needs own parsing/dedup |
| Crunchbase API | Competitor funding, acquisitions, exec changes | Paid; Phase 3+ candidate |
| SEC EDGAR API | Public competitor filings/earnings (Toast, Block/Square) | Free; good for financial-signal sentiment |

**Brand sentiment**
| Source | Purpose | Notes |
|---|---|---|
| News-derived sentiment (LLM classification on ingested articles) | Primary v1 sentiment signal | No extra ingestion cost, reuses news pipeline |
| Reddit API (official, e.g., via PRAW) | Candid restaurant-owner discussion (r/restaurateur, r/pointofsale) | TOS-compliant, free tier available |
| App store reviews (Apple/Google) | Direct customer sentiment on POS apps | Use official APIs where available; Phase 3+ |
| G2 / Capterra / TrustRadius | B2B review-site sentiment | **Requires legal/compliance review** — no official public API for most; prefer a licensed data partnership over scraping |
| X/Twitter API | Real-time brand mentions | Paid tiers only now — deferred, not planned for v1 |

**Competitor product intelligence (later phase)**
- Public changelogs/release-notes pages (Toast, Square, Clover, etc.) — RSS-watch or scrape for feature-launch tracking. **Requires legal/compliance review** if scraping.
- Job postings (LinkedIn/Greenhouse) — signals on competitor investment areas.

**v1 recommendation:** NewsAPI/GNews + curated trade-pub RSS for the news feed, with LLM-derived sentiment from those same articles plus the Reddit API as the initial sentiment sources. Treat any review-site or changelog scraping as Phase 3+ and gate it behind legal/compliance review; prefer licensed APIs when available.

---

## 6. Success Metrics & KPIs

Metrics for the dashboard product itself (not the restaurant business metrics it displays):

| Metric | Target (90 days post-launch) | How measured |
|---|---|---|
| Weekly active users (of Genius Product team) | ≥ 80% of the restaurant vertical team | App analytics (self-instrumented, or a lightweight Pendo install on the dashboard itself) |
| Digest open/read rate | ≥ 70% of published daily/weekly digests viewed within 24h | App analytics |
| Time-to-insight | Reduce manual competitive-research time from ~2–3 hrs/week to <30 min/week per PM | Team self-report / survey at 30/60/90 days |
| Data freshness SLA adherence | ≥ 95% of scheduled ingestion runs complete within their window | Ingestion job logs |
| AI digest accuracy (spot-check) | ≥ 90% of sampled digest statements judged factually correct by a reviewer | Manual weekly QA sample (n=5 digests) |
| Alert-to-action rate | ≥ 50% of triggered sentiment/news alerts result in a logged team action or comment | Alerts table `acknowledged`/notes field |

**Qualitative success signal**: the team references the dashboard (not ad-hoc Google searches or spreadsheets) in weekly planning/standup meetings.

---

## 7. UI/UX Design Direction

- **Visual style**: modern gradient aesthetic — dark-mode-first with vibrant gradient accents (e.g., indigo → violet → magenta, or teal → blue) used on cards, chart accents, and hero sections; light mode as secondary supported theme.
- **Components**: shadcn/ui as the base component library (cards, tabs, dialogs, dropdowns, charts wrappers), customized with gradient borders/backgrounds and glassmorphism (subtle blur + translucency) for elevated surfaces.
- **Icons**: lucide-react throughout for consistency and tree-shakable bundle size.
- **Motion**: Framer Motion for page transitions, card entrance animations (staggered fade/slide-in), animated sentiment gauges, number count-up on KPI cards, and micro-interactions on hover/click.
- **Layout**: persistent left sidebar nav (collapsible), top bar with global search + refresh status + notifications, responsive grid of cards on each page.
- **Accessibility**: maintain WCAG AA contrast even with gradients (test text-on-gradient contrast); respect `prefers-reduced-motion` by disabling/reducing Framer Motion animations.

### 7.1 Empty, Loading & Error States (functional detail)
- **No data yet** (e.g., newly tracked brand with no sentiment history): show a friendly empty-state card with an explanation ("Sentiment data builds over the first 7 days of tracking") rather than a blank/broken chart.
- **Source outage** (e.g., News API down): affected widgets show a "Data temporarily unavailable — last updated [timestamp]" badge instead of failing silently or showing stale data as if fresh.
- **Partial data**: if only some sources for a sentiment score are available (e.g., news but not Reddit), display the score with a "partial data" indicator and list which sources are missing.
- **Skeleton loading states** for all cards/charts using shadcn `Skeleton` components, matching final layout to avoid layout shift.
- **AI generation failure**: if digest/Q&A generation fails, show a retry action rather than an empty response; never show a raw error/stack trace to end users.

### 7.2 Onboarding
- First-login checklist (Admin/Editor roles): confirm default tracked brand list, confirm notification channel, preview a sample digest.
- Empty-state prompts on each page for first-time setup (e.g., "Add your first watchlist" CTA on Overview).

### 7.3 Responsive Behavior
- Primary target is desktop/laptop (internal tool, used during planning/analysis sessions); layout must remain fully usable at tablet widths.
- Mobile (phone) support is read-only viewing priority: Overview digest and Brand Sentiment Meter must be legible on mobile for leadership checking in on-the-go; complex filtering UIs (News Feed advanced filters) can be simplified/collapsed on small screens.

---

## 8. Data Model (high-level)

- `pendo_metrics_snapshot` — periodic cached pulls of Pendo usage/NPS data.
- `news_articles` — id, source, url, title, snippet, publishedAt, brands[], topics[], sentimentScore, fetchedAt.
- `brands` — id, name, category, isOwnBrand, logoUrl, tracked (bool).
- `brand_sentiment_history` — brandId, date, score, sourceBreakdown (json), rationale (AI text).
- `ai_digests` — id, type (daily/weekly), generatedAt, content (markdown), sourceRefs (json).
- `alerts` — id, type, threshold, triggeredAt, message, acknowledged (bool), notes.
- `watchlists` — id, userId, name, keywords[], brandIds[], pendoSegmentIds[] (personal, per-user).
- `users` / `roles` — auth, role (Viewer/Editor/Admin/Super Admin), notification preferences.
- `audit_log` — id, userId, action, targetEntity, timestamp (config changes, role changes, data-source edits).

---

## 9. AI Strategy & Governance

### 9.1 Model & Cost Management
- Use a single configurable LLM endpoint (OpenAI/Azure OpenAI) behind a server-side AI service layer so the provider can be swapped without touching feature code.
- **Token/cost budget**: set a monthly LLM spend cap; instrument token usage per feature (digest generation, sentiment classification, Q&A) so cost-per-feature is visible.
- **Rate limiting**: batch sentiment classification (e.g., classify articles in batches during the ingestion job, not one-by-one on demand); cache digest output rather than regenerating on every page view.
- **Cheaper-model-first**: use a smaller/cheaper model for high-volume tasks (per-article sentiment tagging) and reserve a stronger model for lower-volume, higher-value tasks (weekly digest narrative, Q&A).

### 9.2 Quality & Evaluation
- Weekly manual QA: a team member spot-checks a sample of AI digests and sentiment rationales against source articles for factual accuracy (target ≥90%, per section 6).
- Maintain a small "golden set" of past articles with human-labeled sentiment to periodically regression-test the classification prompt/model.
- Version and log every system prompt change so digest quality regressions can be traced to a specific prompt edit.

### 9.3 Prompt Injection & Untrusted Content
- All externally sourced text (news snippets, reviews, social posts) is treated as **untrusted data**, never as instructions. It is passed to the LLM inside clearly delimited data blocks (e.g., XML-like tags) with an explicit system-prompt instruction to ignore any embedded commands.
- Sanitize/strip HTML and script content from ingested articles before storage and before display (prevent stored XSS as well as prompt injection).
- LLM outputs are validated against an expected schema (e.g., JSON with sentiment score + rationale) before being persisted or rendered; malformed or out-of-range outputs are rejected and logged, not silently accepted.

### 9.4 Historical Backfill
- On initial launch, backfill the last 30 days of news articles for tracked brands (via provider's historical search where available) so the News Feed and Sentiment Meter aren't empty on day one.
- Sentiment *trend* history before launch is approximate/reconstructed from the backfilled articles only; label pre-launch data points as "backfilled" vs. "live" in chart tooltips.

---

## 10. Security, Access & Data Governance

- **RBAC enforcement**: roles defined in section 2 (Viewer/Editor/Admin/Super Admin) are enforced server-side on every route handler, not just hidden in the UI.
- **Secrets management**: all third-party API keys (News API, Reddit, LLM provider) stored server-side only, in environment variables or a secret manager — never exposed to the client bundle.
- **Data retention**: news articles and sentiment history retained for 18 months rolling (configurable); AI digests retained indefinitely (small storage footprint, high historical value); raw ingestion logs retained 90 days.
- **Audit logging**: all config changes (tracked brand list edits, data-source/API key changes, role assignments, alert threshold changes) are written to `audit_log` with actor, timestamp, before/after values.
- **Content sanitization**: any externally sourced HTML/text is sanitized before rendering (e.g., via DOMPurify or a strict allowlist renderer) to prevent stored XSS from untrusted news/review content.
- **Compliance review gate**: any data source involving scraping (vs. an official API) — e.g., G2/Capterra, competitor changelog pages — is blocked from production ingestion until legal/compliance sign-off is recorded (tracked as a checklist item per source in Settings).

---

## 11. Non-Functional Requirements

- **Performance**: dashboard pages should render cached data instantly (<1s) via server components; background jobs handle slow ingestion asynchronously.
- **Reliability**: ingestion jobs must retry with backoff and log failures; stale-data indicator shown in UI if a source hasn't refreshed within expected window.
- **Security**: see section 10 for full detail (secrets, sanitization, RBAC).
- **Compliance**: review ToS for each data source (news APIs, review sites, social platforms) before scraping; prefer licensed APIs; log data provenance for auditability.
- **Scalability**: architecture should support adding new data sources/brands via config, not code changes, where feasible.

---

## 12. Operational Considerations

- **Data curation ownership**: the restaurant vertical PM (Admin role) owns the tracked brand list and keyword set; product marketing (Editor role) can propose additions via the Settings page, subject to Admin approval.
- **Environments**: separate dev/staging/prod configs, each with its own API keys and rate-limit budgets, so ingestion testing never consumes production quota or pollutes production sentiment history.
- **Alert delivery**: Slack is the primary v1 channel (single configurable webhook/channel, e.g., `#genius-restaurant-intel`); email as a fallback per-user opt-in. Alert types: sentiment threshold crossed, ingestion job failure, major news event (AI-flagged as high-significance).
- **Rough cost estimate (monthly, v1 scale)**: News API tier ~$50–450/mo depending on volume; LLM usage ~$50–300/mo depending on digest/Q&A volume (with cheaper-model batching per 9.1); hosting (Vercel) + Postgres (Supabase/Neon) ~$50–100/mo. Final numbers depend on provider selection (open question, section 14).

---

## 13. Phased Implementation Plan

### Phase 0 — Foundation
- Scaffold Next.js + TypeScript + Tailwind + shadcn/ui project.
- Set up design system: gradient theme tokens, base layout (sidebar/topbar), lucide icons, Framer Motion wrapper components.
- Set up auth, RBAC roles, and basic settings page.

### Phase 1 — Pendo Integration
- Server-side Pendo API/MCP integration + caching layer.
- Product Analytics page with usage trend charts and KPI cards, scoped to restaurant-vertical segments.

### Phase 2 — Market Intelligence
- News ingestion job (News API/RSS) + dedup + storage, including 30-day historical backfill.
- News Feed page with filters and AI "why this matters" summaries.

### Phase 3 — Brand Sentiment Meter
- Define tracked brand list + sentiment scoring pipeline (news-based sentiment first, expand sources later).
- Animated sentiment gauge components + historical trend charts, with backfilled-vs-live labeling.

### Phase 4 — AI Insights Layer
- Daily/weekly digest generation combining all sources, with prompt-injection defenses and grounding/citations.
- Anomaly detection + natural-language Q&A over aggregated data.
- Stand up weekly AI-quality QA process and golden-set regression test.

### Phase 5 — Polish & Extras
- Alerts (Slack/email), executive export, competitor feature tracker, watchlists, onboarding checklist.
- Accessibility, mobile-responsive, and performance passes.

---

## 14. Risks & Open Considerations

**Open questions (need answers before/during Phase 0–1):**
- Which news/data provider(s) are approved for use (budget, ToS, data residency)?
- Which LLM provider/endpoint should the AI layer use (OpenAI, Azure OpenAI, internal model)?
- Final list of competitor brands to track for sentiment (proposed default: Toast, Square for Restaurants, Clover, TouchBistro, Lightspeed, SpotOn).
- Auth requirements — internal SSO vs. simple credential auth for v1?
- Hosting target — Vercel vs. internal infrastructure?
- Who is the accountable Admin for tracked brand/keyword curation on an ongoing basis?

**Risks:**
- **Prompt injection via ingested content** — mitigated per section 9.3, but requires ongoing vigilance as new sources are added.
- **Sentiment score credibility** — a single noisy article could swing a score if guardrails (section 5.3) aren't tuned correctly; requires a tuning period post-launch.
- **Data source ToS/legal exposure** — scraping-based sources (G2/Capterra, changelogs) are gated behind compliance review (section 10) and should not be treated as a given for v1.
- **LLM cost overrun** — usage-based LLM billing could scale unexpectedly with team adoption; mitigated by budget caps and cheaper-model-first strategy (section 9.1).
