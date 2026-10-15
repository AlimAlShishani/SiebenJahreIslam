import Link from "next/link";
import { Emblem, Wordmark } from "@/components/brand/Logo";
import { InstagramIcon, MailIcon } from "@/components/ui/Icons";
import { PaymentBadges } from "@/components/ui/PaymentBadges";
import { SHIPPING, SHOP } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import styles from "./Footer.module.css";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/#kollektion", label: "Alle Düfte" },
      { href: "/#herren", label: "Mr. Elixier – Herren" },
      { href: "/#damen", label: "Mrs. Elixier – Damen" },
      { href: "/#formate", label: "Formate & Preise" },
    ],
  },
  {
    title: "Service",
    links: [
      { href: "/versand", label: "Versand & Zahlung" },
      { href: "/widerruf", label: "Widerrufsrecht" },
      { href: "/widerruf#widerrufen", label: "Vertrag widerrufen" },
      { href: "/#faq", label: "Häufige Fragen" },
      { href: `mailto:${SHOP.email}`, label: "Kontakt" },
    ],
  },
  {
    title: "Rechtliches",
    links: [
      { href: "/impressum", label: "Impressum" },
      { href: "/datenschutz", label: "Datenschutz" },
      { href: "/agb", label: "AGB" },
    ],
  },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="grain" aria-hidden="true" />
      <div className={`container ${styles.top}`}>
        <div className={styles.brand}>
          <Emblem className={styles.emblem} />
          <Wordmark className={styles.wordmark} title="Mr. Elixier Parfumes" />
          <p className={styles.claim}>
            Extrait de Parfum mit {SHOP.oilContent} % Duftöl.
            <br />
            Von Hand verpackt und persönlich versendet.
          </p>
          <div className={styles.social}>
            <a href={SHOP.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
              <InstagramIcon size={18} />
            </a>
            <a href={`mailto:${SHOP.email}`} aria-label="E-Mail">
              <MailIcon size={18} />
            </a>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} className={styles.col} aria-label={col.title}>
            <h2 className={styles.colTitle}>{col.title}</h2>
            <ul role="list">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className={`container ${styles.bottom}`}>
        <p className={styles.legal}>
          © {new Date().getFullYear()} {SHOP.fullName}. Alle Preise {SHOP.priceNote}, zzgl. Versand ({formatPrice(SHIPPING.costCents)},
          ab {formatPrice(SHIPPING.freeFromCents)} kostenlos).
        </p>
        <PaymentBadges tone="dark" />
      </div>
    </footer>
  );
}
