import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { triggerPushForActivity } from '../lib/pushNotifications';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import {
  loadHatimDataFromCache,
  saveHatimDataToCache,
  queueHatimWrite,
  syncHatimQueue,
  getHatimCacheKey,
} from '../lib/hatimOffline';
import { BookOpen, Users, Calendar, CheckCircle, RefreshCw, Loader2, X, UserPlus, UserMinus, Settings2, History, Trash2, Mail, LogOut, List, HandHelping } from 'lucide-react';
import { ReadingAudioCell } from '../components/ReadingAudioCell';

const VOTE_HOURS = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '0', '1', '2'] as const;
const VOTE_OPTIONS = [...VOTE_HOURS, 'nachlesen', 'abgeben'] as const;
type VoteValue = typeof VOTE_OPTIONS[number];
const VOTE_ORDER: VoteValue[] = [...VOTE_HOURS, 'nachlesen', 'abgeben'];

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
  allowed_audio_user_ids?: string[] | null;
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

interface ActivityToast {
  id: string;
  message: string;
  juzNumber: number;
}

type QuranPageCache = {
  selectedRamadanDay: number;
  assignments: DailyAssignment[];
  users: any[];
  isAdmin: boolean;
  isInGroup: boolean;
  groupMemberIds: string[];
  currentGroupId: string | null;
  votesForDay: DailyReadingVote[];
  activityLogs: ReadingActivityLog[];
  loadedKey: string | null;
  scrollY: number;
  cachedAtDate?: string;
};

const QURAN_CACHE_KEY = 'quran_page_cache_v1';

function getIslamicDateParts(date: Date): { day: number; month: string; year: number } {
  const ISLAMIC_MONTH_NAMES = [
    'Muharram',
    'Safar',
    'Rabi al-Awwal',
    'Rabi al-Thani',
    'Jumada al-Ula',
    'Jumada al-Akhirah',
    'Rajab',
    'Shaban',
    'Ramadan',
    'Shawwal',
    'Dhu al-Qadah',
    'Dhu al-Hijjah',
  ];

  const toLatinDigits = (value: string) =>
    value
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0));

  const parsePartNumber = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes, fallback: number) => {
    const raw = parts.find((p) => p.type === type)?.value ?? String(fallback);
    const n = Number(toLatinDigits(raw));
    return Number.isFinite(n) ? n : fallback;
  };

  const candidates = [
    'en-SA-u-ca-islamic-umalqura',
    'ar-SA-u-ca-islamic-umalqura',
    'en-TN-u-ca-islamic',
    'ar-SA-u-ca-islamic',
    'en-u-ca-islamic',
  ];

  for (const locale of candidates) {
    try {
      const numericFormatter = new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
      const calendar = numericFormatter.resolvedOptions().calendar;
      if (!calendar.toLowerCase().includes('islamic')) continue;
      const parts = numericFormatter.formatToParts(date);
      const day = parsePartNumber(parts, 'day', 1);
      const monthIndex = parsePartNumber(parts, 'month', 1) - 1;
      const year = parsePartNumber(parts, 'year', 1);
      const month = ISLAMIC_MONTH_NAMES[monthIndex] ?? 'Muharram';
      return { day, month, year };
    } catch {
      // try next locale
    }
  }

  // Hard fallback (should rarely happen)
  return { day: 1, month: 'Muharram', year: 1 };
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Ab 2 Uhr zählt ein neuer Tag ({t('quran.read')} bis 1 Uhr gehört noch zum Vortag). */
function getEffectiveToday(): Date {
  const now = new Date();
  if (now.getHours() < 2) {
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 1);
    return prev;
  }
  return now;
}

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
  const { t } = useTranslation();
  const effectiveToday = getEffectiveToday();
  const todayLocalDate = toLocalDateString(effectiveToday);
  const { user } = useAuth();
  useOffline(); // Offline-Kontext für Routing; navigator.onLine für Datenlogik
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const openReader = searchParams.get('openReader') === '1';
  const [assignments, setAssignments] = useState<DailyAssignment[]>(() => quranPageCache?.assignments ?? []);
  const [users, setUsers] = useState<any[]>(() => quranPageCache?.users ?? []);
  const [distributionUsers, setDistributionUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(() => quranPageCache?.isAdmin ?? false);
  const [isInGroup, setIsInGroup] = useState(() => quranPageCache?.isInGroup ?? false);
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>(() => quranPageCache?.groupMemberIds ?? []);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(() => quranPageCache?.currentGroupId ?? null);
  const [currentGroup, setCurrentGroup] = useState<{ id: string; name: string | null; owner_id: string } | null>(null);
  const [isGroupOwner, setIsGroupOwner] = useState(false);
  const [loading, setLoading] = useState(() => !quranPageCache);
  const [generating, setGenerating] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showManageGroupModal, setShowManageGroupModal] = useState(false);
  const [, setManagingGroup] = useState(false);
  const [clearingPlan, setClearingPlan] = useState(false);
  const [pagesPerUser, setPagesPerUser] = useState<number[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // Voting (nur wenn in Gruppe)
  const [votesForDay, setVotesForDay] = useState<DailyReadingVote[]>(() => quranPageCache?.votesForDay ?? []);
  const [activityLogs, setActivityLogs] = useState<ReadingActivityLog[]>(() => quranPageCache?.activityLogs ?? []);
  const [activityToast, setActivityToast] = useState<ActivityToast | null>(null);
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
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [createGroupName, setCreateGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [showMailboxModal, setShowMailboxModal] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<{ id: string; group_id: string; group_name: string | null; invited_by: string; inviter_name: string | null; inviter_email: string }[]>([]);
  const [loadingMailbox, setLoadingMailbox] = useState(false);
  const [respondingToInvite, setRespondingToInvite] = useState<string | null>(null);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState<{ id: string; email: string; full_name: string | null }[]>([]);
  const [searchingGroup, setSearchingGroup] = useState(false);
  const [pendingInviteUserIds, setPendingInviteUserIds] = useState<Set<string>>(new Set());
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [showPartsWithoutAudioModal, setShowPartsWithoutAudioModal] = useState(false);
  const [partsWithoutAudio, setPartsWithoutAudio] = useState<number[]>([]);
  const [loadingPartsWithoutAudio, setLoadingPartsWithoutAudio] = useState(false);
  const [offlineNoCache, setOfflineNoCache] = useState(false);
  const [delegationModalAssignment, setDelegationModalAssignment] = useState<DailyAssignment | null>(null);
  const [savingDelegation, setSavingDelegation] = useState(false);

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

  const formatVoteLabel = (vote: VoteValue) => t('vote.' + vote, { defaultValue: vote });
  const formatActivityTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const getActorName = (log: ReadingActivityLog) => log.profiles?.full_name || log.profiles?.email || t('common.unknown');
  const formatActivityMessage = (log: ReadingActivityLog) => {
    const actor = getActorName(log);
    if (log.activity_type === 'plan_updated') {
      return `${t('quran.juzShort')} ${log.juz_number} | ${t('activity.planUpdated', { actor })}`;
    }
    if (log.activity_type === 'plan_cleared') {
      return `${t('quran.juzShort')} ${log.juz_number} | ${t('activity.planCleared', { actor })}`;
    }
    return `${t('quran.juzShort')} ${log.juz_number} | ${t('activity.audioUploaded', { actor })}`;
  };

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

  const islamicMonthInfo = useMemo(() => {
    const today = new Date(todayLocalDate + 'T12:00:00');
    const todayParts = getIslamicDateParts(today);

    const monthStartDate = new Date(today);
    while (getIslamicDateParts(monthStartDate).day !== 1) {
      monthStartDate.setDate(monthStartDate.getDate() - 1);
    }

    const monthName = todayParts.month;
    const monthYear = todayParts.year;
    const probe = new Date(monthStartDate);
    let monthLength = 0;
    while (true) {
      const p = getIslamicDateParts(probe);
      if (p.month !== monthName || p.year !== monthYear) break;
      monthLength += 1;
      probe.setDate(probe.getDate() + 1);
      if (monthLength > 31) break;
    }

    return {
      monthName,
      monthYear,
      monthStartDate,
      monthLength: Math.max(29, Math.min(30, monthLength || 30)),
      currentDay: todayParts.day,
    };
  }, [todayLocalDate]);

  const [selectedRamadanDay, setSelectedRamadanDay] = useState(() => {
    const cached = quranPageCache?.selectedRamadanDay;
    const isCacheFromToday = quranPageCache?.cachedAtDate === todayLocalDate;
    if (isCacheFromToday && cached && Number.isFinite(cached)) return cached;
    return islamicMonthInfo.currentDay;
  });

  useEffect(() => {
    if (selectedRamadanDay < 1 || selectedRamadanDay > islamicMonthInfo.monthLength) {
      setSelectedRamadanDay(Math.min(islamicMonthInfo.monthLength, Math.max(1, selectedRamadanDay)));
    }
  }, [selectedRamadanDay, islamicMonthInfo.monthLength]);

  const selectedDateStr = useMemo(() => {
    const d = new Date(islamicMonthInfo.monthStartDate);
    d.setDate(islamicMonthInfo.monthStartDate.getDate() + (selectedRamadanDay - 1));
    return toLocalDateString(d);
  }, [islamicMonthInfo.monthStartDate, selectedRamadanDay]);

  const isToday = selectedRamadanDay === islamicMonthInfo.currentDay;
  const loadedKeyRef = useRef<string | null>(quranPageCache?.loadedKey ?? null);
  const firstLoadDoneRef = useRef<boolean>(!!quranPageCache);
  const assignmentsSectionRef = useRef<HTMLDivElement | null>(null);

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
      currentGroupId,
      votesForDay,
      activityLogs,
      loadedKey: loadedKeyRef.current,
      scrollY: window.scrollY,
      cachedAtDate: todayLocalDate,
    };
    try {
      window.sessionStorage.setItem(QURAN_CACHE_KEY, JSON.stringify(quranPageCache));
    } catch {
      // ignore sessionStorage errors
    }
  }, [selectedRamadanDay, assignments, users, isAdmin, isInGroup, groupMemberIds, currentGroupId, votesForDay, activityLogs, todayLocalDate]);

  useEffect(() => {
    const showLoading = !firstLoadDoneRef.current;
    fetchData({ showLoading });
  }, [user?.id, selectedRamadanDay]);

  useEffect(() => {
    if (!openReader || loading || !user?.id || !currentGroupId) return;
    const myAssignment = assignments.find((a) => a.user_id === user.id);
    if (!myAssignment) return;
    navigate(
      `/quran/read?assignmentId=${encodeURIComponent(myAssignment.id)}&startPage=${myAssignment.start_page}&endPage=${myAssignment.end_page}&date=${encodeURIComponent(selectedDateStr)}&slot=hatim`,
      { replace: true }
    );
  }, [openReader, loading, user?.id, currentGroupId, assignments, selectedDateStr, navigate]);

  const fetchData = async (opts?: { silent?: boolean; showLoading?: boolean }) => {
    const key = `${user?.id ?? ''}-${selectedRamadanDay}`;
    const shouldShowLoading = !!opts?.showLoading && !opts?.silent;
    if (shouldShowLoading) setLoading(true);
    try {
      // Offline: aus IndexedDB-Cache laden
      if (!navigator.onLine && user?.id) {
        const cacheKey = getHatimCacheKey(user.id, selectedDateStr);
        const cached = await loadHatimDataFromCache(cacheKey);
        if (cached) {
          setOfflineNoCache(false);
          setCurrentGroupId(cached.currentGroupId);
          setIsInGroup(cached.isInGroup);
          setIsAdmin(cached.isAdmin);
          setGroupMemberIds(cached.groupMemberIds);
          setUsers(cached.users as typeof users);
          setAssignments(cached.assignments as typeof assignments);
          setVotesForDay(cached.votesForDay as typeof votesForDay);
          setActivityLogs(cached.activityLogs as typeof activityLogs);
          setCurrentGroup(cached.currentGroup);
          setIsGroupOwner(cached.isGroupOwner);
          if (shouldShowLoading) setLoading(false);
          loadedKeyRef.current = key;
          firstLoadDoneRef.current = true;
          if (quranPageCache) quranPageCache.loadedKey = key;
          return;
        }
        setOfflineNoCache(true);
        if (shouldShowLoading) setLoading(false);
        loadedKeyRef.current = key;
        firstLoadDoneRef.current = true;
        return;
      }

      setOfflineNoCache(false);
      // 1. Meine Gruppe: reading_group_members wo user_id = ich
      const { data: myMembership } = await supabase
        .from('reading_group_members')
        .select('group_id')
        .eq('user_id', user?.id ?? '')
        .maybeSingle();
      const gid = myMembership?.group_id ?? null;
      setCurrentGroupId(gid);
      const userInGroup = !!gid && !!user?.id;
      setIsInGroup(userInGroup);

      let groupRow: { id: string; name: string | null; owner_id: string } | null = null;
      let memberIds: string[] = [];
      let usersWithLang: { id: string; email: string; full_name: string | null; role: string; reader_language: string | null }[] = [];
      let assignmentsData: any[] | null = null;
      let votesData: any[] | null = null;
      let activityData: any[] | null = null;

      if (!gid) {
        setGroupMemberIds([]);
        setUsers([]);
        setCurrentGroup(null);
        setIsGroupOwner(false);
      } else {
        const { data: gr } = await supabase
          .from('reading_groups')
          .select('id, name, owner_id')
          .eq('id', gid)
          .single();
        groupRow = gr ?? null;
        setCurrentGroup(groupRow);
        setIsGroupOwner(!!(groupRow && user?.id && groupRow.owner_id === user.id));

        const { data: memberRows } = await supabase
          .from('reading_group_members')
          .select('user_id')
          .eq('group_id', gid);
        memberIds = memberRows?.map((r: { user_id: string }) => r.user_id) ?? [];
        setGroupMemberIds(memberIds);

        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .in('id', memberIds);
        const { data: settingsData } = await supabase
          .from('reading_group_member_settings')
          .select('user_id, reader_language')
          .eq('group_id', gid)
          .in('user_id', memberIds);
        const settingsMap = new Map((settingsData || []).map((s: { user_id: string; reader_language: string | null }) => [s.user_id, s.reader_language]));
        usersWithLang = (usersData || []).map((u: { id: string; email: string; full_name: string | null; role: string }) => ({
          ...u,
          reader_language: settingsMap.get(u.id) ?? null
        }));
        setUsers(usersWithLang);
      }

      const { data: meProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
      setIsAdmin(meProfile?.role === 'admin');

      // 2. Assignments für selected day (und meine Gruppe)
      if (gid) {
        const { data: ad, error } = await supabase
          .from('daily_reading_status')
          .select(`*, profiles (full_name, email)`)
          .eq('group_id', gid)
          .eq('date', selectedDateStr);
        if (error) throw error;
        assignmentsData = ad || [];
        setAssignments(assignmentsData.map((a: any) => ({
          ...a,
          audio_urls: Array.isArray(a.audio_urls) && a.audio_urls.length > 0 ? a.audio_urls : (a.audio_url ? [a.audio_url] : [])
        })));
      } else {
        setAssignments([]);
      }

      if (userInGroup && gid) {
        const { data: vd } = await supabase
          .from('daily_reading_votes')
          .select('id, date, user_id, vote, profiles(full_name, email)')
          .eq('group_id', gid)
          .eq('date', selectedDateStr);
        votesData = vd || [];
        const normalizedVotes: DailyReadingVote[] = votesData.map((v: any) => ({
          ...v,
          vote: normalizeVoteSelections(v.vote),
          profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles
        }));
        setVotesForDay(normalizedVotes);

        const { data: actData } = await supabase
          .from('reading_activity_logs')
          .select('id, date, juz_number, activity_type, actor_user_id, assignment_user_id, created_at, profiles!reading_activity_logs_actor_user_id_fkey(full_name, email)')
          .eq('group_id', gid)
          .order('created_at', { ascending: false })
          .limit(200);
        activityData = actData || [];
        const normalizedActivity: ReadingActivityLog[] = activityData.map((x: any) => ({
          ...x,
          profiles: Array.isArray(x.profiles) ? x.profiles[0] : x.profiles
        }));
        setActivityLogs(normalizedActivity);
      } else {
        setVotesForDay([]);
        setActivityLogs([]);
      }

      // Online: in IndexedDB cachen
      if (navigator.onLine && user?.id) {
        const assignmentsForCache = gid
          ? (assignmentsData || []).map((a: any) => ({
              ...a,
              audio_urls: Array.isArray(a.audio_urls) && a.audio_urls.length > 0 ? a.audio_urls : (a.audio_url ? [a.audio_url] : []),
            }))
          : [];
        const votesForCache = userInGroup && gid ? (votesData || []).map((v: any) => ({
          ...v,
          vote: normalizeVoteSelections(v.vote),
          profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles,
        })) : [];
        const activityForCache = userInGroup && gid ? (activityData || []).map((x: any) => ({
          ...x,
          profiles: Array.isArray(x.profiles) ? x.profiles[0] : x.profiles,
        })) : [];
        await saveHatimDataToCache(user.id, selectedDateStr, {
          currentGroupId: gid,
          isInGroup: userInGroup,
          isAdmin: meProfile?.role === 'admin',
          groupMemberIds: memberIds ?? [],
          users: usersWithLang ?? [],
          assignments: assignmentsForCache,
          votesForDay: votesForCache,
          activityLogs: activityForCache,
          currentGroup: groupRow ?? null,
          isGroupOwner: !!(groupRow && user?.id && groupRow.owner_id === user.id),
        });
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

  const jumpToActivityDay = (juzNumber: number) => {
    setSelectedRamadanDay(juzNumber);
    window.setTimeout(() => {
      assignmentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const deleteActivityLogEntry = async (logId: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Diesen Activity-Log-Eintrag löschen?')) return;
    try {
      const { error } = await supabase.from('reading_activity_logs').delete().eq('id', logId);
      if (error) throw error;
      setActivityLogs((prev) => prev.filter((x) => x.id !== logId));
    } catch (e) {
      console.error('Error deleting activity log entry:', e);
    }
  };

  useEffect(() => {
    const onOnline = () => {
      syncHatimQueue().then(({ synced }) => {
        if (synced > 0) void fetchData({ silent: true });
      });
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [user?.id, selectedRamadanDay]);

  useEffect(() => {
    if (!isInGroup || !user?.id || !currentGroupId) return;
    const channel = supabase
      .channel(`reading-activity-live-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reading_activity_logs' },
        (payload) => {
          const row = payload.new as {
            id: string;
            group_id?: string;
            date: string;
            juz_number: number;
            activity_type: string;
            actor_user_id: string;
            assignment_user_id: string | null;
            created_at: string;
          };
          if (row.group_id && row.group_id !== currentGroupId) return;
          const actor = users.find((u) => u.id === row.actor_user_id);
          const log: ReadingActivityLog = {
            ...row,
            profiles: actor
              ? { full_name: actor.full_name ?? null, email: actor.email ?? '' }
              : null,
          };
          setActivityLogs((prev) => [log, ...prev.filter((x) => x.id !== log.id)].slice(0, 200));

          const actorName = actor?.full_name || actor?.email || 'Jemand';
          const message =
            row.activity_type === 'plan_updated'
              ? `${t('quran.juzShort')} ${row.juz_number} | ${t('activity.planUpdated', { actor: actorName })}`
              : row.activity_type === 'plan_cleared'
                ? `${t('quran.juzShort')} ${row.juz_number} | ${t('activity.planCleared', { actor: actorName })}`
                : `${t('quran.juzShort')} ${row.juz_number} | ${t('activity.audioUploaded', { actor: actorName })}`;
          setActivityToast({ id: row.id, message, juzNumber: row.juz_number });

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(t('activity.newActivity'), { body: message });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isInGroup, user?.id, users, currentGroupId]);

  useEffect(() => {
    if (!isInGroup || typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }
  }, [isInGroup]);

  useEffect(() => {
    if (!activityToast) return;
    const t = window.setTimeout(() => setActivityToast(null), 7000);
    return () => window.clearTimeout(t);
  }, [activityToast]);

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
    if (!isGroupOwner) return;
    if (users.length === 0) return;
    if (
      assignments.length > 0 &&
      !window.confirm(
        t('group.confirmRedistribute', { month: islamicMonthInfo.monthName, day: selectedRamadanDay })
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

  const createGroup = async () => {
    if (!user?.id) return;
    setCreatingGroup(true);
    try {
      const { data: group, error: groupError } = await supabase
        .from('reading_groups')
        .insert({ name: createGroupName.trim() || null, owner_id: user.id })
        .select('id')
        .single();
      if (groupError || !group) throw groupError ?? new Error(t('group.errorCreate'));
      await supabase.from('reading_group_members').insert({ group_id: group.id, user_id: user.id });
      setCreateGroupName('');
      setShowCreateGroupModal(false);
      await fetchData();
    } catch (e) {
      console.error(e);
      alert(t('group.errorCreate'));
    } finally {
      setCreatingGroup(false);
    }
  };

  const openMailbox = async () => {
    setShowMailboxModal(true);
    setLoadingMailbox(true);
    try {
      const { data, error } = await supabase
        .from('reading_group_invitations')
        .select(`
          id,
          group_id,
          invited_by,
          reading_groups(name),
          profiles!reading_group_invitations_invited_by_fkey(full_name, email)
        `)
        .eq('invitee_user_id', user?.id ?? '')
        .eq('status', 'pending');
      if (error) throw error;
      const list = (data || []).map((row: any) => ({
        id: row.id,
        group_id: row.group_id,
        group_name: row.reading_groups?.name ?? null,
        invited_by: row.invited_by,
        inviter_name: row.profiles?.full_name ?? null,
        inviter_email: row.profiles?.email ?? '',
      }));
      setPendingInvitations(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMailbox(false);
    }
  };

  const acceptInvitation = async (invitationId: string, groupId: string) => {
    setRespondingToInvite(invitationId);
    try {
      await supabase.from('reading_group_members').insert({ group_id: groupId, user_id: user?.id });
      await supabase.from('reading_group_invitations').update({ status: 'accepted' }).eq('id', invitationId);
      setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      setShowMailboxModal(false);
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setRespondingToInvite(null);
    }
  };

  const declineInvitation = async (invitationId: string) => {
    setRespondingToInvite(invitationId);
    try {
      await supabase.from('reading_group_invitations').update({ status: 'declined' }).eq('id', invitationId);
      setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (e) {
      console.error(e);
    } finally {
      setRespondingToInvite(null);
    }
  };

  const leaveGroup = async () => {
    if (!currentGroupId || !user?.id) return;
    if (!window.confirm(t('group.confirmLeave'))) return;
    try {
      const isOwner = currentGroup?.owner_id === user.id;
      const otherMembers = users.filter((u) => u.id !== user.id);
      if (isOwner && otherMembers.length > 0) {
        const newOwnerId = otherMembers[0].id;
        await supabase.from('reading_groups').update({ owner_id: newOwnerId }).eq('id', currentGroupId).eq('owner_id', user.id);
      } else if (isOwner && otherMembers.length === 0) {
        await supabase.from('reading_groups').delete().eq('id', currentGroupId);
      }
      await supabase.from('reading_group_members').delete().eq('group_id', currentGroupId).eq('user_id', user.id);
      await fetchData();
    } catch (e) {
      console.error(e);
      alert(t('group.errorLeave'));
    }
  };

  const transferOwnership = async (newOwnerId: string) => {
    if (!currentGroupId || !isGroupOwner || currentGroup?.owner_id === newOwnerId) return;
    if (!window.confirm(t('group.confirmTransfer', { name: users.find((u) => u.id === newOwnerId)?.full_name || users.find((u) => u.id === newOwnerId)?.email || t('common.you') }))) return;
    try {
      await supabase.from('reading_groups').update({ owner_id: newOwnerId }).eq('id', currentGroupId).eq('owner_id', user?.id);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const openManageGroupModal = async () => {
    if (!isGroupOwner || !currentGroupId) return;
    setManagingGroup(true);
    setShowManageGroupModal(true);
    setGroupSearchQuery('');
    setGroupSearchResults([]);
    try {
      const { data: invs } = await supabase
        .from('reading_group_invitations')
        .select('invitee_user_id')
        .eq('group_id', currentGroupId)
        .eq('status', 'pending');
      setPendingInviteUserIds(new Set((invs ?? []).map((i: { invitee_user_id: string }) => i.invitee_user_id)));
    } catch {
      setPendingInviteUserIds(new Set());
    } finally {
      setManagingGroup(false);
    }
  };

  const searchUsersForGroup = async () => {
    const q = groupSearchQuery.trim();
    if (!q || !currentGroupId) return;
    setSearchingGroup(true);
    try {
      const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
      let query = supabase.from('profiles').select('id, email, full_name');
      if (uuidLike) {
        query = query.eq('id', q);
      } else {
        const term = `%${q}%`;
        query = query.or(`email.ilike.${term},full_name.ilike.${term}`);
      }
      const { data, error } = await query.limit(20);
      if (error) throw error;
      setGroupSearchResults(data ?? []);
    } catch (e) {
      console.error(e);
      setGroupSearchResults([]);
    } finally {
      setSearchingGroup(false);
    }
  };

  const inviteToGroup = async (userId: string) => {
    if (!currentGroupId || !user?.id) return;
    setInvitingUserId(userId);
    try {
      await supabase.from('reading_group_invitations').insert({
        group_id: currentGroupId,
        invited_by: user.id,
        invitee_user_id: userId,
        status: 'pending',
      });
      setPendingInviteUserIds((prev) => new Set([...prev, userId]));
    } catch (e) {
      console.error(e);
    } finally {
      setInvitingUserId(null);
    }
  };

  const removeFromGroup = async (userId: string) => {
    if (!currentGroupId) return;
    try {
      await supabase.from('reading_group_members').delete().eq('group_id', currentGroupId).eq('user_id', userId);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const setReaderLanguage = async (userId: string, value: 'ar' | 'de' | null) => {
    if (!currentGroupId) return;
    try {
      if (value === null) {
        await supabase.from('reading_group_member_settings').delete().eq('group_id', currentGroupId).eq('user_id', userId);
      } else {
        await supabase.from('reading_group_member_settings').upsert(
          { group_id: currentGroupId, user_id: userId, reader_language: value, updated_at: new Date().toISOString() },
          { onConflict: 'group_id,user_id' }
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
      if (!currentGroupId) return;
      const { data: existing } = await supabase
        .from('daily_reading_status')
        .select('user_id, audio_url, audio_urls')
        .eq('group_id', currentGroupId)
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
        .eq('group_id', currentGroupId)
        .eq('date', selectedDateStr);

      const juzNumber = selectedRamadanDay;
      const { start: juzStartPage } = getJuzPageInfo(juzNumber);
      let currentPage = juzStartPage;
      const newAssignments: { group_id: string; date: string; juz_number: number; user_id: string; start_page: number; end_page: number; is_completed: boolean; audio_urls?: string[] }[] = [];

      for (let i = 0; i < distributionUsers.length; i++) {
        const count = pagesPerUser[i] ?? 0;
        if (count <= 0) continue;
        const start = currentPage;
        const end = currentPage + count - 1;
        const userId = distributionUsers[i].id;
        newAssignments.push({
          group_id: currentGroupId,
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
      if (user?.id && currentGroupId) {
        const logPayload = {
          group_id: currentGroupId,
          date: selectedDateStr,
          juz_number: selectedRamadanDay,
          activity_type: 'plan_updated',
          actor_user_id: user.id,
          assignment_user_id: null,
        } as const;
        const { error: logError } = await supabase.from('reading_activity_logs').insert(logPayload);
        if (logError) console.error('Error writing plan activity log:', logError);
        else {
          void triggerPushForActivity({
            group_id: currentGroupId,
            date: logPayload.date,
            juz_number: logPayload.juz_number,
            activity_type: logPayload.activity_type,
            actor_user_id: logPayload.actor_user_id,
          });
        }
      }
      await fetchData();
    } catch (error) {
      console.error('Error generating assignments:', error);
      alert(t('group.errorGenerate'));
    } finally {
      setGenerating(false);
    }
  };

  const clearDistribution = async () => {
    if (!currentGroupId || !isGroupOwner) return;
    if (
      !window.confirm(
        t('group.confirmClear', { month: islamicMonthInfo.monthName, day: selectedRamadanDay })
      )
    )
      return;
    setClearingPlan(true);
    try {
      const { error } = await supabase
        .from('daily_reading_status')
        .delete()
        .eq('group_id', currentGroupId)
        .eq('date', selectedDateStr);
      if (error) throw error;
      if (user?.id) {
        const logPayload = {
          group_id: currentGroupId,
          date: selectedDateStr,
          juz_number: selectedRamadanDay,
          activity_type: 'plan_cleared',
          actor_user_id: user.id,
          assignment_user_id: null,
        } as const;
        await supabase.from('reading_activity_logs').insert(logPayload);
        void triggerPushForActivity({
          group_id: currentGroupId,
          date: logPayload.date,
          juz_number: logPayload.juz_number,
          activity_type: logPayload.activity_type,
          actor_user_id: logPayload.actor_user_id,
        });
      }
      await fetchData();
    } catch (e) {
      console.error(e);
      alert(t('group.errorGenerate'));
    } finally {
      setClearingPlan(false);
    }
  };

  const openPlanFromVotesOrModal = async () => {
    if (!isGroupOwner || !isInGroup || !user) return;
    setGenerating(true);
    try {
      if (!currentGroupId) return;
      const { data: votesData } = await supabase
        .from('daily_reading_votes')
        .select('user_id, vote')
        .eq('group_id', currentGroupId)
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
          alert(t('group.allVotedPass'));
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
      alert(t('group.errorVotes'));
    } finally {
      setGenerating(false);
    }
  };

  const doInsertPlanFromVotes = async (
    orderedUsers: { id: string; full_name: string | null; email: string; reader_language?: string | null }[],
    pagesPerUser: number[]
  ) => {
    if (!currentGroupId) return;
    const { data: existing } = await supabase
      .from('daily_reading_status')
      .select('user_id, audio_url, audio_urls')
      .eq('group_id', currentGroupId)
      .eq('date', selectedDateStr);
    const audioUrlsByUser = new Map<string, string[]>();
    for (const row of existing ?? []) {
      const urls = Array.isArray((row as any).audio_urls) && (row as any).audio_urls.length > 0
        ? (row as any).audio_urls
        : (row.audio_url ? [row.audio_url] : []);
      if (urls.length > 0) audioUrlsByUser.set(row.user_id, urls);
    }

    await supabase.from('daily_reading_status').delete().eq('group_id', currentGroupId).eq('date', selectedDateStr);
    const juzNumber = selectedRamadanDay;
    const { start: juzStartPage } = getJuzPageInfo(juzNumber);
    let currentPage = juzStartPage;
    const newAssignments: { group_id: string; date: string; juz_number: number; user_id: string; start_page: number; end_page: number; is_completed: boolean; audio_urls?: string[] }[] = [];
    for (let i = 0; i < orderedUsers.length; i++) {
      const count = pagesPerUser[i] ?? 0;
      if (count <= 0) continue;
      const start = currentPage;
      const end = currentPage + count - 1;
      const userId = orderedUsers[i].id;
      newAssignments.push({
        group_id: currentGroupId,
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
    if (user?.id && currentGroupId) {
      const logPayload = {
        group_id: currentGroupId,
        date: selectedDateStr,
        juz_number: selectedRamadanDay,
        activity_type: 'plan_updated',
        actor_user_id: user.id,
        assignment_user_id: null,
      } as const;
      const { error: logError } = await supabase.from('reading_activity_logs').insert(logPayload);
      if (logError) console.error('Error writing plan activity log:', logError);
      else {
        void triggerPushForActivity({
          group_id: currentGroupId,
          date: logPayload.date,
          juz_number: logPayload.juz_number,
          activity_type: logPayload.activity_type,
          actor_user_id: logPayload.actor_user_id,
        });
      }
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
      alert(t('group.errorVotes'));
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
      alert(t('group.errorVotes'));
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

      if (!currentGroupId) return;

      if (!navigator.onLine) {
        await queueHatimWrite({
          table: 'daily_reading_votes',
          operation: nextVotes.length === 0 ? 'delete' : 'upsert',
          payload: nextVotes.length === 0
            ? { group_id: currentGroupId, date: selectedDateStr, user_id: user.id }
            : { group_id: currentGroupId, date: selectedDateStr, user_id: user.id, vote: nextVotes },
        });
      } else {
        if (nextVotes.length === 0) {
          const { error } = await supabase
            .from('daily_reading_votes')
            .delete()
            .eq('group_id', currentGroupId)
            .eq('date', selectedDateStr)
            .eq('user_id', user.id);
          if (error) throw error;
        } else {
          let error = (await supabase.from('daily_reading_votes').upsert(
            { group_id: currentGroupId, date: selectedDateStr, user_id: user.id, vote: nextVotes, updated_at: new Date().toISOString() },
            { onConflict: 'group_id,date,user_id' }
          )).error;
          if (error) {
            const single = nextVotes[0];
            error = (await supabase.from('daily_reading_votes').upsert(
              { group_id: currentGroupId, date: selectedDateStr, user_id: user.id, vote: single, updated_at: new Date().toISOString() },
              { onConflict: 'group_id,date,user_id' }
            )).error;
          }
          if (error) throw error;
        }
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
      const nextStatus = !currentStatus;
      if (!navigator.onLine) {
        await queueHatimWrite({
          table: 'daily_reading_status',
          operation: 'update',
          payload: { id: assignmentId, is_completed: nextStatus },
        });
      } else {
        const { error } = await supabase
          .from('daily_reading_status')
          .update({ is_completed: nextStatus })
          .eq('id', assignmentId);

        if (error) throw error;
      }

      setAssignments(prev => prev.map(a =>
        a.id === assignmentId ? { ...a, is_completed: nextStatus } : a
      ));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const addDelegation = async (assignmentId: string, delegatedUserId: string) => {
    const a = assignments.find((x) => x.id === assignmentId);
    if (!a || a.user_id !== user?.id) return;
    const current = (a.allowed_audio_user_ids ?? []) as string[];
    if (current.includes(delegatedUserId)) return;
    const next = [...current, delegatedUserId];
    setSavingDelegation(true);
    try {
      const { error } = await supabase
        .from('daily_reading_status')
        .update({ allowed_audio_user_ids: next })
        .eq('id', assignmentId);
      if (error) throw error;
      setAssignments((prev) =>
        prev.map((x) => (x.id === assignmentId ? { ...x, allowed_audio_user_ids: next } : x))
      );
      setDelegationModalAssignment(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingDelegation(false);
    }
  };

  const removeDelegation = async (assignmentId: string, delegatedUserId: string) => {
    const a = assignments.find((x) => x.id === assignmentId);
    if (!a || a.user_id !== user?.id) return;
    const current = (a.allowed_audio_user_ids ?? []) as string[];
    const next = current.filter((id) => id !== delegatedUserId);
    setSavingDelegation(true);
    try {
      const { error } = await supabase
        .from('daily_reading_status')
        .update({ allowed_audio_user_ids: next })
        .eq('id', assignmentId);
      if (error) throw error;
      setAssignments((prev) =>
        prev.map((x) => (x.id === assignmentId ? { ...x, allowed_audio_user_ids: next } : x))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setSavingDelegation(false);
    }
  };

  const canEditAssignmentAudio = (a: DailyAssignment) => {
    if (isGroupOwner || a.user_id === user?.id) return true;
    const allowed = (a.allowed_audio_user_ids ?? []) as string[];
    return user?.id ? allowed.includes(user.id) : false;
  };

  const appendAssignmentAudio = async (assignmentId: string, assignmentUserId: string, newUrl: string) => {
    const a = assignments.find((x) => x.id === assignmentId);
    const canEdit = isGroupOwner || assignmentUserId === user?.id || (user?.id && ((a?.allowed_audio_user_ids ?? []) as string[]).includes(user.id));
    if (!canEdit) return;
    const a = assignments.find((x) => x.id === assignmentId);
    const current = (a?.audio_urls ?? (a?.audio_url ? [a.audio_url] : [])) as string[];
    const next = [...current, newUrl];
    try {
      const { error } = await supabase
        .from('daily_reading_status')
        .update({ audio_urls: next, is_completed: true })
        .eq('id', assignmentId);
      if (error) throw error;
      setAssignments(prev => prev.map(x => (x.id === assignmentId ? { ...x, audio_urls: next, audio_url: null, is_completed: true } : x)));
      if (user?.id && currentGroupId) {
        const logPayload = {
          group_id: currentGroupId,
          date: selectedDateStr,
          juz_number: a?.juz_number ?? selectedRamadanDay,
          activity_type: 'audio_added',
          actor_user_id: user.id,
          assignment_user_id: assignmentUserId,
        } as const;
        const { error: logError } = await supabase
          .from('reading_activity_logs')
          .insert(logPayload);
        if (logError) console.error('Error writing activity log:', logError);
        else {
          void triggerPushForActivity({
            group_id: currentGroupId,
            date: logPayload.date,
            juz_number: logPayload.juz_number,
            activity_type: logPayload.activity_type,
            actor_user_id: logPayload.actor_user_id,
          });
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
    const a = assignments.find((x) => x.id === assignmentId);
    const canEdit = isGroupOwner || assignmentUserId === user?.id || (user?.id && ((a?.allowed_audio_user_ids ?? []) as string[]).includes(user.id));
    if (!canEdit) return;
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

      const { data: latestLog } = await supabase
        .from('reading_activity_logs')
        .select('id')
        .eq('group_id', currentGroupId)
        .eq('date', selectedDateStr)
        .eq('juz_number', selectedRamadanDay)
        .eq('assignment_user_id', assignmentUserId)
        .eq('activity_type', 'audio_added')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestLog?.id) {
        const { error: logDeleteError } = await supabase
          .from('reading_activity_logs')
          .delete()
          .eq('id', latestLog.id);
        if (logDeleteError) console.error('Error deleting activity log:', logDeleteError);
      }

      setAssignments((prev) =>
        prev.map((x) => (x.id === assignmentId ? { ...x, audio_urls: next, audio_url: next[0] ?? null } : x))
      );
      await fetchData({ silent: true });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOpenParts = async () => {
    if (!currentGroupId || !user?.id) return;
    setLoadingPartsWithoutAudio(true);
    try {
      const datesInMonth: string[] = [];
      for (let i = 1; i <= islamicMonthInfo.monthLength; i++) {
        const d = new Date(islamicMonthInfo.monthStartDate);
        d.setDate(islamicMonthInfo.monthStartDate.getDate() + i - 1);
        datesInMonth.push(toLocalDateString(d));
      }
      const { data, error } = await supabase
        .from('daily_reading_status')
        .select('id, date, juz_number, is_completed')
        .eq('group_id', currentGroupId)
        .eq('user_id', user.id)
        .in('date', datesInMonth);
      if (error) throw error;
      const openParts = (data || [])
        .filter((a: { is_completed?: boolean }) => !a.is_completed)
        .map((a: { juz_number: number }) => a.juz_number);
      const unique = [...new Set(openParts)].sort((a, b) => a - b);
      setPartsWithoutAudio(unique);
    } catch (e) {
      console.error(e);
      setPartsWithoutAudio([]);
    } finally {
      setLoadingPartsWithoutAudio(false);
    }
  };

  useEffect(() => {
    if (showPartsWithoutAudioModal && isInGroup && currentGroupId && user?.id) {
      fetchOpenParts();
    }
  }, [showPartsWithoutAudioModal, isInGroup, currentGroupId, user?.id, islamicMonthInfo.monthLength, islamicMonthInfo.monthStartDate]);

  // In Gruppe: Aufteilung der Gruppe; sonst: nur eigene Aufteilung (Einzelnutzer)
  const visibleAssignments = useMemo(() => {
    const list = isInGroup
      ? assignments.filter((a) => groupMemberIds.includes(a.user_id))
      : assignments.filter((a) => a.user_id === user?.id);
    return [...list].sort((a, b) => a.start_page - b.start_page);
  }, [assignments, isInGroup, groupMemberIds, user?.id]);
  const sortedAssignments = visibleAssignments;

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  if (offlineNoCache) {
    return (
      <div className="pt-6 md:pt-8 space-y-6 pb-20">
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center">
          <p className="text-amber-800 dark:text-amber-200 mb-4">{t('offline.noCache')}</p>
          <Link to="/quran" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors">
            <BookOpen size={20} />
            {t('offline.goToQuran')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6 md:pt-8 space-y-8 pb-20 min-w-0 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-emerald-600 dark:bg-emerald-800 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-2 opacity-90">
            <Calendar size={20} />
            <span className="font-medium">{islamicMonthInfo.monthName} {t('quran.day')}</span>
            <select
              value={selectedRamadanDay}
              onChange={(e) => setSelectedRamadanDay(Number(e.target.value))}
              className="bg-white dark:bg-gray-700 text-emerald-800 dark:text-emerald-200 font-bold border-2 border-white dark:border-gray-600 rounded-lg px-4 py-2 min-w-[4rem] shadow-md focus:ring-2 focus:ring-emerald-300 focus:outline-none cursor-pointer appearance-auto"
              title={t('quran.selectDay')}
            >
              {[...Array(islamicMonthInfo.monthLength)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            {isToday ? (
              <span className="text-emerald-200 text-sm">({t('quran.today')})</span>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedRamadanDay(islamicMonthInfo.currentDay)}
                className="text-sm font-medium text-white bg-emerald-500/80 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                title={t('quran.goToToday')}
              >
                <Calendar size={14} />
                {t('quran.today')}
              </button>
            )}
            {isInGroup && (
              <button
                type="button"
                onClick={() => setShowPartsWithoutAudioModal(true)}
                className="text-sm font-medium text-white bg-emerald-500/60 hover:bg-emerald-500/80 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                title={t('quran.openParts')}
              >
                <List size={14} />
                {t('quran.openParts')}
              </button>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-2">{t('quran.juz')} {selectedRamadanDay}</h1>
          <p className="text-emerald-100 max-w-md">
            {isToday
              ? t('quran.readToday')
              : t('quran.distributionFor', { month: islamicMonthInfo.monthName, day: selectedRamadanDay })}
          </p>
        </div>
        <BookOpen className="absolute right-[-20px] bottom-[-40px] opacity-10" size={200} />
      </div>

      {/* Active Group */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Users size={20} className="text-emerald-600 dark:text-emerald-400" /> {t('quran.activeGroup')}
          </h3>
          {isGroupOwner && isInGroup && (
            <button
              type="button"
              onClick={openManageGroupModal}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <Settings2 size={16} /> {t('quran.manageGroup')}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isInGroup ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('quran.noGroup')}</p>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(true)}
                className="text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 px-3 py-1.5 rounded-lg"
              >
                {t('group.createGroup')}
              </button>
              <button
                type="button"
                onClick={openMailbox}
                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500 dark:border-emerald-400"
              >
                <Mail size={14} className="inline mr-1" /> {t('quran.invitations')}
              </button>
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('group.noOneInGroup')} {isGroupOwner && t('group.useManageToInvite')}</p>
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
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={leaveGroup}
              className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium flex items-center gap-1"
            >
              <LogOut size={14} /> {t('group.leaveGroup')}
            </button>
            <button type="button" onClick={openMailbox} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1">
              <Mail size={14} /> {t('quran.invitations')}
            </button>
          </div>
        )}
        {isInGroup && (
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
              <History size={16} className="text-emerald-600 dark:text-emerald-400" />
              {t('quran.activityLog')}
            </h4>
            {activityLogs.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('quran.noActivity')}</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => jumpToActivityDay(log.juz_number)}
                      className="block flex-1 text-left text-xs text-gray-600 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded px-1.5 py-1 transition-colors"
                      title={t('group.jumpToJuzTitle', { n: log.juz_number })}
                    >
                      {formatActivityMessage(log)}
                      <span className="text-gray-400 dark:text-gray-500"> ({formatActivityTime(log.created_at)})</span>
                    </button>
                    {isGroupOwner && (
                      <button
                        type="button"
                        onClick={() => deleteActivityLogEntry(log.id)}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        title="Log-Eintrag löschen"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
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
            {t('quran.whenCanYouRead', { month: islamicMonthInfo.monthName, day: selectedRamadanDay })}
          </h3>
          <div className="space-y-2 mb-3">
            <div className="flex flex-wrap gap-2">
              {VOTE_HOURS.map((opt) => (
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
            <div className="flex flex-wrap gap-2">
              {(['nachlesen', 'abgeben'] as const).map((opt) => (
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
          </div>
          {myVotes.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t('quran.yourChoice')} {myVotes.map(formatVoteLabel).join(', ')}
            </p>
          )}
          {votesForDay.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('quran.whoVoted')}</p>
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
      <div ref={assignmentsSectionRef} className="space-y-4 min-w-0 max-w-full">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 min-w-0">
            {isToday ? t('quran.todayDistribution') : t('quran.distributionForDay', { month: islamicMonthInfo.monthName, day: selectedRamadanDay })}
          </h3>
          {isGroupOwner && isInGroup && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={openPlanFromVotesOrModal}
                disabled={generating}
                className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : null}
                {t('quran.generateFromVotes')}
              </button>
              <button
                onClick={openDistributeModal}
                disabled={generating}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {visibleAssignments.length > 0 ? t('quran.redistribute') : t('quran.generatePlan')}
              </button>
              {visibleAssignments.length > 0 && (
                <button
                  onClick={clearDistribution}
                  disabled={generating || clearingPlan}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium flex items-center gap-1 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                >
                  {clearingPlan ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {t('quran.deleteDistribution')}
                </button>
              )}
            </div>
          )}
        </div>

        {visibleAssignments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400">
              {isInGroup
                ? (isToday ? t('quran.noPlanToday') : t('quran.noPlanForDay', { month: islamicMonthInfo.monthName, day: selectedRamadanDay }))
                : t('quran.noPlanForYou')}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 min-w-0 max-w-full">
              {sortedAssignments.map((assignment, index) => {
                const isMe = assignment.user_id === user?.id;
                const canToggle = isMe || isGroupOwner;
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
                              {t('quran.page')} <span className="font-bold text-gray-900 dark:text-gray-100">{assignment.start_page}</span> {t('quran.to')} <span className="font-bold text-gray-900 dark:text-gray-100">{assignment.end_page}</span>
                            </p>
                            {isMe && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/quran/read?assignmentId=${encodeURIComponent(assignment.id)}&startPage=${assignment.start_page}&endPage=${assignment.end_page}&date=${encodeURIComponent(selectedDateStr)}&slot=hatim`
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                                >
                                  <BookOpen size={14} />
                                  {t('quran.read')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDelegationModalAssignment(assignment)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  title={t('quran.delegateAudioTitle')}
                                >
                                  <HandHelping size={14} />
                                  {t('quran.delegateAudio')}
                                </button>
                              </div>
                            )}
                            <ReadingAudioCell
                              assignmentId={assignment.id}
                              assignmentUserId={assignment.user_id}
                              audioUrls={assignment.audio_urls ?? (assignment.audio_url ? [assignment.audio_url] : [])}
                              canEdit={canEditAssignmentAudio(assignment)}
                              onSaved={(url) => appendAssignmentAudio(assignment.id, assignment.user_id, url)}
                              onDeleted={(url) => removeAssignmentAudioUrl(assignment.id, assignment.user_id, url)}
                              showUploadControls={false}
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
                                  <CheckCircle size={18} className="sm:w-5 sm:h-5" /> {t('quran.done')}
                                </>
                              ) : (
                                <>
                                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-gray-400 dark:border-gray-500 shrink-0" />
                                  <span>{t('quran.open')}</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shrink-0 ${
                              assignment.is_completed ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}>
                              {assignment.is_completed ? t('quran.finished') : t('quran.open')}
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

      {/* Modal: Audio-Aufnahme delegieren (Hilfe anfragen) */}
      {delegationModalAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {t('quran.delegateModalTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setDelegationModalAssignment(null)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <p className="px-6 pt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('quran.delegateModalDesc')}
            </p>
            <div className="p-6 overflow-y-auto space-y-2">
              {users
                .filter((u) => u.id !== user?.id)
                .map((u) => {
                  const allowed = (delegationModalAssignment.allowed_audio_user_ids ?? []) as string[];
                  const isAllowed = allowed.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600"
                    >
                      <span className="flex-1 text-gray-800 dark:text-gray-200 truncate">
                        {u.full_name || u.email}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          isAllowed
                            ? removeDelegation(delegationModalAssignment.id, u.id)
                            : addDelegation(delegationModalAssignment.id, u.id)
                        }
                        disabled={savingDelegation}
                        className={`shrink-0 px-3 py-1 rounded-lg text-sm font-medium ${
                          isAllowed
                            ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/70'
                            : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/70'
                        } disabled:opacity-50`}
                      >
                        {savingDelegation ? <Loader2 size={14} className="animate-spin inline" /> : null}
                        {isAllowed ? t('quran.delegateRemove') : t('quran.delegateAdd')}
                      </button>
                    </div>
                  );
                })}
              {users.filter((u) => u.id !== user?.id).length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                  {t('quran.noOneInGroup')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Offene Parts (noch nicht erledigt) */}
      {showPartsWithoutAudioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {t('quran.openParts')}
              </h3>
              <button
                type="button"
                onClick={() => setShowPartsWithoutAudioModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {loadingPartsWithoutAudio ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={32} className="animate-spin text-emerald-600 dark:text-emerald-400" />
                </div>
              ) : partsWithoutAudio.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">{t('quran.allPartsCompleted')}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {partsWithoutAudio.map((juz) => (
                    <button
                      key={juz}
                      type="button"
                      onClick={() => {
                        setSelectedRamadanDay(juz);
                        setShowPartsWithoutAudioModal(false);
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/70 transition-colors"
                    >
                      {t('quran.juz')} {juz}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Seitenanzahl pro Person beim Neuverteilen */}
      {isGroupOwner && isInGroup && showDistributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {t('group.whoHowManyPages', { juz: selectedRamadanDay, month: islamicMonthInfo.monthName })}
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
              {t('group.totalPages', { n: totalPagesForJuz })}
            </p>
            {arabic3InDistributeUserId && (() => {
              const arUsers = distributionUsers.filter((u: { reader_language?: string | null }) => u.reader_language === 'ar');
              if (arUsers.length < 2) return null;
              return (
                <div className="px-6 pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{t('group.whoReads3Pages')}</span>
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
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{t('common.pages')}</span>
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
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={doGenerateAssignments}
                  disabled={!distributeValid}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {t('group.generatePlan')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Wer bekommt die Seiten von „abgeben“-Votern? */}
      {isGroupOwner && showAbgebenAssignModal && abgebenAssignData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {t('group.assignAbgebenPages')}
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
              {t('group.assignAbgebenDesc')}
            </p>
            <div className="p-6 overflow-y-auto space-y-4">
              {abgebenAssignData.abgebenUsers.map(({ user: u, pages }) => (
                <div key={u.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-700/50">
                  <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{u.full_name || u.email}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">({pages} {t('group.pagesShort')})</span>
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
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmAbgebenAssignAndGenerate}
                disabled={generating}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? <Loader2 size={18} className="animate-spin" /> : null}
                {t('group.generatePlan')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Welcher Arabisch-Leser bekommt 3 Seiten? (Plan aus Votes) */}
      {isGroupOwner && showArabic3Modal && arabic3ModalData && (() => {
        const arUsers = arabic3ModalData.orderedUsers.filter((u) => u.reader_language === 'ar');
        if (arUsers.length === 0) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {t('group.arabicReader3Pages')}
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
                {t('group.arabicReader3Desc')}
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
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={confirmArabic3AndGenerate}
                  disabled={generating}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? <Loader2 size={18} className="animate-spin" /> : null}
                  {t('group.generatePlan')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Gruppe erstellen */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('group.createGroup')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('group.createGroupDesc')}</p>
            <input
              type="text"
              value={createGroupName}
              onChange={(e) => setCreateGroupName(e.target.value)}
              placeholder={t('group.groupNamePlaceholder')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 mb-4 text-gray-800 dark:text-gray-200"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowCreateGroupModal(false); setCreateGroupName(''); }} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{t('common.cancel')}</button>
              <button type="button" onClick={createGroup} disabled={creatingGroup} className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-medium disabled:opacity-50">{creatingGroup ? <Loader2 className="animate-spin inline" size={18} /> : t('group.create')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mailbox (Anfragen) */}
      {showMailboxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><Mail size={20} /> {t('group.invitations')}</h3>
              <button type="button" onClick={() => setShowMailboxModal(false)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              {loadingMailbox ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>
              ) : pendingInvitations.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('group.noInvitations')}</p>
              ) : (
                <div className="space-y-3">
                  {pendingInvitations.map((inv) => (
                    <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{inv.group_name || t('group.defaultGroupName')}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{inv.inviter_name || inv.inviter_email} {t('group.invitesYou')}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button type="button" onClick={() => declineInvitation(inv.id)} disabled={respondingToInvite === inv.id} className="text-sm text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-50">{t('group.decline')}</button>
                        <button type="button" onClick={() => acceptInvitation(inv.id, inv.group_id)} disabled={respondingToInvite === inv.id} className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50">{respondingToInvite === inv.id ? <Loader2 size={14} className="animate-spin inline" /> : t('group.accept')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lese-Gruppe verwalten (nur Owner) */}
      {isGroupOwner && isInGroup && showManageGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {t('group.manageReadingGroup')}
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
              {t('group.manageDesc')}
            </p>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t('group.searchUser')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={groupSearchQuery}
                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUsersForGroup()}
                    placeholder={t('group.searchPlaceholder')}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-200"
                  />
                  <button type="button" onClick={searchUsersForGroup} disabled={searchingGroup} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                    {searchingGroup ? <Loader2 size={16} className="animate-spin" /> : t('group.search')}
                  </button>
                </div>
                {groupSearchResults.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {groupSearchResults.map((p) => {
                      const inGroup = users.some((u) => u.id === p.id);
                      const alreadyInvited = pendingInviteUserIds.has(p.id);
                      const isSelf = p.id === user?.id;
                      const canInvite = !inGroup && !alreadyInvited && !isSelf;
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-2 py-2 px-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                          <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{p.full_name || p.email}</span>
                          {inGroup && <span className="text-xs text-emerald-600 dark:text-emerald-400">{t('group.inGroup')}</span>}
                          {alreadyInvited && <span className="text-xs text-amber-600 dark:text-amber-400">{t('group.invited')}</span>}
                          {canInvite && (
                            <button type="button" onClick={() => inviteToGroup(p.id)} disabled={invitingUserId === p.id} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50 flex items-center gap-1">
                              {invitingUserId === p.id ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} {t('group.invite')}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{t('group.members')}</h4>
                {users.map((p) => {
                  const member = users.find((u) => u.id === p.id) as { reader_language?: string | null } | undefined;
                  const readerLang = member?.reader_language ?? null;
                  const isOwner = currentGroup?.owner_id === p.id;
                  return (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-gray-800 dark:text-gray-200 truncate">{p.full_name || p.email}</span>
                        {isOwner && <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">Owner</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={readerLang ?? ''}
                          onChange={(e) => setReaderLanguage(p.id, (e.target.value || null) as 'ar' | 'de' | null)}
                          className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          title={t('group.readingLanguage')}
                        >
                          <option value="">—</option>
                          <option value="ar">{t('group.arabic')}</option>
                          <option value="de">{t('group.german')}</option>
                        </select>
                        {isGroupOwner && p.id !== user?.id && (
                          <button type="button" onClick={() => transferOwnership(p.id)} className="text-xs text-amber-600 dark:text-amber-400 hover:underline">{t('group.transferOwnership')}</button>
                        )}
                        {p.id === user?.id ? (
                          <button type="button" onClick={leaveGroup} className="flex items-center gap-1 text-sm text-rose-600 dark:text-rose-400 hover:underline">
                            <LogOut size={14} /> {t('group.leaveGroup')}
                          </button>
                        ) : (
                          <button type="button" onClick={() => removeFromGroup(p.id)} className="flex items-center gap-1 text-sm text-rose-600 dark:text-rose-400 hover:underline">
                            <UserMinus size={14} /> {t('group.remove')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activityToast && (
        <button
          type="button"
          onClick={() => {
            jumpToActivityDay(activityToast.juzNumber);
            setActivityToast(null);
          }}
          className="fixed bottom-24 md:bottom-6 right-3 md:right-6 z-50 max-w-[92vw] md:max-w-md rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/90 px-3 py-2 text-left shadow-lg"
        >
          <p className="text-xs md:text-sm font-medium text-emerald-800 dark:text-emerald-100">
            {activityToast.message}
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">{t('quran.tapToOpen')}</p>
        </button>
      )}
    </div>
  );
}