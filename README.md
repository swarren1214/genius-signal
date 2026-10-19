# Genius Signal

A single-workspace product intelligence application built with Next.js, shadcn/Base UI, and persistent SQLite storage. Runtime demo data and synthetic fallbacks have been removed.

## Run Locally

Requires Node.js 24 or later.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Configure server environment variables using `.env.local.example` as the reference; never commit credentials. Restart the server after changing environment variables.

## Connected Data

- **Pendo:** `PENDO_API_KEY` and an explicit app selection are required. Settings supports up to eight app IDs and labels; existing single-app settings are preserved. Alternatively use `PENDO_APP_ID`, or comma-separated `PENDO_APP_IDS` before a workspace scope is saved. Queries use completed Pendo reporting-calendar days. Overall visitors/accounts are distinct across selected apps, not sums of per-app counts; feature adoption uses the distinct visitor denominator of the feature's own app. Analytics displays per-app coverage and definitions, and exports identify each feature's app. The audience is all visitors in selected apps; customer segments are not inferred. App catalog discovery is not available through the verified REST endpoint, so IDs are selected explicitly from Pendo rather than guessed.
- **News:** ingestion combines verified Restaurant Dive, PYMNTS, and Restaurant Technology News RSS feeds with Google News and configured NewsAPI. Publisher-provided summaries are parsed as text and preserve attribution. The feed selects the latest 14 days, excludes evergreen buying guides/dated reviews, rejects invalid/future dates, removes tracking URL variants, and collapses near-identical syndicated headlines. Distinct numeric events are not merged. Rules apply to cached articles too. Healthy sources remain usable when another provider fails; partial failures are reported. Empty results remain empty.
- **News tone:** a standard sentiment lexicon classifies retrieved headlines and summaries. Scores average positive/neutral/negative classifications mapped to 100/50/0. No articles means no score. Historical changes compare observations from the same news selection policy; legacy guide-heavy observations are not treated as comparable market shifts. These are news-tone estimates, not customer NPS or a blend of social/review data.
- **AI:** set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. Generate digests and ask questions in Insights. Context contains retrieved article records and app-scoped Pendo snapshots. External text is treated as untrusted data, outputs are schema-validated, and unknown citation IDs are rejected. Without credentials or evidence, generation is unavailable; no canned response is returned.

Source status distinguishes connected, stale, unavailable, and unconfigured. Automatic source caching is 15 minutes. Manual refresh bypasses both the SQLite and upstream fetch caches. Failed sources may show explicitly stale, previously retrieved data, never invented values.

## Persistence and Operations

SQLite defaults to `.data/signal.sqlite`, ignored by git. Set `SIGNAL_DB_PATH` to a path on a persistent server volume. The database stores retrieved articles, metric snapshots, daily news-tone observations, generated digests, bookmarks, saved reports, product actions, tracked brands, and an audit log.

Bookmarks and actions are workspace-wide, not browser-only. Settings supports watchlist edits, Pendo scope changes, source refresh, action completion, saved snapshot inspection, and audit history.

Set `SLACK_WEBHOOK_URL` to an official Slack webhook to enable confirmed insight delivery. No delivery is claimed until Slack accepts a request.

For scheduled ingestion, configure a strong `CRON_SECRET` and an external scheduler to invoke `GET /api/ingest` with `Authorization: Bearer <CRON_SECRET>` approximately every 15 minutes. The endpoint refreshes sources and records its invocation. No scheduler is installed automatically.

## Deployment Security

The run scripts bind to `127.0.0.1` by default. Without `SIGNAL_AUTH_USER` and `SIGNAL_AUTH_PASSWORD`, the application also rejects non-local hostnames. With both configured, HTTP Basic authentication protects the workspace. Set authentication before overriding the listener hostname or adding a reverse proxy, and use TLS before exposing it to a network. Write APIs additionally require same-origin requests, validate request bodies, and rate-limit refresh/AI operations. The ingestion endpoint has separate bearer authorization.

This is a single-workspace deployment, not an SSO/RBAC system. Individual roles, per-user bookmarks, multi-tenant isolation, and distributed job workers are not implemented. Persistent SQLite is unsuitable for ephemeral serverless storage: use a persistent-volume host, or migrate the storage layer to PostgreSQL before that deployment model.

## Verification

```sh
npm test
npx tsc --noEmit
npm run build
```

Backend tests use isolated temporary databases and cover persistence across restarts, request validation, action state transitions, provenance, unavailable integrations, authentication guards, evergreen exclusions, RSS summary parsing, cached-news filtering, story deduplication, and scope migration/validation. Live validation has exercised the trade feeds and both single-app and two-app Pendo union queries without changing the workspace's saved scope.
