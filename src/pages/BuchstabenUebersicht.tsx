import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { arabicLetters } from '../data/arabicLetters';

export default function BuchstabenUebersicht() {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <Link
          to="/learn"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          aria-label="Zurück zum Lernbereich"
        >
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
          Buchstaben – Schreibweisen
        </h2>
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm">
        Alle 28 arabischen Buchstaben und wie sie alleine, am Anfang, in der Mitte und am Ende eines Wortes geschrieben werden.
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 text-left w-28">
                Buchstabe
              </th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">
                Alleine
              </th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">
                Anfang
              </th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">
                Mitte
              </th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">
                Ende
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
                  {letter.nameDe}
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
