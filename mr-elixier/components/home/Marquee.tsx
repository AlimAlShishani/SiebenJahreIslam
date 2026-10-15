import styles from "./Marquee.module.css";

/** Endlos laufendes Band mit den Markenversprechen. */
export function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul className={styles.row} aria-hidden={hidden || undefined} role="list">
      {items.map((item) => (
        <li key={item} className={styles.item}>
          <span>{item}</span>
          <svg viewBox="0 0 20 20" className={styles.star} aria-hidden="true">
            <path d="M10 0c.6 5.6 4.4 9.4 10 10-5.6.6-9.4 4.4-10 10-.6-5.6-4.4-9.4-10-10C5.6 9.4 9.4 5.6 10 0Z" />
          </svg>
        </li>
      ))}
    </ul>
  );
  return (
    <div className={styles.marquee}>
      <div className={styles.viewport}>
        <div className={styles.track}>
          {row(false)}
          {row(true)}
        </div>
      </div>
    </div>
  );
}
