import type { CSSProperties } from "react";
import { DropIcon, SparkIcon, GiftIcon } from "@/components/ui/Icons";
import { SHOP } from "@/lib/config";
import styles from "./Essence.module.css";

const LEVELS = [
  { name: "Eau de Cologne", range: "2–4 %", value: 4 },
  { name: "Eau de Toilette", range: "5–15 %", value: 15 },
  { name: "Eau de Parfum", range: "15–20 %", value: 20 },
  { name: "Mr. Elixier Extrait", range: `${SHOP.oilContent} %`, value: SHOP.oilContent, highlight: true },
];

const BENEFITS = [
  { icon: DropIcon, title: "Intensiver", text: "Mehr Duftöl heißt mehr Tiefe – jede Note entfaltet sich voll." },
  { icon: SparkIcon, title: "Langanhaltend", text: "Konzipiert, um dich vom Morgen bis in den Abend zu begleiten." },
  { icon: GiftIcon, title: "Ergiebig", text: "Wenige Sprühstöße genügen – dein Flakon hält entsprechend lange." },
];

export function Essence() {
  const max = SHOP.oilContent;
  return (
    <section id="essenz" className={`section ${styles.section}`}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.figure} data-reveal>
          <p className="eyebrow eyebrow--line">Die Essenz</p>
          <p className={styles.number} aria-label={`${SHOP.oilContent} Prozent`} style={{ "--target": max } as CSSProperties}>
            <span className={styles.digits} aria-hidden="true" />
            <span className={styles.percent} aria-hidden="true">
              %
            </span>
          </p>
          <p className={styles.caption}>Duftölanteil in jedem Flakon</p>
        </div>

        <div className={styles.text}>
          <h2 className="h2" data-reveal>
            Konzentration,
            <br />
            die man <em>spürt.</em>
          </h2>
          <p className="lead" data-reveal style={{ "--reveal-delay": "0.1s" } as CSSProperties}>
            Der Duftölanteil entscheidet, wie kraftvoll und wie lange ein Parfum auf der Haut wirkt. Während klassische Eaux de
            Toilette mit wenigen Prozent auskommen, komponieren wir jeden Duft als Extrait de Parfum mit {SHOP.oilContent} %
            Duftöl.
          </p>

          <ul className={styles.levels} role="list" data-reveal style={{ "--reveal-delay": "0.15s" } as CSSProperties}>
            {LEVELS.map((level, i) => (
              <li
                key={level.name}
                className={`${styles.level} ${level.highlight ? styles.highlight : ""}`}
                style={{ "--w": level.value / max, "--d": `${0.25 + i * 0.12}s` } as CSSProperties}
              >
                <span className={styles.levelName}>{level.name}</span>
                <span className={styles.levelRange}>{level.range}</span>
                <span className={styles.track} aria-hidden="true">
                  <span className={styles.fill} />
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.footnote}>Übliche Konzentrationen nach Duftklasse – Richtwerte.</p>
        </div>
      </div>

      <div className={`container ${styles.benefits}`}>
        {BENEFITS.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className={styles.benefit} data-reveal style={{ "--reveal-delay": `${i * 0.1}s` } as CSSProperties}>
            <Icon size={26} className={styles.benefitIcon} />
            <h3 className={styles.benefitTitle}>{title}</h3>
            <p className={styles.benefitText}>{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
