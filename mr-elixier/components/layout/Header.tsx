"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Emblem, Wordmark } from "@/components/brand/Logo";
import { useCart } from "@/components/cart/CartProvider";
import { BagIcon, CloseIcon, InstagramIcon, MailIcon, MenuIcon } from "@/components/ui/Icons";
import { SHOP } from "@/lib/config";
import { requestAudience, type AudienceFilter } from "@/lib/events";
import styles from "./Header.module.css";

const NAV: { href: string; label: string; audience?: AudienceFilter }[] = [
  { href: "/#kollektion", label: "Kollektion", audience: "alle" },
  { href: "/#herren", label: "Herren", audience: "herren" },
  { href: "/#damen", label: "Damen", audience: "damen" },
  { href: "/#formate", label: "Formate" },
  { href: "/#faq", label: "Fragen" },
];

export function Header() {
  const pathname = usePathname();
  const { count, ready, open } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.documentElement.classList.add("no-scroll");
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("no-scroll");
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const solid = scrolled || pathname !== "/" || menuOpen;

  const onNav = (audience?: AudienceFilter) => {
    if (audience) requestAudience(audience);
    setMenuOpen(false);
  };

  return (
    <>
      <a href="#inhalt" className={styles.skip}>
        Zum Inhalt springen
      </a>
      <header className={`${styles.header} ${solid ? styles.solid : ""}`}>
        <div className={`container ${styles.inner}`}>
          <nav className={styles.nav} aria-label="Hauptnavigation">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navLink} onClick={() => onNav(item.audience)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className={`${styles.iconBtn} ${styles.menuBtn}`}
            aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
          </button>

          <Link href="/" className={styles.brand} aria-label="Mr. Elixier – zur Startseite">
            <Emblem className={styles.emblem} />
            <Wordmark className={styles.wordmark} />
          </Link>

          <div className={styles.actions}>
            <button type="button" className={styles.iconBtn} onClick={open} aria-label={`Warenkorb öffnen (${count} Artikel)`}>
              <BagIcon size={22} />
              {ready && count > 0 && (
                <span className={styles.badge} aria-hidden="true">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className={`${styles.menu} ${menuOpen ? styles.menuOpen : ""}`} aria-hidden={!menuOpen} inert={!menuOpen}>
        <nav className={styles.menuNav} aria-label="Menü">
          {NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.menuLink}
              style={{ transitionDelay: menuOpen ? `${0.08 + i * 0.06}s` : "0s" }}
              onClick={() => onNav(item.audience)}
            >
              <span className={styles.menuIndex}>0{i + 1}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.menuFoot}>
          <a href={SHOP.instagram} target="_blank" rel="noreferrer">
            <InstagramIcon size={18} /> Instagram
          </a>
          <a href={`mailto:${SHOP.email}`}>
            <MailIcon size={18} /> {SHOP.email}
          </a>
        </div>
      </div>
    </>
  );
}
