import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline mb-8"
        >
          <ArrowLeft size={18} /> Zurück
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Datenschutzerklärung</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Stand: Februar 2025</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">1. Verantwortliche Stelle</h2>
            <p>
              Verantwortlich für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung (DSGVO) ist der
              Betreiber dieser Anwendung. Kontakt:{' '}
              <a href="mailto:alimalshishani@gmail.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                alimalshishani@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">2. Erhobene Daten</h2>
            <p>Wir erheben und verarbeiten folgende personenbezogene Daten:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <strong>Kontodaten:</strong> E-Mail-Adresse, Passwort (verschlüsselt) bei Registrierung und Anmeldung
              </li>
              <li>
                <strong>Profil:</strong> Anzeigename, den Sie freiwillig angeben
              </li>
              <li>
                <strong>Lernfortschritt:</strong> abgeschlossene Lerneinheiten, Leseplan-Fortschritt
              </li>
              <li>
                <strong>Leseplan:</strong> Aufteilungen, Abstimmungen und Audio-Aufnahmen im Rahmen von Lese-Gruppen
              </li>
              <li>
                <strong>Push-Benachrichtigungen:</strong> technische Daten (Endpoint, Schlüssel) zur Zustellung von
                Benachrichtigungen
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">3. Zweck der Verarbeitung</h2>
            <p>
              Die Daten werden ausschließlich zur Bereitstellung der App-Funktionen verwendet: Nutzerverwaltung,
              Lernfortschritt, Koran-Leseplan, Lese-Gruppen, Push-Benachrichtigungen und die Lerninhalte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">4. Rechtsgrundlage</h2>
            <p>
              Die Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) sowie zur
              Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) im Rahmen der Nutzung der App.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">5. Speicherdauer</h2>
            <p>
              Ihre Daten werden gespeichert, solange Ihr Konto besteht. Nach Löschung des Kontos werden die Daten
              innerhalb der gesetzlichen Aufbewahrungsfristen gelöscht, sofern keine anderen rechtlichen
              Aufbewahrungspflichten bestehen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">6. Hosting & Drittanbieter</h2>
            <p>
              Die App nutzt Supabase (Supabase Inc.) für Datenbank und Authentifizierung sowie Vercel für das Hosting.
              Diese Dienste verarbeiten Daten in der EU bzw. gemäß DSGVO-konformen Vereinbarungen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">7. Ihre Rechte</h2>
            <p>Sie haben das Recht auf:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
              <li>Beschwerde bei einer Aufsichtsbehörde</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">8. Kontakt</h2>
            <p>
              Für Fragen zum Datenschutz wenden Sie sich bitte an:{' '}
              <a href="mailto:alimalshishani@gmail.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                alimalshishani@gmail.com
              </a>
            </p>
          </section>
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
