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
import { calculateNewsScore } from "@/lib/data/sentiment";
import { classifySentiment } from "@/lib/services/news";
import { changePercent, eventSource } from "@/lib/services/pendo-analytics";
import { POST as workspacePost } from "@/app/api/workspace/route";
import { POST as aiPost } from "@/app/api/ai/route";
import { GET as ingestGet } from "@/app/api/ingest/route";
import { proxy } from "@/proxy";

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

test("Pendo pipelines require and carry an exact application scope", () => {
  assert.throws(() => eventSource("", 0, 7));
  assert.equal(eventSource("123", 0, 7).source.events.appId, 123);
  assert.equal(changePercent(120, 100), 20);
  assert.equal(changePercent(10, 0), null);
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
