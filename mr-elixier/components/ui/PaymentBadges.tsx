import styles from "./PaymentBadges.module.css";

/** Dezente, einfarbige Hinweise auf gängige Zahlarten (Freischaltung erfolgt im Stripe-Dashboard). */
export function PaymentBadges({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <ul className={`${styles.list} ${tone === "dark" ? styles.dark : ""}`} role="list" aria-label="Zahlungsarten">
      <li className={styles.badge}>
        <span className={styles.paypal}>
          <b>Pay</b>Pal
        </span>
      </li>
      <li className={styles.badge}>
        <span className={styles.visa}>VISA</span>
      </li>
      <li className={styles.badge} aria-label="Mastercard">
        <svg viewBox="0 0 32 20" width="28" height="18" aria-hidden="true">
          <circle cx="12" cy="10" r="7" fill="currentColor" opacity="0.55" />
          <circle cx="20" cy="10" r="7" fill="currentColor" opacity="0.9" />
        </svg>
      </li>
      <li className={styles.badge}>
        <span className={styles.wallet}>
          <svg viewBox="0 0 14 17" width="11" height="13" aria-hidden="true">
            <path
              fill="currentColor"
              d="M11.6 9c0-2 1.6-2.9 1.7-3a3.7 3.7 0 0 0-2.9-1.6c-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7A3.9 3.9 0 0 0 1.5 6.4c-1.4 2.4-.4 6 1 8 .7 1 1.5 2 2.5 2s1.4-.6 2.6-.6 1.5.6 2.6.6 1.7-1 2.4-2a8 8 0 0 0 1-2.2A3.4 3.4 0 0 1 11.6 9ZM9.6 3.1A3.4 3.4 0 0 0 10.4.6a3.5 3.5 0 0 0-2.3 1.2 3.2 3.2 0 0 0-.8 2.4 2.9 2.9 0 0 0 2.3-1.1Z"
            />
          </svg>
          Pay
        </span>
      </li>
      <li className={styles.badge}>
        <span className={styles.wallet}>
          <b className={styles.g}>G</b>
          Pay
        </span>
      </li>
      <li className={styles.badge}>
        <span className={styles.klarna}>Klarna.</span>
      </li>
    </ul>
  );
}
