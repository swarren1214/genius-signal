# Genius Signal

A single-workspace product intelligence application built with Next.js and shadcn/Base UI. No database is required or used. Runtime demo data and synthetic fallbacks have been removed.

## Run Locally

Requires Node.js 24 or later.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Configure server environment variables using `.env.local.example` as the reference; never commit credentials. Restart the server after changing environment variables.

## Connected Data

- **Pendo:** `PENDO_API_KEY` and an explicit app selection are required. Settings supports up to eight app IDs and labels; existing single-app settings are preserved. Alternatively use `PENDO_APP_ID`, or comma-separated `PENDO_APP_IDS` before a workspace scope is saved. Queries use completed Pendo reporting-calendar days. Overall visitors/accounts are distinct across selected apps, not sums of per-app counts; feature adoption uses the distinct visitor denominator of the feature's own app. Analytics displays per-app coverage and definitions, and exports identify each feature's app. The audience is all visitors in selected apps; customer segments are not inferred. App catalog discovery is not available through the verified REST endpoint, so IDs are selected explicitly from Pendo rather than guessed.
- **News:** ingestion combines verified trade RSS feeds with configured NewsAPI and a separate Google News search for every tracked brand, using all aliases and contextual company names. Local matching rejects geographic, insurance, food, and GENIUS Act namesakes; trading and investment commentary are excluded. The 14-day recency, evergreen exclusion, URL cleanup, and headline-deduplication rules apply to cached articles too. Competitor monitoring shows per-brand candidate counts, timestamps, query inspection, and refresh controls. A successful request is not presented as proof of complete market coverage.
- **News tone:** a standard sentiment lexicon classifies retrieved headlines and summaries. Scores average positive/neutral/negative classifications mapped to 100/50/0, but are suppressed until at least three stories from two publishers are available. Smaller samples remain explicitly unscored. Historical changes compare observations from the same news selection policy. These are news-tone estimates, not confidence probabilities, customer NPS, or a blend of social/review data.
- **AI:** set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. Generate digests and ask questions in Insights. Context contains retrieved article records and app-scoped Pendo snapshots. External text is treated as untrusted data, outputs are schema-validated, and unknown citation IDs are rejected. Without credentials or evidence, generation is unavailable; no canned response is returned.

Source status distinguishes connected, stale, unavailable, and unconfigured. Automatic source caching is 15 minutes. Manual refresh bypasses both the in-memory and upstream fetch caches. Failed sources may show explicitly stale, previously retrieved data, never invented values.

## Brand Logos

Set `NEXT_PUBLIC_LOGO_DEV_TOKEN` to your Logo.dev publishable `pk_` key. Never use a secret `sk_` key in a `NEXT_PUBLIC_` variable. Competitor cards, monitoring rows, sentiment cards, and Settings use explicit company-domain lookups through `img.logo.dev`. Existing tracked brands have a known-domain fallback mapping; custom brands can set **Logo domain** in Settings. Genius defaults to the parent company domain `globalpayments.com`, not the unrelated `genius.com`.

Images load directly from the Logo.dev CDN, with attribution in the footer. The logo slot has fixed dimensions and a monogram fallback when the token/domain is missing or image loading fails. No live logos are claimed until a key is configured. Restart development after changing the key; production requires a fresh build and restart because `NEXT_PUBLIC_` variables are bundled at build time. Configure localhost and your deployed hostname in the key's domain restrictions as appropriate.

## Temporary State and Operations

Retrieved articles, metric snapshots, daily news-tone observations, generated digests, bookmarks, saved reports, product actions, tracked brands, and the latest 50 audit entries are held only in server memory. No database connection, database file, or storage volume is used. Existing local SQLite files are not read or modified.

Temporary state resets when the server process restarts and is not shared across Vercel instances. Settings, bookmarks, reports, and actions are not durably saved and can differ between requests served by different instances. Use environment variables for deployment-wide integration configuration and Pendo scope. Settings supports temporary watchlist edits, Pendo scope changes, source refresh, action completion, snapshot inspection, and audit history.

Set `SLACK_WEBHOOK_URL` to an official Slack webhook to enable confirmed insight delivery. No delivery is claimed until Slack accepts a request.

For scheduled ingestion, configure a strong `CRON_SECRET` and an external scheduler to invoke `GET /api/ingest` with `Authorization: Bearer <CRON_SECRET>` approximately every 15 minutes. The endpoint refreshes sources and records its invocation. No scheduler is installed automatically.

## Deployment Security

The run scripts bind to `127.0.0.1` by default. Without `SIGNAL_AUTH_USER` and `SIGNAL_AUTH_PASSWORD`, the application also rejects non-local hostnames. With both configured, HTTP Basic authentication protects the workspace. Set authentication before overriding the listener hostname or adding a reverse proxy, and use TLS before exposing it to a network. Write APIs additionally require same-origin requests, validate request bodies, and rate-limit refresh/AI operations. The ingestion endpoint has separate bearer authorization.

This is a single-workspace deployment, not an SSO/RBAC system. Individual roles, per-user bookmarks, multi-tenant isolation, durable storage, and distributed job workers are not implemented. Vercel deployments need no database; configure the integration and authentication environment variables before deploying.

## Verification

```sh
npm test
npx tsc --noEmit
npm run build
```

Backend tests use temporary in-memory state and cover reset behavior, mutation isolation, request validation, action state transitions, provenance, unavailable integrations, authentication guards, evergreen exclusions, RSS summary parsing, cached-news filtering, story deduplication, and scope migration/validation. Live validation has exercised the trade feeds and both single-app and two-app Pendo union queries without changing the workspace's saved scope.
