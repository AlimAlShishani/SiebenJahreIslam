import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { SHOP } from "@/lib/config";

export const metadata: Metadata = { title: "Impressum" };

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <address>
        [Firmenname bzw. Vor- und Nachname des Inhabers]
        <br />
        {SHOP.fullName}
        <br />
        [Straße und Hausnummer]
        <br />
        [PLZ und Ort]
        <br />
        Deutschland
      </address>

      <h3>Kontakt</h3>
      <p>
        E-Mail: <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a>
        <br />
        Telefon: [Telefonnummer]
      </p>

      <h3>Umsatzsteuer</h3>
      <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: [USt-IdNr., falls vorhanden]</p>

      <h3>Verantwortlich für den Inhalt</h3>
      <p>[Vor- und Nachname, Anschrift wie oben]</p>

      <h3>Verbraucherstreitbeilegung</h3>
      <p>
        Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
        teilzunehmen.
      </p>
    </LegalPage>
  );
}
