import { X, ArrowRight, BookOpen } from 'lucide-react';

interface LevelIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

export function LevelIntroModal({ isOpen, onClose, onStart }: LevelIntroModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-emerald-600 p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white hover:bg-emerald-500/50 rounded-full p-1 transition-colors"
          >
            <X size={24} />
          </button>
          <BookOpen size={48} className="mx-auto mb-3 opacity-90" />
          <h2 className="text-2xl font-bold">Neue Regel: Die Verlängerung (Madd)</h2>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <p className="text-gray-600 text-center">
            Bisher waren alle Vokale kurz (a, i, u). Jetzt lernen wir, wie man sie lang zieht (aa, ii, uu).
            Dafür gibt es 3 "Verlängerungs-Buchstaben":
          </p>

          <div className="space-y-4">
            {/* Regel 1: Alif */}
            <div className="flex items-center bg-orange-50 p-4 rounded-xl border border-orange-100">
              <div className="text-4xl font-quran text-emerald-800 w-16 text-center" dir="rtl">بَا</div>
              <div className="flex-1 px-4">
                <div className="font-bold text-gray-800">Fatha + Alif = "aa"</div>
                <div className="text-sm text-gray-500">Ein Strich oben (Fatha) gefolgt von einem Alif macht den Ton lang.</div>
              </div>
            </div>

            {/* Regel 2: Waw */}
            <div className="flex items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="text-4xl font-quran text-emerald-800 w-16 text-center" dir="rtl">بُو</div>
              <div className="flex-1 px-4">
                <div className="font-bold text-gray-800">Damma + Waw = "uu"</div>
                <div className="text-sm text-gray-500">Ein Kringel (Damma) gefolgt von einem Waw macht das "u" lang.</div>
              </div>
            </div>

            {/* Regel 3: Ya */}
            <div className="flex items-center bg-purple-50 p-4 rounded-xl border border-purple-100">
              <div className="text-4xl font-quran text-emerald-800 w-16 text-center" dir="rtl">بِي</div>
              <div className="flex-1 px-4">
                <div className="font-bold text-gray-800">Kasra + Ya = "ii"</div>
                <div className="text-sm text-gray-500">Ein Strich unten (Kasra) gefolgt von einem Ya macht das "i" lang.</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-3 rounded-lg text-center text-sm text-gray-600 italic">
            Beispiel: "Nu" (نُ) ist kurz. "Nuur" (نُور) ist lang, weil ein Waw (و) folgt.
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
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