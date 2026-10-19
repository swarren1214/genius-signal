import { DatabaseSync } from "node:sqlite";
import { chmodSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { defaultBrands } from "@/lib/brands";
import type { Brand } from "@/lib/types";

const connections = globalThis as typeof globalThis & {
  signalDatabase?: DatabaseSync;
};

function getDatabase() {
  if (connections.signalDatabase) return connections.signalDatabase;
  const path =
    process.env.SIGNAL_DB_PATH || join(process.cwd(), ".data", "signal.sqlite");
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  chmodSync(path, 0o600);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS records (
      kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL,
      updated_at TEXT NOT NULL, PRIMARY KEY (kind, id)
    );
    CREATE TABLE IF NOT EXISTS audit (
      id TEXT PRIMARY KEY, action TEXT NOT NULL, resource TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  const initialized = db
    .prepare(
      "SELECT id FROM records WHERE kind = 'system' AND id = 'brands-initialized'",
    )
    .get();
  if (!initialized) {
    const insert = db.prepare(
      "INSERT INTO records (kind,id,data,updated_at) VALUES (?,?,?,?)",
    );
    db.exec("BEGIN IMMEDIATE");
    try {
      for (const brand of defaultBrands)
        insert.run(
          "brand",
          brand.id,
          JSON.stringify(brand),
          new Date().toISOString(),
        );
      insert.run(
        "system",
        "brands-initialized",
        "true",
        new Date().toISOString(),
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  connections.signalDatabase = db;
  return db;
}

export function readRecord<T>(kind: string, id: string): T | null {
  const row = getDatabase()
    .prepare("SELECT data FROM records WHERE kind = ? AND id = ?")
    .get(kind, id);
  return row ? (JSON.parse(String(row.data)) as T) : null;
}

export function listRecords<T>(kind: string): T[] {
  return getDatabase()
    .prepare("SELECT data FROM records WHERE kind = ? ORDER BY updated_at DESC")
    .all(kind)
    .map((row) => JSON.parse(String(row.data)) as T);
}

export function writeRecord(kind: string, id: string, value: unknown) {
  getDatabase()
    .prepare(
      "INSERT INTO records (kind,id,data,updated_at) VALUES (?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at",
    )
    .run(kind, id, JSON.stringify(value), new Date().toISOString());
}

export function deleteRecord(kind: string, id: string) {
  getDatabase()
    .prepare("DELETE FROM records WHERE kind = ? AND id = ?")
    .run(kind, id);
}

export function recordAudit(action: string, resource: string) {
  getDatabase()
    .prepare(
      "INSERT INTO audit (id,action,resource,created_at) VALUES (?,?,?,?)",
    )
    .run(randomUUID(), action, resource, new Date().toISOString());
}

export function getBrands(): Brand[] {
  return listRecords<Brand>("brand").sort(
    (first, second) =>
      Number(Boolean(second.isOwnBrand)) - Number(Boolean(first.isOwnBrand)) ||
      first.name.localeCompare(second.name),
  );
}

export function getAuditLog() {
  return getDatabase()
    .prepare(
      "SELECT id,action,resource,created_at AS createdAt FROM audit ORDER BY created_at DESC LIMIT 50",
    )
    .all()
    .map((row) => ({
      id: String(row.id),
      action: String(row.action),
      resource: String(row.resource),
      createdAt: String(row.createdAt),
    }));
}

export function closeDatabase() {
  connections.signalDatabase?.close();
  delete connections.signalDatabase;
}
