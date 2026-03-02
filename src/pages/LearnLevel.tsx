import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Play, Check, X, Volume2, Heart, RefreshCw, Trophy, BookOpen, HelpCircle, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playSuccessSound, playErrorSound } from '../utils/audio';
import { GenericLevelModal } from '../components/GenericLevelModal';
import { ClickableArabicVerse } from '../components/ClickableArabicVerse';

/** Stufe 8: Optionen für „Madd-Buchstaben anklicken“ (richtige Auswahl im Admin festgelegt) */
export interface MaddClickOptions {
  task_type?: 'madd_click';
  correct_madd_indices: number[];
}

interface Option {
  id: string;
  text: string;
  is_correct: boolean;
  audio_url: string | null;
}

interface LearningItem {
  id: string;
  content: string;
  transliteration: string;
  audio_url: string | null;
  order_index: number;
  options?: Option[] | MaddClickOptions;
  help_audio_url?: string | null;
  rule_audio_url?: string | null;
}

interface LevelInfo {
  title: string;
  description: string | null;
  modal_content: string | null;
  modal_audio_url: string | null;
  modal_audio_urls?: string[] | null;
  intro_video_url: string | null;
}

function isYouTubeUrl(url: string | null): boolean {
  if (!url) return false;
  return /youtube\.com\/watch|youtu\.be\//i.test(url);
}

function getYouTubeEmbedUrl(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

export default function LearnLevel() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Data State
  const [allItems, setAllItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Game State
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [lives, setLives] = useState(3);
  const [queue, setQueue] = useState<LearningItem[]>([]); // Items left to answer in this run
  const [currentItem, setCurrentItem] = useState<LearningItem | null>(null);
  
  // Quiz State
  const [currentOptions, setCurrentOptions] = useState<Option[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Stufe 8 (Madd): Auswahl der als „natürlicher Madd“ markierten Buchstaben
  const [selectedMaddIndices, setSelectedMaddIndices] = useState<Set<number>>(new Set());
  const [hasCheckedMadd, setHasCheckedMadd] = useState(false);

  // Level modal (Stufen-Info während des Quiz)
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [showLevelModal, setShowLevelModal] = useState(false);
  // Intro-Video: zuerst anzeigen, dann Quiz; kann während des Quiz wieder geöffnet werden
  const [showIntroVideo, setShowIntroVideo] = useState(false);

  const [levelAccessAllowed, setLevelAccessAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    fetchItems();
  }, [levelId]);

  useEffect(() => {
    if (!levelId) return;
    (async () => {
      const { data } = await supabase
        .from('learning_levels')
        .select('title, description, modal_content, modal_audio_url, modal_audio_urls, intro_video_url')
        .eq('level_number', parseInt(levelId))
        .single();
      if (data) {
        setLevelInfo(data);
        setShowIntroVideo(!!data.intro_video_url);
      }
    })();
  }, [levelId]);

  // Prüfen ob Stufe freigeschaltet ist (Stufe 1 immer, sonst nur wenn vorherige bestanden)
  useEffect(() => {
    if (!levelId) {
      setLevelAccessAllowed(true);
      return;
    }
    const num = parseInt(levelId);
    if (num <= 1) {
      setLevelAccessAllowed(true);
      return;
    }
    if (!user) {
      setLevelAccessAllowed(false);
      return;
    }
    (async () => {
      const [itemsRes, progressRes] = await Promise.all([
        supabase.from('learning_items').select('id').eq('level_id', num - 1),
        supabase.from('user_progress').select('item_id').eq('user_id', user.id).eq('is_completed', true),
      ]);
      const prevIds = (itemsRes.data || []).map((r: { id: string }) => r.id);
      const completedSet = new Set((progressRes.data || []).map((r: { item_id: string }) => r.item_id));
      const prevCompleted = prevIds.length === 0 || prevIds.every((id) => completedSet.has(id));
      setLevelAccessAllowed(prevCompleted);
    })();
  }, [levelId, user?.id]);

  const fetchItems = async () => {
    if (!levelId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('learning_items')
      .select('*')
      .eq('level_id', parseInt(levelId))
      .order('order_index');

    if (error) {
      console.error('Error fetching items:', error);
    } else {
      const items = data || [];
      setAllItems(items);
      startNewRun(items);
    }
    setLoading(false);
  };

  const startNewRun = (items: LearningItem[]) => {
    // Shuffle items for the run
    const shuffled = shuffleArray([...items]);
    setQueue(shuffled);
    setCurrentItem(shuffled[0]);
    setLives(3);
    setGameStatus('playing');
    setSelectedOptionId(null);
    setIsCorrect(null);
  };

  // Initialize Options when current item changes (Stufe 8: Madd-State zurücksetzen)
  useEffect(() => {
    if (!currentItem) return;
    if (parseInt(levelId || '0') === 8) {
      setSelectedMaddIndices(new Set());
      setHasCheckedMadd(false);
      setSelectedOptionId(null);
      setIsCorrect(null);
      return;
    }
    prepareOptions();
  }, [currentItem, levelId]);

  const prepareOptions = () => {
    if (!currentItem) return;

    // Stufe 8 nutzt kein Options-Grid
    if (parseInt(levelId || '0') === 8) return;

    // 1. Check if item has explicit options saved in DB
    if (currentItem.options && Array.isArray(currentItem.options) && currentItem.options.length > 0) {
      setCurrentOptions(shuffleArray(currentItem.options));
    } else {
      // Fallback: Generate random distractors from other items in the same level
      const otherItems = allItems.filter(i => i.id !== currentItem.id);
      const randomDistractors = shuffleArray(otherItems).slice(0, 2).map((i, idx) => ({
        id: `d_${idx}`,
        text: i.transliteration,
        is_correct: false,
        audio_url: null
      }));

      const correctOption: Option = {
        id: 'correct',
        text: currentItem.transliteration,
        is_correct: true,
        audio_url: null
      };

      setCurrentOptions(shuffleArray([correctOption, ...randomDistractors]));
    }
    
    setSelectedOptionId(null);
    setIsCorrect(null);
  };

  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const playAudio = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!url) return;
    const audio = new Audio(url);
    audio.volume = 0.6;
    setIsPlaying(true);
    audio.play();
    audio.onended = () => setIsPlaying(false);
  };

  /** Stufe 8: Buchstabe als Madd markieren / Markierung aufheben */
  const handleMaddLetterClick = (letterIndex: number) => {
    if (parseInt(levelId || '0') !== 8 || hasCheckedMadd) return;
    setSelectedMaddIndices((prev) => {
      const next = new Set(prev);
      if (next.has(letterIndex)) next.delete(letterIndex);
      else next.add(letterIndex);
      return next;
    });
  };

  /** Stufe 8: Auswahl prüfen (erster Klick auf Weiter) oder zur nächsten Aufgabe (zweiter Klick). */
  const handleMaddWeiter = () => {
    if (parseInt(levelId || '0') !== 8 || !currentItem) return;
    const opts = currentItem.options as MaddClickOptions | undefined;
    const correctIndices = Array.isArray(opts?.correct_madd_indices) ? opts.correct_madd_indices : [];

    if (!hasCheckedMadd) {
      const selected = [...selectedMaddIndices].sort((a, b) => a - b);
      const correct = [...new Set(correctIndices)].sort((a, b) => a - b);
      const same = selected.length === correct.length && selected.every((v, i) => v === correct[i]);
      setHasCheckedMadd(true);
      setIsCorrect(same);
      if (same) playSuccessSound();
      else {
        playErrorSound();
        const newLives = lives - 1;
        setLives(newLives);
        if (newLives === 0) setGameStatus('lost');
      }
      return;
    }
    handleNext();
  };

  const handleOptionClick = async (option: Option) => {
    if (selectedOptionId || gameStatus !== 'playing') return; // Prevent multiple clicks

    setSelectedOptionId(option.id);
    const correct = option.is_correct;
    setIsCorrect(correct);

    if (correct) {
      playSuccessSound();
    } else {
      playErrorSound();
    }

    if (option.audio_url) {
      playAudio(option.audio_url);
    }

    if (!correct) {
      // Wrong answer
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives === 0) {
        setGameStatus('lost');
      }
    }
  };

  const handleNext = async () => {
    if (gameStatus === 'lost') return;

    // Remove current item from queue
    const newQueue = queue.slice(1);
    setQueue(newQueue);

    if (newQueue.length === 0) {
      // WIN!
      setGameStatus('won');
      playSuccessSound(); // Extra sound for winning
      await saveProgress();
    } else {
      setCurrentItem(newQueue[0]);
    }
  };

  const saveProgress = async () => {
    if (!user || !levelId) return;
    
    // Save progress for ALL items in this level at once
    // This marks the whole level as "mastered" effectively because we track per item
    const updates = allItems.map(item => ({
      user_id: user.id,
      item_id: item.id,
      is_completed: true,
      completed_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('user_progress').upsert(updates, { onConflict: 'user_id,item_id' });
    if (error) console.error('Error saving progress:', error);
  };

  if (loading) return <div className="p-8 text-center text-gray-600 dark:text-gray-400">Laden...</div>;

  const levelNum = parseInt(levelId || '0');
  if (levelNum > 1 && levelAccessAllowed === null) {
    return <div className="p-8 text-center text-gray-600 dark:text-gray-400">Laden...</div>;
  }

  if (levelAccessAllowed === false) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Diese Stufe ist noch gesperrt. Schließe zuerst die vorherige Stufe ab (Quiz ohne alle Leben zu verlieren).
        </p>
        <button
          onClick={() => navigate('/learn')}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold"
        >
          Zur Lernübersicht
        </button>
      </div>
    );
  }

  // Intro-Video anzeigen (wenn vorhanden und gewünscht)
  if (showIntroVideo && levelInfo?.intro_video_url) {
    return (
      <div className="pb-20 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate('/learn')} className="flex items-center text-gray-500 hover:text-emerald-600">
            <ArrowLeft size={20} className="mr-1" /> Zurück
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-black shadow-lg aspect-video">
          {isYouTubeUrl(levelInfo.intro_video_url) ? (
            <iframe
              src={getYouTubeEmbedUrl(levelInfo.intro_video_url!)}
              title="Stufen-Intro"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <video src={levelInfo.intro_video_url!} controls className="w-full h-full" />
          )}
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setShowIntroVideo(false)}
            className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-lg"
          >
            Quiz starten
          </button>
          <button
            onClick={() => navigate('/learn')}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
          >
            Zur Lernübersicht
          </button>
        </div>
      </div>
    );
  }

  if (allItems.length === 0) return (
    <div className="p-8 text-center max-w-md mx-auto">
      <p className="text-gray-600 dark:text-gray-400 mb-4">Noch keine Inhalte in dieser Stufe.</p>
      {levelInfo?.intro_video_url && (
        <button
          onClick={() => setShowIntroVideo(true)}
          className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg mb-4 flex items-center gap-2 mx-auto"
        >
          <Film size={18} /> Zum Video
        </button>
      )}
      <button
        onClick={() => navigate('/learn')}
        className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold"
      >
        Zur Lernübersicht
      </button>
    </div>
  );

  // --- GAME OVER SCREEN ---
  if (gameStatus === 'lost') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center animate-fade-in">
        <div className="bg-red-100 p-6 rounded-full mb-6">
          <X size={64} className="text-red-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Keine Leben mehr!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          Du hast leider 3 Fehler gemacht. Versuche es noch einmal, um die Stufe zu meistern.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {levelInfo?.intro_video_url && (
            <button
              onClick={() => setShowIntroVideo(true)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 flex items-center gap-2"
            >
              <Film size={18} /> Zum Video
            </button>
          )}
          <button 
            onClick={() => navigate('/learn')}
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold"
          >
            Beenden
          </button>
          <button 
            onClick={() => startNewRun(allItems)}
            className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold flex items-center gap-2 shadow-lg"
          >
            <RefreshCw size={20} /> Neuer Versuch
          </button>
        </div>
      </div>
    );
  }

  // --- WIN SCREEN ---
  if (gameStatus === 'won') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center animate-fade-in">
        <div className="bg-yellow-100 p-6 rounded-full mb-6">
          <Trophy size={64} className="text-yellow-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Mashallah!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          Du hast die Stufe erfolgreich abgeschlossen und {lives} Leben behalten.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {levelInfo?.intro_video_url && (
            <button
              onClick={() => setShowIntroVideo(true)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 flex items-center gap-2"
            >
              <Film size={18} /> Zum Video
            </button>
          )}
          <button 
            onClick={() => navigate('/learn')}
            className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-lg"
          >
            Zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  if (!currentItem) return null;

  return (
    <div className="pb-20 max-w-2xl mx-auto">
      {/* Header */}
        <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => navigate('/learn')} 
            className="flex items-center text-gray-500 hover:text-emerald-600"
          >
            <ArrowLeft size={20} className="mr-1" /> Abbruch
          </button>
          <button
            onClick={() => setShowLevelModal(true)}
            className="flex items-center gap-1 text-gray-500 hover:text-emerald-600 px-2 py-1 rounded-lg hover:bg-emerald-50"
            title="Stufen-Info anzeigen"
          >
            <BookOpen size={18} /> Stufen-Info
          </button>
          {levelInfo?.intro_video_url && (
            <button
              onClick={() => setShowIntroVideo(true)}
              className="flex items-center gap-1 text-gray-500 hover:text-emerald-600 px-2 py-1 rounded-lg hover:bg-emerald-50"
              title="Intro-Video ansehen"
            >
              <Film size={18} /> Zum Video
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm border border-red-100 dark:border-gray-600">
          {[...Array(3)].map((_, i) => (
            <Heart 
              key={i} 
              size={20} 
              className={`${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-200 fill-gray-200'} transition-all`} 
            />
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-emerald-100 dark:border-gray-600 min-h-[500px] flex flex-col relative">
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2">
          <div 
            className="bg-emerald-500 h-2 transition-all duration-500" 
            style={{ width: `${((allItems.length - queue.length) / allItems.length) * 100}%` }}
          ></div>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
          <span className="text-sm text-gray-400 mb-4">Frage {allItems.length - queue.length + 1} von {allItems.length}</span>
          
          <div className="mb-8 w-full flex flex-col items-center animate-fade-in" key={currentItem.id}>
            {/* Stufe 8 (Madd): Vers mit klickbaren Buchstaben – nur natürliche Madd-Buchstaben markieren */}
            {levelNum === 8 ? (
              <div className="w-full px-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Markiere alle Buchstaben mit <strong>natürlichem Madd</strong> (Alif, Yā, Wāw mit passendem Tashkīl davor), dann „Prüfen“. Du kannst beliebig viele anklicken.</p>
                <ClickableArabicVerse
                  content={currentItem.content}
                  selectedIndices={selectedMaddIndices}
                  onToggle={handleMaddLetterClick}
                  disabled={hasCheckedMadd}
                  selectedClassName="bg-amber-400/35 dark:bg-amber-500/40"
                  correctIndices={(() => {
                    const opts = currentItem.options as MaddClickOptions | undefined;
                    return Array.isArray(opts?.correct_madd_indices) ? opts.correct_madd_indices : [];
                  })()}
                  showFeedback={hasCheckedMadd && isCorrect === false}
                />
                {hasCheckedMadd && (
                  <p className={`mt-4 text-lg font-semibold ${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isCorrect ? 'Richtig!' : 'Leider falsch.'}
                  </p>
                )}
              </div>
            ) : (
              <>
            {/* Stufe 7 (Tanween): Frage = Transliteration, Antworten = Arabisch */}
            {levelNum === 7 ? (
              <h1 className="text-5xl md:text-6xl font-bold text-emerald-900 dark:text-emerald-200 mb-6 leading-tight" dir="ltr">{currentItem.transliteration}</h1>
            ) : (
              <h1 className="text-8xl font-bold text-emerald-900 dark:text-emerald-200 mb-6 font-quran leading-tight" dir="rtl">{currentItem.content}</h1>
            )}
            
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              {currentItem.audio_url && (
                <button 
                  onClick={() => playAudio(currentItem.audio_url!)}
                  disabled={isPlaying}
                  className="p-4 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors shadow-sm"
                  title="Frage anhören"
                >
                  <Play size={32} className={isPlaying ? 'animate-pulse' : ''} />
                </button>
              )}
              {currentItem.help_audio_url && (
                <button
                  onClick={() => playAudio(currentItem.help_audio_url!)}
                  disabled={isPlaying}
                  className="p-3 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors shadow-sm flex items-center gap-2"
                  title="Hilfe anhören"
                >
                  <HelpCircle size={24} /> <span className="text-sm font-medium">Hilfe</span>
                </button>
              )}
              {currentItem.rule_audio_url && (
                <button
                  onClick={() => playAudio(currentItem.rule_audio_url!)}
                  disabled={isPlaying}
                  className="p-3 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors shadow-sm flex items-center gap-2"
                  title="Regel-Audio anhören"
                >
                  <Volume2 size={24} /> <span className="text-sm font-medium">Regel</span>
                </button>
              )}
              {!currentItem.audio_url && !currentItem.help_audio_url && !currentItem.rule_audio_url && (
                <p className="text-xs text-gray-400">(Kein Frage-Audio)</p>
              )}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 gap-3 w-full max-w-md">
              {currentOptions.map((option, idx) => {
                let btnClass = "relative p-4 rounded-xl border-2 text-lg font-semibold transition-all transform active:scale-98 flex items-center justify-between ";
                
                if (selectedOptionId) {
                    if (option.is_correct) {
                        btnClass += "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 text-emerald-800 dark:text-emerald-200"; 
                    } else if (option.id === selectedOptionId && !isCorrect) {
                        btnClass += "bg-red-100 dark:bg-red-900/40 border-red-500 text-red-800 dark:text-red-200"; 
                    } else {
                        btnClass += "bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 opacity-50"; 
                    }
                } else {
                    btnClass += "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(option)}
                    disabled={selectedOptionId !== null}
                    className={btnClass}
                  >
                    <span className={`flex-grow text-center ${levelNum === 7 ? 'font-quran text-3xl md:text-4xl' : ''}`} dir={levelNum === 7 ? 'rtl' : undefined}>{option.text}</span>
                    
                    {option.audio_url && (
                      <div 
                        onClick={(e) => playAudio(option.audio_url!, e)}
                        className="ml-2 p-2 rounded-full bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 text-emerald-600 cursor-pointer z-10"
                        title="Antwort anhören"
                      >
                        <Volume2 size={16} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center h-24">
           {levelNum === 8 ? (
             <>
               {hasCheckedMadd && (isCorrect === true ? (
                 <div className="flex items-center gap-2 text-emerald-600 font-bold animate-fade-in"><Check size={24} /> Richtig!</div>
               ) : isCorrect === false ? (
                 <div className="flex items-center gap-2 text-red-600 font-bold animate-fade-in"><X size={24} /> Falsch! -1 ❤️</div>
               ) : null)}
               <button onClick={handleMaddWeiter} className="ml-auto px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 shadow-md transform active:scale-95 transition-all flex items-center gap-2">
                 {hasCheckedMadd ? (queue.length === 1 ? 'Beenden' : 'Weiter') : 'Prüfen'} <Check size={18} />
               </button>
             </>
           ) : (
             <>
               {isCorrect === true && (
                 <div className="flex items-center gap-2 text-emerald-600 font-bold animate-fade-in"><Check size={24} /> Richtig!</div>
               )}
               {isCorrect === false && (
                 <div className="flex items-center gap-2 text-red-600 font-bold animate-fade-in"><X size={24} /> Falsch! -1 ❤️</div>
               )}
               {selectedOptionId && (
                 <button onClick={handleNext} className="ml-auto px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 shadow-md transform active:scale-95 transition-all flex items-center gap-2">
                   {queue.length === 1 ? 'Beenden' : 'Weiter'} <Check size={18} />
                 </button>
               )}
             </>
           )}
        </div>
      </div>

      <GenericLevelModal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        onStart={() => setShowLevelModal(false)}
        levelNumber={levelId ? parseInt(levelId) : 1}
        levelFromDb={levelInfo}
      />
    </div>
  );
}
