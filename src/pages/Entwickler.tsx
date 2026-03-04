import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Entwickler() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline mb-8"
        >
          <ArrowLeft size={18} /> Zurück
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Über den Entwickler</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Alim – Entwickler von Nuruna</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <p>
            Ich heiße Alim und bin im November 2006 geboren. Schon früh habe ich mich für Programmieren interessiert.
            Mit etwa 15 Jahren begann ich, mich intensiver mit dem Islam auseinanderzusetzen.
          </p>

          <p>
            Das Lesen des Korans hat mir sehr gefallen. Ich habe begonnen, darüber in sozialen Medien zu posten –
            auch Koranrezitationen. Mit meiner Freundesgruppe haben wir im Ramadan angefangen, den gesamten Koran
            zu lesen: Jeden Tag haben wir die Seiten auf die Gruppe aufgeteilt, sodass wir gemeinsam durch den
            Ramadan kamen.
          </p>

          <p>
            Nach drei Ramadans – also drei Jahren – kam mir die Idee: Warum nicht eine App bauen, die das für uns
            vereinfacht? Eine App, in der man gut Koran lesen kann und in der Freunde, die kein Arabisch können,
            auch Arabisch lernen können. So ist Nuruna entstanden.
          </p>

          <p>
            Ich entwickle Nuruna als Hobby-Entwickler und teile die App mit meinen Freunden und allen, die sie
            nutzen möchten.
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
