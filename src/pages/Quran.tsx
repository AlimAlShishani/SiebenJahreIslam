import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, Calendar, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';

interface DailyAssignment {
  id: string;
  date: string;
  juz_number: number;
  user_id: string;
  start_page: number;
  end_page: number;
  is_completed: boolean;
  profiles: {
    full_name: string | null;
    email: string;
  };
}

export default function Quran() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<DailyAssignment[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Helper: Get Ramadan Day (1-30) based on current date
  // For testing/demo, we assume Ramadan starts Feb 18, 2026
  const getRamadanDay = () => {
    const today = new Date();
    const ramadanStart = new Date('2026-02-18');
    const diffTime = Math.abs(today.getTime() - ramadanStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // If before Ramadan, return 1. If after, return 30 (or handle appropriately)
    if (today < ramadanStart) return 1;
    if (diffDays > 30) return 30;
    return diffDays;
  };

  const currentRamadanDay = getRamadanDay();
  const todayDateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Active Users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, email, full_name');
      setUsers(usersData || []);

      // 2. Fetch Assignments for Today
      const { data: assignmentsData, error } = await supabase
        .from('daily_reading_status')
        .select(`
          *,
          profiles (full_name, email)
        `)
        .eq('date', todayDateStr);

      if (error) throw error;
      setAssignments(assignmentsData || []);

    } catch (error) {
      console.error('Error fetching Quran data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJuzPageInfo = (juz: number) => {
    if (juz === 1) {
      return { start: 1, length: 21 };
    } else if (juz === 30) {
      return { start: 582, length: 23 };
    } else {
      // Juz 2 starts at 22. Juz 3 at 42, etc.
      // Formula: 22 + (juz - 2) * 20
      const start = 22 + (juz - 2) * 20;
      return { start, length: 20 };
    }
  };

  const generateAssignments = async () => {
    if (users.length === 0) return;
    
    const confirmMessage = assignments.length > 0 
      ? "Es existiert bereits ein Plan für heute. Möchtest du ihn wirklich neu generieren? Der alte Fortschritt geht verloren."
      : "Möchtest du den Leseplan für heute generieren?";

    if (!window.confirm(confirmMessage)) return;

    setGenerating(true);
    try {
      // 1. Delete existing assignments for today
      await supabase
        .from('daily_reading_status')
        .delete()
        .eq('date', todayDateStr);

      // 2. Calculate Pages
      // Logic: Distribute the pages of the current Juz among users
      // We cycle through Juz 1-30 based on Ramadan Day
      const juzNumber = currentRamadanDay; 
      const { start: juzStartPage, length: totalPages } = getJuzPageInfo(juzNumber);
      
      const pagesPerUser = Math.floor(totalPages / users.length);
      const remainder = totalPages % users.length;

      let currentPage = juzStartPage;
      const newAssignments = [];

      for (let i = 0; i < users.length; i++) {
        // Distribute remainder pages to first few users
        const extraPage = i < remainder ? 1 : 0;
        const userPagesCount = pagesPerUser + extraPage;
        
        if (userPagesCount === 0) continue; // Should not happen if users < 20

        const start = currentPage;
        const end = currentPage + userPagesCount - 1;
        
        newAssignments.push({
          date: todayDateStr,
          juz_number: juzNumber,
          user_id: users[i].id,
          start_page: start,
          end_page: end,
          is_completed: false
        });

        currentPage = end + 1;
      }

      // 3. Insert new assignments
      const { error } = await supabase
        .from('daily_reading_status')
        .insert(newAssignments);

      if (error) throw error;

      await fetchData(); // Refresh UI

    } catch (error) {
      console.error('Error generating assignments:', error);
      alert('Fehler beim Generieren des Plans.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleCompletion = async (assignmentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('daily_reading_status')
        .update({ is_completed: !currentStatus })
        .eq('id', assignmentId);

      if (error) throw error;
      
      // Optimistic update
      setAssignments(prev => prev.map(a => 
        a.id === assignmentId ? { ...a, is_completed: !currentStatus } : a
      ));

    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2 opacity-90">
            <Calendar size={20} />
            <span className="font-medium">Ramadan Tag {currentRamadanDay}</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Juz {currentRamadanDay}</h1>
          <p className="text-emerald-100 max-w-md">
            Lese heute deinen Teil, um gemeinsam mit der Gruppe den Qur'an zu khatmen.
          </p>
        </div>
        <BookOpen className="absolute right-[-20px] bottom-[-40px] opacity-10" size={200} />
      </div>

      {/* Active Group */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={20} className="text-emerald-600" /> Aktive Gruppe
        </h3>
        <div className="flex flex-wrap gap-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700">
                {(u.full_name || u.email || '?')[0].toUpperCase()}
              </div>
              <span className="text-sm text-gray-600">{u.full_name || u.email}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Heutige Aufteilung</h3>
          <button 
            onClick={generateAssignments}
            disabled={generating}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {assignments.length > 0 ? 'Neu verteilen' : 'Plan generieren'}
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 mb-4">Noch kein Leseplan für heute.</p>
            <button 
              onClick={generateAssignments}
              disabled={generating}
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md"
            >
              Jetzt generieren
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignments.map((assignment) => {
              const isMe = assignment.user_id === user?.id;
              
              return (
                <div 
                  key={assignment.id} 
                  className={`relative p-5 rounded-xl border transition-all ${
                    assignment.is_completed 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : isMe 
                        ? 'bg-white border-emerald-500 shadow-md ring-1 ring-emerald-100' 
                        : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">
                          {assignment.profiles.full_name || assignment.profiles.email}
                        </span>
                        {isMe && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                            Du
                          </span>
                        )}
                      </div>
                      <div className="text-lg text-gray-600">
                        Seite <span className="font-bold text-gray-900">{assignment.start_page}</span> bis <span className="font-bold text-gray-900">{assignment.end_page}</span>
                      </div>
                    </div>

                    {isMe ? (
                      <button
                        onClick={() => toggleCompletion(assignment.id, assignment.is_completed)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                          assignment.is_completed
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {assignment.is_completed ? (
                          <>
                            <CheckCircle size={20} /> Erledigt
                          </>
                        ) : (
                          <>
                            <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
                            Offen
                          </>
                        )}
                      </button>
                    ) : (
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        assignment.is_completed ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {assignment.is_completed ? 'Fertig' : 'Offen'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}