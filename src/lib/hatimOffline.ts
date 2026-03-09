/**
 * Offline support for Hatim/Quran page data.
 * - Online: fetch from Supabase, cache to IndexedDB
 * - Offline: read from IndexedDB cache
 * - Offline writes: queue to sync_queue, process when online
 */
import { supabase } from './supabase';
import {
  saveHatimCache,
  loadHatimCache,
  addToSyncQueue,
  getSyncQueue,
  removeSyncQueueEntry,
  type HatimCacheEntry,
  type SyncQueueEntry,
} from './idb';

const CACHE_KEY_PREFIX = 'hatim:';

export function getHatimCacheKey(userId: string, date: string): string {
  return `${CACHE_KEY_PREFIX}${userId}-${date}`;
}

export async function loadHatimDataFromCache(key: string): Promise<HatimCacheEntry['data'] | null> {
  const entry = await loadHatimCache(key);
  return entry?.data ?? null;
}

export async function saveHatimDataToCache(
  userId: string,
  date: string,
  data: HatimCacheEntry['data']
): Promise<void> {
  const key = getHatimCacheKey(userId, date);
  await saveHatimCache({ key, date, data });
}

export async function queueHatimWrite(entry: Omit<SyncQueueEntry, 'id' | 'timestamp'>): Promise<void> {
  await addToSyncQueue(entry);
}

export async function syncHatimQueue(): Promise<{ synced: number; failed: number }> {
  const queue = await getSyncQueue();
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      switch (item.table) {
        case 'daily_reading_votes': {
          if (item.operation === 'upsert') {
            const p = item.payload as { group_id: string; date: string; user_id: string; vote: string[] };
            const { error } = await supabase.from('daily_reading_votes').upsert(
              { group_id: p.group_id, date: p.date, user_id: p.user_id, vote: p.vote, updated_at: new Date().toISOString() },
              { onConflict: 'group_id,date,user_id' }
            );
            if (error) throw error;
          } else if (item.operation === 'delete') {
            const p = item.payload as { group_id: string; date: string; user_id: string };
            const { error } = await supabase
              .from('daily_reading_votes')
              .delete()
              .eq('group_id', p.group_id)
              .eq('date', p.date)
              .eq('user_id', p.user_id);
            if (error) throw error;
          }
          break;
        }
        case 'daily_reading_status': {
          if (item.operation === 'update') {
            const p = item.payload as { id: string; is_completed?: boolean; audio_urls?: string[]; audio_url?: string | null };
            const { id, ...updates } = p;
            const { error } = await supabase.from('daily_reading_status').update(updates).eq('id', id);
            if (error) throw error;
          }
          break;
        }
        case 'reading_activity_logs': {
          if (item.operation === 'insert') {
            const p = item.payload as Record<string, unknown>;
            const { error } = await supabase.from('reading_activity_logs').insert(p);
            if (error) throw error;
          }
          break;
        }
        case 'quran_instance_tracking': {
          if (item.operation === 'insert') {
            const p = item.payload as {
              user_id: string;
              slot_id: string;
              started_at: string;
              ended_at: string;
              duration_ms: number;
              pages_read: number;
              ayahs_read: number;
            };
            const { error } = await supabase.from('quran_instance_tracking').insert(p);
            if (error) throw error;
          }
          break;
        }
        default:
          failed += 1;
          continue;
      }
      await removeSyncQueueEntry(item.id);
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  return { synced, failed };
}
