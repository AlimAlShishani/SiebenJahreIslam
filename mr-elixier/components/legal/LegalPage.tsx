import type { ReactNode } from "react";
import styles from "./LegalPage.module.css";

/** Gemeinsames Layout für Impressum, Datenschutz, AGB usw. */
export function LegalPage({
  eyebrow = "Rechtliches",
  title,
  intro,
  placeholder = true,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  /** Hinweis, dass es sich um einen Platzhaltertext handelt */
  placeholder?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <section className={styles.hero}>
        <div className="grain" aria-hidden="true" />
        <div className={`container ${styles.heroInner}`}>
          <p className="eyebrow eyebrow--line">{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          {intro && <p className={styles.intro}>{intro}</p>}
        </div>
      </section>
      <section className={styles.body}>
        <div className={`container ${styles.bodyInner}`}>
          {placeholder && (
            <p className={styles.placeholder} role="note">
              <strong>Platzhalter:</strong> Dieser Text ist eine Vorlage und muss vor dem Livegang durch rechtssichere,
              geprüfte Texte ersetzt werden (z. B. von einem Händlerbund, der IT-Recht Kanzlei oder einem Anwalt). Angaben in
              [eckigen Klammern] sind zu ergänzen.
            </p>
          )}
          <div className={styles.prose}>{children}</div>
        </div>
      </section>
    </>
  );
}
