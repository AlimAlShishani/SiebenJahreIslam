import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Play, Check, X, Volume2, Heart, RefreshCw, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playSuccessSound, playErrorSound } from '../utils/audio';

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
  options?: Option[];
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

  useEffect(() => {
    fetchItems();
  }, [levelId]);

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

  // Initialize Options when current item changes
  useEffect(() => {
    if (currentItem) {
      prepareOptions();
    }
  }, [currentItem]);

  const prepareOptions = () => {
    if (!currentItem) return;

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
    setIsPlaying(true);
    audio.play();
    audio.onended = () => setIsPlaying(false);
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

  if (loading) return <div className="p-8 text-center">Laden...</div>;
  if (allItems.length === 0) return (
    <div className="p-8 text-center">
      <p>Keine Inhalte für diese Stufe gefunden.</p>
      <button onClick={() => navigate('/learn')} className="mt-4 text-emerald-600 underline">Zurück zur Übersicht</button>
    </div>
  );

  // --- GAME OVER SCREEN ---
  if (gameStatus === 'lost') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center animate-fade-in">
        <div className="bg-red-100 p-6 rounded-full mb-6">
          <X size={64} className="text-red-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Keine Leben mehr!</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Du hast leider 3 Fehler gemacht. Versuche es noch einmal, um die Stufe zu meistern.
        </p>
        <div className="flex gap-4">
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
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Mashallah!</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Du hast die Stufe erfolgreich abgeschlossen und {lives} Leben behalten.
        </p>
        <button 
          onClick={() => navigate('/learn')}
          className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-lg"
        >
          Zur Übersicht
        </button>
      </div>
    );
  }

  if (!currentItem) return null;

  return (
    <div className="pb-20 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate('/learn')} 
          className="flex items-center text-gray-500 hover:text-emerald-600"
        >
          <ArrowLeft size={20} className="mr-1" /> Abbruch
        </button>
        
        <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm border border-red-100">
          {[...Array(3)].map((_, i) => (
            <Heart 
              key={i} 
              size={20} 
              className={`${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-200 fill-gray-200'} transition-all`} 
            />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-emerald-100 min-h-[500px] flex flex-col relative">
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-2">
          <div 
            className="bg-emerald-500 h-2 transition-all duration-500" 
            style={{ width: `${((allItems.length - queue.length) / allItems.length) * 100}%` }}
          ></div>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
          <span className="text-sm text-gray-400 mb-4">Frage {allItems.length - queue.length + 1} von {allItems.length}</span>
          
          <div className="mb-8 w-full flex flex-col items-center animate-fade-in" key={currentItem.id}>
            <h1 className="text-8xl font-bold text-emerald-900 mb-6 font-quran leading-tight" dir="rtl">{currentItem.content}</h1>
            
            <div className="flex gap-4 justify-center mb-6">
              {currentItem.audio_url ? (
                <button 
                  onClick={() => playAudio(currentItem.audio_url!)}
                  disabled={isPlaying}
                  className="p-4 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors shadow-sm"
                  title="Frage anhören"
                >
                  <Play size={32} className={isPlaying ? 'animate-pulse' : ''} />
                </button>
              ) : (
                 <p className="text-xs text-gray-400">(Kein Frage-Audio)</p>
              )}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 gap-3 w-full max-w-md">
              {currentOptions.map((option, idx) => {
                let btnClass = "relative p-4 rounded-xl border-2 text-lg font-semibold transition-all transform active:scale-98 flex items-center justify-between ";
                
                if (selectedOptionId) {
                    if (option.is_correct) {
                        btnClass += "bg-emerald-100 border-emerald-500 text-emerald-800"; 
                    } else if (option.id === selectedOptionId && !isCorrect) {
                        btnClass += "bg-red-100 border-red-500 text-red-800"; 
                    } else {
                        btnClass += "bg-gray-50 border-gray-100 text-gray-400 opacity-50"; 
                    }
                } else {
                    btnClass += "bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700 shadow-sm";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(option)}
                    disabled={selectedOptionId !== null}
                    className={btnClass}
                  >
                    <span className="flex-grow text-center">{option.text}</span>
                    
                    {option.audio_url && (
                      <div 
                        onClick={(e) => playAudio(option.audio_url!, e)}
                        className="ml-2 p-2 rounded-full bg-white/50 hover:bg-white text-emerald-600 cursor-pointer z-10"
                        title="Antwort anhören"
                      >
                        <Volume2 size={16} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-between items-center h-24">
           {isCorrect === true && (
             <div className="flex items-center gap-2 text-emerald-600 font-bold animate-fade-in">
               <Check size={24} /> Richtig!
             </div>
           )}
           {isCorrect === false && (
             <div className="flex items-center gap-2 text-red-600 font-bold animate-fade-in">
               <X size={24} /> Falsch! -1 ❤️
             </div>
           )}

           {selectedOptionId && (
             <button 
               onClick={handleNext}
               className="ml-auto px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 shadow-md transform active:scale-95 transition-all flex items-center gap-2"
             >
               {queue.length === 1 ? 'Beenden' : 'Weiter'} <Check size={18} />
             </button>
           )}
        </div>
      </div>
    </div>
  );
}
