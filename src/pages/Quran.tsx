import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, Calendar, CheckCircle, RefreshCw, Loader2, X, UserPlus, UserMinus, Settings2 } from 'lucide-react';

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
  const [distributionUsers, setDistributionUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInGroup, setIsInGroup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showManageGroupModal, setShowManageGroupModal] = useState(false);
  const [allProfilesForManage, setAllProfilesForManage] = useState<any[]>([]);
  const [managingGroup, setManagingGroup] = useState(false);
  const [pagesPerUser, setPagesPerUser] = useState<number[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

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
      // 1. Lese-Gruppe: nur Nutzer aus reading_group_members
      const { data: memberRows } = await supabase
        .from('reading_group_members')
        .select('user_id');
      const groupIds = memberRows?.map((r: { user_id: string }) => r.user_id) ?? [];
      setIsInGroup(!!user?.id && groupIds.includes(user.id));
      if (groupIds.length > 0) {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .in('id', groupIds);
        setUsers(usersData || []);
      } else {
        setUsers([]);
      }

      // Admin erkennen (eigener Profil-Eintrag)
      const { data: meProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
      setIsAdmin(meProfile?.role === 'admin');

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

  const getDefaultPagesPerUser = (count: number): number[] => {
    const { length: totalPages } = getJuzPageInfo(selectedRamadanDay);
    if (count === 0) return [];
    const base = Math.floor(totalPages / count);
    const remainder = totalPages % count;
    return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
  };

  const openDistributeModal = () => {
    if (!isAdmin) return;
    if (users.length === 0) return;
    if (
      assignments.length > 0 &&
      !window.confirm(
        `Es existiert bereits ein Plan für Tag ${selectedRamadanDay}. Neu verteilen? Der alte Fortschritt geht verloren.`
      )
    )
      return;

    // Immer aktuelle Lese-Gruppe verwenden (nicht nur aus alten Zuweisungen)
    setDistributionUsers(users);
    setPagesPerUser(getDefaultPagesPerUser(users.length));

    setShowDistributeModal(true);
  };

  const openManageGroupModal = async () => {
    if (!isAdmin) return;
    setManagingGroup(true);
    setShowManageGroupModal(true);
    try {
      const { data } = await supabase.from('profiles').select('id, email, full_name');
      setAllProfilesForManage(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setManagingGroup(false);
    }
  };

  const addToGroup = async (userId: string) => {
    try {
      await supabase.from('reading_group_members').insert({ user_id: userId });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const removeFromGroup = async (userId: string) => {
    try {
      await supabase.from('reading_group_members').delete().eq('user_id', userId);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const totalPagesForJuz = getJuzPageInfo(selectedRamadanDay).length;
  const distributeSum = pagesPerUser.reduce((a, b) => a + b, 0);
  const distributeValid =
    pagesPerUser.length === distributionUsers.length &&
    distributeSum === totalPagesForJuz &&
    pagesPerUser.every((p) => p >= 0);

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

      for (let i = 0; i < distributionUsers.length; i++) {
        const count = pagesPerUser[i] ?? 0;
        if (count <= 0) continue;
        const start = currentPage;
        const end = currentPage + count - 1;
        newAssignments.push({
          date: selectedDateStr,
          juz_number: juzNumber,
          user_id: distributionUsers[i].id,
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

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;

    setDistributionUsers((prev) => {
      const updated = [...prev];
      const [movedUser] = updated.splice(dragIndex, 1);
      updated.splice(targetIndex, 0, movedUser);
      return updated;
    });

    setPagesPerUser((prev) => {
      const updated = [...prev];
      const [movedPages] = updated.splice(dragIndex, 1);
      updated.splice(targetIndex, 0, movedPages);
      return updated;
    });

    setDragIndex(null);
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

  const sortedAssignments = [...assignments].sort((a, b) => a.start_page - b.start_page);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-8 pb-20 min-w-0 max-w-full overflow-x-hidden">
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
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Users size={20} className="text-emerald-600 dark:text-emerald-400" /> Aktive Gruppe
          </h3>
          {isAdmin && isInGroup && (
            <button
              type="button"
              onClick={openManageGroupModal}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <Settings2 size={16} /> Gruppe verwalten
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isInGroup ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Du bist nicht in der Lese-Gruppe. Kontaktiere einen Admin, um hinzugefügt zu werden.</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Noch niemand in der Lese-Gruppe. {isAdmin && 'Nutze „Gruppe verwalten“, um dich und andere hinzuzufügen.'}</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600">
                <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {(u.full_name || u.email || '?')[0].toUpperCase()}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">{u.full_name || u.email}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assignments List – nur für Gruppenmitglieder */}
      {isInGroup && (
      <div className="space-y-4 min-w-0 max-w-full">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 min-w-0">
            {isToday ? 'Heutige Aufteilung' : `Aufteilung für Tag ${selectedRamadanDay}`}
          </h3>
          {isAdmin && (
            <button 
              onClick={openDistributeModal}
              disabled={generating}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {assignments.length > 0 ? 'Neu verteilen' : 'Plan generieren'}
            </button>
          )}
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {isToday ? 'Noch kein Leseplan für heute.' : `Noch kein Leseplan für Ramadan Tag ${selectedRamadanDay}.`}
            </p>
            {isAdmin && (
              <button 
                onClick={openDistributeModal}
                disabled={generating}
                className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md"
              >
                Jetzt generieren
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-4 min-w-0 max-w-full">
              {sortedAssignments.map((assignment, index) => {
                const isMe = assignment.user_id === user?.id;
                const canToggle = isMe || isAdmin;
                const pageCount = assignment.end_page - assignment.start_page + 1;
                const colorClass = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
                
                return (
                  <div 
                    key={assignment.id} 
                    className={`relative min-w-0 max-w-full p-4 sm:p-5 rounded-xl border transition-all overflow-hidden ${
                      assignment.is_completed 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                        : isMe 
                          ? 'bg-white dark:bg-gray-800 border-emerald-500 dark:border-emerald-600 shadow-md ring-1 ring-emerald-100 dark:ring-emerald-900/50' 
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex gap-2 sm:gap-3 items-start min-w-0">
                      {/* Farbige Box für diese Person (Seitenbereich) */}
                      <div className="shrink-0 w-14 sm:w-24 flex flex-col justify-center">
                        <div className={`h-9 sm:h-10 rounded-lg ${colorClass} flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-inner`}>
                          {pageCount} S.
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                          {assignment.start_page}–{assignment.end_page}
                        </p>
                      </div>

                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex justify-between items-start gap-2 min-w-0">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 min-w-0">
                              <span className="font-bold text-gray-800 dark:text-gray-100 truncate block" title={assignment.profiles.full_name || assignment.profiles.email}>
                                {assignment.profiles.full_name || assignment.profiles.email}
                              </span>
                              {isMe && (
                                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                                  Du
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                              Seite <span className="font-bold text-gray-900 dark:text-gray-100">{assignment.start_page}</span> bis <span className="font-bold text-gray-900 dark:text-gray-100">{assignment.end_page}</span>
                            </p>
                          </div>

                          {canToggle ? (
                            <button
                              onClick={() => toggleCompletion(assignment.id, assignment.is_completed)}
                              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold transition-all shrink-0 text-sm ${
                                assignment.is_completed
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {assignment.is_completed ? (
                                <>
                                  <CheckCircle size={18} className="sm:w-5 sm:h-5" /> Erledigt
                                </>
                              ) : (
                                <>
                                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-gray-400 dark:border-gray-500 shrink-0" />
                                  <span>Offen</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shrink-0 ${
                              assignment.is_completed ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}>
                              {assignment.is_completed ? 'Fertig' : 'Offen'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      )}

      {/* Modal: Seitenanzahl pro Person beim Neuverteilen */}
      {isAdmin && isInGroup && showDistributeModal && (
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
              {distributionUsers.map((u, idx) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 cursor-move rounded-lg border border-transparent hover:border-emerald-300 dark:hover:border-emerald-600 bg-transparent"
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(idx)}
                >
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

      {/* Modal: Lese-Gruppe verwalten (nur Admin, nur wenn selbst in der Gruppe) */}
      {isAdmin && isInGroup && showManageGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Lese-Gruppe verwalten
              </h3>
              <button
                type="button"
                onClick={() => setShowManageGroupModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <p className="px-6 pt-2 text-sm text-gray-500 dark:text-gray-400">
              Nur Nutzer in der Lese-Gruppe erscheinen bei „Aktive Gruppe“ und können in den Plan.
            </p>
            <div className="p-6 overflow-y-auto space-y-2">
              {managingGroup ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>
              ) : (
                allProfilesForManage.map((p) => {
                  const inGroup = users.some((u) => u.id === p.id);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                          {(p.full_name || p.email || '?')[0].toUpperCase()}
                        </div>
                        <span className="text-gray-800 dark:text-gray-200 truncate">{p.full_name || p.email}</span>
                        {inGroup && (
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full shrink-0">
                            In Gruppe
                          </span>
                        )}
                      </div>
                      {inGroup ? (
                        <button
                          type="button"
                          onClick={() => removeFromGroup(p.id)}
                          className="flex items-center gap-1 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium shrink-0"
                        >
                          <UserMinus size={16} /> Entfernen
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToGroup(p.id)}
                          className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium shrink-0"
                        >
                          <UserPlus size={16} /> Hinzufügen
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}