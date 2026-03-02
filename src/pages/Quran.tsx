import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, Calendar, CheckCircle, RefreshCw, Loader2, X, UserPlus, UserMinus, Settings2, History } from 'lucide-react';
import { ReadingAudioCell } from '../components/ReadingAudioCell';

const VOTE_OPTIONS = ['20', '21', '22', '23', '0', '1', 'nachlesen', 'abgeben'] as const;
type VoteValue = typeof VOTE_OPTIONS[number];
const VOTE_ORDER: VoteValue[] = ['20', '21', '22', '23', '0', '1', 'nachlesen', 'abgeben'];

interface DailyReadingVote {
  id: string;
  date: string;
  user_id: string;
  vote: VoteValue[];
  profiles?: { full_name: string | null; email: string };
}

interface DailyAssignment {
  id: string;
  date: string;
  juz_number: number;
  user_id: string;
  start_page: number;
  end_page: number;
  is_completed: boolean;
  audio_url: string | null;
  audio_urls?: string[] | null;
  profiles: {
    full_name: string | null;
    email: string;
  };
}

interface ReadingActivityLog {
  id: string;
  date: string;
  juz_number: number;
  activity_type: string;
  actor_user_id: string;
  assignment_user_id: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string } | null;
}

type QuranPageCache = {
  selectedRamadanDay: number;
  assignments: DailyAssignment[];
  users: any[];
  isAdmin: boolean;
  isInGroup: boolean;
  groupMemberIds: string[];
  votesForDay: DailyReadingVote[];
  activityLogs: ReadingActivityLog[];
  loadedKey: string | null;
  scrollY: number;
};

const QURAN_CACHE_KEY = 'quran_page_cache_v1';

const readQuranPageCache = (): QuranPageCache | null => {
  try {
    const raw = window.sessionStorage.getItem(QURAN_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QuranPageCache;
  } catch {
    return null;
  }
};

let quranPageCache: QuranPageCache | null = typeof window !== 'undefined' ? readQuranPageCache() : null;

export default function Quran() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<DailyAssignment[]>(() => quranPageCache?.assignments ?? []);
  const [users, setUsers] = useState<any[]>(() => quranPageCache?.users ?? []);
  const [distributionUsers, setDistributionUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(() => quranPageCache?.isAdmin ?? false);
  const [isInGroup, setIsInGroup] = useState(() => quranPageCache?.isInGroup ?? false);
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>(() => quranPageCache?.groupMemberIds ?? []);
  const [loading, setLoading] = useState(() => !quranPageCache);
  const [generating, setGenerating] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showManageGroupModal, setShowManageGroupModal] = useState(false);
  const [allProfilesForManage, setAllProfilesForManage] = useState<any[]>([]);
  const [managingGroup, setManagingGroup] = useState(false);
  const [pagesPerUser, setPagesPerUser] = useState<number[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // Voting (nur wenn in Gruppe)
  const [votesForDay, setVotesForDay] = useState<DailyReadingVote[]>(() => quranPageCache?.votesForDay ?? []);
  const [activityLogs, setActivityLogs] = useState<ReadingActivityLog[]>(() => quranPageCache?.activityLogs ?? []);
  const [savingVote, setSavingVote] = useState(false);
  const [showAbgebenAssignModal, setShowAbgebenAssignModal] = useState(false);
  const [abgebenAssignData, setAbgebenAssignData] = useState<{
    orderedUsers: { id: string; full_name: string | null; email: string; reader_language?: string | null }[];
    abgebenUsers: { user: { id: string; full_name: string | null; email: string; reader_language?: string | null }; pages: number }[];
    totalPages: number;
  } | null>(null);
  const [abgebenRecipients, setAbgebenRecipients] = useState<Record<string, string>>({});
  const [showArabic3Modal, setShowArabic3Modal] = useState(false);
  const [arabic3ModalData, setArabic3ModalData] = useState<{
    orderedUsers: { id: string; full_name: string | null; email: string; reader_language?: string | null }[];
    pagesPerUser: number[];
    totalPages: number;
    abgebenAssignments: { abgebenUserId: string; pages: number; recipientUserId: string }[];
  } | null>(null);
  const [arabic3SelectedUserId, setArabic3SelectedUserId] = useState<string>('');
  const [arabic3InDistributeUserId, setArabic3InDistributeUserId] = useState<string | null>(null);

  const normalizeVoteSelections = (value: unknown): VoteValue[] => {
    const allowed = new Set<string>(VOTE_OPTIONS);
    if (Array.isArray(value)) {
      return value.filter((v): v is VoteValue => typeof v === 'string' && allowed.has(v));
    }
    if (typeof value === 'string') {
      if (allowed.has(value)) return [value as VoteValue];
      try {
        const parsed = JSON.parse(value) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.filter((v): v is VoteValue => typeof v === 'string' && allowed.has(v));
        }
      } catch {
        /* ignore */
      }
    }
    return [];
  };

  const formatVoteLabel = (vote: VoteValue) => (vote === '0' || vote === '1' ? `${vote} Uhr` : vote);
  const formatActivityTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  const getEarliestVote = (votes: VoteValue[]): VoteValue | null => {
    if (votes.length === 0) return null;
    const unique = Array.from(new Set(votes));
    unique.sort((a, b) => VOTE_ORDER.indexOf(a) - VOTE_ORDER.indexOf(b));
    return unique[0] ?? null;
  };

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

  const [selectedRamadanDay, setSelectedRamadanDay] = useState(() => quranPageCache?.selectedRamadanDay ?? getRamadanDay());
  const selectedDateStr = getDateForRamadanDay(selectedRamadanDay);
  const isToday = selectedRamadanDay === getRamadanDay();
  const loadedKeyRef = useRef<string | null>(quranPageCache?.loadedKey ?? null);
  const firstLoadDoneRef = useRef<boolean>(!!quranPageCache);

  useLayoutEffect(() => {
    if (quranPageCache?.scrollY) {
      window.scrollTo(0, quranPageCache.scrollY);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (quranPageCache) {
        quranPageCache.scrollY = window.scrollY;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    quranPageCache = {
      selectedRamadanDay,
      assignments,
      users,
      isAdmin,
      isInGroup,
      groupMemberIds,
      votesForDay,
      activityLogs,
      loadedKey: loadedKeyRef.current,
      scrollY: window.scrollY,
    };
    try {
      window.sessionStorage.setItem(QURAN_CACHE_KEY, JSON.stringify(quranPageCache));
    } catch {
      // ignore sessionStorage errors
    }
  }, [selectedRamadanDay, assignments, users, isAdmin, isInGroup, groupMemberIds, votesForDay, activityLogs]);

  useEffect(() => {
    const showLoading = !firstLoadDoneRef.current;
    fetchData({ showLoading });
  }, [user?.id, selectedRamadanDay]);

  const fetchData = async (opts?: { silent?: boolean; showLoading?: boolean }) => {
    const key = `${user?.id ?? ''}-${selectedRamadanDay}`;
    const shouldShowLoading = !!opts?.showLoading && !opts?.silent;
    if (shouldShowLoading) setLoading(true);
    try {
      // 1. Lese-Gruppe: nur Nutzer aus reading_group_members
      const { data: memberRows } = await supabase
        .from('reading_group_members')
        .select('user_id');
      const groupIds = memberRows?.map((r: { user_id: string }) => r.user_id) ?? [];
      setGroupMemberIds(groupIds);
      const userInGroup = !!user?.id && groupIds.includes(user.id);
      setIsInGroup(userInGroup);
      if (groupIds.length > 0) {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .in('id', groupIds);
        const { data: settingsData } = await supabase
          .from('reading_group_member_settings')
          .select('user_id, reader_language')
          .in('user_id', groupIds);
        const settingsMap = new Map((settingsData || []).map((s: { user_id: string; reader_language: string | null }) => [s.user_id, s.reader_language]));
        const usersWithLang = (usersData || []).map((u: { id: string; email: string; full_name: string | null; role: string }) => ({
          ...u,
          reader_language: settingsMap.get(u.id) ?? null
        }));
        setUsers(usersWithLang);
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
      setAssignments((assignmentsData || []).map((a: any) => ({
        ...a,
        audio_urls: Array.isArray(a.audio_urls) && a.audio_urls.length > 0 ? a.audio_urls : (a.audio_url ? [a.audio_url] : [])
      })));

      // 3. Votes für diesen Tag (nur wenn in Gruppe) – userInGroup nutzen, nicht State (State ist beim ersten Laden noch falsch)
      if (userInGroup) {
        const { data: votesData } = await supabase
          .from('daily_reading_votes')
          .select('id, date, user_id, vote, profiles(full_name, email)')
          .eq('date', selectedDateStr);
        const normalizedVotes: DailyReadingVote[] = (votesData || []).map((v: any) => ({
          ...v,
          vote: normalizeVoteSelections(v.vote),
          profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles
        }));
        setVotesForDay(normalizedVotes);

        const { data: activityData } = await supabase
          .from('reading_activity_logs')
          .select('id, date, juz_number, activity_type, actor_user_id, assignment_user_id, created_at, profiles!reading_activity_logs_actor_user_id_fkey(full_name, email)')
          .eq('date', selectedDateStr)
          .order('created_at', { ascending: false })
          .limit(50);
        const normalizedActivity: ReadingActivityLog[] = (activityData || []).map((x: any) => ({
          ...x,
          profiles: Array.isArray(x.profiles) ? x.profiles[0] : x.profiles
        }));
        setActivityLogs(normalizedActivity);
      } else {
        setVotesForDay([]);
        setActivityLogs([]);
      }

    } catch (error) {
      console.error('Error fetching Quran data:', error);
    } finally {
      if (shouldShowLoading) setLoading(false);
      loadedKeyRef.current = key;
      firstLoadDoneRef.current = true;
      if (quranPageCache) quranPageCache.loadedKey = key;
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

  /** 2 Seiten für Arabisch, 3 für Deutsch/null; Ausgleich so dass Summe = totalPages. */
  const getPagesByReaderLanguage = (
    userList: { id: string; reader_language?: string | null }[],
    totalPages: number
  ): number[] => {
    if (userList.length === 0) return [];
    let pages = userList.map((u) => (u.reader_language === 'ar' ? 2 : 3));
    let sum = pages.reduce((a, b) => a + b, 0);
    const arIndices = userList.map((u, i) => (u.reader_language === 'ar' ? i : -1)).filter((i) => i >= 0);
    while (sum < totalPages && arIndices.length > 0) {
      const idx = arIndices[sum % arIndices.length];
      pages[idx] += 1;
      sum += 1;
    }
    while (sum > totalPages) {
      const reduced = pages.findIndex((p, i) => userList[i].reader_language === 'ar' && p > 1);
      if (reduced >= 0) {
        pages[reduced] -= 1;
        sum -= 1;
      } else {
        const deReduced = pages.findIndex((p, i) => userList[i].reader_language !== 'ar' && p > 2);
        if (deReduced >= 0) {
          pages[deReduced] -= 1;
          sum -= 1;
        } else break;
        }
      }
    return pages;
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

    const totalPages = getJuzPageInfo(selectedRamadanDay).length;
    const initialPages = getPagesByReaderLanguage(users, totalPages);
    setDistributionUsers(users);
    setPagesPerUser(initialPages);
    const arWith3Idx = users.findIndex((u, i) => u.reader_language === 'ar' && (initialPages[i] ?? 0) === 3);
    setArabic3InDistributeUserId(arWith3Idx >= 0 ? users[arWith3Idx].id : null);

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

  const setReaderLanguage = async (userId: string, value: 'ar' | 'de' | null) => {
    try {
      if (value === null) {
        await supabase.from('reading_group_member_settings').delete().eq('user_id', userId);
      } else {
        await supabase.from('reading_group_member_settings').upsert(
          { user_id: userId, reader_language: value, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      }
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
      const { data: existing } = await supabase
        .from('daily_reading_status')
        .select('user_id, audio_url, audio_urls')
        .eq('date', selectedDateStr);
      const audioUrlsByUser = new Map<string, string[]>();
      for (const row of existing ?? []) {
        const urls = Array.isArray((row as any).audio_urls) && (row as any).audio_urls.length > 0
          ? (row as any).audio_urls
          : (row.audio_url ? [row.audio_url] : []);
        if (urls.length > 0) audioUrlsByUser.set(row.user_id, urls);
      }

      await supabase
        .from('daily_reading_status')
        .delete()
        .eq('date', selectedDateStr);

      const juzNumber = selectedRamadanDay;
      const { start: juzStartPage } = getJuzPageInfo(juzNumber);
      let currentPage = juzStartPage;
      const newAssignments: { date: string; juz_number: number; user_id: string; start_page: number; end_page: number; is_completed: boolean; audio_urls?: string[] }[] = [];

      for (let i = 0; i < distributionUsers.length; i++) {
        const count = pagesPerUser[i] ?? 0;
        if (count <= 0) continue;
        const start = currentPage;
        const end = currentPage + count - 1;
        const userId = distributionUsers[i].id;
        newAssignments.push({
          date: selectedDateStr,
          juz_number: juzNumber,
          user_id: userId,
          start_page: start,
          end_page: end,
          is_completed: false,
          audio_urls: audioUrlsByUser.get(userId) ?? []
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

  const openPlanFromVotesOrModal = async () => {
    if (!isAdmin || !isInGroup || !user) return;
    setGenerating(true);
    try {
      const { data: votesData } = await supabase
        .from('daily_reading_votes')
        .select('user_id, vote')
        .eq('date', selectedDateStr);
      const votesByUser = new Map<string, VoteValue[]>();
      for (const row of (votesData || []) as { user_id: string; vote: VoteValue[] | VoteValue }[]) {
        const normalized = normalizeVoteSelections(row.vote);
        if (normalized.length === 0) continue;
        votesByUser.set(row.user_id, normalized);
      }
      const votedNonAbgeben = Array.from(votesByUser.entries())
        .map(([user_id, voteList]) => ({ user_id, earliestVote: getEarliestVote(voteList) }))
        .filter((v): v is { user_id: string; earliestVote: VoteValue } => !!v.earliestVote && v.earliestVote !== 'abgeben')
        .sort(
          (a, b) => VOTE_ORDER.indexOf(a.earliestVote) - VOTE_ORDER.indexOf(b.earliestVote) || a.user_id.localeCompare(b.user_id)
        );
      const votedAbgeben = Array.from(votesByUser.entries())
        .map(([user_id, voteList]) => ({ user_id, earliestVote: getEarliestVote(voteList) }))
        .filter((v): v is { user_id: string; earliestVote: VoteValue } => v.earliestVote === 'abgeben');
      const orderedIds = [...votedNonAbgeben.map((v) => v.user_id)];
      const nonVoterIds = users.filter((u) => !votesByUser.has(u.id)).map((u) => u.id);
      orderedIds.push(...nonVoterIds);
      const orderedUsers = orderedIds.map((id) => users.find((u) => u.id === id)).filter((u): u is (typeof users)[0] => !!u);
      const totalPages = getJuzPageInfo(selectedRamadanDay).length;
      const abgebenUsers: { user: (typeof users)[0]; pages: number }[] = votedAbgeben
        .map((v) => {
          const u = users.find((x) => x.id === v.user_id);
          return u ? { user: u, pages: u.reader_language === 'ar' ? 2 : 3 } : null;
        })
        .filter((x): x is { user: (typeof users)[0]; pages: number } => !!x);

      if (abgebenUsers.length > 0) {
        if (orderedUsers.length === 0) {
          alert('Alle haben „abgeben“ gewählt. Es gibt niemanden, dem die Seiten zugeteilt werden können. Bitte manuell verteilen.');
          return;
        }
        setAbgebenRecipients(
          Object.fromEntries(abgebenUsers.map((a) => [a.user.id, orderedUsers[0]?.id ?? '']))
        );
        setAbgebenAssignData({ orderedUsers, abgebenUsers, totalPages });
        setShowAbgebenAssignModal(true);
      } else {
        await applyPlanFromVotes(orderedUsers, totalPages, []);
      }
    } catch (error) {
      console.error('Error preparing plan from votes:', error);
      alert('Fehler beim Erzeugen des Plans aus Votes.');
    } finally {
      setGenerating(false);
    }
  };

  const doInsertPlanFromVotes = async (
    orderedUsers: { id: string; full_name: string | null; email: string; reader_language?: string | null }[],
    pagesPerUser: number[]
  ) => {
    const { data: existing } = await supabase
      .from('daily_reading_status')
      .select('user_id, audio_url, audio_urls')
      .eq('date', selectedDateStr);
    const audioUrlsByUser = new Map<string, string[]>();
    for (const row of existing ?? []) {
      const urls = Array.isArray((row as any).audio_urls) && (row as any).audio_urls.length > 0
        ? (row as any).audio_urls
        : (row.audio_url ? [row.audio_url] : []);
      if (urls.length > 0) audioUrlsByUser.set(row.user_id, urls);
    }

    await supabase.from('daily_reading_status').delete().eq('date', selectedDateStr);
    const juzNumber = selectedRamadanDay;
    const { start: juzStartPage } = getJuzPageInfo(juzNumber);
    let currentPage = juzStartPage;
    const newAssignments: { date: string; juz_number: number; user_id: string; start_page: number; end_page: number; is_completed: boolean; audio_urls?: string[] }[] = [];
    for (let i = 0; i < orderedUsers.length; i++) {
      const count = pagesPerUser[i] ?? 0;
      if (count <= 0) continue;
      const start = currentPage;
      const end = currentPage + count - 1;
      const userId = orderedUsers[i].id;
      newAssignments.push({
        date: selectedDateStr,
        juz_number: juzNumber,
        user_id: userId,
        start_page: start,
        end_page: end,
        is_completed: false,
        audio_urls: audioUrlsByUser.get(userId) ?? []
      });
      currentPage = end + 1;
    }
    if (newAssignments.length > 0) {
      const { error } = await supabase.from('daily_reading_status').insert(newAssignments);
      if (error) throw error;
    }
  };

  const applyPlanFromVotes = async (
    orderedUsers: { id: string; full_name: string | null; email: string; reader_language?: string | null }[],
    totalPages: number,
    abgebenAssignments: { abgebenUserId: string; pages: number; recipientUserId: string }[]
  ) => {
    setGenerating(true);
    try {
      const baseTotal = totalPages - abgebenAssignments.reduce((s, a) => s + a.pages, 0);
      let pagesPerUser = getPagesByReaderLanguage(orderedUsers, baseTotal);
      for (const { recipientUserId, pages } of abgebenAssignments) {
        const idx = orderedUsers.findIndex((u) => u.id === recipientUserId);
        if (idx >= 0) pagesPerUser[idx] = (pagesPerUser[idx] ?? 0) + pages;
      }

      const arWith3 = orderedUsers
        .map((u, i) => ({ u, i, pages: pagesPerUser[i] ?? 0 }))
        .filter((x) => x.u.reader_language === 'ar' && x.pages === 3);
      if (arWith3.length >= 1) {
        setShowAbgebenAssignModal(false);
        setAbgebenAssignData(null);
        setAbgebenRecipients({});
        setArabic3ModalData({ orderedUsers, pagesPerUser, totalPages, abgebenAssignments });
        setArabic3SelectedUserId(arWith3[0].u.id);
        setShowArabic3Modal(true);
        setGenerating(false);
        return;
      }

      await doInsertPlanFromVotes(orderedUsers, pagesPerUser);
      setShowAbgebenAssignModal(false);
      setAbgebenAssignData(null);
      setAbgebenRecipients({});
      await fetchData();
    } catch (error) {
      console.error('Error generating plan from votes:', error);
      alert('Fehler beim Erzeugen des Plans aus Votes.');
    } finally {
      setGenerating(false);
    }
  };

  const confirmArabic3AndGenerate = async () => {
    if (!arabic3ModalData) return;
    const { orderedUsers, pagesPerUser, totalPages } = arabic3ModalData;
    const pages = [...pagesPerUser];
    const arIndices = orderedUsers.map((u, i) => ({ i, u })).filter((x) => x.u.reader_language === 'ar');
    const selectedIndex = orderedUsers.findIndex((u) => u.id === arabic3SelectedUserId);
    if (selectedIndex >= 0 && orderedUsers[selectedIndex].reader_language === 'ar') {
      arIndices.forEach(({ i }) => { pages[i] = 2; });
      pages[selectedIndex] = 3;
      const sum = pages.reduce((a, b) => a + b, 0);
      if (sum < totalPages) {
        const deIdx = orderedUsers.findIndex((u, i) => u.reader_language !== 'ar' && (pages[i] ?? 0) > 0);
        if (deIdx >= 0) pages[deIdx] = (pages[deIdx] ?? 0) + (totalPages - sum);
      }
    }
    setGenerating(true);
    try {
      await doInsertPlanFromVotes(orderedUsers, pages);
      setShowArabic3Modal(false);
      setArabic3ModalData(null);
      setArabic3SelectedUserId('');
      await fetchData();
    } catch (error) {
      console.error('Error generating plan from votes:', error);
      alert('Fehler beim Erzeugen des Plans aus Votes.');
    } finally {
      setGenerating(false);
    }
  };

  const confirmAbgebenAssignAndGenerate = async () => {
    if (!abgebenAssignData) return;
    const { orderedUsers, abgebenUsers, totalPages } = abgebenAssignData;
    const abgebenAssignments = abgebenUsers.map((a) => ({
      abgebenUserId: a.user.id,
      pages: a.pages,
      recipientUserId: abgebenRecipients[a.user.id] || orderedUsers[0]?.id
    })).filter((a) => a.recipientUserId);
    await applyPlanFromVotes(orderedUsers, totalPages, abgebenAssignments);
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
  const myVotes = votesForDay.find((v) => v.user_id === user?.id)?.vote ?? [];

  const saveVote = async (vote: VoteValue) => {
    if (!user?.id) return;
    setSavingVote(true);
    try {
      let nextVotes: VoteValue[];
      if (vote === 'nachlesen' || vote === 'abgeben') {
        nextVotes = [vote];
      } else {
        const current = new Set(myVotes);
        current.delete('nachlesen');
        current.delete('abgeben');
        if (current.has(vote)) current.delete(vote);
        else current.add(vote);
        nextVotes = Array.from(current).sort((a, b) => VOTE_ORDER.indexOf(a) - VOTE_ORDER.indexOf(b));
      }

      if (nextVotes.length === 0) {
        const { error } = await supabase
          .from('daily_reading_votes')
          .delete()
          .eq('date', selectedDateStr)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        let error = (await supabase.from('daily_reading_votes').upsert(
          { date: selectedDateStr, user_id: user.id, vote: nextVotes, updated_at: new Date().toISOString() },
          { onConflict: 'date,user_id' }
        )).error;
        if (error) {
          const single = nextVotes[0];
          error = (await supabase.from('daily_reading_votes').upsert(
            { date: selectedDateStr, user_id: user.id, vote: single, updated_at: new Date().toISOString() },
            { onConflict: 'date,user_id' }
          )).error;
        }
        if (error) throw error;
      }

      setVotesForDay((prev) => {
        const rest = prev.filter((v) => v.user_id !== user.id);
        if (nextVotes.length === 0) return rest;
        return [...rest, { id: '', date: selectedDateStr, user_id: user.id, vote: nextVotes, profiles: undefined }];
      });
    } catch (e) {
      console.error(e);
      await fetchData();
    } finally {
      setSavingVote(false);
    }
  };

  const toggleCompletion = async (assignmentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('daily_reading_status')
        .update({ is_completed: !currentStatus })
        .eq('id', assignmentId);

      if (error) throw error;

      setAssignments(prev => prev.map(a =>
        a.id === assignmentId ? { ...a, is_completed: !currentStatus } : a
      ));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const appendAssignmentAudio = async (assignmentId: string, assignmentUserId: string, newUrl: string) => {
    if (!isAdmin && assignmentUserId !== user?.id) return;
    const a = assignments.find((x) => x.id === assignmentId);
    const current = (a?.audio_urls ?? (a?.audio_url ? [a.audio_url] : [])) as string[];
    const next = [...current, newUrl];
    try {
      const { error } = await supabase
        .from('daily_reading_status')
        .update({ audio_urls: next })
        .eq('id', assignmentId);
      if (error) throw error;
      setAssignments(prev => prev.map(x => (x.id === assignmentId ? { ...x, audio_urls: next, audio_url: null } : x)));
      if (user?.id) {
        const { error: logError } = await supabase
          .from('reading_activity_logs')
          .insert({
            date: selectedDateStr,
            juz_number: a?.juz_number ?? selectedRamadanDay,
            activity_type: 'audio_added',
            actor_user_id: user.id,
            assignment_user_id: assignmentUserId,
          });
        if (logError) console.error('Error writing activity log:', logError);
        else {
          setActivityLogs((prev) => [
            {
              id: `tmp-${Date.now()}`,
              date: selectedDateStr,
              juz_number: a?.juz_number ?? selectedRamadanDay,
              activity_type: 'audio_added',
              actor_user_id: user.id,
              assignment_user_id: assignmentUserId,
              created_at: new Date().toISOString(),
              profiles: users.find((u) => u.id === user.id)
                ? {
                    full_name: users.find((u) => u.id === user.id)?.full_name ?? null,
                    email: users.find((u) => u.id === user.id)?.email ?? '',
                  }
                : null,
            },
            ...prev,
          ].slice(0, 50));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  /** Vergleichs-Key aus URL (funktioniert auch bei relativen Pfaden oder nur Dateiname). */
  const getAudioPathFromUrl = (url: string): string | null => {
    if (!url?.trim()) return null;
    try {
      const u = new URL(url);
      const segs = u.pathname.split('/');
      const name = segs[segs.length - 1]?.split('?')[0];
      return name || null;
    } catch {
      const last = url.split('/').pop()?.split('?')[0];
      return last || null;
    }
  };

  /** Normalisiert URL für Vergleich (Blob/unterschiedliche Formate). */
  const normalizeUrlForCompare = (url: string) => (url || '').trim().replace(/#.*$/, '').replace(/\?.*$/, '');

  const removeAssignmentAudioUrl = async (assignmentId: string, assignmentUserId: string, urlToRemove: string) => {
    if (!isAdmin && assignmentUserId !== user?.id) return;
    const pathToRemove = getAudioPathFromUrl(urlToRemove);
    const urlNorm = normalizeUrlForCompare(urlToRemove);
    try {
      const { data: row } = await supabase
        .from('daily_reading_status')
        .select('audio_urls, audio_url')
        .eq('id', assignmentId)
        .single();
      const current = (Array.isArray(row?.audio_urls) && row.audio_urls.length > 0
        ? row.audio_urls
        : (row?.audio_url ? [row.audio_url] : [])) as string[];
      let idx = current.findIndex(
        (u) =>
          u === urlToRemove ||
          (pathToRemove != null && getAudioPathFromUrl(u) === pathToRemove) ||
          normalizeUrlForCompare(u) === urlNorm
      );
      if (idx === -1 && current.length === 1) idx = 0;
      if (idx === -1) return;
      const next = current.filter((_, i) => i !== idx);
      const { error } = await supabase
        .from('daily_reading_status')
        .update({ audio_urls: next, audio_url: next[0] ?? null })
        .eq('id', assignmentId);
      if (error) throw error;
      setAssignments((prev) =>
        prev.map((x) => (x.id === assignmentId ? { ...x, audio_urls: next, audio_url: next[0] ?? null } : x))
      );
      await fetchData({ silent: true });
    } catch (e) {
      console.error(e);
    }
  };

  // In Gruppe: Aufteilung der Gruppe; sonst: nur eigene Aufteilung (Einzelnutzer)
  const visibleAssignments = useMemo(() => {
    const list = isInGroup
      ? assignments.filter((a) => groupMemberIds.includes(a.user_id))
      : assignments.filter((a) => a.user_id === user?.id);
    return [...list].sort((a, b) => a.start_page - b.start_page);
  }, [assignments, isInGroup, groupMemberIds, user?.id]);
  const sortedAssignments = visibleAssignments;

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
        {isInGroup && (
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
              <History size={16} className="text-emerald-600 dark:text-emerald-400" />
              Activity Log
            </h4>
            {activityLogs.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">Noch keine Aktivitäten für diesen Tag.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {activityLogs.map((log) => (
                  <p key={log.id} className="text-xs text-gray-600 dark:text-gray-300">
                    <span className="font-medium">{log.profiles?.full_name || log.profiles?.email || 'Unbekannt'}</span>
                    {' '}hat für Juz {log.juz_number} eine Audio hinzugefügt
                    <span className="text-gray-400 dark:text-gray-500"> ({formatActivityTime(log.created_at)})</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zeit-Voting (nur wenn in Gruppe) */}
      {isInGroup && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
            Wann kannst du lesen? (Tag {selectedRamadanDay})
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {VOTE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => saveVote(opt)}
                disabled={savingVote}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  myVotes.includes(opt)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {formatVoteLabel(opt)}
              </button>
            ))}
          </div>
          {myVotes.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Deine Wahl: {myVotes.map(formatVoteLabel).join(', ')}
            </p>
          )}
          {votesForDay.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Wer hat was gewählt:</p>
              <ul className="space-y-2">
                {votesForDay.map((v) => (
                  <li key={v.user_id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[8rem]">
                      {v.profiles?.full_name || v.profiles?.email || 'Unbekannt'}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {v.vote.length === 0 ? '–' : v.vote.map(formatVoteLabel).join(', ')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Assignments List – für alle: Gruppe oder nur eigene Aufteilung */}
      <div className="space-y-4 min-w-0 max-w-full">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 min-w-0">
            {isToday ? 'Heutige Aufteilung' : `Aufteilung für Tag ${selectedRamadanDay}`}
          </h3>
          {isAdmin && isInGroup && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={openPlanFromVotesOrModal}
                disabled={generating}
                className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : null}
                Plan aus Votes erzeugen
              </button>
              <button
                onClick={openDistributeModal}
                disabled={generating}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {visibleAssignments.length > 0 ? 'Neu verteilen' : 'Plan generieren'}
              </button>
            </div>
          )}
        </div>

        {visibleAssignments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {isInGroup
                ? (isToday ? 'Noch kein Leseplan für heute.' : `Noch kein Leseplan für Ramadan Tag ${selectedRamadanDay}.`)
                : (isToday ? 'Noch kein Leseplan für dich.' : `Noch kein Leseplan für dich (Tag ${selectedRamadanDay}).`)}
            </p>
            {isAdmin && isInGroup && (
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={openPlanFromVotesOrModal}
                  disabled={generating}
                  className="bg-amber-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-md"
                >
                  Plan aus Votes erzeugen
                </button>
                <button
                  onClick={openDistributeModal}
                  disabled={generating}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md"
                >
                  Jetzt generieren
                </button>
              </div>
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
                            <ReadingAudioCell
                              assignmentId={assignment.id}
                              audioUrls={assignment.audio_urls ?? (assignment.audio_url ? [assignment.audio_url] : [])}
                              canEdit={isMe || isAdmin}
                              onSaved={(url) => appendAssignmentAudio(assignment.id, assignment.user_id, url)}
                              onDeleted={(url) => removeAssignmentAudioUrl(assignment.id, assignment.user_id, url)}
                            />
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
            {arabic3InDistributeUserId && (() => {
              const arUsers = distributionUsers.filter((u: { reader_language?: string | null }) => u.reader_language === 'ar');
              if (arUsers.length < 2) return null;
              return (
                <div className="px-6 pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Wer von den Arabisch-Lesern liest 3 Seiten?</span>
                  <select
                    value={arabic3InDistributeUserId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      const prevId = arabic3InDistributeUserId;
                      if (!prevId || prevId === newId) return;
                      const prevIdx = distributionUsers.findIndex((u: { id: string }) => u.id === prevId);
                      const newIdx = distributionUsers.findIndex((u: { id: string }) => u.id === newId);
                      if (prevIdx < 0 || newIdx < 0) return;
                      setPagesPerUser((p) => {
                        const next = [...p];
                        next[prevIdx] = 2;
                        next[newIdx] = 3;
                        return next;
                      });
                      setArabic3InDistributeUserId(newId);
                    }}
                    className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  >
                    {arUsers.map((u: { id: string; full_name: string | null; email: string }) => (
                      <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                    ))}
                  </select>
                </div>
              );
            })()}
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

      {/* Modal: Wer bekommt die Seiten von „abgeben“-Votern? */}
      {isAdmin && showAbgebenAssignModal && abgebenAssignData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Seiten von „abgeben“ zuweisen
              </h3>
              <button
                type="button"
                onClick={() => { setShowAbgebenAssignModal(false); setAbgebenAssignData(null); }}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <p className="px-6 pt-2 text-sm text-gray-500 dark:text-gray-400">
              Diese Nutzer haben „abgeben“ gewählt. Wem sollen ihre Seiten zugeteilt werden?
            </p>
            <div className="p-6 overflow-y-auto space-y-4">
              {abgebenAssignData.abgebenUsers.map(({ user: u, pages }) => (
                <div key={u.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-700/50">
                  <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{u.full_name || u.email}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">({pages} S.)</span>
                  <span className="text-gray-400 dark:text-gray-500">→</span>
                  <select
                    value={abgebenRecipients[u.id] ?? ''}
                    onChange={(e) => setAbgebenRecipients((prev) => ({ ...prev, [u.id]: e.target.value }))}
                    className="flex-1 min-w-0 text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  >
                    {abgebenAssignData.orderedUsers.map((r) => (
                      <option key={r.id} value={r.id}>{r.full_name || r.email}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-2">
              <button
                type="button"
                onClick={() => { setShowAbgebenAssignModal(false); setAbgebenAssignData(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={confirmAbgebenAssignAndGenerate}
                disabled={generating}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? <Loader2 size={18} className="animate-spin" /> : null}
                Plan erzeugen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Welcher Arabisch-Leser bekommt 3 Seiten? (Plan aus Votes) */}
      {isAdmin && showArabic3Modal && arabic3ModalData && (() => {
        const arUsers = arabic3ModalData.orderedUsers.filter((u) => u.reader_language === 'ar');
        if (arUsers.length === 0) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  Arabisch-Leser mit 3 Seiten
                </h3>
                <button
                  type="button"
                  onClick={() => { setShowArabic3Modal(false); setArabic3ModalData(null); setArabic3SelectedUserId(''); }}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="px-6 pt-2 text-sm text-gray-500 dark:text-gray-400">
                Ein Arabisch-Leser erhält 3 Seiten (statt 2). Wer soll es sein?
              </p>
              <div className="p-6">
                <select
                  value={arabic3SelectedUserId}
                  onChange={(e) => setArabic3SelectedUserId(e.target.value)}
                  className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  {arUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                  ))}
                </select>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowArabic3Modal(false); setArabic3ModalData(null); setArabic3SelectedUserId(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={confirmArabic3AndGenerate}
                  disabled={generating}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? <Loader2 size={18} className="animate-spin" /> : null}
                  Plan erzeugen
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
                  const member = users.find((u) => u.id === p.id);
                  const readerLang = (member as { reader_language?: string | null })?.reader_language ?? null;
                  return (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
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
                      <div className="flex items-center gap-2 shrink-0">
                        {inGroup && (
                          <select
                            value={readerLang ?? ''}
                            onChange={(e) => setReaderLanguage(p.id, (e.target.value || null) as 'ar' | 'de' | null)}
                            className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            title="Lese-Sprache für Seitenverteilung"
                          >
                            <option value="">Nicht festgelegt</option>
                            <option value="ar">Arabisch (2 S.)</option>
                            <option value="de">Deutsch (3 S.)</option>
                          </select>
                        )}
                        {inGroup ? (
                          <button
                            type="button"
                            onClick={() => removeFromGroup(p.id)}
                            className="flex items-center gap-1 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium"
                          >
                            <UserMinus size={16} /> Entfernen
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToGroup(p.id)}
                            className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
                          >
                            <UserPlus size={16} /> Hinzufügen
                          </button>
                        )}
                      </div>
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