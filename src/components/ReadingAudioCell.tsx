import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mic, Upload, Loader2, Trash2, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

const BUCKET = 'reading-audio';
const AUDIO_BITS_PER_SECOND = 64000;

export interface ReadingAudioCellProps {
  assignmentId: string;
  audioUrl: string | null;
  canEdit: boolean;
  onSaved: (url: string) => void;
  /** Nach Löschen der Datei in Storage aufrufen; DB-Update erfolgt im Parent. */
  onDeleted?: () => void | Promise<void>;
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

export function ReadingAudioCell({ assignmentId, audioUrl, canEdit, onSaved, onDeleted }: ReadingAudioCellProps) {
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const storagePath = `${assignmentId}.webm`;

  useEffect(() => {
    if (!audioUrl) {
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      return;
    }
    setCurrentTime(0);
    setDuration(0);
    const el = audioRef.current;
    if (!el) return;
    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onLoadedMetadata = () => setDuration(el.duration);
    const onDurationChange = () => setDuration(el.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
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
  }, [audioUrl]);

  const uploadBlob = async (blob: Blob): Promise<string> => {
    const file = new File([blob], storagePath, { type: blob.type });
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return publicUrl;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options: MediaRecorderOptions = { audioBitsPerSecond: AUDIO_BITS_PER_SECOND };
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      }
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
          const url = await uploadBlob(blob);
          onSaved(url);
        } catch (e) {
          console.error(e);
        } finally {
          setUploading(false);
        }
      };
      mr.start();
      setRecording(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      onSaved(publicUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteAudio = async () => {
    if (!onDeleted) return;
    setDeleting(true);
    try {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      onDeleted();
    } catch (e) {
      console.error(e);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

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
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const time = pct * el.duration;
    el.currentTime = time;
    setCurrentTime(time);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {audioUrl && (
        <>
          <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={togglePlay}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              title={isPlaying ? 'Pause' : 'Abspielen'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={() => seek(-10)}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 shrink-0"
              title="-10 Sekunden"
            >
              <SkipBack size={16} />
            </button>
            <button
              type="button"
              onClick={() => seek(10)}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 shrink-0"
              title="+10 Sekunden"
            >
              <SkipForward size={16} />
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0 min-w-[4.5rem]">
              {formatTime(currentTime)} / {formatDuration(duration)}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 w-full max-w-xs rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer overflow-hidden"
            onClick={onProgressClick}
          >
            <div
              className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}
      {canEdit && (
        <>
          {audioUrl && (
            <button
              type="button"
              onClick={deleteAudio}
              disabled={deleting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-sm font-medium hover:bg-rose-200 dark:hover:bg-rose-900/60 disabled:opacity-50 w-fit"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Audio löschen
            </button>
          )}
          {recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-sm font-medium w-fit"
            >
              Stopp
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={uploading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 w-fit"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Mic size={14} />}
              Aufnehmen
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 w-fit"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Hochladen
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={onFileSelect}
          />
        </>
      )}
    </div>
  );
}
