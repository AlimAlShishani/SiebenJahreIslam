import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mic, Upload, Loader2, Trash2, Play, Pause, SkipBack, SkipForward, Send } from 'lucide-react';

const BUCKET = 'reading-audio';
const AUDIO_BITS_PER_SECOND = 48000;

export interface ReadingAudioCellProps {
  assignmentId: string;
  audioUrls: string[];
  canEdit: boolean;
  onSaved: (url: string) => void;
  onDeleted?: (url: string) => void | Promise<void>;
  showUploadControls?: boolean;
  showPlayers?: boolean;
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

function getStoragePathFromUrl(url: string): string | null {
  if (!url?.trim()) return null;
  try {
    const pathname = new URL(url).pathname;
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
}: { url: string; canDelete: boolean; onDelete: () => void; deleting?: boolean }) {
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

  return (
    <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <audio ref={audioRef} src={url} preload="metadata" className="hidden" />
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={togglePlay} className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shrink-0" title={isPlaying ? 'Pause' : 'Abspielen'}>
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <button type="button" onClick={() => seek(-10)} className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 shrink-0" title="-10 s">
          <SkipBack size={16} />
        </button>
        <button type="button" onClick={() => seek(10)} className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 shrink-0" title="+10 s">
          <SkipForward size={16} />
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0 min-w-[4.5rem]">
          {formatTime(currentTime)} / {formatDuration(duration)}
        </span>
        {canDelete && (
          <button type="button" onClick={onDelete} disabled={deleting} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-sm font-medium hover:bg-rose-200 dark:hover:bg-rose-900/60 disabled:opacity-50 ml-auto">
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Löschen
          </button>
        )}
      </div>
      <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="h-2 w-full max-w-xs rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer overflow-hidden" onClick={onProgressClick}>
        <div className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-150" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export function ReadingAudioCell({
  assignmentId,
  audioUrls,
  canEdit,
  onSaved,
  onDeleted,
  showUploadControls = true,
  showPlayers = true,
}: ReadingAudioCellProps) {
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingPathRef = useRef<string>('');
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
      recordingPathRef.current = `${assignmentId}_${Date.now()}.webm`;
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
      mr.start();
      setRecording(true);
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
    }
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const path = `${assignmentId}_${Date.now()}_${i}.webm`;
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
    if (!window.confirm('Dieses Audio wirklich endgültig löschen?')) return;
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

  return (
    <div className="mt-2 flex flex-col gap-3">
      {showPlayers &&
        audioUrls.map((url) => (
          <SingleAudioPlayer
            key={url}
            url={url}
            canDelete={canEdit}
            onDelete={() => deleteOneAudio(url)}
            deleting={deletingUrl === url}
          />
        ))}
      {canEdit && showUploadControls && (
        <>
          {recording ? (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Aufnahme läuft – Tab offen lassen, dann bleibt die Aufnahme erhalten.
              </p>
              <button type="button" onClick={toggleRecordingPause} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 w-fit">
                {recordingPaused ? <><Play size={14} /> Fortsetzen</> : <><Pause size={14} /> Pause</>}
              </button>
              <button type="button" onClick={sendRecording} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 w-fit">
                <Send size={14} /> Senden
              </button>
            </>
          ) : (
            <button type="button" onClick={startRecording} disabled={uploading} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 w-fit">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Mic size={14} />}
              Aufnehmen
            </button>
          )}
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 w-fit">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Hochladen
          </button>
          <input ref={inputRef} type="file" accept="audio/*" multiple className="hidden" onChange={onFileSelect} />
        </>
      )}
    </div>
  );
}
