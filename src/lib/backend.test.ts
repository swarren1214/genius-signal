import assert from "node:assert/strict";
import { after, test } from "node:test";
import { NextRequest } from "next/server";
import {
  resetWorkspace,
  deleteRecord,
  getAuditLog,
  getBrands,
  listRecords,
  readRecord,
  writeRecord,
} from "@/lib/store";
import { calculateNewsScore, getBrandSignals } from "@/lib/data/sentiment";
import { classifySentiment } from "@/lib/services/news";
import { changePercent, eventSource } from "@/lib/services/pendo-analytics";
import { POST as workspacePost } from "@/app/api/workspace/route";
import { POST as aiPost } from "@/app/api/ai/route";
import { GET as ingestGet } from "@/app/api/ingest/route";
import { proxy } from "@/proxy";
import {
  canonicalStoryUrl,
  NEWS_POLICY_VERSION,
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
import { brandLogoDomain, brandLogoUrl, logoDomainPattern } from "@/lib/brand-logos";
import {
  brandNewsQuery,
  matchArticleBrands,
} from "@/lib/services/news-relevance";
import { defaultBrands } from "@/lib/brands";

resetWorkspace();
after(() => resetWorkspace());

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

test("logo lookups use explicit company domains and only public tokens", () => {
  const htmlPattern = new RegExp(`^(?:${logoDomainPattern})$`, "v");
  assert.equal(htmlPattern.test("my-brand.example.com"), true);
  assert.equal(htmlPattern.test("https://wrong.example/path"), false);
  for (const brand of getBrands()) assert.ok(brandLogoDomain(brand));
  assert.equal(brandLogoDomain({ id: "square" }), "squareup.com");
  assert.equal(
    brandLogoDomain({ id: "custom", logoDomain: "custom.example.com" }),
    "custom.example.com",
  );
  assert.equal(
    brandLogoDomain({ id: "custom", logoDomain: "https://evil.test/path" }),
    null,
  );
  assert.equal(brandLogoUrl({ id: "toast" }), null);
  assert.equal(brandLogoUrl({ id: "toast" }, "sk_private_test"), null);
  const url = new URL(brandLogoUrl({ id: "toast" }, "pk_public_test")!);
  assert.equal(url.hostname, "img.logo.dev");
  assert.equal(url.pathname, "/toasttab.com");
  assert.equal(url.searchParams.get("fallback"), "404");
});

test("brand logo domains are validated and retained with temporary watchlist edits", async () => {
  const brand = {
    id: "logo-test",
    name: "Logo test",
    newsSearchTerms: ["Logo test"],
    logoDomain: "logo.example.com",
  };
  assert.equal(
    (await workspacePost(request({ action: "save-brand", brand }))).status,
    200,
  );
  assert.equal(
    getBrands().find((item) => item.id === brand.id)?.logoDomain,
    brand.logoDomain,
  );
  assert.equal(
    (
      await workspacePost(
        request({
          action: "save-brand",
          brand: { ...brand, logoDomain: "javascript:alert(1)" },
        }),
      )
    ).status,
    400,
  );
  deleteRecord("brand", brand.id);
});

test("competitor searches use every alias and matching excludes namesakes", () => {
  const clover = defaultBrands.find((brand) => brand.id === "clover")!;
  assert.match(brandNewsQuery(clover, 14), /Clover Network/);
  assert.match(brandNewsQuery(clover, 14), /"Clover"/);
  assert.deepEqual(
    matchArticleBrands(
      "Global Payments introduces Genius for restaurant payments",
      defaultBrands,
    ),
    ["genius"],
  );
  assert.deepEqual(
    matchArticleBrands("Lightspeed expands restaurant payments", defaultBrands),
    ["lightspeed"],
  );
  assert.deepEqual(
    matchArticleBrands(
      "Square launches restaurant checkout tools",
      defaultBrands,
    ),
    ["square"],
  );
  assert.deepEqual(
    matchArticleBrands("SpotOn unveils restaurant software", defaultBrands),
    ["spoton"],
  );
  for (const text of [
    "Town Square opens a new restaurant",
    "Restaurant serves French toast",
    "Restaurant fire burns 150 square meters of roof",
    "Japanese restaurant opens at Lincoln Square North",
    "Natalie Merchant at the Chicago Theater - Times Square Chronicles",
    "Square Tech explores stablecoin payments",
    "Clover Health Medicare network plans",
    "Global Payments explores GENIUS Act stablecoin rules",
    "A restaurant earns a spot on a national dining list",
  ])
    assert.deepEqual(matchArticleBrands(text, defaultBrands), []);
});

test("small or single-publisher samples cannot appear as strong brand scores", () => {
  const item = {
    id: "sample-test",
    url: "https://publisher.test/report",
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
  };
  assert.equal(
    getBrandSignals([item]).find((signal) => signal.brand.id === "toast")
      ?.score,
    null,
  );
  assert.equal(
    getBrandSignals([
      item,
      { ...item, id: "two" },
      { ...item, id: "three" },
    ]).find((signal) => signal.brand.id === "toast")?.score,
    null,
  );
  assert.equal(
    getBrandSignals([
      item,
      { ...item, id: "two", source: "Independent Publisher" },
      { ...item, id: "three" },
    ]).find((signal) => signal.brand.id === "toast")?.score,
    100,
  );
});

test("temporary records support upsert and deletion without retaining mutations", () => {
  writeRecord("test", "record", { value: 1 });
  writeRecord("test", "record", { value: 2 });
  assert.deepEqual(readRecord("test", "record"), { value: 2 });
  const record = readRecord<{ value: number }>("test", "record")!;
  record.value = 3;
  assert.deepEqual(readRecord("test", "record"), { value: 2 });
  deleteRecord("test", "record");
  assert.equal(readRecord("test", "record"), null);
});

test("resetting temporary state clears records and restores default brands", () => {
  writeRecord("test", "temporary", { value: 1 });
  deleteRecord("brand", defaultBrands[0].id);
  resetWorkspace();
  assert.equal(readRecord("test", "temporary"), null);
  assert.equal(getBrands().length, defaultBrands.length);
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
  assert.equal(
    isTimelyNews(
      {
        ...story,
        title:
          "Lightspeed Commerce Exceeds Market Returns: Some Facts to Consider",
      },
      now,
    ),
    false,
  );
  assert.equal(
    isTimelyNews(
      {
        ...story,
        source: "Simply Wall Street",
        title: "Could AI Alter The Investment Case For Lightspeed Commerce?",
      },
      now,
    ),
    false,
  );
  assert.equal(
    isTimelyNews(
      {
        ...story,
        title:
          "Lightspeed Commerce (TSX:LSPD) Nears Earnings, Is The Stock Cheap?",
      },
      now,
    ),
    false,
  );
  assert.equal(
    isTimelyNews(
      {
        ...story,
        title:
          "Lightspeed Commerce Upcoming Fiscal Q2 Results Put Merchant Growth Under the Lens",
      },
      now,
    ),
    false,
  );
  assert.equal(
    isTimelyNews(
      {
        ...story,
        title: "Lightspeed reports quarterly results and merchant growth",
      },
      now,
    ),
    true,
  );
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
  assert.equal(
    isTimelyNews(
      { ...story, title: "Lightspeed Commerce stock closes down 3.4 percent" },
      now,
    ),
    false,
  );
  assert.equal(
    isTimelyNews(
      {
        ...story,
        title:
          "Lightspeed announces restaurant payments partnership as shares rise",
      },
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
    policy: NEWS_POLICY_VERSION,
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

test("temporary actions are audited and can be completed", async () => {
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

test("temporary brand edits work without fake source state", async () => {
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

test("temporary scope mutations retain explicit app lists and reject duplicate/default coverage", async () => {
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
  const article = {
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
  };
  const articles = [
    article,
    { ...article, id: "policy-evidence-2", source: "Another publisher" },
    { ...article, id: "policy-evidence-3" },
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
