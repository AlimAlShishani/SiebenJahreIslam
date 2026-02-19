import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Book, Volume2, Star, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GenericLevelModal } from '../components/GenericLevelModal';

interface LearningLevel {
  id: number;
  level_number: number;
  title: string;
  description: string;
}

interface UserProgressMap {
  [levelNumber: number]: {
    completed: number;
    total: number;
  };
}

export default function Learn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [levels, setLevels] = useState<LearningLevel[]>([]);
  const [progressMap, setProgressMap] = useState<UserProgressMap>({});
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // 1. Fetch Levels
        const { data: levelsData, error: levelsError } = await supabase
          .from('learning_levels')
          .select('*')
          .order('level_number');
        
        if (levelsError) throw levelsError;

        // 2. Fetch all Items to count totals per level
        const { data: itemsData, error: itemsError } = await supabase
          .from('learning_items')
          .select('id, level_id');

        if (itemsError) throw itemsError;

        // 3. Fetch User Progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('item_id')
          .eq('user_id', user.id)
          .eq('is_completed', true);

        if (progressError) throw progressError;

        // Process Data
        const stats: UserProgressMap = {};
        
        // Initialize stats for each level
        levelsData?.forEach(l => {
          stats[l.level_number] = { completed: 0, total: 0 };
        });

        // Count totals
        itemsData?.forEach(item => {
          if (stats[item.level_id]) {
            stats[item.level_id].total++;
          }
        });

        // Count completed
        // We need to know which level each completed item belongs to.
        // Create a map of item_id -> level_id
        const itemLevelMap = new Map<string, number>();
        itemsData?.forEach(item => itemLevelMap.set(item.id, item.level_id));

        progressData?.forEach(p => {
          const levelId = itemLevelMap.get(p.item_id);
          if (levelId && stats[levelId]) {
            stats[levelId].completed++;
          }
        });

        setLevels(levelsData || []);
        setProgressMap(stats);

      } catch (error) {
        console.error('Error loading learn data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleLevelClick = (levelNumber: number) => {
    setSelectedLevelId(levelNumber);
    setShowModal(true);
  };

  const handleStartLevel = () => {
    setShowModal(false);
    if (selectedLevelId) {
      navigate(`/learn/${selectedLevelId}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-600 dark:text-gray-400">Laden...</div>;

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">Lernbereich</h2>
      
      {selectedLevelId && (
        <GenericLevelModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          onStart={handleStartLevel} 
          levelNumber={selectedLevelId}
        />
      )}

      <div className="grid grid-cols-1 gap-6">
        {levels.map((level, index) => {
          const stats = progressMap[level.level_number] || { completed: 0, total: 0 };
          const progressPercent = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
          
          // Logic: Unlock if previous level is completed (or if it's the first level)
          const prevLevelIndex = index - 1;
          const prevLevel = prevLevelIndex >= 0 ? levels[prevLevelIndex] : null;
          
          let isLocked = false;
          if (prevLevel) {
            const prevStats = progressMap[prevLevel.level_number];
            // Lock if previous level is not fully completed (or has no items)
            if (!prevStats || prevStats.total === 0 || prevStats.completed < prevStats.total) {
              isLocked = true;
            }
          }

          return (
            <div key={level.id} className="relative">
              {isLocked ? (
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 opacity-75 flex items-center justify-between cursor-not-allowed">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-1 rounded-full">
                        Stufe {level.level_number}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400">
                        {level.title}
                      </h3>
                    </div>
                    <p className="text-gray-400 dark:text-gray-500 text-sm flex items-center gap-1">
                      <Lock size={14} /> Schließe vorherige Stufe ab
                    </p>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-full">
                    <Lock size={24} className="text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => handleLevelClick(level.level_number)}
                  className="block group cursor-pointer"
                >
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-emerald-100 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all hover:shadow-md flex items-center justify-between relative overflow-hidden">
                    {/* Progress Background */}
                    <div 
                      className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${progressPercent}%` }}
                    ></div>

                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2 py-1 rounded-full">
                          Stufe {level.level_number}
                        </span>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                          {level.title}
                        </h3>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 mb-2">{level.description}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {stats.completed} / {stats.total} gemeistert
                      </p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-full group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                      {level.level_number === 1 ? <Book size={24} className="text-emerald-600 dark:text-emerald-400" /> :
                       level.level_number === 2 ? <Volume2 size={24} className="text-emerald-600 dark:text-emerald-400" /> :
                       <Star size={24} className="text-emerald-600 dark:text-emerald-400" />}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}