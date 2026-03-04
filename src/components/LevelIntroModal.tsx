import { X, ArrowRight, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LevelIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

export function LevelIntroModal({ isOpen, onClose, onStart }: LevelIntroModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-emerald-600 dark:bg-emerald-800 p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white hover:bg-emerald-500/50 rounded-full p-1 transition-colors"
          >
            <X size={24} />
          </button>
          <BookOpen size={48} className="mx-auto mb-3 opacity-90" />
          <h2 className="text-2xl font-bold">{t('level5Intro.title')}</h2>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 text-gray-900 dark:text-gray-100">
          <p className="text-gray-600 dark:text-gray-300 text-center">
            {t('level5Intro.intro')}
          </p>

          <div className="space-y-4">
            <div className="flex items-center bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
              <div className="text-4xl font-quran text-emerald-800 dark:text-emerald-200 w-16 text-center" dir="rtl">بَا</div>
              <div className="flex-1 px-4">
                <div className="font-bold text-gray-800 dark:text-gray-200">{t('level5Intro.fathaAlif')}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('level5Intro.fathaAlifDesc')}</div>
              </div>
            </div>

            <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="text-4xl font-quran text-emerald-800 dark:text-emerald-200 w-16 text-center" dir="rtl">بُو</div>
              <div className="flex-1 px-4">
                <div className="font-bold text-gray-800 dark:text-gray-200">{t('level5Intro.dammaWaw')}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('level5Intro.dammaWawDesc')}</div>
              </div>
            </div>

            <div className="flex items-center bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
              <div className="text-4xl font-quran text-emerald-800 dark:text-emerald-200 w-16 text-center" dir="rtl">بِي</div>
              <div className="flex-1 px-4">
                <div className="font-bold text-gray-800 dark:text-gray-200">{t('level5Intro.kasraYa')}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('level5Intro.kasraYaDesc')}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center text-sm text-gray-600 dark:text-gray-300 italic">
            {t('level5Intro.example')}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button 
            onClick={onStart}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg transform active:scale-95"
          >
            {t('level5Intro.understood')} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
