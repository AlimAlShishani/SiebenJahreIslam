import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function AndroidNutzung() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline mb-8"
        >
          <ArrowLeft size={18} /> Zurück
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Meine Nutzung von Android</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Alim – Entwickler von Nuruna</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <p>
            Ich nutze Android seit mehreren Jahren – zuerst als normaler Nutzer, später auch mit Interesse an der
            Technik dahinter. Mein Smartphone verwende ich täglich für verschiedene Zwecke.
          </p>

          <p>
            Dazu gehören Apps zum Lesen und Lernen – etwa Koran-Apps, Lern-Apps und E-Book-Reader. Über soziale
            Medien tausche ich mich mit Freunden aus und teile Inhalte. Außerdem nutze ich Android für
            Kommunikation, Nachrichten, Musik und die Organisation des Alltags.
          </p>

          <p>
            Durch die Nutzung vieler Apps habe ich gesehen, was gut funktioniert und was verbesserungswürdig ist.
            Das hat mich motiviert, selbst eine App zu entwickeln – Nuruna – die genau die Funktionen bietet, die
            mir und meinen Freunden beim Koran lesen und Arabisch lernen fehlten.
          </p>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <ArrowLeft size={18} /> Zurück
          </Link>
        </div>
      </div>
    </div>
  );
}
