import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextRequest } from "next/server";
import {
  closeDatabase,
  deleteRecord,
  getAuditLog,
  getBrands,
  listRecords,
  readRecord,
  writeRecord,
} from "@/lib/database";
import { calculateNewsScore, getBrandSignals } from "@/lib/data/sentiment";
import { classifySentiment } from "@/lib/services/news";
import { changePercent, eventSource } from "@/lib/services/pendo-analytics";
import { POST as workspacePost } from "@/app/api/workspace/route";
import { POST as aiPost } from "@/app/api/ai/route";
import { GET as ingestGet } from "@/app/api/ingest/route";
import { proxy } from "@/proxy";
import {
  canonicalStoryUrl,
  isTimelyNews,
  selectNewsStories,
} from "@/lib/services/news-quality";
import { parseRssFeed } from "@/lib/services/rss";
import {
  pendoScopeSchema,
  resolvePendoScope,
  scopeAppIds,
} from "@/lib/pendo-scope";
import { getNewsFeed } from "@/lib/data/news";

const directory = mkdtempSync(join(tmpdir(), "signal-tests-"));
process.env.SIGNAL_DB_PATH = join(directory, "workspace.sqlite");
after(() => {
  closeDatabase();
  rmSync(directory, { recursive: true, force: true });
});

function request(body: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
}

test("brand configuration contains names and terms, not seeded scores", () => {
  const brands = getBrands();
  assert.ok(brands.length > 0);
  assert.ok(
    brands.every(
      (brand) => brand.newsSearchTerms.length > 0 && !("sentiment" in brand),
    ),
  );
});

test("SQLite records survive connection restart and upsert", () => {
  writeRecord("test", "record", { value: 1 });
  writeRecord("test", "record", { value: 2 });
  closeDatabase();
  assert.deepEqual(readRecord("test", "record"), { value: 2 });
  deleteRecord("test", "record");
  assert.equal(readRecord("test", "record"), null);
});

test("no news articles means no sentiment score", () => {
  assert.equal(calculateNewsScore([]), null);
  assert.equal(
    calculateNewsScore([
      { sentiment: "positive" },
      { sentiment: "neutral" },
      { sentiment: "negative" },
    ]),
    50,
  );
  assert.equal(
    classifySentiment("excellent successful growth").label,
    "positive",
  );
  assert.equal(
    classifySentiment("terrible failure and loss").label,
    "negative",
  );
});

test("news quality excludes evergreen reviews, guides, stale and future stories", () => {
  const now = Date.parse("2026-10-19T12:00:00Z");
  const story = {
    title: "Toast launches restaurant payment integration",
    url: "https://publisher.test/news",
    source: "Publisher",
    publishedAt: "2026-10-18T12:00:00Z",
  };
  assert.equal(isTimelyNews(story, now), true);
  for (const title of [
    "Best Restaurant POS Systems in 2026",
    "TouchBistro POS Review and Pricing Plans in 2026",
    "The Complete Restaurant POS Systems Guide for 2026",
  ])
    assert.equal(isTimelyNews({ ...story, title }, now), false);
  assert.equal(
    isTimelyNews({ ...story, publishedAt: "2026-09-01T12:00:00Z" }, now),
    false,
  );
  assert.equal(
    isTimelyNews({ ...story, publishedAt: "2026-10-20T12:00:00Z" }, now),
    false,
  );
  assert.equal(
    isTimelyNews(
      { ...story, title: "Toast wins best restaurant technology award" },
      now,
    ),
    true,
  );
});

test("trade RSS summaries retain publisher text and reject invalid payloads", () => {
  const stories = parseRssFeed(
    '<rss><channel><item><title>Restaurant payment launch</title><link>https://publisher.test/launch</link><pubDate>Sun, 18 Oct 2026 12:00:00 GMT</pubDate><description><![CDATA[<p>Publisher <strong>summary</strong> with a <a href="https://publisher.test">link</a>.</p>]]></description></item></channel></rss>',
    "Trade Publisher",
  );
  assert.equal(stories[0].source, "Trade Publisher");
  assert.equal(stories[0].snippet, "Publisher summary with a link.");
  assert.throws(() =>
    parseRssFeed("<html>Unavailable</html>", "Trade Publisher"),
  );
});

test("cached evergreen articles cannot bypass the current news policy", async () => {
  const article = {
    id: "cache-policy-test",
    title: "Best Restaurant POS Systems in 2026",
    url: "https://publisher.test/buying-guide",
    source: "Publisher",
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    snippet: "Restaurant POS software comparison",
    brands: ["toast"],
    topic: "General",
    sentiment: "neutral",
    sentimentScore: 0,
    whyItMatters: "",
  };
  writeRecord("article", article.id, article);
  writeRecord("source", "news", {
    status: "connected",
    isLive: true,
    fetchedAt: new Date().toISOString(),
    provider: "Unit-test feed",
  });
  const result = await getNewsFeed();
  assert.equal(
    result.articles.some((item) => item.id === article.id),
    false,
  );
  deleteRecord("article", article.id);
  deleteRecord("source", "news");
});

test("story deduplication handles tracking URLs and syndicated headlines without merging different numbers", () => {
  const now = Date.parse("2026-10-19T12:00:00Z");
  const story = {
    title: "Toast launches new restaurant tableside payment platform",
    url: "https://publisher.test/news?utm_source=email",
    source: "Publisher",
    publishedAt: "2026-10-18T12:00:00Z",
  };
  assert.equal(canonicalStoryUrl(story.url), "https://publisher.test/news");
  const duplicate = {
    ...story,
    title: "Toast launches restaurant tableside payment platform - Wire",
    url: "https://wire.test/coverage",
    source: "Wire",
  };
  assert.equal(
    selectNewsStories(
      [
        story,
        duplicate,
        { ...story, url: "https://publisher.test/news?fbclid=tracking" },
      ],
      now,
    ).length,
    1,
  );
  assert.equal(
    selectNewsStories(
      [
        {
          ...story,
          title: "Toast raises restaurant payment processing fees by 5 percent",
        },
        {
          ...story,
          url: "https://wire.test/other",
          title:
            "Toast raises restaurant payment processing fees by 10 percent",
        },
      ],
      now,
    ).length,
    2,
  );
});

test("Pendo pipelines require and carry an exact application scope", () => {
  assert.throws(() => eventSource("", 0, 7));
  assert.equal(eventSource("123", 0, 7).source.events.appId, 123);
  assert.equal(changePercent(120, 100), 20);
  assert.equal(changePercent(10, 0), null);
  assert.deepEqual(
    eventSource(["123", "456"], 0, 7).source.events.appId,
    [123, 456],
  );
  assert.throws(() => eventSource(["123", "123"], 0, 7));
  assert.throws(() => eventSource("-323232", 0, 7));
});

test("Pendo scope preserves legacy selection and validates explicit multi-app coverage", () => {
  const legacy = resolvePendoScope(
    { appId: "123", appName: "Current application" },
    { appId: "456", appName: "Fallback" },
  );
  assert.deepEqual(scopeAppIds(legacy), ["123"]);
  assert.equal(legacy.apps[0].appName, "Current application");
  const scope = pendoScopeSchema.parse({
    appName: "Selected restaurant applications",
    apps: [
      { appId: "456", appName: "iOS" },
      { appId: "123", appName: "Android" },
    ],
  });
  assert.deepEqual(scopeAppIds(scope), ["123", "456"]);
  assert.throws(() =>
    pendoScopeSchema.parse({
      appName: "",
      apps: [
        { appId: "123", appName: "One" },
        { appId: "123", appName: "Duplicate" },
      ],
    }),
  );
  assert.throws(() => pendoScopeSchema.parse({ appName: "", apps: [] }));
});

test("workspace writes reject cross-origin and invalid requests", async () => {
  const reconstructed = new Request("http://localhost:3000/api/workspace", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Host: "127.0.0.1:3000",
      Origin: "http://127.0.0.1:3000",
    },
    body: JSON.stringify({ action: "create-action", title: "", notes: "" }),
  });
  assert.equal((await workspacePost(reconstructed)).status, 400);
  assert.equal(
    (
      await workspacePost(
        request(
          { action: "create-action", title: "Title", notes: "" },
          "https://other.test",
        ),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await workspacePost(
        request({ action: "create-action", title: "", notes: "" }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await workspacePost(
        request({
          action: "bookmark",
          kind: "news",
          id: "missing",
          saved: true,
        }),
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await workspacePost(
        request({
          action: "create-action",
          title: "Title",
          notes: "",
          insightId: "missing",
        }),
      )
    ).status,
    404,
  );
});

test("actions are persisted, audited, and can be completed", async () => {
  const response = await workspacePost(
    request({
      action: "create-action",
      title: "Verify source provenance",
      notes: "Check cited records.",
    }),
  );
  assert.equal(response.status, 201);
  const { item } = await response.json();
  assert.equal(
    readRecord<{ status: string }>("action", item.id)?.status,
    "open",
  );
  assert.equal(
    (
      await workspacePost(
        request({ action: "update-action", id: item.id, status: "done" }),
      )
    ).status,
    200,
  );
  assert.equal(
    readRecord<{ status: string }>("action", item.id)?.status,
    "done",
  );
  assert.ok(getAuditLog().some((entry) => entry.action === "action.created"));
});

test("brand edits persist without fake source state", async () => {
  const brand = {
    id: "test-brand",
    name: "Test configured brand",
    newsSearchTerms: ["exact product term"],
    isOwnBrand: false,
  };
  assert.equal(
    (await workspacePost(request({ action: "save-brand", brand }))).status,
    200,
  );
  assert.equal(
    getBrands().find((item) => item.id === brand.id)?.name,
    brand.name,
  );
  assert.equal(
    (await workspacePost(request({ action: "delete-brand", id: brand.id })))
      .status,
    200,
  );
  assert.equal(
    getBrands().some((item) => item.id === brand.id),
    false,
  );
});

test("scope mutations persist explicit app lists and reject duplicate/default coverage", async () => {
  const apps = [
    { appId: "123", appName: "Android" },
    { appId: "456", appName: "iOS" },
  ];
  assert.equal(
    (
      await workspacePost(
        request({
          action: "save-pendo-settings",
          apps,
          appName: "Selected apps",
        }),
      )
    ).status,
    200,
  );
  assert.equal(
    readRecord<{ apps: unknown[] }>("settings", "pendo")?.apps.length,
    2,
  );
  assert.equal(
    (
      await workspacePost(
        request({
          action: "save-pendo-settings",
          apps: [apps[0], apps[0]],
          appName: "Invalid",
        }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await workspacePost(
        request({
          action: "save-pendo-settings",
          appId: "-323232",
          appName: "Default app",
        }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await workspacePost(
        request({
          action: "save-pendo-settings",
          appId: "123",
          appName: "Legacy single app",
        }),
      )
    ).status,
    200,
  );
  assert.equal(
    readRecord<{ apps: unknown[] }>("settings", "pendo")?.apps.length,
    1,
  );
  deleteRecord("settings", "pendo");
});

test("missing AI and scheduler credentials return unavailable, not canned data", async () => {
  assert.equal(
    (await aiPost(request({ action: "question", question: "What changed?" })))
      .status,
    503,
  );
  assert.equal(
    (await ingestGet(new Request("http://localhost:3000/api/ingest"))).status,
    503,
  );
  assert.equal(listRecords("digest").length, 0);
});

test("network access is blocked until authentication is configured", () => {
  const oldUser = process.env.SIGNAL_AUTH_USER;
  const oldPassword = process.env.SIGNAL_AUTH_PASSWORD;
  delete process.env.SIGNAL_AUTH_USER;
  delete process.env.SIGNAL_AUTH_PASSWORD;
  assert.equal(proxy(new NextRequest("http://public.test/")).status, 503);
  assert.equal(proxy(new NextRequest("http://localhost/")).status, 200);
  process.env.SIGNAL_AUTH_USER = "unit-user";
  process.env.SIGNAL_AUTH_PASSWORD = "unit-password";
  assert.equal(proxy(new NextRequest("http://public.test/")).status, 401);
  assert.equal(
    proxy(
      new NextRequest("http://public.test/", {
        headers: {
          authorization: `Basic ${Buffer.from("unit-user:unit-password").toString("base64")}`,
        },
      }),
    ).status,
    200,
  );
  if (oldUser === undefined) delete process.env.SIGNAL_AUTH_USER;
  else process.env.SIGNAL_AUTH_USER = oldUser;
  if (oldPassword === undefined) delete process.env.SIGNAL_AUTH_PASSWORD;
  else process.env.SIGNAL_AUTH_PASSWORD = oldPassword;
});

test("sentiment changes do not mix different news selection policies", () => {
  const today = new Date().toISOString().slice(0, 10);
  const previousDate = new Date(Date.now() - 86400000)
    .toISOString()
    .slice(0, 10);
  writeRecord("sentiment", "legacy-policy-observation", {
    brandId: "toast",
    date: previousDate,
    score: 0,
  });
  const articles = [
    {
      id: "policy-evidence",
      url: "https://publisher.test/launch",
      source: "Publisher",
      title: "Toast launches restaurant payment integration",
      snippet: "Launch coverage",
      publishedAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      brands: ["toast"],
      topic: "Product Launch",
      sentiment: "positive" as const,
      sentimentScore: 1,
      whyItMatters: "",
    },
  ];
  assert.equal(
    getBrandSignals(articles).find((signal) => signal.brand.id === "toast")
      ?.delta,
    null,
  );
  const current = readRecord<{ policy: string }>("sentiment", `toast:${today}`);
  assert.ok(current?.policy);
  writeRecord("sentiment", "comparable-policy-observation", {
    brandId: "toast",
    date: previousDate,
    score: 50,
    policy: current.policy,
  });
  assert.equal(
    getBrandSignals(articles).find((signal) => signal.brand.id === "toast")
      ?.delta,
    50,
  );
});
