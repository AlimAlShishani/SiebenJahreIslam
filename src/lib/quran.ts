import { supabase } from './supabase';

export interface JuzAssignment {
  id: string;
  date: string;
  juz_number: number;
  assigned_user_id: string | null;
  is_completed: boolean;
  assigned_user?: {
    full_name: string;
    email: string;
  };
}

export async function getMyJuzForToday(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('juz_tracking')
    .select('*, assigned_user:profiles(full_name, email)')
    .eq('date', today)
    .eq('assigned_user_id', userId);

  if (error) throw error;
  return data as JuzAssignment[];
}

export async function getGroupProgressForToday() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('juz_tracking')
    .select('*, assigned_user:profiles(full_name, email)')
    .eq('date', today);

  if (error) throw error;
  return data as JuzAssignment[];
}

export async function markJuzAsCompleted(id: string, isCompleted: boolean) {
  const { error } = await supabase
    .from('juz_tracking')
    .update({ is_completed: isCompleted })
    .eq('id', id);

  if (error) throw error;
}

// Funktion um Juz für einen Tag zu generieren (Admin/System Funktion)
export async function generateDailyJuzAssignments(date: string) {
  // 1. Hole alle aktiven User
  const { data: users } = await supabase.from('profiles').select('id');
  
  if (!users || users.length === 0) return;

  const assignments = [];
  // Einfache Logik: Verteile 30 Juz auf die User
  // Wenn wir weniger als 30 User haben, müssen manche mehrere lesen.
  // Wenn wir mehr als 30 haben, haben manche frei (oder wir lesen mehrere Khatams).
  
  // Hier: Wir erstellen einfach 30 Einträge, und weisen sie Round-Robin zu.
  for (let i = 1; i <= 30; i++) {
    const userIndex = (i - 1) % users.length;
    assignments.push({
      date: date,
      juz_number: i,
      assigned_user_id: users[userIndex].id,
      is_completed: false
    });
  }

  const { error } = await supabase.from('juz_tracking').insert(assignments);
  if (error) console.error('Error generating assignments:', error);
}
