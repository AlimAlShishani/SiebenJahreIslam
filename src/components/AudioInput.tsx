import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Mic, Upload, Library, Play, Square, Trash2, Search, Check, Pause, Edit2, Save, X } from 'lucide-react';

interface AudioInputProps {
  label: string;
  currentUrl: string | null;
  onAudioChange: (file: File | null, url: string | null) => void;
  onSave?: () => void; // Callback for immediate save
  suggestedName?: string; // Optional: Custom filename for recordings
}

export function AudioInput({ label, currentUrl, onAudioChange, onSave, suggestedName }: AudioInputProps) {
  const [mode, setMode] = useState<'upload' | 'record' | 'library'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [displayName, setDisplayName] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Library State
  const [libraryFiles, setLibraryFiles] = useState<{name: string, url: string}[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');

  // Edit Display Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Debug State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setPreviewUrl(currentUrl);
    if (currentUrl) {
      try {
        const urlObj = new URL(currentUrl);
        const pathParts = urlObj.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        setDisplayName(decodeURIComponent(fileName));
      } catch (e) {
        setDisplayName('Gespeichertes Audio');
      }
    } else {
      setDisplayName('');
    }
  }, [currentUrl]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // --- RECORDING LOGIC ---
  const startRecording = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Dein Browser unterstützt keine Audio-Aufnahme.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        if (blob.size === 0) {
          setErrorMsg("Aufnahme war leer.");
          return;
        }

        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        let fileName = `recording-${Date.now()}.${ext}`;

        if (suggestedName) {
          // Sanitize filename: allow only letters, numbers, underscores, hyphens
          // Example: "_hhu" from suggestedName
          const safeName = suggestedName.replace(/[^a-z0-9_\-]/gi, '').toLowerCase();
          if (safeName) {
             fileName = `${safeName}.${ext}`;
          }
        }
        
        const file = new File([blob], fileName, { type: mimeType });
        
        // Auto-Upload Logic
        try {
          const { error: uploadError } = await supabase.storage
            .from('audio-files')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('audio-files')
            .getPublicUrl(fileName);

          // If there was a previous recording that wasn't renamed (still starts with "recording-") 
          // AND the new name is different from the old one (to avoid deleting what we just overwrote if names match)
          if (displayName && displayName.startsWith('recording-') && currentUrl && displayName !== fileName) {
             try {
                // Extract filename from currentUrl to be sure
                const urlObj = new URL(currentUrl);
                const pathParts = urlObj.pathname.split('/');
                const oldFileName = pathParts[pathParts.length - 1];
                await supabase.storage.from('audio-files').remove([decodeURIComponent(oldFileName)]);
             } catch (e) {
                console.error("Error deleting old recording:", e);
             }
          }

          setPreviewUrl(publicUrl);
          setDisplayName(fileName);
          onAudioChange(null, publicUrl); // Pass URL directly, no file needed for upload later
          
          // Optional: Trigger save if parent provided callback
          // if (onSave) onSave(); 

        } catch (err: any) {
          console.error("Auto-upload failed:", err);
          setErrorMsg("Upload fehlgeschlagen: " + err.message);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setErrorMsg(`Mikrofon-Fehler: ${err.message}`);
    }
  };

  const stopRecording = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // --- LIBRARY LOGIC ---
  const loadLibrary = async () => {
    setLoadingLibrary(true);
    const { data, error } = await supabase.storage.from('audio-files').list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    
    if (error) {
      console.error('Error loading library:', error);
    } else {
      const files = data.map(f => {
        const { data: { publicUrl } } = supabase.storage.from('audio-files').getPublicUrl(f.name);
        return { name: f.name, url: publicUrl };
      });
      setLibraryFiles(files);
    }
    setLoadingLibrary(false);
  };

  useEffect(() => {
    if (mode === 'library') {
      loadLibrary();
    }
  }, [mode]);

  const selectFromLibrary = (url: string, fileName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreviewUrl(url);
    setDisplayName(fileName);
    onAudioChange(null, url); 
  };

  const deleteFromLibrary = async (fileName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Möchtest du "${fileName}" wirklich löschen?`)) return;
    
    setLoadingLibrary(true); 
    const { error } = await supabase.storage.from('audio-files').remove([fileName]);
    
    if (error) {
      alert('Fehler beim Löschen: ' + error.message);
      setLoadingLibrary(false);
    } else {
      setLibraryFiles(prev => prev.filter(f => f.name !== fileName));
      
      if (previewUrl && displayName === fileName) {
        setPreviewUrl(null);
        setDisplayName('');
        onAudioChange(null, null);
        alert('Datei gelöscht. Die Auswahl wurde entfernt.');
      }

      setLoadingLibrary(false);
    }
  };

  const startRename = (fileName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingFile(fileName);
    setNewFileName(fileName);
  };

  const saveRename = async (oldName: string, e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (!newFileName || newFileName === oldName) {
      setEditingFile(null);
      return;
    }

    setLoadingLibrary(true);
    const { error } = await supabase.storage.from('audio-files').move(oldName, newFileName);
    
    if (error) {
      alert('Fehler beim Umbenennen: ' + error.message);
      setLoadingLibrary(false);
    } else {
      loadLibrary(); 
      if (displayName === oldName) {
        setDisplayName(newFileName);
      }
    }
    setEditingFile(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingFile(null);
  }

  // --- DIRECT RENAME (SELECTED AUDIO) ---
  const startDirectRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!displayName || !previewUrl) return;
    setTempName(displayName);
    setIsEditingName(true);
  };

  const saveDirectRename = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!tempName || tempName === displayName) {
      setIsEditingName(false);
      return;
    }

    // Rename in Storage
    const { error } = await supabase.storage.from('audio-files').move(displayName, tempName);
    
    if (error) {
      alert('Fehler beim Umbenennen: ' + error.message);
    } else {
      setDisplayName(tempName);
      const { data: { publicUrl } } = supabase.storage.from('audio-files').getPublicUrl(tempName);
      setPreviewUrl(publicUrl);
      onAudioChange(null, publicUrl);
    }
    setIsEditingName(false);
  };

  // --- UPLOAD LOGIC ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setDisplayName(file.name);
      onAudioChange(file, null);
    }
  };

  const clearAudio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setPreviewUrl(null);
    setDisplayName('');
    onAudioChange(null, null);
  };

  const togglePlay = (e: React.MouseEvent, url?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const targetUrl = url || previewUrl;
    
    if (!targetUrl) return;

    if (isPlaying && audioRef.current && audioRef.current.src === targetUrl) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current || audioRef.current.src !== targetUrl) {
        if (audioRef.current) audioRef.current.pause(); 
        audioRef.current = new Audio(targetUrl);
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = (e: Event | string) => {
            console.error("Audio playback error", e);
            // Safe casting for the event target
            if (typeof e === 'object' && e !== null && 'target' in e) {
                const target = e.target as HTMLAudioElement;
                setErrorMsg(`Fehler: ${target.error?.message || 'Format nicht unterstützt'}`);
            } else {
                setErrorMsg('Fehler beim Abspielen des Audios');
            }
            setIsPlaying(false);
        };
      }
      
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => {
          console.error("Error playing audio:", e);
          setErrorMsg("Konnte Audio nicht abspielen: " + e.message);
          setIsPlaying(false);
        });
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
        {onSave && (
          <button 
            type="button" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(); }}
            className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition-colors"
          >
            <Save size={12} /> Speichern
          </button>
        )}
      </div>
      
      {errorMsg && (
        <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded border border-red-200 dark:border-red-800">
          {errorMsg}
        </div>
      )}

      {/* PREVIEW AREA */}
      {previewUrl ? (
        <div className="flex items-center gap-2 mb-4 bg-white dark:bg-gray-900 p-2 rounded border border-emerald-100 dark:border-emerald-900 shadow-sm">
          <button 
            type="button" 
            onClick={(e) => togglePlay(e)} 
            className={`p-2 rounded-full transition-colors ${isPlaying && audioRef.current?.src === previewUrl ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
          >
            {isPlaying && audioRef.current?.src === previewUrl ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          {isEditingName ? (
            <div className="flex flex-grow gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
              <input 
                type="text" 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)}
                className="flex-grow text-xs border rounded px-1"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <button type="button" onClick={saveDirectRename} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Save size={12} /></button>
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditingName(false); }} className="text-gray-400 hover:bg-gray-100 p-1 rounded"><X size={12} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-grow overflow-hidden mr-2 group">
              <span className="text-xs text-gray-600 dark:text-gray-300 truncate font-mono" title={displayName}>
                {displayName || 'Audio'}
              </span>
              {displayName && (
                <button type="button" onClick={startDirectRename} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 p-1 transition-opacity">
                  <Edit2 size={10} />
                </button>
              )}
            </div>
          )}

          <button type="button" onClick={clearAudio} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <div className="mb-4 text-xs text-gray-400 dark:text-gray-500 italic p-2 border border-dashed rounded text-center">
          Kein Audio ausgewählt
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-1 mb-3 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setMode('upload'); }}
          className={`flex-1 flex items-center justify-center gap-1 py-1 text-xs rounded transition-all ${mode === 'upload' ? 'bg-white dark:bg-gray-900 shadow text-emerald-700 dark:text-emerald-300 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
        >
          <Upload size={14} /> Upload
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setMode('record'); }}
          className={`flex-1 flex items-center justify-center gap-1 py-1 text-xs rounded transition-all ${mode === 'record' ? 'bg-white dark:bg-gray-900 shadow text-emerald-700 dark:text-emerald-300 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
        >
          <Mic size={14} /> Aufnahme
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setMode('library'); }}
          className={`flex-1 flex items-center justify-center gap-1 py-1 text-xs rounded transition-all ${mode === 'library' ? 'bg-white dark:bg-gray-900 shadow text-emerald-700 dark:text-emerald-300 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
        >
          <Library size={14} /> Bibliothek
        </button>
      </div>

      {/* CONTENT */}
      <div className="min-h-[100px] flex flex-col justify-center">
        
        {/* MODE: UPLOAD */}
        {mode === 'upload' && (
          <input 
            type="file" 
            accept="audio/*"
            onChange={handleFileUpload}
            className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
          />
        )}

        {/* MODE: RECORD */}
        {mode === 'record' && (
          <div className="flex flex-col items-center gap-3">
            {!isRecording ? (
              <button 
                type="button" 
                onClick={startRecording}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm active:scale-95 transform"
              >
                <Mic size={18} /> Aufnahme starten
              </button>
            ) : (
              <button 
                type="button" 
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-colors animate-pulse"
              >
                <Square size={18} /> Stopp ({recordingTime}s)
              </button>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500">Mikrofon wird benötigt</p>
          </div>
        )}

        {/* MODE: LIBRARY */}
        {mode === 'library' && (
          <div className="space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-2 text-gray-400 dark:text-gray-500" />
              <input 
                type="text" 
                placeholder="Suchen..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 p-1 space-y-1">
              {loadingLibrary ? (
                <p className="text-center text-xs text-gray-400 py-4">Lade...</p>
              ) : (
                libraryFiles
                  .filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(file => (
                  <div key={file.name} className="flex items-center justify-between p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded group border-b border-gray-50 dark:border-gray-800 last:border-0">
                    
                    {/* File Name / Edit Mode */}
                    {editingFile === file.name ? (
                      <div className="flex flex-grow gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="text" 
                          value={newFileName} 
                          onChange={(e) => setNewFileName(e.target.value)}
                          className="flex-grow text-xs border rounded px-1"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button type="button" onClick={(e) => saveRename(file.name, e)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Save size={12} /></button>
                        <button type="button" onClick={cancelRename} className="text-gray-400 hover:bg-gray-100 p-1 rounded"><X size={12} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-grow overflow-hidden mr-2">
                        <span className="text-xs text-gray-800 dark:text-gray-200 truncate max-w-[120px]" title={file.name}>{file.name}</span>
                        <button type="button" onClick={(e) => startRename(file.name, e)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 p-1">
                          <Edit2 size={10} />
                        </button>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button 
                        type="button" 
                        onClick={(e) => togglePlay(e, file.url)} 
                        className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ${isPlaying && audioRef.current?.src === file.url ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-400 dark:text-gray-500'}`} 
                        title="Abspielen"
                      >
                        {isPlaying && audioRef.current?.src === file.url ? <Pause size={12} /> : <Play size={12} />}
                      </button>
                      <button type="button" onClick={(e) => deleteFromLibrary(file.name, e)} className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600" title="Löschen">
                        <Trash2 size={12} />
                      </button>
                      <button 
                        type="button" 
                        onClick={(e) => selectFromLibrary(file.url, file.name, e)} 
                        className={`p-1 rounded ${previewUrl === file.url ? 'bg-emerald-500 text-white' : 'text-gray-400 dark:text-gray-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-600'}`}
                        title="Auswählen"
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
