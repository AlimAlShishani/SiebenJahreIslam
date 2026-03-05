/**
 * Shared slot config loading for QuranReader.
 */
import { formatGoalLabel } from './readingGoal';

const CUSTOM_SLOTS_STORAGE_KEY = 'quran-reader-custom-slots';

export interface SlotGoalConfig {
  goalStartPage: number;
  goalEndPage: number;
  goalLabel: string;
}

function parseGoalLabel(goal: { from: number; to: number; unit: string }): string {
  return formatGoalLabel(goal as { from: number; to: number; unit: 'juz' | 'page' | 'aya' });
}

/** Lädt Slot-Config für Custom-Slots (goal, start/end page). */
export function getSlotGoalConfig(slotId: string): SlotGoalConfig | null {
  if (typeof window === 'undefined') return null;
  if (slotId === 'hatim' || slotId === 'free' || slotId === 'kahf') return null;
  try {
    const raw = window.localStorage.getItem(CUSTOM_SLOTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const item = parsed.find((s: any) => s?.id === slotId);
    if (!item?.goal || !Number.isFinite(item.goalStartPage) || !Number.isFinite(item.goalEndPage)) return null;
    return {
      goalStartPage: item.goalStartPage,
      goalEndPage: item.goalEndPage,
      goalLabel: parseGoalLabel(item.goal),
    };
  } catch {
    return null;
  }
}
