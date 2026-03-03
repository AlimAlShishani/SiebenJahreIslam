import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, BookText, Plus, Trash2 } from 'lucide-react';

const CUSTOM_SLOTS_STORAGE_KEY = 'quran-reader-custom-slots';

export interface QuranReaderSlot {
  id: string;
  label: string;
}

function loadCustomSlots(): QuranReaderSlot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_SLOTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is QuranReaderSlot =>
        item && typeof item === 'object' && typeof (item as any).id === 'string' && typeof (item as any).label === 'string'
    );
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

export default function QuranMenu() {
  const navigate = useNavigate();
  const [customSlots, setCustomSlots] = useState<QuranReaderSlot[]>(loadCustomSlots);

  const addSlot = () => {
    const next = { id: crypto.randomUUID(), label: `Leseplatz ${customSlots.length + 2}` };
    const updated = [...customSlots, next];
    setCustomSlots(updated);
    saveCustomSlots(updated);
    navigate(`/quran/read?slot=${encodeURIComponent(next.id)}`);
  };

  const removeSlot = (id: string) => {
    const updated = customSlots.filter((s) => s.id !== id);
    setCustomSlots(updated);
    saveCustomSlots(updated);
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

          <Link
            to="/quran/read?slot=free"
            className="flex items-center gap-3 w-full p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800 shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <BookText className="text-emerald-700 dark:text-emerald-300" size={22} />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="font-semibold text-gray-900 dark:text-gray-100">Quran lesen (frei)</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Einfach durchblättern, Fortschritt wird gespeichert</div>
            </div>
          </Link>

          {customSlots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center gap-3 w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm"
            >
              <Link
                to={`/quran/read?slot=${encodeURIComponent(slot.id)}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <BookText className="text-gray-600 dark:text-gray-300" size={22} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{slot.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Eigener Leseplatz</div>
                </div>
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  removeSlot(slot.id);
                }}
                className="flex-shrink-0 p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                aria-label="Leseplatz entfernen"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addSlot}
            className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <Plus size={20} />
            <span>Neuer Leseplatz</span>
          </button>
        </div>
      </div>
    </div>
  );
}
