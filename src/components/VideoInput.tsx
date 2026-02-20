import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, Library, Trash2, Edit2, Save, X, Check } from 'lucide-react';

interface VideoInputProps {
  label: string;
  currentUrl: string | null;
  onVideoChange: (url: string | null) => void;
}

export function VideoInput({ label, currentUrl, onVideoChange }: VideoInputProps) {
  const [mode, setMode] = useState<'upload' | 'library'>('upload');
  const [displayName, setDisplayName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [libraryFiles, setLibraryFiles] = useState<{ name: string; url: string }[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUrl) {
      try {
        const urlObj = new URL(currentUrl);
        const pathParts = urlObj.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        setDisplayName(decodeURIComponent(fileName));
      } catch {
        setDisplayName('Video');
      }
    } else {
      setDisplayName('');
    }
  }, [currentUrl]);

  const loadLibrary = async () => {
    setLoadingLibrary(true);
    const { data, error } = await supabase.storage
      .from('level-videos')
      .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) {
      setErrorMsg('Fehler: ' + error.message);
      setLibraryFiles([]);
    } else {
      setLibraryFiles(
        (data || []).map((f) => {
          const { data: { publicUrl } } = supabase.storage.from('level-videos').getPublicUrl(f.name);
          return { name: f.name, url: publicUrl };
        })
      );
    }
    setLoadingLibrary(false);
  };

  useEffect(() => {
    if (mode === 'library') loadLibrary();
  }, [mode]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setErrorMsg('Bitte eine Video-Datei wählen (z.B. MP4, WebM).');
      return;
    }
    setErrorMsg(null);
    setUploading(true);
    const ext = file.name.split('.').pop() || 'mp4';
    const fileName = `level-video-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('level-videos').upload(fileName, file);
    if (error) {
      setErrorMsg('Upload fehlgeschlagen: ' + error.message);
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('level-videos').getPublicUrl(fileName);
    setDisplayName(fileName);
    onVideoChange(publicUrl);
    setUploading(false);
    e.target.value = '';
  };

  const selectFromLibrary = (url: string, name: string) => {
    setDisplayName(name);
    onVideoChange(url);
  };

  const deleteFromLibrary = async (fileName: string) => {
    if (!confirm(`"${fileName}" wirklich löschen?`)) return;
    const { error } = await supabase.storage.from('level-videos').remove([fileName]);
    if (error) alert('Fehler: ' + error.message);
    else {
      setLibraryFiles((prev) => prev.filter((f) => f.name !== fileName));
      if (displayName === fileName) {
        setDisplayName('');
        onVideoChange(null);
      }
    }
  };

  const saveRename = async (oldName: string) => {
    if (!newFileName || newFileName === oldName) {
      setEditingFile(null);
      return;
    }
    const { error } = await supabase.storage.from('level-videos').move(oldName, newFileName);
    if (error) alert('Fehler beim Umbenennen: ' + error.message);
    else {
      loadLibrary();
      if (displayName === oldName) {
        setDisplayName(newFileName);
        const { data: { publicUrl } } = supabase.storage.from('level-videos').getPublicUrl(newFileName);
        onVideoChange(publicUrl);
      }
    }
    setEditingFile(null);
  };

  const saveDirectRename = async () => {
    if (!tempName || tempName === displayName || !currentUrl) {
      setIsEditingName(false);
      return;
    }
    const urlObj = new URL(currentUrl);
    const pathParts = urlObj.pathname.split('/');
    const oldName = decodeURIComponent(pathParts[pathParts.length - 1]);
    const { error } = await supabase.storage.from('level-videos').move(oldName, tempName);
    if (error) alert('Fehler: ' + error.message);
    else {
      setDisplayName(tempName);
      const { data: { publicUrl } } = supabase.storage.from('level-videos').getPublicUrl(tempName);
      onVideoChange(publicUrl);
    }
    setIsEditingName(false);
  };

  const clearVideo = () => {
    setDisplayName('');
    onVideoChange(null);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</label>
      {errorMsg && (
        <div className="mb-2 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded">
          {errorMsg}
        </div>
      )}

      {currentUrl ? (
        <div className="mb-4 rounded border border-gray-200 dark:border-gray-600 overflow-hidden bg-black">
          <video src={currentUrl} controls className="w-full max-h-48" />
          <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-900">
            {isEditingName ? (
              <>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="flex-1 text-sm border rounded px-2 py-1"
                />
                <button type="button" onClick={saveDirectRename} className="p-1 text-emerald-600"><Save size={14} /></button>
                <button type="button" onClick={() => setIsEditingName(false)} className="p-1 text-gray-500"><X size={14} /></button>
              </>
            ) : (
              <>
                <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1" title={displayName}>{displayName}</span>
                <button type="button" onClick={() => { setTempName(displayName); setIsEditingName(true); }} className="p-1 text-gray-400 hover:text-blue-500"><Edit2 size={14} /></button>
                <button type="button" onClick={clearVideo} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-4 text-xs text-gray-400 dark:text-gray-500 italic p-3 border border-dashed rounded text-center">
          Kein Video ausgewählt
        </div>
      )}

      <div className="flex gap-1 mb-3 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => { setMode('upload'); setErrorMsg(null); }}
          className={`flex-1 flex items-center justify-center gap-1 py-1 text-xs rounded ${mode === 'upload' ? 'bg-white dark:bg-gray-900 shadow text-emerald-700 dark:text-emerald-300 font-medium' : 'text-gray-600 dark:text-gray-300'}`}
        >
          <Upload size={14} /> Hochladen
        </button>
        <button
          type="button"
          onClick={() => setMode('library')}
          className={`flex-1 flex items-center justify-center gap-1 py-1 text-xs rounded ${mode === 'library' ? 'bg-white dark:bg-gray-900 shadow text-emerald-700 dark:text-emerald-300 font-medium' : 'text-gray-600 dark:text-gray-300'}`}
        >
          <Library size={14} /> Bibliothek
        </button>
      </div>

      {mode === 'upload' && (
        <input
          type="file"
          accept="video/*"
          onChange={handleUpload}
          disabled={uploading}
          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-emerald-50 file:text-emerald-700"
        />
      )}
      {mode === 'library' && (
        <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900 p-1 space-y-1">
          {loadingLibrary ? (
            <p className="text-center text-xs text-gray-400 py-4">Laden...</p>
          ) : (
            libraryFiles.map((f) => (
              <div key={f.name} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded group">
                {editingFile === f.name ? (
                  <>
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="flex-1 text-xs border rounded px-1"
                    />
                    <button type="button" onClick={() => saveRename(f.name)} className="p-1 text-emerald-600"><Save size={12} /></button>
                    <button type="button" onClick={() => setEditingFile(null)} className="p-1 text-gray-500"><X size={12} /></button>
                  </>
                ) : (
                  <>
                    <span className="text-xs truncate max-w-[140px]" title={f.name}>{f.name}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => { setEditingFile(f.name); setNewFileName(f.name); }} className="p-1 text-gray-400 hover:text-blue-500"><Edit2 size={12} /></button>
                      <button type="button" onClick={() => deleteFromLibrary(f.name)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                      <button
                        type="button"
                        onClick={() => selectFromLibrary(f.url, f.name)}
                        className={`p-1 rounded ${currentUrl === f.url ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-emerald-100'}`}
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
