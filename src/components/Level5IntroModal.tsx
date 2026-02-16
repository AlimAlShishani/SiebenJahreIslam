import { X, ArrowRight, BookOpen } from 'lucide-react';

interface Level5IntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

export function Level5IntroModal({ isOpen, onClose, onStart }: Level5IntroModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-blue-100 hover:text-white hover:bg-blue-500/50 rounded-full p-1 transition-colors"
          >
            <X size={24} />
          </button>
          <BookOpen size={48} className="mx-auto mb-3 opacity-90" />
          <h2 className="text-2xl font-bold">Neue Zeichen: Sukoon & Hamzatul Wasl</h2>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
          <p className="text-gray-600 text-center">
            In dieser Stufe begegnen dir zwei wichtige Zeichen für das Verbinden von Wörtern und das Anhalten.
          </p>

          <div className="space-y-4">
            {/* Regel 1: Sukoon */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-4 mb-2">
                <div className="text-4xl font-quran text-blue-800 w-12 text-center bg-white rounded-lg p-1 shadow-sm">ـْ</div>
                <h3 className="font-bold text-gray-800 text-lg">Das Sukoon (Stopp)</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Ein kleiner Kreis über dem Buchstaben. Er bedeutet: <strong>Kein Vokal</strong>. Du stoppst auf diesem Buchstaben.
              </p>
              <div className="bg-white p-2 rounded border border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">Beispiel: "Ab"</span>
                <span className="font-quran text-2xl" dir="rtl">أَبْ</span>
              </div>
            </div>

            {/* Regel 2: Hamzatul Wasl */}
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-4 mb-2">
                <div className="text-4xl font-quran text-emerald-800 w-12 text-center bg-white rounded-lg p-1 shadow-sm">ٱ</div>
                <h3 className="font-bold text-gray-800 text-lg">Hamzatul Wasl</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Das "Verbindungs-Alif". Es steht oft am Anfang von Wörtern (wie "Al-").
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li><strong>Am Satzanfang:</strong> Du sprichst es (meist als "A" oder "I").</li>
                <li><strong>Mitten im Satz:</strong> Es ist <strong>stumm</strong>! Du springst direkt zum nächsten Buchstaben.</li>
              </ul>
              <div className="mt-2 bg-white p-2 rounded border border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">"Bismillah" (M ist mit L verbunden)</span>
                <span className="font-quran text-2xl" dir="rtl">بِسْمِ ٱللّٰهِ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onStart}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg transform active:scale-95"
          >
            Verstanden <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}