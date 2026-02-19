import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, Calendar, CheckCircle, RefreshCw, Loader2, ChevronUp, ChevronDown, X } from 'lucide-react';

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
  const [swapping, setSwapping] = useState<string | null>(null);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [pagesPerUser, setPagesPerUser] = useState<number[]>([]);

  // Farben für die Seiten-Boxen (eine pro Person)
  const SEGMENT_COLORS = [
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-violet-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-lime-500',
  ];

  // Helper: Get Ramadan Day (1-30) based on current date. Ramadan starts Feb 18, 2026.
  const getRamadanDay = () => {
    const today = new Date();
    const ramadanStart = new Date('2026-02-18');
    const diffTime = Math.abs(today.getTime() - ramadanStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (today < ramadanStart) return 1;
    if (diffDays > 30) return 30;
    return diffDays;
  };

  // Convert Ramadan day (1-30) to date string YYYY-MM-DD
  const getDateForRamadanDay = (day: number) => {
    const start = new Date('2026-02-18');
    const d = new Date(start);
    d.setDate(start.getDate() + (day - 1));
    return d.toISOString().split('T')[0];
  };

  const [selectedRamadanDay, setSelectedRamadanDay] = useState(() => getRamadanDay());
  const selectedDateStr = getDateForRamadanDay(selectedRamadanDay);
  const isToday = selectedRamadanDay === getRamadanDay();

  useEffect(() => {
    fetchData();
  }, [user, selectedRamadanDay]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Active Users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, email, full_name');
      setUsers(usersData || []);

      // 2. Fetch Assignments for selected day
      const { data: assignmentsData, error } = await supabase
        .from('daily_reading_status')
        .select(`
          *,
          profiles (full_name, email)
        `)
        .eq('date', selectedDateStr);

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
      // Juz 2 starts at 22. Juz 3 at 42, etc. – je 20 Seiten
      const start = 22 + (juz - 2) * 20;
      return { start, length: 20 };
    }
  };

  const getDefaultPagesPerUser = (): number[] => {
    const { length: totalPages } = getJuzPageInfo(selectedRamadanDay);
    const base = Math.floor(totalPages / users.length);
    const remainder = totalPages % users.length;
    return users.map((_, i) => base + (i < remainder ? 1 : 0));
  };

  const openDistributeModal = () => {
    if (users.length === 0) return;
    if (assignments.length > 0 && !window.confirm(`Es existiert bereits ein Plan für Tag ${selectedRamadanDay}. Neu verteilen? Der alte Fortschritt geht verloren.`)) return;
    setPagesPerUser(getDefaultPagesPerUser());
    setShowDistributeModal(true);
  };

  const totalPagesForJuz = getJuzPageInfo(selectedRamadanDay).length;
  const distributeSum = pagesPerUser.reduce((a, b) => a + b, 0);
  const distributeValid = pagesPerUser.length === users.length && distributeSum === totalPagesForJuz && pagesPerUser.every(p => p >= 1);

  const doGenerateAssignments = async () => {
    if (!distributeValid) return;
    setGenerating(true);
    setShowDistributeModal(false);
    try {
      await supabase
        .from('daily_reading_status')
        .delete()
        .eq('date', selectedDateStr);

      const juzNumber = selectedRamadanDay;
      const { start: juzStartPage } = getJuzPageInfo(juzNumber);
      let currentPage = juzStartPage;
      const newAssignments = [];

      for (let i = 0; i < users.length; i++) {
        const count = pagesPerUser[i] ?? 0;
        if (count <= 0) continue;
        const start = currentPage;
        const end = currentPage + count - 1;
        newAssignments.push({
          date: selectedDateStr,
          juz_number: juzNumber,
          user_id: users[i].id,
          start_page: start,
          end_page: end,
          is_completed: false
        });
        currentPage = end + 1;
      }

      const { error } = await supabase
        .from('daily_reading_status')
        .insert(newAssignments);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error generating assignments:', error);
      alert('Fehler beim Generieren des Plans.');
    } finally {
      setGenerating(false);
    }
  };

  const setPageCountForUser = (userIndex: number, value: number) => {
    const n = Math.max(0, Math.floor(value));
    setPagesPerUser(prev => {
      const next = [...prev];
      next[userIndex] = n;
      return next;
    });
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

  const swapWithNeighbor = async (index: number, direction: 'up' | 'down') => {
    const sorted = [...assignments].sort((a, b) => a.start_page - b.start_page);
    const otherIndex = direction === 'up' ? index - 1 : index + 1;
    if (otherIndex < 0 || otherIndex >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[otherIndex];
    setSwapping(a.id);
    try {
      const { error } = await supabase.rpc('swap_daily_reading_assignments', {
        a_id: a.id,
        b_id: b.id,
      });
      if (error) throw error;
      await fetchData();
    } catch (err: unknown) {
      console.error('Swap failed:', err);
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
      alert(
        msg.includes('function') || msg.includes('exist') || msg.includes('permission')
          ? 'Verschieben fehlgeschlagen. Bitte in Supabase das SQL-Skript „08_swap_reading_assignments.sql“ ausführen (und ggf. erneut ausführen).'
          : 'Verschieben fehlgeschlagen.'
      );
    } finally {
      setSwapping(null);
    }
  };

  const sortedAssignments = [...assignments].sort((a, b) => a.start_page - b.start_page);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="bg-emerald-600 dark:bg-emerald-800 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-2 opacity-90">
            <Calendar size={20} />
            <span className="font-medium">Ramadan Tag</span>
            <select
              value={selectedRamadanDay}
              onChange={(e) => setSelectedRamadanDay(Number(e.target.value))}
              className="bg-white dark:bg-gray-700 text-emerald-800 dark:text-emerald-200 font-bold border-2 border-white dark:border-gray-600 rounded-lg px-4 py-2 min-w-[4rem] shadow-md focus:ring-2 focus:ring-emerald-300 focus:outline-none cursor-pointer appearance-auto"
              title="Tag auswählen"
            >
              {[...Array(30)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            {isToday && <span className="text-emerald-200 text-sm">(heute)</span>}
          </div>
          <h1 className="text-4xl font-bold mb-2">Juz {selectedRamadanDay}</h1>
          <p className="text-emerald-100 max-w-md">
            {isToday
              ? 'Lese heute deinen Teil, um gemeinsam mit der Gruppe den Qur\'an zu khatmen.'
              : `Aufteilung und Fortschritt für Ramadan Tag ${selectedRamadanDay}.`}
          </p>
        </div>
        <BookOpen className="absolute right-[-20px] bottom-[-40px] opacity-10" size={200} />
      </div>

      {/* Active Group */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Users size={20} className="text-emerald-600 dark:text-emerald-400" /> Aktive Gruppe
        </h3>
        <div className="flex flex-wrap gap-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600">
              <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {(u.full_name || u.email || '?')[0].toUpperCase()}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">{u.full_name || u.email}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {isToday ? 'Heutige Aufteilung' : `Aufteilung für Tag ${selectedRamadanDay}`}
          </h3>
          <button 
            onClick={openDistributeModal}
            disabled={generating}
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {assignments.length > 0 ? 'Neu verteilen' : 'Plan generieren'}
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {isToday ? 'Noch kein Leseplan für heute.' : `Noch kein Leseplan für Ramadan Tag ${selectedRamadanDay}.`}
            </p>
            <button 
              onClick={openDistributeModal}
              disabled={generating}
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md"
            >
              Jetzt generieren
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {sortedAssignments.map((assignment, index) => {
                const isMe = assignment.user_id === user?.id;
                const pageCount = assignment.end_page - assignment.start_page + 1;
                const colorClass = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
                
                return (
                  <div 
                    key={assignment.id} 
                    className={`relative p-5 rounded-xl border transition-all ${
                      assignment.is_completed 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                        : isMe 
                          ? 'bg-white dark:bg-gray-800 border-emerald-500 dark:border-emerald-600 shadow-md ring-1 ring-emerald-100 dark:ring-emerald-900/50' 
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      {/* Verschieben: Nach oben / Nach unten */}
                      <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={() => swapWithNeighbor(index, 'up')}
                          disabled={index === 0 || swapping !== null}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Nach oben (tauscht mit Person darüber)"
                        >
                          <ChevronUp size={20} />
                        </button>
                        <button
                          type="button"
                          onClick={() => swapWithNeighbor(index, 'down')}
                          disabled={index === sortedAssignments.length - 1 || swapping !== null}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Nach unten (tauscht mit Person darunter)"
                        >
                          <ChevronDown size={20} />
                        </button>
                      </div>

                      {/* Farbige Box für diese Person (Seitenbereich) */}
                      <div className="shrink-0 w-24 flex flex-col justify-center">
                        <div className={`h-10 rounded-lg ${colorClass} flex items-center justify-center text-white text-sm font-bold shadow-inner`}>
                          {pageCount} S.
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                          {assignment.start_page}–{assignment.end_page}
                        </p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-800 dark:text-gray-100">
                                {assignment.profiles.full_name || assignment.profiles.email}
                              </span>
                              {isMe && (
                                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                                  Du
                                </span>
                              )}
                            </div>
                            <div className="text-gray-600 dark:text-gray-300">
                              Seite <span className="font-bold text-gray-900 dark:text-gray-100">{assignment.start_page}</span> bis <span className="font-bold text-gray-900 dark:text-gray-100">{assignment.end_page}</span>
                            </div>
                          </div>

                          {isMe ? (
                            <button
                              onClick={() => toggleCompletion(assignment.id, assignment.is_completed)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shrink-0 ${
                                assignment.is_completed
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {assignment.is_completed ? (
                                <>
                                  <CheckCircle size={20} /> Erledigt
                                </>
                              ) : (
                                <>
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-400 dark:border-gray-500" />
                                  Offen
                                </>
                              )}
                            </button>
                          ) : (
                            <div className={`px-3 py-1 rounded-full text-sm font-medium shrink-0 ${
                              assignment.is_completed ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}>
                              {assignment.is_completed ? 'Fertig' : 'Offen'}
                            </div>
                          )}
                        </div>
                      </div>

                      {swapping === assignment.id && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-xl flex items-center justify-center">
                          <Loader2 size={24} className="animate-spin text-emerald-600" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal: Seitenanzahl pro Person beim Neuverteilen */}
      {showDistributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Wer wie viele Seiten? (Juz {selectedRamadanDay})
              </h3>
              <button
                type="button"
                onClick={() => setShowDistributeModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <p className="px-6 pt-2 text-sm text-gray-500 dark:text-gray-400">
              Gesamt: {totalPagesForJuz} Seiten. Die Summe pro Person muss genau {totalPagesForJuz} ergeben.
            </p>
            <div className="p-6 overflow-y-auto space-y-3">
              {users.map((u, idx) => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                    {(u.full_name || u.email || '?')[0].toUpperCase()}
                  </div>
                  <span className="flex-1 text-gray-800 dark:text-gray-200 truncate">{u.full_name || u.email}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={totalPagesForJuz}
                      value={pagesPerUser[idx] ?? 0}
                      onChange={(e) => setPageCountForUser(idx, e.target.valueAsNumber || 0)}
                      className="w-16 px-2 py-1.5 text-center border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Seiten</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
              <p className={`text-sm font-medium ${distributeValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                Summe: {distributeSum} {distributeValid ? '✓' : `(noch ${totalPagesForJuz - distributeSum})`}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDistributeModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={doGenerateAssignments}
                  disabled={!distributeValid}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Plan generieren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}