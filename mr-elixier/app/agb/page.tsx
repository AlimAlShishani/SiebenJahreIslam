import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { SHOP } from "@/lib/config";

export const metadata: Metadata = { title: "AGB" };

export default function AgbPage() {
  return (
    <LegalPage title="Allgemeine Geschäftsbedingungen">
      <h2>1. Geltungsbereich</h2>
      <p>
        Diese AGB gelten für alle Bestellungen über den Online-Shop von {SHOP.fullName}, [Inhaber/Firma, Anschrift] gegenüber
        Verbrauchern.
      </p>

      <h2>2. Vertragsschluss</h2>
      <p>
        Die Darstellung der Produkte im Shop ist kein rechtlich bindendes Angebot. Mit Klick auf „Zahlungspflichtig bestellen“
        gibst du ein verbindliches Angebot ab. [Regelung zur Annahme, z. B. durch Bestellbestätigung oder Versand, ergänzen.]
      </p>

      <h2>3. Preise und Versandkosten</h2>
      <p>
        Alle Preise verstehen sich {SHOP.priceNote}, zuzüglich Versandkosten. Details findest du unter{" "}
        <Link href="/versand">Versand &amp; Zahlung</Link>.
      </p>

      <h2>4. Zahlung</h2>
      <p>Die Zahlung erfolgt über den Zahlungsdienstleister Stripe mit den dort angebotenen Zahlungsarten.</p>

      <h2>5. Lieferung</h2>
      <p>Wir liefern innerhalb Deutschlands. [Lieferzeit angeben.]</p>

      <h2>6. Eigentumsvorbehalt</h2>
      <p>Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.</p>

      <h2>7. Widerrufsrecht</h2>
      <p>
        Verbrauchern steht ein gesetzliches Widerrufsrecht zu – siehe <Link href="/widerruf">Widerrufsbelehrung</Link>.
      </p>

      <h2>8. Gewährleistung</h2>
      <p>Es gelten die gesetzlichen Gewährleistungsrechte.</p>
    </LegalPage>
  );
}
