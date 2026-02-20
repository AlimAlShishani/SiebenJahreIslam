import { X, ArrowRight, BookOpen, Volume2 } from 'lucide-react';
import { levelContents } from '../data/levelContent';

export interface LevelInfoFromDb {
  title: string;
  description: string | null;
  modal_content: string | null;
  modal_audio_url: string | null;
  modal_audio_urls?: string[] | null;
}

interface GenericLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  levelNumber: number;
  levelFromDb?: LevelInfoFromDb | null;
}

export function GenericLevelModal({ isOpen, onClose, onStart, levelNumber, levelFromDb }: GenericLevelModalProps) {
  if (!isOpen) return null;

  const fallback = levelContents[levelNumber];
  const title = levelFromDb?.title ?? fallback?.title ?? `Stufe ${levelNumber}`;
  const description = levelFromDb?.description ?? fallback?.description ?? '';
  const useDbContent = levelFromDb?.modal_content != null && levelFromDb.modal_content.trim() !== '';
  const audioUrls: string[] = levelFromDb?.modal_audio_urls?.length
    ? levelFromDb.modal_audio_urls
    : levelFromDb?.modal_audio_url
      ? [levelFromDb.modal_audio_url]
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative flex flex-col max-h-[90vh]">
        
        <div className="bg-emerald-600 dark:bg-emerald-800 p-6 text-white text-center relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white hover:bg-emerald-500/50 rounded-full p-1 transition-colors"
          >
            <X size={24} />
          </button>
          <BookOpen size={48} className="mx-auto mb-3 opacity-90" />
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-emerald-100 mt-1">{description}</p>
        </div>

        <div className="p-8 overflow-y-auto grow space-y-4 text-gray-900 dark:text-gray-100">
          {useDbContent ? (
            <div 
              className="prose prose-emerald dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: levelFromDb!.modal_content! }}
            />
          ) : (
            fallback?.modalContent
          )}
          {audioUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-600">
              {audioUrls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { const a = new Audio(url); a.volume = 0.6; a.play(); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/70 transition-colors"
                >
                  <Volume2 size={18} /> Audio {audioUrls.length > 1 ? i + 1 : ''} abspielen
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end shrink-0">
          <button 
            onClick={onStart}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg transform active:scale-95"
          >
            Verstanden, los geht&apos;s! <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}