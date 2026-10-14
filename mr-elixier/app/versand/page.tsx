import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { SHIPPING, SHOP, SIZES } from "@/lib/config";
import { formatBasePrice, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Versand & Zahlung" };

export default function VersandPage() {
  return (
    <LegalPage
      eyebrow="Service"
      title="Versand & Zahlung"
      intro="Jede Bestellung wird von Hand verpackt und persönlich zur Post gebracht."
      placeholder={false}
    >
      <h2>Versandkosten</h2>
      <table>
        <tbody>
          <tr>
            <td>Versand innerhalb Deutschlands ({SHIPPING.carrier})</td>
            <td>{formatPrice(SHIPPING.costCents)}</td>
          </tr>
          <tr>
            <td>ab {formatPrice(SHIPPING.freeFromCents)} Bestellwert</td>
            <td>kostenlos</td>
          </tr>
        </tbody>
      </table>
      <p>Wir liefern derzeit ausschließlich innerhalb Deutschlands. [Lieferzeit ergänzen, z. B. „1–3 Werktage nach Zahlungseingang“.]</p>

      <h2>Preise</h2>
      <table>
        <thead>
          <tr>
            <th>Größe</th>
            <th>Preis ({SHOP.priceNote})</th>
          </tr>
        </thead>
        <tbody>
          {SIZES.map((size) => (
            <tr key={size.ml}>
              <td>
                {size.ml} ml · {size.title} · Grundpreis {formatBasePrice(size.priceCents, size.ml)}
              </td>
              <td>{formatPrice(size.priceCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Zahlungsarten</h2>
      <p>
        Bezahlt wird über die verschlüsselte Bezahlseite unseres Zahlungsdienstleisters Stripe – je nach Freischaltung z. B. per
        Kreditkarte, Apple Pay, Google Pay, PayPal oder Klarna. Die Zahlung wird sofort mit der Bestellung fällig.
      </p>
    </LegalPage>
  );
}
