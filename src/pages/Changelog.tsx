import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import changelogRaw from '../../CHANGELOG.md?raw';

export default function Changelog() {
  const { t } = useTranslation();
  const lines = changelogRaw.split('\n');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <Link
          to="/"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={t('common.back')}
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex items-center gap-2">
          <FileText size={24} className="text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {t('changelog.title', 'Changelog')}
          </h1>
        </div>
      </div>
      <div className="p-4 md:p-6 max-w-2xl mx-auto pb-20 space-y-4">
        {lines.map((line, i) => {
          if (line.startsWith('## [')) {
            const m = line.match(/^## \[(.*?)\]/);
            return (
              <h2 key={i} className="text-lg font-bold mt-6 mb-2 text-emerald-700 dark:text-emerald-400 first:mt-0">
                {m?.[1] ?? line}
              </h2>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={i} className="text-base font-semibold mt-4 mb-1 text-gray-800 dark:text-gray-200">
                {line.slice(4)}
              </h3>
            );
          }
          if (line.startsWith('- **')) {
            const m = line.match(/^- \*\*(.*?)\*\* – (.*)$/);
            return (
              <li key={i} className="ml-4 list-disc text-gray-600 dark:text-gray-300">
                <strong>{m?.[1]}</strong> – {m?.[2] ?? line}
              </li>
            );
          }
          if (line.startsWith('- ')) {
            return (
              <li key={i} className="ml-4 list-disc text-gray-600 dark:text-gray-300">
                {line.slice(2)}
              </li>
            );
          }
          if (line.trim() === '---') {
            return <hr key={i} className="my-4 border-gray-200 dark:border-gray-600" />;
          }
          if (line.startsWith('# ')) {
            return null; // Haupttitel überspringen
          }
          return null;
        })}
      </div>
    </div>
  );
}
