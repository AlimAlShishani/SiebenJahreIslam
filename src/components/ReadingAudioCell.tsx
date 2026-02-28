import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Mic, Upload, Loader2 } from 'lucide-react';

const BUCKET = 'reading-audio';
const AUDIO_BITS_PER_SECOND = 64000;

interface ReadingAudioCellProps {
  assignmentId: string;
  audioUrl: string | null;
  canEdit: boolean;
  onSaved: (url: string) => void;
}

export function ReadingAudioCell({ assignmentId, audioUrl, canEdit, onSaved }: ReadingAudioCellProps) {
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const storagePath = `${assignmentId}.webm`;

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

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {audioUrl && (
        <audio
          src={audioUrl}
          controls
          className="max-w-full h-8 rounded-lg"
          preload="metadata"
        />
      )}
      {canEdit && (
        <>
          {recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-sm font-medium"
            >
              Stopp
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={uploading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Mic size={14} />}
              Aufnehmen
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
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
