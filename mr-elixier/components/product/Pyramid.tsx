import type { CSSProperties } from "react";
import type { Scent } from "@/lib/products";
import styles from "./Pyramid.module.css";

const LAYERS = [
  { key: "top", roman: "I", title: "Kopfnote", time: "Der erste Eindruck" },
  { key: "heart", roman: "II", title: "Herznote", time: "Nach etwa 20 Minuten" },
  { key: "base", roman: "III", title: "Basisnote", time: "Was bleibt – über Stunden" },
] as const;

export function Pyramid({ scent }: { scent: Scent }) {
  return (
    <section className={`section section--dark ${styles.section}`} style={{ "--tint": scent.tint } as CSSProperties}>
      <div className={styles.glow} aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        <div className={styles.head}>
          <p className="eyebrow eyebrow--line" data-reveal>
            Die Duftpyramide
          </p>
          <h2 className="h2" data-reveal>
            So entfaltet sich <em className="gold-text">{scent.name}.</em>
          </h2>
        </div>
        <ol className={styles.layers} role="list">
          {LAYERS.map((layer, i) => (
            <li
              key={layer.key}
              className={styles.layer}
              data-reveal
              style={{ "--reveal-delay": `${i * 0.12}s` } as CSSProperties}
            >
              <span className={styles.roman}>{layer.roman}</span>
              <h3 className={styles.title}>{layer.title}</h3>
              <p className={styles.time}>{layer.time}</p>
              <ul className={styles.notes} role="list">
                {scent.notes[layer.key].map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
