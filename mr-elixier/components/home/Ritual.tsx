import type { CSSProperties } from "react";
import { GiftBag } from "@/components/bottle/Packaging";
import styles from "./Ritual.module.css";

const STEPS = [
  { title: "Duft wählen", text: "Entdecke die Kollektion und wähle deine Größe – 15, 50 oder 100 ml." },
  { title: "Sicher bezahlen", text: "Bezahlt wird über eine verschlüsselte Bezahlseite – schnell und unkompliziert." },
  { title: "Von Hand verpackt", text: "Jede Bestellung wird persönlich geprüft und sorgfältig für dich verpackt." },
  { title: "Persönlich versendet", text: "Wir bringen dein Paket selbst zur Post – und von dort direkt zu dir nach Hause." },
];

export function Ritual() {
  return (
    <section className={`section ${styles.section}`} aria-labelledby="ritual-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.visual} data-reveal>
          <div className={styles.glow} aria-hidden="true" />
          <GiftBag className={styles.bag} />
          <p className={styles.signature}>Mit Sorgfalt, von Hand.</p>
        </div>

        <div className={styles.copy}>
          <p className="eyebrow eyebrow--line" data-reveal>
            Das Ritual
          </p>
          <h2 id="ritual-title" className="h2" data-reveal>
            Von Hand verpackt.
            <br />
            <em>Persönlich versendet.</em>
          </h2>
          <p className="lead" data-reveal>
            Bei Mr. Elixier gibt es kein anonymes Großlager. Jede Bestellung geht durch unsere Hände – vom Flakon bis zum
            fertigen Paket.
          </p>

          <ol className={styles.steps} role="list">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className={styles.step}
                data-reveal
                style={{ "--reveal-delay": `${0.08 * i}s` } as CSSProperties}
              >
                <span className={styles.num}>0{i + 1}</span>
                <div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepText}>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
