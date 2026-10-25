import type { Attempt, Proficiency, Session, StageStatus, SyncQueueItem, SyncResponse } from "@/types";
import { syncResponseSchema, sessionDownlinkSchema, attemptDownlinkSchema, proficiencyDownlinkSchema, progressDownlinkSchema } from "@/lib/http/sync-contracts";

const DB_NAME = "wordspire-local";
const DB_VERSION = 2;
const STORES = ["sessions", "attempts", "proficiencies", "stageProgress", "syncQueue", "meta"] as const;

type StoreName = typeof STORES[number];

const memory: {
  sessions: Session[];
  attempts: Attempt[];
  proficiencies: Proficiency[];
  stageProgress: LocalStageProgress[];
  syncQueue: SyncQueueItem[];
  meta: Record<string, unknown>;
} = { sessions: [], attempts: [], proficiencies: [], stageProgress: [], syncQueue: [], meta: {} };

export interface LocalStageProgress {
  id: string;
  childProfileId: string;
  stageId: string;
  status: StageStatus;
  completedStars: number;
  version: number;
  updatedAt: number;
}

function hasIndexedDB(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      for (const storeName of STORES) {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: storeName === "meta" ? "key" : "id" });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IDB_OPEN_FAILED"));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IDB_REQUEST_FAILED"));
  });
}

async function readAll<T>(storeName: StoreName): Promise<T[]> {
  if (!hasIndexedDB()) return [...(memory[storeName] as unknown as T[])];
  const database = await openDatabase();
  const transaction = database.transaction(storeName, "readonly");
  const result = await requestResult(transaction.objectStore(storeName).getAll());
  database.close();
  return result;
}

async function put<T extends object>(storeName: StoreName, value: T): Promise<void> {
  if (!hasIndexedDB()) {
    const items = memory[storeName] as unknown as Array<T & { id?: string; key?: string }>;
    const key = "key" in value ? value.key : "id" in value ? value.id : undefined;
    const index = key ? items.findIndex((item) => ("key" in item ? item.key : item.id) === key) : -1;
    if (index >= 0) items[index] = value as T & { id?: string; key?: string };
    else items.push(value as T & { id?: string; key?: string });
    return;
  }
  const database = await openDatabase();
  const transaction = database.transaction(storeName, "readwrite");
  await requestResult(transaction.objectStore(storeName).put(value));
  database.close();
}

async function getMeta<T>(key: string, fallback: T): Promise<T> {
  if (!hasIndexedDB()) return (memory.meta[key] as T | undefined) ?? fallback;
  const database = await openDatabase();
  const transaction = database.transaction("meta", "readonly");
  const result = await requestResult(transaction.objectStore("meta").get(key)) as { value?: T } | undefined;
  database.close();
  return result?.value ?? fallback;
}

async function setMeta<T>(key: string, value: T): Promise<void> {
  if (!hasIndexedDB()) {
    memory.meta[key] = value;
    return;
  }
  await put("meta", { key, value });
}

function createDeviceId(): string {
  return crypto.randomUUID();
}

export interface LocalDB {
  sessions: Session[];
  attempts: Attempt[];
  proficiencies: Proficiency[];
  stageProgress: LocalStageProgress[];
  syncQueue: SyncQueueItem[];
  lastSyncVersion: number;
  deviceId: string;
}

export async function initLocalDB(): Promise<void> {
  if (typeof window !== "undefined" && !hasIndexedDB()) throw new Error("IndexedDB 不可用，无法保存设备标识和学习记录。");
  if (hasIndexedDB()) (await openDatabase()).close();
  const deviceId = await getMeta("deviceId", "");
  if (!deviceId) await setMeta("deviceId", createDeviceId());
  const lastSyncVersion = await getMeta("lastSyncVersion", 0);
  if (typeof lastSyncVersion !== "number") await setMeta("lastSyncVersion", 0);
}

export async function getDeviceId(): Promise<string> {
  await initLocalDB();
  return getMeta("deviceId", "");
}

export async function getLocalDB(): Promise<LocalDB> {
  await initLocalDB();
  return {
    sessions: await readAll<Session>("sessions"),
    attempts: await readAll<Attempt>("attempts"),
    proficiencies: await readAll<Proficiency>("proficiencies"),
    stageProgress: await readAll<LocalStageProgress>("stageProgress"),
    syncQueue: await readAll<SyncQueueItem>("syncQueue"),
    lastSyncVersion: await getMeta("lastSyncVersion", 0),
    deviceId: await getMeta("deviceId", ""),
  };
}

export async function saveLocalSession(session: Session): Promise<void> {
  await put("sessions", session);
}

export async function getLocalSession(sessionId: string): Promise<Session | null> {
  const rows = await readAll<Session>("sessions");
  return rows.find((session) => session.id === sessionId) ?? null;
}

export async function saveLocalAttempt(attempt: Attempt): Promise<void> {
  await put("attempts", attempt);
}

export async function getLocalAttempt(attemptId: string): Promise<Attempt | null> {
  const rows = await readAll<Attempt>("attempts");
  return rows.find((attempt) => attempt.id === attemptId) ?? null;
}

export async function enqueueSync(item: Omit<SyncQueueItem, "id" | "createdAt">): Promise<void> {
  await initLocalDB();
  await put("syncQueue", { ...item, id: `${item.entity}:${item.entityId}:${item.version}:${item.deviceId}`, createdAt: Date.now(), status: "local_dirty" });
}

export async function getPendingSync(): Promise<SyncQueueItem[]> {
  const items = await readAll<SyncQueueItem>("syncQueue");
  return items.filter((item) => item.status === "local_dirty" || item.status === "syncing").sort((a, b) => a.createdAt - b.createdAt);
}

export async function applyServerItems(items: SyncQueueItem[]): Promise<void> {
  for (const item of items) {
    if (item.entity === "sessions") {
      const payload = sessionDownlinkSchema.parse(item.payload);
      await put<Session>("sessions", {
        id: item.entityId,
        childProfileId: item.childProfileId,
        ...payload,
        syncStatus: "synced",
      });
    } else if (item.entity === "attempts") {
      const payload = attemptDownlinkSchema.parse(item.payload);
      await put<Attempt>("attempts", {
        id: item.entityId,
        childProfileId: item.childProfileId,
        ...payload,
        syncStatus: "synced",
      });
    } else if (item.entity === "proficiencies") {
      const payload = proficiencyDownlinkSchema.parse(item.payload);
      await put<Proficiency>("proficiencies", {
        id: item.entityId,
        childProfileId: item.childProfileId,
        ...payload,
      });
    } else if (item.entity === "stage_progress") {
      const payload = progressDownlinkSchema.parse(item.payload);
      await put<LocalStageProgress>("stageProgress", {
        id: item.entityId,
        childProfileId: item.childProfileId,
        ...payload,
        version: item.version,
      });
    }
    await put("syncQueue", { ...item, status: "synced" });
  }
}

export async function markSynced(queueItemIds: string[]): Promise<void> {
  const items = await readAll<SyncQueueItem>("syncQueue");
  for (const item of items) {
    if (queueItemIds.includes(item.id)) await put("syncQueue", { ...item, status: "synced" });
  }
}

const syncFlights = new Map<string, Promise<SyncResponse | null>>();
export async function flushSync(childProfileId: string): Promise<SyncResponse | null> {
  const current = syncFlights.get(childProfileId);
  if (current) return current;
  const flight = performSync(childProfileId);
  syncFlights.set(childProfileId, flight);
  try { return await flight; }
  finally { syncFlights.delete(childProfileId); }
}

async function performSync(childProfileId: string): Promise<SyncResponse | null> {
  if (typeof window === "undefined" || !navigator.onLine) return null;
  await initLocalDB();
  const items = (await getPendingSync()).filter(item => item.childProfileId === childProfileId);
  const deviceId = await getMeta("deviceId", "");
  const cursorKey = `syncCursor:${childProfileId}`;
  let lastSyncVersion = await getMeta(cursorKey, 0);
  for (const item of items) await put("syncQueue", { ...item, status: "syncing" });
  try {
    let offset = 0;
    const combined: SyncResponse = { accepted: 0, rejected: [], acknowledgements: [], serverVersion: lastSyncVersion, serverItems: [], hasMore: false };
    let hasMore = false;
    do {
    const batch = items.slice(offset, offset + 100);
    offset += batch.length;
    const response = await fetch("/api/sync", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-WordSpire-Device-Id": deviceId },
      body: JSON.stringify({ deviceId, childProfileId, items: batch, lastSyncVersion }),
    });
    if (!response.ok) throw new Error(`SYNC_${response.status}`);
    const result = syncResponseSchema.parse(await response.json());
    if (result.hasMore && result.serverVersion <= lastSyncVersion) throw new Error("SYNC_CURSOR_NOT_ADVANCING");
    await markSynced(result.acknowledgements.filter(item => item.status === "accepted").map(item => item.id));
    for (const failure of result.acknowledgements.filter(item => item.status === "rejected")) {
      const item = items.find(candidate => candidate.id === failure.id);
      if (item) await put("syncQueue", { ...item, status: "local_dirty", error: failure.error });
    }
    await applyServerItems(result.serverItems ?? []);
    await setMeta(cursorKey, result.serverVersion);
    lastSyncVersion = result.serverVersion;
    hasMore = result.hasMore;
    combined.accepted += result.accepted;
    combined.rejected.push(...result.rejected);
    combined.acknowledgements.push(...result.acknowledgements);
    combined.serverItems.push(...result.serverItems);
    combined.serverVersion = result.serverVersion;
    } while (offset < items.length || hasMore);
    return combined;
  } catch (error) {
    const pending = await getPendingSync();
    for (const item of pending.filter(item => item.childProfileId === childProfileId)) await put("syncQueue", { ...item, status: "local_dirty" });
    throw error;
  }
}
