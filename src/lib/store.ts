import { randomUUID } from "node:crypto";
import { defaultBrands } from "@/lib/brands";
import type { Brand } from "@/lib/types";

type StoredRecord = { data: string; updatedAt: number };
type AuditEntry = {
  id: string;
  action: string;
  resource: string;
  createdAt: string;
};
type WorkspaceState = {
  records: Map<string, Map<string, StoredRecord>>;
  audit: AuditEntry[];
  sequence: number;
};

const runtime = globalThis as typeof globalThis & {
  signalWorkspace?: WorkspaceState;
};

function getWorkspace(): WorkspaceState {
  if (!runtime.signalWorkspace) {
    runtime.signalWorkspace = {
      records: new Map([
        [
          "brand",
          new Map(
            defaultBrands.map((brand) => [
              brand.id,
              { data: JSON.stringify(brand), updatedAt: 0 },
            ]),
          ),
        ],
      ]),
      audit: [],
      sequence: 0,
    };
  }
  return runtime.signalWorkspace;
}

export function readRecord<T>(kind: string, id: string): T | null {
  const record = getWorkspace().records.get(kind)?.get(id);
  return record ? (JSON.parse(record.data) as T) : null;
}

export function listRecords<T>(kind: string): T[] {
  return [...(getWorkspace().records.get(kind)?.values() ?? [])]
    .sort((first, second) => second.updatedAt - first.updatedAt)
    .map((record) => JSON.parse(record.data) as T);
}

export function writeRecord(kind: string, id: string, value: unknown) {
  const workspace = getWorkspace();
  const data = JSON.stringify(value);
  if (data === undefined) throw new TypeError("Record must be JSON serializable");
  let records = workspace.records.get(kind);
  if (!records) {
    records = new Map();
    workspace.records.set(kind, records);
  }
  records.set(id, { data, updatedAt: ++workspace.sequence });
}

export function deleteRecord(kind: string, id: string) {
  getWorkspace().records.get(kind)?.delete(id);
}

export function recordAudit(action: string, resource: string) {
  const audit = getWorkspace().audit;
  audit.unshift({
    id: randomUUID(),
    action,
    resource,
    createdAt: new Date().toISOString(),
  });
  audit.length = Math.min(audit.length, 50);
}

export function getBrands(): Brand[] {
  return listRecords<Brand>("brand").sort(
    (first, second) =>
      Number(Boolean(second.isOwnBrand)) - Number(Boolean(first.isOwnBrand)) ||
      first.name.localeCompare(second.name),
  );
}

export function getAuditLog(): AuditEntry[] {
  return getWorkspace().audit.map((entry) => ({ ...entry }));
}

export function resetWorkspace() {
  delete runtime.signalWorkspace;
}