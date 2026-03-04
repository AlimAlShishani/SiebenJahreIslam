import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Entwickler() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline mb-8"
        >
          <ArrowLeft size={18} /> {t('common.back')}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('entwickler.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{t('entwickler.subtitle')}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <p>{t('entwickler.p1')}</p>
          <p>{t('entwickler.p2')}</p>
          <p>{t('entwickler.p3')}</p>
          <p>{t('entwickler.p4')}</p>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <ArrowLeft size={18} /> {t('common.back')}
          </Link>
        </div>
      </div>
    </div>
  );
}
