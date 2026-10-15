import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { SHOP } from "@/lib/config";

export const metadata: Metadata = { title: "Datenschutz" };

export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutz" intro="Der Schutz deiner Daten ist uns wichtig. Hier erklären wir, welche Daten wir wofür verarbeiten.">
      <h2>1. Verantwortlicher</h2>
      <p>
        [Name/Firma, Anschrift wie im Impressum], E-Mail: <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a>
      </p>

      <h2>2. Hosting</h2>
      <p>
        Diese Website wird bei [Hosting-Anbieter, z. B. Vercel Inc.] gehostet. Beim Aufruf werden technisch notwendige Daten
        (z. B. IP-Adresse, Zeitpunkt, aufgerufene Seite) in Server-Logs verarbeitet (Art. 6 Abs. 1 lit. f DSGVO).
      </p>

      <h2>3. Bestellungen</h2>
      <p>
        Für die Abwicklung deiner Bestellung verarbeiten wir Name, Lieferadresse, E-Mail-Adresse, optional Telefonnummer und
        Bestellinhalt (Art. 6 Abs. 1 lit. b DSGVO). Die Daten werden zur Vertragserfüllung und gemäß gesetzlicher
        Aufbewahrungspflichten gespeichert.
      </p>

      <h2>4. Zahlungsabwicklung über Stripe</h2>
      <p>
        Die Zahlung erfolgt über Stripe (Stripe Payments Europe, Ltd., Irland). Auf der Bezahlseite von Stripe gibst du deine
        Zahlungsdaten direkt bei Stripe ein; wir erhalten keine vollständigen Kartendaten. [Hinweise zur Datenschutzerklärung von
        Stripe ergänzen.]
      </p>

      <h2>5. Bestellbenachrichtigung per E-Mail</h2>
      <p>[Falls genutzt: Hinweis auf den E-Mail-Dienst (z. B. Resend) zur Benachrichtigung über neue Bestellungen.]</p>

      <h2>6. Warenkorb, Cookies und Schriftarten</h2>
      <p>
        Dein Warenkorb wird ausschließlich lokal in deinem Browser gespeichert (Local Storage) – technisch notwendig, ohne
        Weitergabe an Dritte. Wir setzen keine Tracking- oder Marketing-Cookies ein. Schriftarten werden lokal von unserem Server
        geladen, es besteht keine Verbindung zu Google.
      </p>

      <h2>7. Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und
        Widerspruch sowie das Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde.
      </p>
    </LegalPage>
  );
}
