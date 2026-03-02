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

type RecorderUiState = {
  assignmentId: string | null;
  recording: boolean;
  paused: boolean;
  uploading: boolean;
};

let activeMediaRecorder: MediaRecorder | null = null;
let activeStream: MediaStream | null = null;
let activeChunks: Blob[] = [];
let activeRecordingPath = '';
let activeOnSaved: ((url: string) => void) | null = null;
let activeWakeLock: { release: () => Promise<void> } | null = null;
let activeSilentAudioContext: AudioContext | null = null;
let activeSilentSource: AudioBufferSourceNode | null = null;
const recorderListeners = new Set<(s: RecorderUiState) => void>();

const recorderUiState: RecorderUiState = {
  assignmentId: null,
  recording: false,
  paused: false,
  uploading: false,
};

const emitRecorderState = () => {
  const snapshot = { ...recorderUiState };
  recorderListeners.forEach((listener) => listener(snapshot));
};

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

export function ReadingAudioCell({ assignmentId, audioUrls, canEdit, onSaved, onDeleted }: ReadingAudioCellProps) {
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startSilentPlayback = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      activeSilentAudioContext = ctx;
      const duration = 0.1;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(ctx.destination);
      source.start(0);
      activeSilentSource = source;
    } catch {
      activeSilentAudioContext = null;
      activeSilentSource = null;
    }
  };

  const stopSilentPlayback = () => {
    try {
      activeSilentSource?.stop();
      activeSilentSource = null;
      activeSilentAudioContext?.close();
      activeSilentAudioContext = null;
    } catch {
      activeSilentSource = null;
      activeSilentAudioContext = null;
    }
  };

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && typeof (navigator as any).wakeLock?.request === 'function') {
        activeWakeLock = await (navigator as any).wakeLock.request('screen');
      }
    } catch {
      activeWakeLock = null;
    }
  };

  const releaseWakeLock = async () => {
    try {
      if (activeWakeLock) {
        await activeWakeLock.release();
        activeWakeLock = null;
      }
    } catch {
      activeWakeLock = null;
    }
  };

  useEffect(() => {
    const listener = (s: RecorderUiState) => {
      const sameAssignment = s.assignmentId === assignmentId;
      setRecording(sameAssignment && s.recording);
      setRecordingPaused(sameAssignment && s.paused);
      setUploading(sameAssignment && s.uploading);
      if (sameAssignment) {
        activeOnSaved = onSaved;
      }
    };
    recorderListeners.add(listener);
    listener({ ...recorderUiState });
    if (recorderUiState.assignmentId === assignmentId) {
      activeOnSaved = onSaved;
    }
    return () => {
      recorderListeners.delete(listener);
    };
  }, [assignmentId, onSaved]);

  useEffect(() => {
    if (!recording) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeMediaRecorder?.state === 'recording') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
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
    if (recorderUiState.recording && recorderUiState.assignmentId !== assignmentId) {
      alert('Es läuft bereits eine Aufnahme in einer anderen Aufgabe. Bitte zuerst dort senden.');
      return;
    }
    if (recorderUiState.recording && recorderUiState.assignmentId === assignmentId) return;
    try {
      activeRecordingPath = `${assignmentId}_${Date.now()}.webm`;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options: MediaRecorderOptions = { audioBitsPerSecond: AUDIO_BITS_PER_SECOND };
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) options.mimeType = 'audio/webm;codecs=opus';
      else if (MediaRecorder.isTypeSupported('audio/webm')) options.mimeType = 'audio/webm';
      const mr = new MediaRecorder(stream, options);
      activeMediaRecorder = mr;
      activeStream = stream;
      activeOnSaved = onSaved;
      activeChunks = [];
      recorderUiState.assignmentId = assignmentId;
      recorderUiState.recording = true;
      recorderUiState.paused = false;
      emitRecorderState();
      mr.ondataavailable = (e) => { if (e.data.size > 0) activeChunks.push(e.data); };
      mr.onpause = () => {
        recorderUiState.paused = true;
        emitRecorderState();
      };
      mr.onresume = () => {
        recorderUiState.paused = false;
        emitRecorderState();
      };
      mr.onstop = async () => {
        activeStream?.getTracks().forEach((t) => t.stop());
        activeStream = null;
        recorderUiState.recording = false;
        recorderUiState.paused = false;
        recorderUiState.uploading = true;
        emitRecorderState();
        const blob = new Blob(activeChunks, { type: mr.mimeType || 'audio/webm' });
        activeChunks = [];
        if (blob.size === 0) {
          recorderUiState.uploading = false;
          recorderUiState.assignmentId = null;
          emitRecorderState();
          activeMediaRecorder = null;
          activeRecordingPath = '';
          await releaseWakeLock();
          stopSilentPlayback();
          return;
        }
        try {
          const url = await uploadToPath(activeRecordingPath, blob);
          activeOnSaved?.(url);
        } catch (e) {
          console.error(e);
        } finally {
          recorderUiState.uploading = false;
          recorderUiState.assignmentId = null;
          emitRecorderState();
          activeMediaRecorder = null;
          activeRecordingPath = '';
          await releaseWakeLock();
          stopSilentPlayback();
        }
      };
      mr.start();
      startSilentPlayback();
      await requestWakeLock();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRecordingPause = () => {
    const mr = activeMediaRecorder;
    if (!mr) return;
    try {
      if (mr.state === 'recording') { mr.pause(); }
      else if (mr.state === 'paused') { mr.resume(); }
    } catch {
      recorderUiState.paused = false;
      emitRecorderState();
    }
  };

  const sendRecording = () => {
    if (activeMediaRecorder && activeMediaRecorder.state !== 'inactive') {
      activeMediaRecorder.stop();
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
      {audioUrls.map((url) => (
        <SingleAudioPlayer
          key={url}
          url={url}
          canDelete={canEdit}
          onDelete={() => deleteOneAudio(url)}
          deleting={deletingUrl === url}
        />
      ))}
      {canEdit && (
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
