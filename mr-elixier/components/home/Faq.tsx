import { MailIcon } from "@/components/ui/Icons";
import { SHIPPING, SHOP } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import styles from "./Faq.module.css";

const QUESTIONS: { q: string; a: string; show?: boolean }[] = [
  {
    q: `Was bedeutet ${SHOP.oilContent} % Duftöl?`,
    a: `Der Duftölanteil bestimmt Intensität und Haltbarkeit eines Parfums. Ein Eau de Toilette enthält meist 5–15 %, ein Eau de Parfum 15–20 %. Unsere Düfte sind als Extrait de Parfum mit ${SHOP.oilContent} % Duftöl komponiert – schon wenige Sprühstöße genügen.`,
  },
  {
    q: "Sind das die Originale der genannten Marken?",
    a: "Nein. Mr. Elixier ist eine eigenständige Marke mit eigenen Kompositionen. Die Markennamen dienen ausschließlich der Orientierung, in welche Duftrichtung ein Duft geht. Wir stehen in keiner Verbindung zu den genannten Herstellern.",
    show: SHOP.showInspiration,
  },
  {
    q: "Welche Größe passt zu mir?",
    a: "15 ml zum Kennenlernen und für unterwegs, 50 ml als täglicher Begleiter und 100 ml für deinen Signature-Duft – mit dem besten Preis pro Milliliter.",
  },
  {
    q: "Wie lange hält der Duft?",
    a: "Das hängt von Duft, Haut und Wetter ab. Durch den hohen Duftölanteil sind unsere Parfums auf Langlebigkeit ausgelegt. Tipp: auf Pulspunkte wie Handgelenke und Hals sowie auf die Kleidung sprühen.",
  },
  {
    q: "Wie wird versendet und was kostet der Versand?",
    a: `Jede Bestellung wird von Hand verpackt und persönlich bei der Post aufgegeben. Der Versand innerhalb Deutschlands kostet ${formatPrice(SHIPPING.costCents)} – ab ${formatPrice(SHIPPING.freeFromCents)} Bestellwert ist er kostenlos.`,
  },
  {
    q: "Wie kann ich bezahlen?",
    a: "Bezahlt wird über eine verschlüsselte Bezahlseite unseres Zahlungsdienstleisters Stripe – zum Beispiel per Kreditkarte, Apple Pay, Google Pay oder PayPal.",
  },
];

export function Faq() {
  return (
    <section id="faq" className={`section ${styles.section}`} aria-labelledby="faq-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.side}>
          <p className="eyebrow eyebrow--line" data-reveal>
            Gut zu wissen
          </p>
          <h2 id="faq-title" className="h2" data-reveal>
            Häufige <em>Fragen.</em>
          </h2>
          <p className="lead" data-reveal>
            Du hast eine andere Frage? Schreib uns – wir antworten persönlich.
          </p>
          <a href={`mailto:${SHOP.email}`} className="btn btn--ghost" data-reveal>
            <MailIcon size={18} /> Kontakt aufnehmen
          </a>
        </div>

        <div className={styles.list} data-reveal>
          {QUESTIONS.filter((item) => item.show !== false).map((item, i) => (
            <details key={item.q} className={styles.item} name="faq" open={i === 0}>
              <summary className={styles.summary}>
                <span>{item.q}</span>
                <i className={styles.icon} aria-hidden="true" />
              </summary>
              <p className={styles.answer}>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
