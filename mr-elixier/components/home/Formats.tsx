import type { CSSProperties, ReactNode } from "react";
import { Coffret, Tube, WindowBox } from "@/components/bottle/Packaging";
import { BOTTLE_STYLE, SIZES } from "@/lib/config";
import { formatBasePrice, formatPriceShort } from "@/lib/format";
import type { Scent } from "@/lib/products";
import styles from "./Formats.module.css";

type ScentLike = Pick<Scent, "slug" | "name" | "line" | "tint">;

export function Formats({ small, medium, large }: { small: ScentLike; medium: ScentLike; large: ScentLike }) {
  const items: { visual: ReactNode; tag: string; text: string }[] = [
    {
      visual: <WindowBox scent={small} />,
      tag: "Zum Kennenlernen",
      text: "Perfekt, um einen neuen Duft zu entdecken – und klein genug für jede Tasche.",
    },
    {
      visual: <Tube scent={medium} />,
      tag: "Der Klassiker",
      text: `Der elegante Begleiter für jeden Tag – im massiven Glasflakon mit ${BOTTLE_STYLE.cap === "gold" ? "goldener" : "schwarzer"} Kappe.`,
    },
    {
      visual: <Coffret scent={large} />,
      tag: "Bester Preis pro ml",
      text: "Dein Signature-Duft im großen Format – auf Satin gebettet, mit edlem Schwarz-Etikett.",
    },
  ];

  return (
    <section id="formate" className={`section section--dark ${styles.section}`} aria-labelledby="formate-title">
      <div className="grain" aria-hidden="true" />
      <div className={`container ${styles.head}`}>
        <p className="eyebrow eyebrow--line" data-reveal>
          Drei Formate
        </p>
        <h2 id="formate-title" className="h2" data-reveal>
          Für jeden Moment
          <br />
          das <em className="gold-text">richtige Maß.</em>
        </h2>
        <p className="lead" data-reveal>
          Jeder Duft der Kollektion ist in allen drei Größen erhältlich – mit derselben Konzentration und in liebevoller
          Verpackung.
        </p>
      </div>

      <div className={`container ${styles.grid}`}>
        {SIZES.map((size, i) => (
          <article
            key={size.ml}
            className={styles.card}
            data-reveal
            style={{ "--reveal-delay": `${i * 0.12}s` } as CSSProperties}
          >
            <div className={styles.stage}>
              <div className={`${styles.visual} ${styles[`v${size.ml}`]}`}>{items[i].visual}</div>
            </div>
            <div className={styles.body}>
              <p className={styles.tag}>{items[i].tag}</p>
              <div className={styles.titleRow}>
                <h3 className={styles.title}>
                  {size.ml} <span>ml</span>
                </h3>
                <p className={styles.price}>{formatPriceShort(size.priceCents)}</p>
              </div>
              <p className={styles.subtitle}>
                {size.title} · {formatBasePrice(size.priceCents, size.ml)}
              </p>
              <p className={styles.text}>{items[i].text}</p>
              <p className={styles.pack}>{size.packaging}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
