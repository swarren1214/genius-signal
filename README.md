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

- **Pendo:** `PENDO_API_KEY` and `PENDO_APP_ID` are required. Queries are application-scoped, use completed Pendo reporting-calendar days, and calculate distinct visitors, active accounts, events, actual daily history, and tagged feature usage. Weekly changes compare distinct visitor counts, not sums of daily counts. The application scope and display label can be changed in Settings.
- **News:** NewsAPI is used when `NEWS_API_KEY` is configured; public Google News RSS is the real-data fallback. Retrieved stories are deduplicated by URL, persisted, and attributed to their original publisher. Empty results remain empty.
- **News tone:** a standard sentiment lexicon classifies retrieved headlines and summaries. Scores average positive/neutral/negative classifications mapped to 100/50/0. No articles means no score. These are news-tone estimates, not customer NPS or a blend of social/review data.
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

Backend tests use isolated temporary databases and cover persistence across restarts, request validation, action state transitions, provenance, unavailable integrations, and authentication guards. Source adapters have also been exercised against the configured Pendo application and public RSS.
