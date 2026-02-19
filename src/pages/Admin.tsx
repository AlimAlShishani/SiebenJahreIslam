import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Edit2, Trash2, X, Music, Plus, CheckCircle, Circle, Bold } from 'lucide-react';
import { AudioInput } from '../components/AudioInput';

interface Option {
  id: string;
  text: string;
  is_correct: boolean;
  audio_url: string | null;
  audioFile?: File | null; // Helper for upload
}

interface LearningItem {
  id: string;
  level_id: number;
  content: string;
  transliteration: string;
  audio_url: string | null;
  order_index: number;
  options?: Option[];
  help_audio_url?: string | null;
  rule_audio_url?: string | null;
}

interface LearningLevel {
  id: number;
  level_number: number;
  title: string;
  description?: string | null;
  modal_content?: string | null;
  modal_audio_url?: string | null;
  modal_audio_urls?: string[] | null;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'popups'>('manage');
  const [level, setLevel] = useState(1);
  const [items, setItems] = useState<LearningItem[]>([]);
  const [levels, setLevels] = useState<LearningLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<LearningItem | null>(null);
  
  // Form States
  const [content, setContent] = useState('');
  const [mainAudioFile, setMainAudioFile] = useState<File | null>(null);
  const [mainAudioUrl, setMainAudioUrl] = useState<string | null>(null);
  const [helpAudioFile, setHelpAudioFile] = useState<File | null>(null);
  const [helpAudioUrl, setHelpAudioUrl] = useState<string | null>(null);
  const [ruleAudioFile, setRuleAudioFile] = useState<File | null>(null);
  const [ruleAudioUrl, setRuleAudioUrl] = useState<string | null>(null);
  
  // Popups tab
  const [popupLevel, setPopupLevel] = useState(1);
  const [modalContent, setModalContent] = useState('');
  const [popupSaving, setPopupSaving] = useState(false);
  const modalContentRef = useRef<HTMLTextAreaElement>(null);
  const [modalAudioList, setModalAudioList] = useState<{ url: string | null; file: File | null }[]>([]);
  
  // Options State
  const [options, setOptions] = useState<Option[]>([
    { id: '1', text: '', is_correct: true, audio_url: null },
    { id: '2', text: '', is_correct: false, audio_url: null },
    { id: '3', text: '', is_correct: false, audio_url: null },
  ]);

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch Levels on Mount
  useEffect(() => {
    const fetchLevels = async () => {
      const { data, error } = await supabase
        .from('learning_levels')
        .select('id, level_number, title, description, modal_content, modal_audio_url, modal_audio_urls')
        .order('level_number');
      if (error) console.error('Error fetching levels:', error);
      else setLevels(data || []);
    };
    fetchLevels();
  }, []);

  // Load popup content when Popups tab and level change
  useEffect(() => {
    if (activeTab !== 'popups') return;
    const l = levels.find((x) => x.level_number === popupLevel);
    if (l) {
      setModalContent(l.modal_content ?? '');
      const urls = l.modal_audio_urls;
      if (urls?.length) {
        setModalAudioList(urls.map((url) => ({ url, file: null })));
      } else if (l.modal_audio_url) {
        setModalAudioList([{ url: l.modal_audio_url, file: null }]);
      } else {
        setModalAudioList([]);
      }
    }
  }, [activeTab, popupLevel, levels]);

  // Fetch Items
  useEffect(() => {
    if (activeTab === 'manage') {
      fetchItems();
    }
  }, [level, activeTab]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('learning_items')
      .select('*')
      .eq('level_id', level)
      .order('order_index');
    
    if (error) console.error('Error fetching items:', error);
    else setItems(data || []);
    setLoading(false);
  };

  const handleOptionChange = (id: string, field: keyof Option, value: any) => {
    setOptions(prev => prev.map(opt => {
      if (opt.id === id) {
        return { ...opt, [field]: value };
      }
      return opt;
    }));
  };

  const handleOptionAudioUpdate = (id: string, file: File | null, url: string | null) => {
    setOptions(prev => prev.map(opt => {
      if (opt.id === id) {
        return { 
          ...opt, 
          audioFile: file,
          audio_url: file ? null : url 
        };
      }
      return opt;
    }));
  };

  const setCorrectOption = (id: string) => {
    setOptions(prev => prev.map(opt => ({
      ...opt,
      is_correct: opt.id === id
    })));
  };

  const addOption = () => {
    setOptions(prev => [...prev, { id: Math.random().toString(), text: '', is_correct: false, audio_url: null }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) {
      alert('Mindestens 2 Optionen sind erforderlich.');
      return;
    }
    setOptions(prev => prev.filter(o => o.id !== id));
  };

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('audio-files')
      .getPublicUrl(filePath);
    
    return publicUrl;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUploading(true);
    setMessage('');

    try {
      // 1. Handle Main Audio
      let finalMainAudioUrl = mainAudioUrl;
      if (mainAudioFile) finalMainAudioUrl = await uploadFile(mainAudioFile);

      // 1b. Help & Rule Audio
      let finalHelpUrl = helpAudioUrl;
      let finalRuleUrl = ruleAudioUrl;
      if (helpAudioFile) finalHelpUrl = await uploadFile(helpAudioFile);
      if (ruleAudioFile) finalRuleUrl = await uploadFile(ruleAudioFile);

      // 2. Handle Option Audios
      const finalOptions = await Promise.all(options.map(async (opt) => {
        let optAudioUrl = opt.audio_url; // Start with current state
        
        // If a new file was selected/recorded for this option, upload it
        if (opt.audioFile) {
          optAudioUrl = await uploadFile(opt.audioFile);
        }
        
        return {
          id: opt.id,
          text: opt.text,
          is_correct: opt.is_correct,
          audio_url: optAudioUrl
        };
      }));

      // Find correct answer text for 'transliteration' column fallback
      const correctOption = finalOptions.find(o => o.is_correct);
      const correctText = correctOption ? correctOption.text : '';

      // 3. Insert or Update Database
      if (editingItem) {
        const { error } = await supabase
          .from('learning_items')
          .update({
            content,
            transliteration: correctText,
            audio_url: finalMainAudioUrl,
            options: finalOptions,
            help_audio_url: finalHelpUrl,
            rule_audio_url: finalRuleUrl
          })
          .eq('id', editingItem.id);
        if (error) throw error;
        setMessage('Eintrag aktualisiert!');
        setMainAudioFile(null);
        setMainAudioUrl(finalMainAudioUrl);
        setHelpAudioFile(null);
        setHelpAudioUrl(finalHelpUrl);
        setRuleAudioFile(null);
        setRuleAudioUrl(finalRuleUrl);
        setOptions(prev => prev.map(o => {
            const matchingFinal = finalOptions.find(fo => fo.id === o.id);
            return {
                ...o,
                audioFile: null,
                audio_url: matchingFinal ? matchingFinal.audio_url : o.audio_url
            };
        }));

      } else {
        const { error } = await supabase
          .from('learning_items')
          .insert({
            level_id: level,
            content,
            transliteration: correctText,
            audio_url: finalMainAudioUrl,
            options: finalOptions,
            help_audio_url: finalHelpUrl,
            rule_audio_url: finalRuleUrl,
            order_index: items.length + 1
          });
        if (error) throw error;
        setMessage('Erfolgreich erstellt!');
        resetForm();
        setActiveTab('manage'); 
      }

      fetchItems();
    } catch (error: any) {
      console.error('Error:', error);
      setMessage('Fehler: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setMainAudioFile(null);
    setMainAudioUrl(null);
    setHelpAudioFile(null);
    setHelpAudioUrl(null);
    setRuleAudioFile(null);
    setRuleAudioUrl(null);
    setOptions([
      { id: '1', text: '', is_correct: true, audio_url: null },
      { id: '2', text: '', is_correct: false, audio_url: null },
      { id: '3', text: '', is_correct: false, audio_url: null },
    ]);
  };

  // Helper to shuffle array
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const startEdit = (item: LearningItem) => {
    setEditingItem(item);
    setContent(item.content);
    setMainAudioFile(null);
    setMainAudioUrl(item.audio_url);
    setHelpAudioFile(null);
    setHelpAudioUrl(item.help_audio_url ?? null);
    setRuleAudioFile(null);
    setRuleAudioUrl(item.rule_audio_url ?? null);
    
    // Load existing options or create defaults if none exist
    if (item.options && Array.isArray(item.options) && item.options.length > 0) {
      setOptions(item.options.map(o => ({ ...o, audioFile: null })));
    } else {
      // Fallback for old items
      const correctOpt: Option = { id: '1', text: item.transliteration, is_correct: true, audio_url: null };
      
      const otherItems = items.filter(i => i.id !== item.id);
      const randomDistractors = shuffleArray(otherItems).slice(0, 2).map((distractorItem, idx) => ({
        id: (idx + 2).toString(),
        text: distractorItem.transliteration,
        is_correct: false,
        audio_url: null
      }));

      while (randomDistractors.length < 2) {
        randomDistractors.push({
          id: (randomDistractors.length + 2).toString(),
          text: '',
          is_correct: false,
          audio_url: null
        });
      }

      setOptions([correctOpt, ...randomDistractors]);
    }
    
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return;
    const { error } = await supabase.from('learning_items').delete().eq('id', id);
    if (error) alert('Fehler beim Löschen');
    else fetchItems();
  };

  const resetMyProgress = async () => {
    if (!confirm('ACHTUNG: Dein gesamter Lernfortschritt wird gelöscht. Fortfahren?')) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      alert('Fehler beim Zurücksetzen: ' + error.message);
    } else {
      alert('Dein Fortschritt wurde erfolgreich zurückgesetzt.');
    }
  };

  const getSuggestedName = (text: string) => {
    if (!text) return undefined;
    const firstPart = text.split(/[ (]/)[0].trim().toLowerCase();
    return `_${firstPart}`;
  };

  const insertAtCursor = (before: string, after?: string) => {
    const ta = modalContentRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = modalContent;
    const newText =
      after === undefined
        ? text.slice(0, start) + before + text.slice(start)
        : text.slice(0, start) + before + (end > start ? text.slice(start, end) : '') + after + text.slice(end);
    setModalContent(newText);
    const newPos = after === undefined ? start + before.length : start + before.length + (end > start ? end - start : 0);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(newPos, newPos); }, 0);
  };

  const wrapSelection = (openTag: string, closeTag: string) => {
    insertAtCursor(openTag, closeTag);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20" data-admin-version="popups-v1">
      <h2 className="text-2xl font-bold text-emerald-800 mb-6">Admin Dashboard</h2>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 justify-between items-center">
        <div className="flex gap-4">
          <button 
            onClick={() => { setActiveTab('manage'); setEditingItem(null); }}
            className={`pb-2 px-4 ${activeTab === 'manage' ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Inhalte verwalten
          </button>
          <button 
            onClick={() => { setActiveTab('create'); resetForm(); }}
            className={`pb-2 px-4 ${activeTab === 'create' ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {editingItem ? 'Bearbeiten' : 'Neu erstellen'}
          </button>
          <button 
            onClick={() => setActiveTab('popups')}
            className={`pb-2 px-4 ${activeTab === 'popups' ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Stufen-Popups
          </button>
        </div>
        
        <button 
          onClick={resetMyProgress}
          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded border border-red-200 transition-colors"
        >
          Mein Fortschritt zurücksetzen
        </button>
      </div>

      {/* Level Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aktuelle Stufe</label>
          <select
          value={level} 
          onChange={(e) => setLevel(parseInt(e.target.value))}
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {levels.length > 0 ? (
            levels.map((l) => (
              <option key={l.id} value={l.level_number}>
                Stufe {l.level_number}: {l.title}
              </option>
            ))
          ) : (
            <option value={1}>Lade Stufen...</option>
          )}
        </select>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-lg ${message.includes('Fehler') ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}`}>
          {message}
        </div>
      )}

      {/* CREATE / EDIT FORM */}
      {activeTab === 'create' && (
        <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-emerald-100 dark:border-gray-600 space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{editingItem ? 'Eintrag bearbeiten' : 'Neuen Eintrag erstellen'}</h3>
            {editingItem && (
              <button type="button" onClick={() => { setEditingItem(null); resetForm(); setActiveTab('manage'); }} className="text-gray-400 hover:text-red-500">
                <X size={20} />
              </button>
            )}
          </div>

          {/* Question Content */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">Frage / Hauptinhalt</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inhalt (Arabisch)</label>
              <input
                type="text"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-quran text-right text-3xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="z.B. ا"
                dir="rtl"
              />
            </div>
            
            {/* Main Audio Input */}
            <AudioInput 
              label="Frage Audio"
              currentUrl={mainAudioUrl}
              onAudioChange={(file, url) => {
                setMainAudioFile(file);
                setMainAudioUrl(url); 
              }}
              onSave={() => handleSave()}
            />
            <AudioInput 
              label="Hilfe-Audio (z. B. für ة beim ersten Vorkommen)"
              currentUrl={helpAudioUrl}
              onAudioChange={(file, url) => {
                setHelpAudioFile(file);
                setHelpAudioUrl(url);
              }}
              onSave={() => handleSave()}
            />
            <AudioInput 
              label="Regel-Audio (z. B. N-Regel bei Stufe 6)"
              currentUrl={ruleAudioUrl}
              onAudioChange={(file, url) => {
                setRuleAudioFile(file);
                setRuleAudioUrl(url);
              }}
              onSave={() => handleSave()}
            />
          </div>

          {/* Answer Options */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Antwortmöglichkeiten</h4>
              <button type="button" onClick={addOption} className="text-sm text-emerald-600 flex items-center gap-1 hover:underline">
                <Plus size={16} /> Option hinzufügen
              </button>
            </div>
            
            <div className="space-y-4">
              {options.map((opt, index) => (
                <div key={opt.id} className={`p-4 rounded-lg border ${opt.is_correct ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'}`}>
                  <div className="flex items-start gap-4">
                    <button 
                      type="button" 
                      onClick={() => setCorrectOption(opt.id)}
                      className={`mt-2 ${opt.is_correct ? 'text-emerald-600' : 'text-gray-300 hover:text-gray-400'}`}
                      title="Als richtige Antwort markieren"
                    >
                      {opt.is_correct ? <CheckCircle size={24} /> : <Circle size={24} />}
                    </button>
                    
                    <div className="flex-grow space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Antwort Text</label>
                        <input
                          type="text"
                          required
                          value={opt.text}
                          onChange={(e) => handleOptionChange(opt.id, 'text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder={`Option ${index + 1}`}
                        />
                      </div>
                      
                      {/* Option Audio Input */}
                      <AudioInput 
                        label="Antwort Audio"
                        currentUrl={opt.audio_url}
                        onAudioChange={(file, url) => handleOptionAudioUpdate(opt.id, file, url)}
                        onSave={() => handleSave()}
                        suggestedName={getSuggestedName(opt.text)}
                      />
                    </div>

                    <button 
                      type="button" 
                      onClick={() => removeOption(opt.id)}
                      className="text-gray-400 hover:text-red-500 mt-2"
                      title="Option entfernen"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-semibold shadow-md"
          >
            {uploading ? 'Speichert...' : <><Save size={20} /> Speichern</>}
          </button>
        </form>
      )}

      {/* POPUPS TAB */}
      {activeTab === 'popups' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-emerald-100 dark:border-gray-600 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Stufen-Popups bearbeiten</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Hier kannst du den Einführungstext (Popup) pro Stufe anpassen. Wenn leer, wird der Standard aus der App verwendet. HTML ist erlaubt (z. B. &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;).</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stufe wählen</label>
            <select
              value={popupLevel}
              onChange={(e) => setPopupLevel(parseInt(e.target.value))}
              className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {levels.map((l) => (
                <option key={l.id} value={l.level_number}>Stufe {l.level_number}: {l.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Popup-Inhalt</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Text markieren und Formatierung anwenden. Audios für diese Stufe legst du unten unter „Stufen-Audios“ an – sie erscheinen unter dem Popup-Text.</p>
            {/* Toolbar: Fett, Größe, Farbe */}
            <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-t-lg border border-b-0 border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => wrapSelection('<strong>', '</strong>')}
                className="p-2 rounded hover:bg-gray-200"
                title="Fett"
              >
                <Bold size={18} />
              </button>
              <select
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                defaultValue=""
                onChange={(e) => {
                  const v = e.target.value;
                  e.target.value = '';
                  if (v === 'big') wrapSelection('<span style="font-size: 1.25em">', '</span>');
                  if (v === 'small') wrapSelection('<span style="font-size: 0.9em">', '</span>');
                }}
                title="Größe"
              >
                <option value="">Größe</option>
                <option value="big">Größer</option>
                <option value="small">Kleiner</option>
              </select>
              <select
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                defaultValue=""
                onChange={(e) => {
                  const v = e.target.value;
                  e.target.value = '';
                  if (!v) return;
                  wrapSelection(`<span style="color: ${v}">`, '</span>');
                }}
                title="Farbe"
              >
                <option value="">Farbe</option>
                <option value="#0d9488">Türkis</option>
                <option value="#b91c1c">Rot</option>
                <option value="#1d4ed8">Blau</option>
                <option value="#15803d">Grün</option>
                <option value="#713f12">Braun</option>
                <option value="#4b5563">Grau</option>
              </select>
            </div>
            <textarea
              ref={modalContentRef}
              value={modalContent}
              onChange={(e) => setModalContent(e.target.value)}
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-b-lg focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="<p>In diesem Kapitel lernst du...</p><ul><li>...</li></ul>"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stufen-Audios (unter dem Popup-Text)</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Diese Audios erscheinen im Popup unter dem Text als Abspielen-Buttons – wie bei den Frage- und Antwort-Audios.</p>
            {modalAudioList.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-1 min-w-0">
                  <AudioInput
                    label={modalAudioList.length > 1 ? `Audio ${idx + 1}` : 'Stufen-Audio'}
                    currentUrl={item.url}
                    onAudioChange={(file, url) => {
                      setModalAudioList(prev => prev.map((x, i) => i === idx ? { url: url ?? x.url, file: file ?? null } : x));
                    }}
                    onSave={() => {}}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setModalAudioList(prev => prev.filter((_, i) => i !== idx))}
                  className="p-2 text-gray-400 hover:text-red-600 shrink-0"
                  title="Entfernen"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setModalAudioList(prev => [...prev, { url: null, file: null }])}
              className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
            >
              <Plus size={16} /> Weiteres Audio hinzufügen
            </button>
          </div>
          <button
            type="button"
            onClick={async () => {
              setPopupSaving(true);
              setMessage('');
              try {
                const urls: string[] = [];
                for (const item of modalAudioList) {
                  if (item.file) {
                    urls.push(await uploadFile(item.file));
                  } else if (item.url) {
                    urls.push(item.url);
                  }
                }
                const { error } = await supabase.from('learning_levels').update({
                  modal_content: modalContent,
                  modal_audio_urls: urls.length ? urls : null,
                  modal_audio_url: urls[0] ?? null
                }).eq('level_number', popupLevel);
                if (error) throw error;
                setMessage('Popup gespeichert!');
                setModalAudioList(urls.map(url => ({ url, file: null })));
                const { data } = await supabase.from('learning_levels').select('modal_content, modal_audio_url, modal_audio_urls').eq('level_number', popupLevel).single();
                if (data) {
                  setModalContent((data as { modal_content?: string }).modal_content ?? '');
                  const u = (data as { modal_audio_urls?: string[] }).modal_audio_urls;
                  setModalAudioList(u?.length ? u.map(url => ({ url, file: null })) : data.modal_audio_url ? [{ url: data.modal_audio_url, file: null }] : []);
                }
                setLevels(prev => prev.map(l => l.level_number === popupLevel ? { ...l, modal_content: modalContent, modal_audio_url: urls[0] ?? undefined, modal_audio_urls: urls } : l));
              } catch (err: any) {
                setMessage('Fehler: ' + err.message);
              } finally {
                setPopupSaving(false);
              }
            }}
            disabled={popupSaving}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-semibold"
          >
            {popupSaving ? 'Speichert...' : 'Popup speichern'}
          </button>
        </div>
      )}

      {/* MANAGE LIST */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {loading ? <p className="text-gray-600 dark:text-gray-400">Laden...</p> : items.length === 0 ? <p className="text-gray-500 dark:text-gray-400">Keine Einträge in dieser Stufe.</p> : (
            items.map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 flex justify-between items-center hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="font-quran text-3xl w-16 text-center" dir="rtl">{item.content}</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{item.transliteration}</p>
                    <div className="flex gap-2 mt-1">
                      {item.audio_url && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded">
                          <Music size={10} /> Frage-Audio
                        </span>
                      )}
                      {item.options && item.options.length > 0 && (
                         <span className="text-xs text-blue-600 dark:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                           {item.options.length} Optionen
                         </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => startEdit(item)}
                    className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full"
                    title="Bearbeiten"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                    title="Löschen"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
