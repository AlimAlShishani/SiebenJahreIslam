import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { VideoInput } from '../components/VideoInput';
import { AudioInput } from '../components/AudioInput';
import { Edit2, ChevronDown, ChevronUp, Save, X, Trash2 } from 'lucide-react';
import { ClickableArabicVerse } from '../components/ClickableArabicVerse';

function isYouTubeUrl(url: string | null): boolean {
  if (!url) return false;
  return /youtube\.com\/watch|youtu\.be\//i.test(url);
}

interface Option {
  id: string;
  text: string;
  is_correct: boolean;
  audio_url: string | null;
}

interface LearningLevel {
  id: number;
  level_number: number;
  title: string;
  description: string | null;
  intro_video_url: string | null;
}

interface MaddClickOptions {
  task_type?: 'madd_click';
  correct_madd_indices: number[];
}

interface LearningItem {
  id: string;
  level_id: number;
  content: string;
  transliteration: string | null;
  order_index: number;
  options?: Option[] | MaddClickOptions | null;
}

export default function Admin() {
  const [message, setMessage] = useState('');
  const [levels, setLevels] = useState<LearningLevel[]>([]);
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<LearningItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [savingVideo, setSavingVideo] = useState<number | null>(null);
  const [youtubeUrlDraft, setYoutubeUrlDraft] = useState<Record<number, string>>({});

  const itemsByLevel = useMemo(() => {
    const map: Record<number, LearningItem[]> = {};
    for (const item of items) {
      if (!map[item.level_id]) map[item.level_id] = [];
      map[item.level_id].push(item);
    }
    Object.keys(map).forEach((k) => map[Number(k)].sort((a, b) => a.order_index - b.order_index));
    return map;
  }, [items]);

  const fetchData = async () => {
    const [levelsRes, itemsRes] = await Promise.all([
      supabase.from('learning_levels').select('id, level_number, title, description, intro_video_url').order('level_number'),
      supabase.from('learning_items').select('id, level_id, content, transliteration, order_index, options').order('level_id').order('order_index'),
    ]);
    if (levelsRes.error) console.error('Error fetching levels:', levelsRes.error);
    else setLevels(levelsRes.data || []);
    if (itemsRes.error) console.error('Error fetching items:', itemsRes.error);
    else setItems(itemsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLevelVideoChange = async (levelNumber: number, url: string | null) => {
    setSavingVideo(levelNumber);
    const { error } = await supabase
      .from('learning_levels')
      .update({ intro_video_url: url })
      .eq('level_number', levelNumber);
    setSavingVideo(null);
    if (error) {
      setMessage('Fehler beim Speichern des Videos: ' + error.message);
    } else {
      setLevels((prev) => prev.map((l) => (l.level_number === levelNumber ? { ...l, intro_video_url: url } : l)));
      setMessage('');
    }
  };

  const handleDeleteItem = async (item: LearningItem) => {
    if (!confirm(`Aufgabe wirklich löschen?\n\n„${item.content.slice(0, 50)}${item.content.length > 50 ? '…' : ''}"`)) return;
    setDeletingItemId(item.id);
    const { error } = await supabase.from('learning_items').delete().eq('id', item.id);
    setDeletingItemId(null);
    if (error) {
      setMessage('Fehler beim Löschen: ' + error.message);
    } else {
      fetchData();
      setMessage('Aufgabe gelöscht.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const resetMyProgress = async () => {
    if (!confirm('ACHTUNG: Dein gesamter Lernfortschritt wird gelöscht. Fortfahren?')) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('user_progress').delete().eq('user_id', user.id);
    if (error) setMessage('Fehler beim Zurücksetzen: ' + error.message);
    else setMessage('Dein Fortschritt wurde zurückgesetzt.');
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mb-6">Admin Dashboard</h2>

      {message && (
        <div
          className={`p-4 mb-6 rounded-lg ${message.includes('Fehler') ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}`}
        >
          {message}
        </div>
      )}

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Lernstufen</h3>
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Laden...</p>
        ) : levels.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Keine Stufen. Führe <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">09_seed_new_levels.sql</code> aus.
          </p>
        ) : (
          <ul className="space-y-2">
            {levels.map((l) => {
              const levelItems = itemsByLevel[l.level_number] || [];
              const isExpanded = expandedLevel === l.level_number;
              return (
                <li
                  key={l.id}
                  className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 py-2 px-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    onClick={() => setExpandedLevel(isExpanded ? null : l.level_number)}
                  >
                    <button type="button" className="p-0.5 text-gray-500">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 w-8">{l.level_number}.</span>
                    <span className="text-gray-800 dark:text-gray-100 flex-1">{l.title}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {levelItems.length} {levelItems.length === 1 ? 'Aufgabe' : 'Aufgaben'}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-600 p-4 space-y-6">
                      {/* Stufen-Video: Supabase oder YouTube (ungelisteter Link) */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Intro-Video (wird zuerst in der Stufe gezeigt)</h4>
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">YouTube (ungelisteter Link)</label>
                          <input
                            type="url"
                            value={youtubeUrlDraft[l.level_number] ?? (isYouTubeUrl(l.intro_video_url) ? l.intro_video_url! : '')}
                            onChange={(e) => setYoutubeUrlDraft((prev) => ({ ...prev, [l.level_number]: e.target.value }))}
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (!v || /youtube\.com|youtu\.be/i.test(v)) {
                                handleLevelVideoChange(l.level_number, v || null);
                                setYoutubeUrlDraft((prev) => ({ ...prev, [l.level_number]: '' }));
                              }
                            }}
                            placeholder="https://www.youtube.com/watch?v=… oder https://youtu.be/…"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Oder Video von Supabase unten hochladen / auswählen.</p>
                        </div>
                        {!isYouTubeUrl(l.intro_video_url) && (
                          <>
                            <VideoInput
                              label="Video aus Supabase"
                              currentUrl={l.intro_video_url}
                              onVideoChange={(url) => handleLevelVideoChange(l.level_number, url)}
                            />
                            {savingVideo === l.level_number && (
                              <p className="text-xs text-gray-500 mt-1">Speichern…</p>
                            )}
                          </>
                        )}
                        {isYouTubeUrl(l.intro_video_url) && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">YouTube-Link wird verwendet. Leer lassen und Supabase nutzen, um wieder hochzuladen.</p>
                        )}
                      </div>

                      {/* Aufgabenliste mit Bearbeiten */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Aufgaben</h4>
                        <ul className="space-y-2 max-h-64 overflow-y-auto">
                          {levelItems.map((it, idx) => (
                            <li
                              key={it.id}
                              className="flex items-center gap-2 text-sm py-2 px-3 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600"
                            >
                              <span className="text-gray-500 w-6">{idx + 1}.</span>
                              <span className="font-arabic text-lg flex-1" dir="rtl">
                                {it.content}
                              </span>
                              <span className="text-gray-600 dark:text-gray-300 truncate max-w-[180px]">
                                {it.transliteration || '–'}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItem(it);
                                }}
                                className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                title="Aufgabe bearbeiten"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(it);
                                }}
                                disabled={deletingItemId === it.id}
                                className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                                title="Aufgabe löschen"
                              >
                                <Trash2 size={16} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {!isExpanded && levelItems.length > 0 && (
                    <ul className="border-t border-gray-200 dark:border-gray-600 bg-gray-100/50 dark:bg-gray-900/50 px-3 py-2 space-y-1 max-h-32 overflow-y-auto">
                      {levelItems.slice(0, 5).map((it, idx) => (
                        <li key={it.id} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 w-6">{idx + 1}.</span>
                          <span className="font-arabic text-lg" dir="rtl" title={it.transliteration || ''}>
                            {it.content}
                          </span>
                          {it.transliteration && (
                            <span className="text-gray-600 dark:text-gray-300 truncate">{it.transliteration}</span>
                          )}
                        </li>
                      ))}
                      {levelItems.length > 5 && (
                        <li className="text-xs text-gray-400">… und {levelItems.length - 5} weitere (Stufe aufklappen)</li>
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editingItem && (
        editingItem.level_id === 8 ? (
          <EditMaddItemModal
            key={editingItem.id}
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSaved={() => {
              fetchData();
              setEditingItem(null);
              setMessage('Aufgabe gespeichert.');
              setTimeout(() => setMessage(''), 3000);
            }}
          />
        ) : (
          <EditItemModal
            key={editingItem.id}
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSaved={() => {
              fetchData();
              setEditingItem(null);
              setMessage('Aufgabe gespeichert.');
              setTimeout(() => setMessage(''), 3000);
            }}
          />
        )
      )}

      <button
        onClick={resetMyProgress}
        className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-300 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
      >
        Mein Fortschritt zurücksetzen
      </button>
    </div>
  );
}

function getMaddCorrectIndices(raw: unknown): number[] {
  if (raw && typeof raw === 'object' && 'correct_madd_indices' in raw && Array.isArray((raw as MaddClickOptions).correct_madd_indices)) {
    return [...(raw as MaddClickOptions).correct_madd_indices].sort((a, b) => a - b);
  }
  return [];
}

function EditMaddItemModal({
  item,
  onClose,
  onSaved,
}: {
  item: LearningItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [content, setContent] = useState(item.content);
  const [correctIndices, setCorrectIndices] = useState<Set<number>>(() => new Set(getMaddCorrectIndices(item.options)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(item.content);
    setCorrectIndices(new Set(getMaddCorrectIndices(item.options)));
  }, [item.id, item.content, item.options]);

  const toggleMaddIndex = (letterIndex: number) => {
    setCorrectIndices((prev) => {
      const next = new Set(prev);
      if (next.has(letterIndex)) next.delete(letterIndex);
      else next.add(letterIndex);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const options: MaddClickOptions = {
      task_type: 'madd_click',
      correct_madd_indices: [...correctIndices].sort((a, b) => a - b),
    };
    const { error } = await supabase
      .from('learning_items')
      .update({
        content: content.trim() || item.content,
        transliteration: null,
        options,
      })
      .eq('id', item.id);
    setSaving(false);
    if (error) {
      alert('Fehler beim Speichern: ' + error.message);
    } else {
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Madd-Aufgabe (Stufe 8)</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Quran-Abschnitt (arabischer Text)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xl font-arabic"
              dir="rtl"
              placeholder="Vers oder Abschnitt einfügen…"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Klicke die Buchstaben an, die als <strong>richtige</strong> Madd-Buchstaben gelten sollen (diese Auswahl wird beim Lernenden als korrekt gewertet).
            </label>
            <div className="min-h-[120px] py-4 px-2 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <ClickableArabicVerse
                content={content}
                selectedIndices={correctIndices}
                onToggle={toggleMaddIndex}
                selectedClassName="bg-emerald-400/40 dark:bg-emerald-500/45"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ausgewählt: {correctIndices.size} Buchstabe(n). Indizes: {[...correctIndices].sort((a,b)=>a-b).join(', ') || '–'}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-600">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Abbrechen
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50">
            <Save size={16} /> {saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}

function normalizeOptions(raw: unknown): Option[] {
  let arr: any[] = [];
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw);
    } catch {
      arr = [];
    }
  } else if (Array.isArray(raw)) {
    arr = raw;
  }
  if (!arr.length) {
    return [
      { id: '1', text: '', is_correct: true, audio_url: null },
      { id: '2', text: '', is_correct: false, audio_url: null },
      { id: '3', text: '', is_correct: false, audio_url: null },
    ];
  }
  return arr.slice(0, 10).map((o: any, i: number) => ({
    id: String(o?.id ?? i + 1),
    text: String(o?.text ?? o?.Text ?? ''),
    is_correct: Boolean(o?.is_correct),
    audio_url: o?.audio_url ?? null,
  }));
}

function EditItemModal({
  item,
  onClose,
  onSaved,
}: {
  item: LearningItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [content, setContent] = useState(item.content);
  const [options, setOptions] = useState<Option[]>(() => normalizeOptions(item.options));
  const [saving, setSaving] = useState(false);

  // Beim Öffnen (oder Wechsel der Aufgabe) Optionen aus item laden, damit die Textfelder gefüllt sind
  useEffect(() => {
    setOptions(normalizeOptions(item.options));
  }, [item.id]);

  const updateOption = (index: number, patch: Partial<Option>) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const correctText = options.find((o) => o.is_correct)?.text?.trim() ?? null;
    const { error } = await supabase
      .from('learning_items')
      .update({
        content: content.trim() || item.content,
        transliteration: correctText,
        options: options.map((o) => ({ id: o.id, text: o.text, is_correct: o.is_correct, audio_url: o.audio_url })),
      })
      .eq('id', item.id);
    setSaving(false);
    if (error) {
      alert('Fehler beim Speichern: ' + error.message);
    } else {
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Aufgabe bearbeiten</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Frage (arabisches Zeichen)</label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-2xl font-arabic text-center"
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Antwortmöglichkeiten</label>
            <div className="space-y-4">
              {options.map((opt, idx) => (
                <div
                  key={opt.id}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateOption(idx, { text: e.target.value })}
                      placeholder="Antworttext"
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <label className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      <input
                        type="radio"
                        name="correct"
                        checked={opt.is_correct}
                        onChange={() => setOptions((prev) => prev.map((o, i) => ({ ...o, is_correct: i === idx })))}
                      />
                      Richtig
                    </label>
                  </div>
                  <AudioInput
                    label={`Audio für „${opt.text || 'Option ' + (idx + 1)}“`}
                    currentUrl={opt.audio_url}
                    onAudioChange={(_, url) => updateOption(idx, { audio_url: url })}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
