import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'nuruna-offline';
const DB_VERSION = 3;

export type SessionCacheEntry = {
  userId: string;
  email: string;
  cachedAt: number;
};

export type StreakCacheEntry = {
  userId: string;
  streak: number;
  cachedAt: number;
};

export type HatimCacheEntry = {
  key: string;
  date: string;
  data: {
    currentGroupId: string | null;
    isInGroup: boolean;
    isAdmin: boolean;
    groupMemberIds: string[];
    users: unknown[];
    assignments: unknown[];
    votesForDay: unknown[];
    activityLogs: unknown[];
    currentGroup: { id: string; name: string | null; owner_id: string } | null;
    isGroupOwner: boolean;
  };
  cachedAt: number;
};

export type SyncQueueEntry = {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'upsert' | 'delete';
  payload: unknown;
  timestamp: number;
};

function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('hatim_cache')) {
        db.createObjectStore('hatim_cache', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
      if (!db.objectStoreNames.contains('streak_cache')) {
        db.createObjectStore('streak_cache', { keyPath: 'userId' });
      }
      if (!db.objectStoreNames.contains('session_cache')) {
        db.createObjectStore('session_cache', { keyPath: 'userId' });
      }
    },
  });
}

export async function saveHatimCache(entry: Omit<HatimCacheEntry, 'cachedAt'>): Promise<void> {
  const db = await getDB();
  await db.put('hatim_cache', {
    ...entry,
    cachedAt: Date.now(),
  });
}

export async function loadHatimCache(key: string): Promise<HatimCacheEntry | null> {
  const db = await getDB();
  return (await db.get('hatim_cache', key)) ?? null;
}

export async function addToSyncQueue(entry: Omit<SyncQueueEntry, 'id' | 'timestamp'>): Promise<void> {
  const db = await getDB();
  await db.add('sync_queue', {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
}

export async function getSyncQueue(): Promise<SyncQueueEntry[]> {
  const db = await getDB();
  const tx = db.transaction('sync_queue', 'readonly');
  const index = tx.store.index('timestamp');
  const entries = await index.getAll();
  await tx.done;
  return entries;
}

export async function removeSyncQueueEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sync_queue', id);
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getDB();
  await db.clear('sync_queue');
}

export async function saveStreakCache(userId: string, streak: number): Promise<void> {
  const db = await getDB();
  await db.put('streak_cache', { userId, streak, cachedAt: Date.now() });
}

export async function loadStreakCache(userId: string): Promise<StreakCacheEntry | null> {
  const db = await getDB();
  return (await db.get('streak_cache', userId)) ?? null;
}

export async function saveSessionCache(userId: string, email: string): Promise<void> {
  const db = await getDB();
  await db.put('session_cache', { userId, email, cachedAt: Date.now() });
}

export async function loadSessionCache(): Promise<SessionCacheEntry | null> {
  const db = await getDB();
  const all = await db.getAll('session_cache');
  if (all.length === 0) return null;
  const sorted = (all as SessionCacheEntry[]).sort((a, b) => b.cachedAt - a.cachedAt);
  return sorted[0];
}

export async function clearSessionCache(): Promise<void> {
  const db = await getDB();
  await db.clear('session_cache');
}
