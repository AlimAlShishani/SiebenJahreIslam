import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, BookText, Plus, Trash2, Pencil } from 'lucide-react';
import { getSurahList, type SurahMeta } from '../lib/quranApi';

const CUSTOM_SLOTS_STORAGE_KEY = 'quran-reader-custom-slots';
const FREE_LABEL_STORAGE_KEY = 'quran-reader-free-label';
const LAST_LOCATION_PREFIX = 'quran-reader-last-location-';

type LastLocation = {
  page?: number;
  surah?: number;
  ayah?: number;
  juz?: number;
};

export interface QuranReaderSlot {
  id: string;
  label: string;
  createdAt: number;
  expiresAt: number | null;
}

function loadCustomSlots(): QuranReaderSlot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_SLOTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    const slots = parsed
      .filter((item: any) => item && typeof item === 'object' && typeof item.id === 'string' && typeof item.label === 'string')
      .map((item: any) => ({
        id: item.id,
        label: item.label,
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : 0,
        expiresAt: typeof item.expiresAt === 'number' ? item.expiresAt : null,
      }))
      .filter((s) => s.expiresAt === null || s.expiresAt > now);
    if (slots.length < parsed.length) {
      try {
        window.localStorage.setItem(CUSTOM_SLOTS_STORAGE_KEY, JSON.stringify(slots));
      } catch {
        // ignore
      }
    }
    return slots;
  } catch {
    return [];
  }
}

function saveCustomSlots(slots: QuranReaderSlot[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CUSTOM_SLOTS_STORAGE_KEY, JSON.stringify(slots));
  } catch {
    // ignore
  }
}

function getLastLocation(slotId: string): LastLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${LAST_LOCATION_PREFIX}${slotId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastLocation;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function getFreeLabel(): string {
  if (typeof window === 'undefined') return 'Quran lesen (frei)';
  return window.localStorage.getItem(FREE_LABEL_STORAGE_KEY) || 'Quran lesen (frei)';
}

function formatRemaining(expiresAt: number | null): string {
  if (expiresAt === null) return 'Unendlich';
  const ms = expiresAt - Date.now();
  if (ms <= 0) return 'Abgelaufen';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const w = Math.floor(d / 7);
  const mo = Math.floor(d / 30);
  if (mo >= 1) return `${mo} Monat${mo !== 1 ? 'e' : ''}`;
  if (w >= 1) return `${w} Woche${w !== 1 ? 'n' : ''}`;
  if (d >= 1) return `${d} Tag${d !== 1 ? 'e' : ''}`;
  if (h >= 1) return `${h} Stunde${h !== 1 ? 'n' : ''}`;
  if (m >= 1) return `${m} Minute${m !== 1 ? 'n' : ''}`;
  return 'weniger als 1 Min.';
}

export default function QuranMenu() {
  const navigate = useNavigate();
  const [customSlots, setCustomSlots] = useState<QuranReaderSlot[]>(loadCustomSlots);
  const [freeLabel, setFreeLabel] = useState(getFreeLabel);
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlotLabel, setNewSlotLabel] = useState('');
  const [newSlotMonths, setNewSlotMonths] = useState('');
  const [newSlotWeeks, setNewSlotWeeks] = useState('');
  const [newSlotDays, setNewSlotDays] = useState('');
  const [newSlotHours, setNewSlotHours] = useState('');
  const [newSlotInfinite, setNewSlotInfinite] = useState(true);

  useEffect(() => {
    getSurahList().then(setSurahs).catch(() => setSurahs([]));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(FREE_LABEL_STORAGE_KEY, freeLabel);
  }, [freeLabel]);

  const lastFree = getLastLocation('free');
  const surahName = (surahNum: number) => surahs.find((s) => s.number === surahNum)?.englishName ?? `Sure ${surahNum}`;

  const removeSlot = (id: string) => {
    const updated = customSlots.filter((s) => s.id !== id);
    setCustomSlots(updated);
    saveCustomSlots(updated);
  };

  const updateSlotLabel = (id: string, label: string) => {
    const updated = customSlots.map((s) => (s.id === id ? { ...s, label } : s));
    setCustomSlots(updated);
    saveCustomSlots(updated);
    setEditingLabelId(null);
  };

  const saveNewSlot = () => {
    const label = (newSlotLabel || `Leseplatz ${customSlots.length + 2}`).trim();
    let expiresAt: number | null = null;
    if (!newSlotInfinite) {
      const months = Math.max(0, parseInt(newSlotMonths, 10) || 0);
      const weeks = Math.max(0, parseInt(newSlotWeeks, 10) || 0);
      const days = Math.max(0, parseInt(newSlotDays, 10) || 0);
      const hours = Math.max(0, parseInt(newSlotHours, 10) || 0);
      const totalMs =
        months * 30 * 24 * 60 * 60 * 1000 +
        weeks * 7 * 24 * 60 * 60 * 1000 +
        days * 24 * 60 * 60 * 1000 +
        hours * 60 * 60 * 1000;
      if (totalMs > 0) expiresAt = Date.now() + totalMs;
    }
    const next: QuranReaderSlot = {
      id: crypto.randomUUID(),
      label,
      createdAt: Date.now(),
      expiresAt,
    };
    const updated = [...customSlots, next];
    setCustomSlots(updated);
    saveCustomSlots(updated);
    setShowAddForm(false);
    setNewSlotLabel('');
    setNewSlotMonths('');
    setNewSlotWeeks('');
    setNewSlotDays('');
    setNewSlotHours('');
    setNewSlotInfinite(true);
    navigate(`/quran/read?slot=${encodeURIComponent(next.id)}`);
  };

  const statusLine = (slotId: string) => {
    const loc = getLastLocation(slotId);
    if (!loc?.surah || !loc?.ayah) return null;
    const left = `${surahName(loc.surah)} : ${loc.ayah}`;
    const page = loc.page ?? '?';
    const juz = loc.juz ?? '?';
    const right = `Seite ${page} | Juz ${juz}`;
    return { left, right };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-6">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center text-emerald-800 dark:text-emerald-200">Quran</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Wähle, wie du lesen möchtest. Jeder Eintrag merkt sich deine letzte Stelle.
        </p>

        <div className="space-y-3">
          <Link
            to="/hatim?openReader=1"
            className="flex items-center gap-3 w-full p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800 shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <BookOpen className="text-emerald-700 dark:text-emerald-300" size={22} />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="font-semibold text-gray-900 dark:text-gray-100">Hatim Reader</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Öffnet direkt deinen Part an der Startseite (speichert getrennt)</div>
            </div>
          </Link>

          {/* Free slot: umbenennbar + Speicherstatus */}
          <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            <Link
              to="/quran/read?slot=free"
              className="flex items-center gap-3 w-full p-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <BookText className="text-emerald-700 dark:text-emerald-300" size={22} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{freeLabel}</div>
                {lastFree?.surah && lastFree?.ayah ? (
                  <div className="flex justify-between items-baseline gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <span>{surahName(lastFree.surah)} : {lastFree.ayah}</span>
                    <span className="shrink-0">Seite {lastFree.page ?? '?'} | Juz {lastFree.juz ?? '?'}</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Noch nicht gelesen</div>
                )}
              </div>
            </Link>
            <div className="px-4 pb-3 flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setEditingLabelId('free');
                  setEditingLabelValue(freeLabel);
                }}
                className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Pencil size={12} /> Umbenennen
              </button>
            </div>
            {editingLabelId === 'free' && (
              <div className="px-4 pb-3 flex gap-2">
                <input
                  type="text"
                  value={editingLabelValue}
                  onChange={(e) => setEditingLabelValue(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm"
                  placeholder="Name"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFreeLabel(editingLabelValue.trim() || 'Quran lesen (frei)');
                    setEditingLabelId(null);
                  }}
                  className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs"
                >
                  Speichern
                </button>
              </div>
            )}
          </div>

          {customSlots.map((slot) => {
            const status = statusLine(slot.id);
            const isEditing = editingLabelId === slot.id;
            return (
              <div
                key={slot.id}
                className="rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm overflow-hidden"
              >
                <div className="flex items-center gap-3 w-full p-4">
                  <Link
                    to={`/quran/read?slot=${encodeURIComponent(slot.id)}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <BookText className="text-gray-600 dark:text-gray-300" size={22} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{slot.label}</div>
                      {status ? (
                        <div className="flex justify-between items-baseline gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span>{status.left}</span>
                          <span className="shrink-0">{status.right}</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Noch nicht gelesen</div>
                      )}
                      <div className="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5">
                        Verbleibend: {formatRemaining(slot.expiresAt)}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingLabelId(slot.id);
                        setEditingLabelValue(slot.label);
                      }}
                      className="p-2 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      aria-label="Umbenennen"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        removeSlot(slot.id);
                      }}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label="Leseplatz entfernen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <div className="px-4 pb-3 flex gap-2">
                    <input
                      type="text"
                      value={editingLabelValue}
                      onChange={(e) => setEditingLabelValue(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => updateSlotLabel(slot.id, editingLabelValue.trim() || slot.label)}
                      className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs"
                    >
                      Speichern
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {showAddForm ? (
            <div className="rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-600 bg-white dark:bg-gray-800 p-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                value={newSlotLabel}
                onChange={(e) => setNewSlotLabel(e.target.value)}
                placeholder={`Leseplatz ${customSlots.length + 2}`}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              />
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Löscht sich nach</div>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={newSlotInfinite}
                  onChange={() => setNewSlotInfinite(true)}
                />
                <span>Unendlich (bis du sie löschst)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!newSlotInfinite}
                  onChange={() => setNewSlotInfinite(false)}
                />
                <span>Zeitraum:</span>
              </label>
              {!newSlotInfinite && (
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={newSlotMonths}
                      onChange={(e) => setNewSlotMonths(e.target.value)}
                      className="w-14 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1 py-0.5 text-center"
                    />
                    Monate
                  </span>
                  <span className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={newSlotWeeks}
                      onChange={(e) => setNewSlotWeeks(e.target.value)}
                      className="w-14 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1 py-0.5 text-center"
                    />
                    Wochen
                  </span>
                  <span className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={newSlotDays}
                      onChange={(e) => setNewSlotDays(e.target.value)}
                      className="w-14 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1 py-0.5 text-center"
                    />
                    Tage
                  </span>
                  <span className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={newSlotHours}
                      onChange={(e) => setNewSlotHours(e.target.value)}
                      className="w-14 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1 py-0.5 text-center"
                    />
                    Stunden
                  </span>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSlotLabel('');
                    setNewSlotMonths('');
                    setNewSlotWeeks('');
                    setNewSlotDays('');
                    setNewSlotHours('');
                    setNewSlotInfinite(true);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={saveNewSlot}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm"
                >
                  Erstellen & öffnen
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <Plus size={20} />
              <span>Neuer Leseplatz</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
