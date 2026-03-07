import { supabase } from './supabase';

export type TrackingPeriod = 'today' | 'week' | 'month' | 'alltime';

export interface InstanceTrackingSessionInput {
  startedAt: string;
  endedAt: string;
  durationMs: number;
  pagesRead: number;
  ayahsRead: number;
}

export interface InstanceTrackingStats {
  pages: number;
  ayahs: number;
  durationMs: number;
}

function getEffectiveTodayDate(): Date {
  const now = new Date();
  if (now.getHours() < 2) {
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 1);
    return prev;
  }
  return now;
}

function getTodayStartAt2(date: Date): Date {
  const start = new Date(date);
  start.setHours(2, 0, 0, 0);
  return start;
}

function getRangeStart(period: TrackingPeriod): Date | null {
  if (period === 'alltime') return null;

  if (period === 'today') {
    return getTodayStartAt2(getEffectiveTodayDate());
  }

  const now = new Date();
  if (period === 'week') {
    const start = new Date(now);
    const day = start.getDay(); // 0=So,1=Mo...
    const diffToMonday = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  const start = new Date(now);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function clampNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export async function recordInstanceTrackingSession(
  userId: string,
  slotId: string,
  session: InstanceTrackingSessionInput
): Promise<void> {
  if (!userId || !slotId) return;
  const durationMs = clampNonNegativeInt(session.durationMs);
  const pagesRead = clampNonNegativeInt(session.pagesRead);
  const ayahsRead = clampNonNegativeInt(session.ayahsRead);
  if (durationMs <= 0) return;

  await supabase.from('quran_instance_tracking').insert({
    user_id: userId,
    slot_id: slotId,
    started_at: session.startedAt,
    ended_at: session.endedAt,
    duration_ms: durationMs,
    pages_read: pagesRead,
    ayahs_read: ayahsRead,
  });
}

export async function getInstanceTrackingStats(
  userId: string,
  slotId: string | 'all',
  period: TrackingPeriod
): Promise<InstanceTrackingStats> {
  if (!userId) return { pages: 0, ayahs: 0, durationMs: 0 };

  const rangeStart = getRangeStart(period);
  let query = supabase
    .from('quran_instance_tracking')
    .select('pages_read, ayahs_read, duration_ms')
    .eq('user_id', userId);

  if (slotId !== 'all') {
    query = query.eq('slot_id', slotId);
  }
  if (rangeStart) {
    query = query.gte('started_at', rangeStart.toISOString());
  }

  const { data, error } = await query;
  if (error || !data) return { pages: 0, ayahs: 0, durationMs: 0 };

  return data.reduce<InstanceTrackingStats>(
    (acc, row: { pages_read: number | null; ayahs_read: number | null; duration_ms: number | null }) => {
      acc.pages += clampNonNegativeInt(row.pages_read ?? 0);
      acc.ayahs += clampNonNegativeInt(row.ayahs_read ?? 0);
      acc.durationMs += clampNonNegativeInt(row.duration_ms ?? 0);
      return acc;
    },
    { pages: 0, ayahs: 0, durationMs: 0 }
  );
}
