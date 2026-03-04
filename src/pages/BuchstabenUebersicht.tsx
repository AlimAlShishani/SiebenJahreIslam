import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { arabicLetters } from '../data/arabicLetters';

export default function BuchstabenUebersicht() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <Link
          to="/learn"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
          {t('letters.title')}
        </h2>
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm">
        {t('letters.desc')}
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 text-left w-28">
                {t('letters.letter')}
              </th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">
                {t('letters.isolated')}
              </th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">
                {t('letters.initial')}
              </th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">
                {t('letters.medial')}
              </th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">
                {t('letters.final')}
              </th>
            </tr>
          </thead>
          <tbody className="font-quran text-3xl">
            {arabicLetters.map((letter, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors"
              >
                <td className="py-3 px-4 text-base text-gray-800 dark:text-gray-200 font-sans">
                  {t(`letterNames.${index}`)}
                </td>
                <td className="py-3 px-4 text-emerald-800 dark:text-emerald-200">
                  {letter.isolated}
                </td>
                <td className="py-3 px-4 text-emerald-800 dark:text-emerald-200">
                  {letter.initial ?? '—'}
                </td>
                <td className="py-3 px-4 text-emerald-800 dark:text-emerald-200">
                  {letter.medial ?? '—'}
                </td>
                <td className="py-3 px-4 text-emerald-800 dark:text-emerald-200">
                  {letter.final}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
