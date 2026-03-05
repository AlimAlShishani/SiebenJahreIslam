import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronUp, Mic, Upload, Loader2, Trash2, Play, Pause, SkipBack, SkipForward, Send } from 'lucide-react';

const BUCKET = 'reading-audio';
const AUDIO_BITS_PER_SECOND = 48000;

export interface ReadingAudioCellProps {
  assignmentId: string;
  /** user_id des Assignments – für sichere Storage-Pfade (RLS) */
  assignmentUserId: string;
  audioUrls: string[];
  canEdit: boolean;
  onSaved: (url: string) => void;
  onDeleted?: (url: string) => void | Promise<void>;
  showUploadControls?: boolean;
  showPlayers?: boolean;
  /** Kompaktere Darstellung (z. B. Sidebar Desktop) */
  compact?: boolean;
  /** Mobile Reader Bottom-Bar Darstellung */
  mobileBar?: boolean;
  /** Aktueller Zustand des Audio-Panels (nur mobileBar) */
  mobileAudioOpen?: boolean;
  /** Öffnet/Schließt das Audio-Panel (nur mobileBar) */
  onToggleMobileAudio?: () => void;
  /** Callback für Mobile-Bar, wenn Aufnahme startet/endet */
  onRecordingChange?: (active: boolean) => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '–:––';
  return formatTime(seconds);
}

/** Extrahiert den Storage-Pfad aus der Public-URL (vollständiger Pfad nach Bucket). */
function getStoragePathFromUrl(url: string): string | null {
  if (!url?.trim()) return null;
  try {
    const pathname = new URL(url).pathname;
    const bucketSegment = pathname.split('/').findIndex((s) => s === BUCKET);
    if (bucketSegment >= 0 && bucketSegment < pathname.split('/').length - 1) {
      const afterBucket = pathname.split('/').slice(bucketSegment + 1).join('/').split('?')[0];
      return afterBucket || null;
    }
    const segments = pathname.split('/');
    const name = segments[segments.length - 1]?.split('?')[0];
    return name || null;
  } catch {
    const last = url.split('/').pop()?.split('?')[0];
    return last || null;
  }
}

function SingleAudioPlayer({
  url,
  canDelete,
  onDelete,
  deleting,
  compact = false,
}: { url: string; canDelete: boolean; onDelete: () => void; deleting?: boolean; compact?: boolean }) {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onLoadedMetadata = () => setDuration(el.duration);
    const onDurationChange = () => setDuration(el.duration);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('durationchange', onDurationChange);
    el.addEventListener('ended', onEnded);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    if (Number.isFinite(el.duration)) setDuration(el.duration);
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('durationchange', onDurationChange);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [url]);

  const seek = (delta: number) => {
    const el = audioRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(el.duration || 0, el.currentTime + delta));
    el.currentTime = next;
    setCurrentTime(next);
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  };

  const onProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    el.currentTime = pct * el.duration;
    setCurrentTime(el.currentTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const playSize = compact ? 14 : 18;
  const seekSize = compact ? 12 : 16;
  const boxClass = compact ? 'gap-1 p-1.5 rounded-md' : 'gap-1.5 p-2 rounded-lg';
  const btnClass = compact ? 'w-7 h-7 rounded-md' : 'w-9 h-9 rounded-full';
  const seekBtnClass = compact ? 'w-6 h-6 rounded' : 'w-8 h-8 rounded-lg';

  return (
    <div className={`flex flex-col ${boxClass} bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700`}>
      <audio ref={audioRef} src={url} preload="metadata" className="hidden" />
      <div className="flex items-center gap-1.5 flex-wrap">
        <button type="button" onClick={togglePlay} className={`flex items-center justify-center ${btnClass} bg-emerald-600 hover:bg-emerald-700 text-white shrink-0`} title={isPlaying ? t('audio.pause') : t('audio.play')}>
          {isPlaying ? <Pause size={playSize} /> : <Play size={playSize} className="ml-0.5" />}
        </button>
        <button type="button" onClick={() => seek(-10)} className={`flex items-center justify-center ${seekBtnClass} bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 shrink-0`} title="-10 s">
          <SkipBack size={seekSize} />
        </button>
        <button type="button" onClick={() => seek(10)} className={`flex items-center justify-center ${seekBtnClass} bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 shrink-0`} title="+10 s">
          <SkipForward size={seekSize} />
        </button>
        <span className={`tabular-nums shrink-0 text-gray-500 dark:text-gray-400 ${compact ? 'text-[10px] min-w-[3.5rem]' : 'text-xs min-w-[4.5rem]'}`}>
          {formatTime(currentTime)} / {formatDuration(duration)}
        </span>
        {canDelete && (
          <button type="button" onClick={onDelete} disabled={deleting} className={`flex items-center gap-1 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-medium hover:bg-rose-200 dark:hover:bg-rose-900/60 disabled:opacity-50 ml-auto ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-sm'}`}>
            {deleting ? <Loader2 size={compact ? 10 : 14} className="animate-spin" /> : <Trash2 size={compact ? 10 : 14} />}
            {t('audio.delete')}
          </button>
        )}
      </div>
      <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className={`w-full rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer overflow-hidden ${compact ? 'h-1.5 max-w-[10rem]' : 'h-2 max-w-xs'}`} onClick={onProgressClick}>
        <div className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-150" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export function ReadingAudioCell({
  assignmentId,
  assignmentUserId,
  audioUrls,
  canEdit,
  onSaved,
  onDeleted,
  showUploadControls = true,
  showPlayers = true,
  compact = false,
  mobileBar = false,
  mobileAudioOpen = false,
  onToggleMobileAudio,
  onRecordingChange,
}: ReadingAudioCellProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingPathRef = useRef<string>('');
  const cancelRecordingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const silentAudioContextRef = useRef<AudioContext | null>(null);
  const silentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const startSilentPlayback = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      silentAudioContextRef.current = ctx;
      const duration = 0.1;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(ctx.destination);
      source.start(0);
      silentSourceRef.current = source;
    } catch {
      silentAudioContextRef.current = null;
      silentSourceRef.current = null;
    }
  };

  const stopSilentPlayback = () => {
    try {
      silentSourceRef.current?.stop();
      silentSourceRef.current = null;
      silentAudioContextRef.current?.close();
      silentAudioContextRef.current = null;
    } catch {
      silentSourceRef.current = null;
      silentAudioContextRef.current = null;
    }
  };

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && typeof (navigator as any).wakeLock?.request === 'function') {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch {
      wakeLockRef.current = null;
    }
  };

  const releaseWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch {
      wakeLockRef.current = null;
    }
  };

  useEffect(() => {
    if (!recording) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mediaRecorderRef.current?.state === 'recording') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      releaseWakeLock();
      stopSilentPlayback();
    };
  }, [recording]);

  const uploadToPath = async (path: string, blob: Blob): Promise<string> => {
    const file = new File([blob], path, { type: blob.type });
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return `${publicUrl}${publicUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
  };

  const startRecording = async () => {
    try {
      cancelRecordingRef.current = false;
      recordingPathRef.current = `${assignmentUserId}/${assignmentId}_${Date.now()}.webm`;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options: MediaRecorderOptions = { audioBitsPerSecond: AUDIO_BITS_PER_SECOND };
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) options.mimeType = 'audio/webm;codecs=opus';
      else if (MediaRecorder.isTypeSupported('audio/webm')) options.mimeType = 'audio/webm';
      const mr = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (cancelRecordingRef.current) {
          cancelRecordingRef.current = false;
          chunksRef.current = [];
          return;
        }
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        if (blob.size === 0) return;
        setUploading(true);
        try {
          const url = await uploadToPath(recordingPathRef.current, blob);
          onSaved(url);
        } catch (e) {
          console.error(e);
        } finally {
          setUploading(false);
        }
      };
      // Falls das Audio-Panel in der Mobile-Bar geöffnet ist, beim Start der Aufnahme zuklappen.
      if (mobileBar && mobileAudioOpen && onToggleMobileAudio) {
        onToggleMobileAudio();
      }
      mr.start();
      setRecording(true);
      if (onRecordingChange) onRecordingChange(true);
      setRecordingPaused(false);
      startSilentPlayback();
      await requestWakeLock();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRecordingPause = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    try {
      if (mr.state === 'recording') { mr.pause(); setRecordingPaused(true); }
      else if (mr.state === 'paused') { mr.resume(); setRecordingPaused(false); }
    } catch {
      setRecordingPaused(false);
    }
  };

  const sendRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setRecordingPaused(false);
      releaseWakeLock();
      stopSilentPlayback();
      if (onRecordingChange) onRecordingChange(false);
    }
  };

  const cancelRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      cancelRecordingRef.current = true;
      mr.stop();
    }
    setRecording(false);
    setRecordingPaused(false);
    releaseWakeLock();
    stopSilentPlayback();
    if (onRecordingChange) onRecordingChange(false);
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const path = `${assignmentUserId}/${assignmentId}_${Date.now()}_${i}.webm`;
        const file = files[i];
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
        onSaved(`${publicUrl}${publicUrl.includes('?') ? '&' : '?'}t=${Date.now()}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteOneAudio = async (url: string) => {
    if (!onDeleted) return;
    if (!window.confirm(t('audio.confirmDelete'))) return;
    setDeletingUrl(url);
    try {
      const path = getStoragePathFromUrl(url);
      if (path) {
        try {
          await supabase.storage.from(BUCKET).remove([path]);
        } catch {
          // Datei existiert nicht mehr im Storage – trotzdem aus DB/Anzeige entfernen
        }
      }
      onDeleted(url);
    } catch (e) {
      console.error(e);
      onDeleted(url);
    } finally {
      setDeletingUrl(null);
    }
  };

  const gapClass = compact ? 'gap-1.5' : 'gap-3';
  const btnClass = compact
    ? 'min-w-0 px-2 py-1 rounded-md text-xs'
    : 'min-w-[8.5rem] px-2.5 py-1.5 rounded-lg text-sm';
  const iconSize = compact ? 12 : 14;

  return (
    <div className={compact ? 'mt-1 flex flex-col gap-1.5' : 'mt-2 flex flex-col gap-3'}>
      {showPlayers &&
        audioUrls.map((url) => (
          <SingleAudioPlayer
            key={url}
            url={url}
            canDelete={canEdit}
            onDelete={() => deleteOneAudio(url)}
            deleting={deletingUrl === url}
            compact={compact}
          />
        ))}
      {canEdit && showUploadControls && (
        <>
          {mobileBar ? (
            recording ? (
              <div className="relative h-full flex flex-col items-center justify-end pb-2 gap-3 translate-x-[1px]">
                {/* Pause / Abbrechen deutlich oberhalb des Senden-Buttons, ohne Überlappung */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-10">
                  <button
                    type="button"
                    onClick={toggleRecordingPause}
                    className="w-8 h-8 rounded-full inline-flex items-center justify-center bg-gray-700 text-gray-200 hover:bg-gray-600 shadow-md"
                    aria-label={recordingPaused ? t('audio.resume') : t('audio.pause')}
                  >
                    {recordingPaused ? <Play size={12} /> : <Pause size={12} />}
                  </button>
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="w-8 h-8 rounded-full inline-flex items-center justify-center bg-rose-900/80 text-rose-200 hover:bg-rose-900 shadow-md"
                    aria-label={t('audio.cancelRecording')}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={sendRecording}
                  className="w-12 h-12 rounded-full inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all transform hover:scale-105"
                  aria-label={t('audio.sendRecording')}
                >
                  <Send size={20} />
                </button>
              </div>
            ) : (
              <div className="relative h-full flex flex-col items-center justify-end pb-2 gap-2 translate-x-[1px]">
                <button
                  type="button"
                  onClick={onToggleMobileAudio}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={t('audio.showRecordings')}
                >
                  {mobileAudioOpen ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                </button>
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={uploading}
                  className="w-12 h-12 rounded-full inline-flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-200 shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t('audio.startRecording')}
                >
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />}
                </button>
              </div>
            )
          ) : recording ? (
            <>
              {!compact && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('audio.recordingInProgress')}
                </p>
              )}
              <div className={`flex items-center gap-2 flex-wrap ${gapClass}`}>
                <button type="button" onClick={toggleRecordingPause} className={`flex-1 inline-flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 ${btnClass}`}>
                  {recordingPaused ? <><Play size={iconSize} /> {t('audio.resume')}</> : <><Pause size={iconSize} /> {t('audio.pause')}</>}
                </button>
                <button type="button" onClick={sendRecording} className={`flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white font-medium hover:bg-emerald-700 ${btnClass}`}>
                  <Send size={iconSize} /> {t('audio.sendRecording')}
                </button>
                <button type="button" onClick={cancelRecording} className={`flex-1 inline-flex items-center justify-center gap-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-medium hover:bg-rose-200 dark:hover:bg-rose-900/60 ${btnClass}`}>
                  <Trash2 size={iconSize} /> {t('audio.cancelRecording')}
                </button>
              </div>
            </>
          ) : (
            <div className={`flex items-center gap-2 flex-wrap ${gapClass}`}>
              <button type="button" onClick={startRecording} disabled={uploading} className={`flex-1 inline-flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 ${btnClass}`}>
                {uploading ? <Loader2 size={iconSize} className="animate-spin" /> : <Mic size={iconSize} />}
                {t('audio.record')}
              </button>
              <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className={`flex-1 inline-flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 ${btnClass}`}>
                {uploading ? <Loader2 size={iconSize} className="animate-spin" /> : <Upload size={iconSize} />}
                {t('audio.upload')}
              </button>
            </div>
          )}
          <input ref={inputRef} type="file" accept="audio/*" multiple className="hidden" onChange={onFileSelect} />
        </>
      )}
    </div>
  );
}
