/**
 * Surah-Kahf-Fenster: VON (Tag + Uhrzeit) bis BIS (Tag + Uhrzeit)
 */

import { supabase } from './supabase';

export interface KahfWindowConfig {
  startDay: number; // 0=Sonntag, 1=Mo, …, 6=Samstag
  startTime: string; // HH:mm
  endDay: number;
  endTime: string;
}

const DEFAULT_CONFIG: KahfWindowConfig = {
  startDay: 4, // Donnerstag
  startTime: '19:30',
  endDay: 5, // Freitag
  endTime: '19:30',
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { value: KahfWindowConfig; fetchedAt: number } | null = null;

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function toMinutesSinceWeekStart(day: number, timeStr: string): number {
  return day * 24 * 60 + parseTime(timeStr);
}

export async function getKahfWindow(): Promise<KahfWindowConfig> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.value;
  }
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['kahf_start_day', 'kahf_start_time', 'kahf_end_day', 'kahf_end_time', 'maghrib_time']);
    if (error) return DEFAULT_CONFIG;
    const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
    const legacyTime = /^\d{1,2}:\d{2}$/.test(String(map.maghrib_time || '')) ? String(map.maghrib_time) : null;
    const startDay = map.kahf_start_day != null ? parseInt(String(map.kahf_start_day), 10) : (legacyTime ? 4 : DEFAULT_CONFIG.startDay);
    const endDay = map.kahf_end_day != null ? parseInt(String(map.kahf_end_day), 10) : (legacyTime ? 5 : DEFAULT_CONFIG.endDay);
    const startTime = /^\d{1,2}:\d{2}$/.test(String(map.kahf_start_time || '')) ? String(map.kahf_start_time) : (legacyTime ?? DEFAULT_CONFIG.startTime);
    const endTime = /^\d{1,2}:\d{2}$/.test(String(map.kahf_end_time || '')) ? String(map.kahf_end_time) : (legacyTime ?? DEFAULT_CONFIG.endTime);
    const value: KahfWindowConfig = {
      startDay: Number.isFinite(startDay) && startDay >= 0 && startDay <= 6 ? startDay : DEFAULT_CONFIG.startDay,
      startTime,
      endDay: Number.isFinite(endDay) && endDay >= 0 && endDay <= 6 ? endDay : DEFAULT_CONFIG.endDay,
      endTime,
    };
    cache = { value, fetchedAt: Date.now() };
    return value;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function setKahfWindow(config: KahfWindowConfig): Promise<{ error: string | null }> {
  if (!/^\d{1,2}:\d{2}$/.test(config.startTime) || !/^\d{1,2}:\d{2}$/.test(config.endTime)) {
    return { error: 'Ungültiges Zeitformat. Verwende HH:mm (z.B. 19:30)' };
  }
  if (config.startDay < 0 || config.startDay > 6 || config.endDay < 0 || config.endDay > 6) {
    return { error: 'Tag muss 0–6 sein (So–Sa)' };
  }
  try {
    const rows = [
      { key: 'kahf_start_day', value: String(config.startDay), updated_at: new Date().toISOString() },
      { key: 'kahf_start_time', value: config.startTime, updated_at: new Date().toISOString() },
      { key: 'kahf_end_day', value: String(config.endDay), updated_at: new Date().toISOString() },
      { key: 'kahf_end_time', value: config.endTime, updated_at: new Date().toISOString() },
    ];
    for (const row of rows) {
      const { error } = await supabase.from('app_settings').upsert(row, { onConflict: 'key' });
      if (error) return { error: error.message };
    }
    cache = null;
    return { error: null };
  } catch (e) {
    return { error: String(e) };
  }
}

/**
 * Prüft, ob das Kahf-Fenster aktiv ist (aktueller Zeitpunkt liegt zwischen VON und BIS).
 */
export async function isKahfWindowActive(): Promise<boolean> {
  const cfg = await getKahfWindow();
  return isKahfWindowActiveSync(cfg);
}

export function isKahfWindowActiveSync(cfg: KahfWindowConfig): boolean {
  const now = new Date();
  const dow = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const current = dow * 24 * 60 + currentMinutes;
  const start = toMinutesSinceWeekStart(cfg.startDay, cfg.startTime);
  const end = toMinutesSinceWeekStart(cfg.endDay, cfg.endTime);

  if (start <= end) {
    return current >= start && current < end;
  }
  return current >= start || current < end;
}

/**
 * Verbleibende Millisekunden bis zum Ende des Kahf-Fensters.
 * Gibt null zurück, wenn das Fenster nicht aktiv ist.
 */
export function getKahfRemainingMsSync(cfg: KahfWindowConfig): number | null {
  if (!isKahfWindowActiveSync(cfg)) return null;
  const now = new Date();
  const dow = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [endH, endM] = cfg.endTime.split(':').map(Number);

  // Nächstes Ende: endDay um endTime
  let endDate = new Date(now);
  endDate.setHours(endH ?? 0, endM ?? 0, 0, 0);
  const daysUntilEnd = (cfg.endDay - dow + 7) % 7;
  if (daysUntilEnd > 0) {
    endDate.setDate(endDate.getDate() + daysUntilEnd);
  } else if (daysUntilEnd === 0 && currentMinutes >= (endH ?? 0) * 60 + (endM ?? 0)) {
    endDate.setDate(endDate.getDate() + 7);
  }
  return Math.max(0, endDate.getTime() - now.getTime());
}
