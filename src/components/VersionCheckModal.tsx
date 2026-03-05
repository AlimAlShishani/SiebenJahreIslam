import { useTranslation } from 'react-i18next';
import { RefreshCw, X } from 'lucide-react';

interface VersionCheckModalProps {
  latestVersion: string | null;
  onDismiss: () => void;
  onReload: () => void;
}

export function VersionCheckModal({ latestVersion, onDismiss, onReload }: VersionCheckModalProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={t('common.cancel')}
        >
          <X size={20} />
        </button>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <RefreshCw size={28} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {t('versionCheck.title')}
              </h2>
              {latestVersion && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('versionCheck.versionAvailable', { version: latestVersion })}
                </p>
              )}
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('versionCheck.description')}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t('versionCheck.later')}
            </button>
            <button
              onClick={onReload}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              {t('versionCheck.reload')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
