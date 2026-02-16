import { X, ArrowRight, BookOpen } from 'lucide-react';
import { levelContents } from '../data/levelContent';

interface GenericLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  levelNumber: number;
}

export function GenericLevelModal({ isOpen, onClose, onStart, levelNumber }: GenericLevelModalProps) {
  if (!isOpen) return null;

  const content = levelContents[levelNumber];

  // Fallback if no content is defined for this level
  if (!content) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-600 p-6 text-white text-center relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white hover:bg-emerald-500/50 rounded-full p-1 transition-colors"
          >
            <X size={24} />
          </button>
          <BookOpen size={48} className="mx-auto mb-3 opacity-90" />
          <h2 className="text-2xl font-bold">{content.title}</h2>
          <p className="text-emerald-100 mt-1">{content.description}</p>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto grow">
          {content.modalContent}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
          <button 
            onClick={onStart}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg transform active:scale-95"
          >
            Verstanden, los geht's! <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}