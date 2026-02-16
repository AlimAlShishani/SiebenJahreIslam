import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle, Circle, RefreshCw, Users, BookOpen } from 'lucide-react';

interface ReadingAssignment {
  id: string;
  date: string;
  juz_number: number;
  user_id: string;
  start_page: number;
  end_page: number;
  is_completed: boolean;
  user?: {
    full_name: string;
    email: string;
  };
}

export default function Quran() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ReadingAssignment[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Simulierter "Ramadan Tag" (1-30). 
  const [selectedDay, setSelectedDay] = useState(1); 

  // Helper to get real date for Ramadan 2026 (Starting Feb 18, 2026)
  const getRamadanDate = (day: number) => {
    const startDate = new Date('2026-02-18');
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + (day - 1));
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('full_name, email');
      if (data) setUsers(data);
    };
    fetchUsers();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    const dateKey = getRamadanDate(selectedDay);

    const { data, error } = await supabase
      .from('daily_reading_status')
      .select(`
        *,
        user:profiles(full_name, email)
      `)
      .eq('date', dateKey)
      .order('start_page');

    if (error) {
      console.error('Error fetching assignments:', error);
    } else {
      setAssignments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, [selectedDay]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Lade Koran-Plan...</div>;
  }

  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('daily_reading_status')
      .update({ is_completed: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      alert('Fehler beim Speichern: ' + error.message);
    } else {
      fetchAssignments();
    }
  };

  const generateAssignments = async () => {
    setGenerating(true);
    try {
      const dateKey = getRamadanDate(selectedDay);
      
      // 1. Hole alle User
      const { data: users } = await supabase.from('profiles').select('id');
      
      if (!users || users.length === 0) {
        alert('Keine Benutzer gefunden!');
        return;
      }

      // 2. Berechne Aufteilung
      // Standard: 1 Juz = 20 Seiten.
      // Juz 1: Seite 1-20. Juz 2: Seite 21-40.
      // Startseite des Juz = (Tag - 1) * 20 + 1
      const pagesPerJuz = 20;
      const juzStartPage = (selectedDay - 1) * pagesPerJuz + 1;
      
      const totalUsers = users.length;
      
      // Wir runden oder verteilen Reste. Einfachheitshalber: Math.floor und der letzte kriegt den Rest.
      const basePages = Math.floor(pagesPerJuz / totalUsers);
      const remainder = pagesPerJuz % totalUsers;

      const newAssignments = [];
      let currentPage = juzStartPage;

      for (let i = 0; i < totalUsers; i++) {
        // Verteile den Rest auf die ersten 'remainder' User
        const extraPage = i < remainder ? 1 : 0;
        const myPagesCount = basePages + extraPage;
        
        if (myPagesCount === 0) continue; 

        const start = currentPage;
        const end = currentPage + myPagesCount - 1;
        
        newAssignments.push({
          date: dateKey,
          juz_number: selectedDay, // Tag 1 = Juz 1
          user_id: users[i].id,
          start_page: start,
          end_page: end,
          is_completed: false
        });

        currentPage = end + 1;
      }

      // Lösche alte Einträge für diesen Tag (falls neu generiert wird)
      await supabase.from('daily_reading_status').delete().eq('date', dateKey);

      const { error } = await supabase.from('daily_reading_status').insert(newAssignments);
      if (error) throw error;
      
      fetchAssignments();
    } catch (error: any) {
      console.error('Error generating assignments:', error);
      alert('Fehler beim Generieren: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const myAssignment = assignments.find(a => a.user_id === user?.id);
  const completedCount = assignments.filter(a => a.is_completed).length;
  const progressPercentage = assignments.length > 0 ? (completedCount / assignments.length) * 100 : 0;

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-emerald-800 flex items-center gap-2">
            <BookOpen className="text-emerald-600" />
            Koran-Leseplan
          </h2>
          <p className="text-gray-500">Gemeinsam den Koran lesen</p>
        </div>
        
        {/* Tag Auswahl */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
          <span className="text-sm font-medium text-gray-600 pl-2">Tag:</span>
          <select 
            value={selectedDay} 
            onChange={(e) => setSelectedDay(parseInt(e.target.value))}
            className="border-none bg-transparent font-bold text-emerald-700 focus:ring-0 cursor-pointer"
          >
            {[...Array(30)].map((_, i) => (
              <option key={i+1} value={i+1}>{i+1}. Ramadan (Juz {i+1})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
          <Users size={16} /> Aktive Gruppe ({users.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {users.map((u, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                {(u.full_name || u.email || '?')[0].toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 font-medium">
                {u.full_name || u.email?.split('@')[0] || 'Unbekannt'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Gruppen-Fortschritt */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users size={20} className="text-emerald-500" />
            Tagesfortschritt (Juz {selectedDay})
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              {completedCount} / {assignments.length} erledigt
            </span>
            {assignments.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Möchtest du den Plan für diesen Tag wirklich neu generieren? Der aktuelle Fortschritt für diesen Tag geht verloren.')) {
                    generateAssignments();
                  }
                }}
                disabled={generating}
                className="text-xs text-gray-400 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                title="Plan neu verteilen"
              >
                <RefreshCw size={14} className={generating ? 'animate-spin' : ''} /> Neu verteilen
              </button>
            )}
          </div>
        </div>
        
        <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
          <div 
            className="bg-emerald-500 h-4 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        {assignments.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">Noch kein Plan für diesen Tag erstellt.</p>
            <button 
              onClick={generateAssignments} 
              disabled={generating}
              className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
            >
              <RefreshCw size={18} className={generating ? 'animate-spin' : ''} />
              Plan jetzt generieren
            </button>
            <p className="text-xs text-gray-400 mt-2">
              (Verteilt Juz {selectedDay} automatisch auf alle registrierten Nutzer)
            </p>
          </div>
        )}
      </div>

      {/* Meine Aufgabe */}
      {myAssignment && (
        <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-xl border border-emerald-200 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full -mr-16 -mt-16 opacity-50 blur-2xl"></div>
          
          <h3 className="text-xl font-bold text-emerald-900 mb-4 relative z-10">Deine Aufgabe heute</h3>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
            <div className="text-center md:text-left">
              <div className="text-4xl font-bold text-emerald-600 mb-1">
                Seite {myAssignment.start_page} - {myAssignment.end_page}
              </div>
              <p className="text-emerald-800 font-medium">
                Juz {myAssignment.juz_number}
              </p>
            </div>

            <button 
              onClick={() => handleToggleComplete(myAssignment.id, myAssignment.is_completed)}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all transform active:scale-95 shadow-sm ${
                myAssignment.is_completed 
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                  : 'bg-white text-gray-500 border-2 border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
              }`}
            >
              {myAssignment.is_completed ? (
                <>
                  <CheckCircle size={28} />
                  <span className="font-bold text-lg">Erledigt</span>
                </>
              ) : (
                <>
                  <Circle size={28} />
                  <span className="font-bold text-lg">Als erledigt markieren</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Liste aller Zuteilungen */}
      {assignments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Aufgaben der Gruppe</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map(assignment => (
              <div 
                key={assignment.id} 
                className={`p-4 rounded-lg border flex justify-between items-center transition-all ${
                  assignment.is_completed 
                    ? 'bg-emerald-50/50 border-emerald-100 opacity-75' 
                    : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="font-bold text-gray-800 flex items-center gap-2">
                    {assignment.user?.full_name || assignment.user?.email?.split('@')[0] || 'Unbekannt'}
                    {assignment.user_id === user?.id && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Du</span>}
                  </div>
                  <div className="text-sm text-gray-500">
                    Seite {assignment.start_page} - {assignment.end_page}
                  </div>
                </div>
                
                {assignment.is_completed ? (
                  <div className="text-emerald-500 flex items-center gap-1 text-sm font-medium bg-white px-2 py-1 rounded-full shadow-sm">
                    <CheckCircle size={14} /> Fertig
                  </div>
                ) : (
                   <div className="text-gray-400 flex items-center gap-1 text-sm">
                    <Circle size={14} /> Offen
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}