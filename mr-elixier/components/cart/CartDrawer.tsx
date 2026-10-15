"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Emblem } from "@/components/brand/Logo";
import { ProductVisual } from "@/components/bottle/ProductVisual";
import { CloseIcon, LockIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/ui/Icons";
import { MAX_QTY, SHIPPING, SHOP, getSize } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { lineKey } from "@/lib/order";
import { useCart } from "./CartProvider";
import styles from "./CartDrawer.module.css";

export function CartDrawer() {
  const cart = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const { isOpen, close } = cart;

  useEffect(() => {
    if (!isOpen) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    document.documentElement.classList.add("no-scroll");
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 60);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex='0']");
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.documentElement.classList.remove("no-scroll");
      window.removeEventListener("keydown", onKey);
      lastFocus.current?.focus?.();
    };
  }, [isOpen, close]);

  const progress = Math.min(1, cart.subtotalCents / SHIPPING.freeFromCents);
  const empty = cart.lines.length === 0;

  return (
    <div className={`${styles.root} ${isOpen ? styles.open : ""}`} aria-hidden={!isOpen} inert={!isOpen}>
      <button type="button" className={styles.backdrop} onClick={close} aria-label="Warenkorb schließen" tabIndex={-1} />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        tabIndex={-1}
      >
        <div className={styles.head}>
          <h2 id="cart-title" className={styles.title}>
            Warenkorb {cart.count > 0 && <span className={styles.count}>({cart.count})</span>}
          </h2>
          <button type="button" className={styles.close} onClick={close} aria-label="Schließen">
            <CloseIcon size={22} />
          </button>
        </div>

        {empty ? (
          <div className={styles.empty}>
            <Emblem className={styles.emptyEmblem} />
            <p className={styles.emptyTitle}>Dein Warenkorb ist noch leer.</p>
            <p className={styles.emptyText}>Entdecke über 40 Düfte mit {SHOP.oilContent} % Duftöl – ab 15 €.</p>
            <Link href="/#kollektion" className="btn btn--dark" onClick={close}>
              Düfte entdecken
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.shipping}>
              <p>
                {cart.freeShippingGapCents > 0 ? (
                  <>
                    Noch <strong>{formatPrice(cart.freeShippingGapCents)}</strong> bis zum kostenlosen Versand
                  </>
                ) : (
                  <>Dein Versand ist kostenlos</>
                )}
              </p>
              <div className={styles.bar} aria-hidden="true">
                <span style={{ transform: `scaleX(${progress})` }} />
              </div>
            </div>

            <ul className={styles.lines} role="list">
              {cart.lines.map((line) => {
                const size = getSize(line.ml);
                return (
                  <li key={lineKey(line)} className={styles.line}>
                    <Link href={`/duft/${line.slug}`} className={styles.thumb} onClick={close} tabIndex={-1} aria-hidden="true">
                      <ProductVisual scent={line.scent} ml={line.ml} shadow={false} sizes="64px" />
                    </Link>
                    <div className={styles.info}>
                      <div className={styles.row}>
                        <Link href={`/duft/${line.slug}`} className={styles.name} onClick={close}>
                          {line.scent.name}
                        </Link>
                        <span className={styles.price}>{formatPrice(line.totalCents)}</span>
                      </div>
                      <p className={styles.meta}>
                        {line.ml} ml · {size?.title} · {line.scent.line === "mrs" ? "Mrs." : "Mr."} Elixier
                      </p>
                      <div className={styles.row}>
                        <div className={styles.qty} role="group" aria-label={`Menge ${line.scent.name}`}>
                          <button
                            type="button"
                            onClick={() => cart.setQty(line.slug, line.ml, line.qty - 1)}
                            aria-label="Menge verringern"
                          >
                            <MinusIcon size={14} />
                          </button>
                          <span aria-live="polite">{line.qty}</span>
                          <button
                            type="button"
                            onClick={() => cart.setQty(line.slug, line.ml, line.qty + 1)}
                            disabled={line.qty >= MAX_QTY}
                            aria-label="Menge erhöhen"
                          >
                            <PlusIcon size={14} />
                          </button>
                        </div>
                        <button
                          type="button"
                          className={styles.remove}
                          onClick={() => cart.remove(line.slug, line.ml)}
                          aria-label={`${line.scent.name} entfernen`}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className={styles.foot}>
              <dl className={styles.sums}>
                <div>
                  <dt>Zwischensumme</dt>
                  <dd>{formatPrice(cart.subtotalCents)}</dd>
                </div>
                <div>
                  <dt>Versand ({SHIPPING.carrier})</dt>
                  <dd>{cart.shippingCents === 0 ? "kostenlos" : formatPrice(cart.shippingCents)}</dd>
                </div>
                <div className={styles.total}>
                  <dt>Gesamt</dt>
                  <dd>{formatPrice(cart.totalCents)}</dd>
                </div>
              </dl>
              <p className={styles.vat}>{SHOP.priceNote}</p>
              <Link href="/kasse" className="btn btn--gold btn--block" onClick={close}>
                Zur Kasse <span className="arrow">→</span>
              </Link>
              <p className={styles.secure}>
                <LockIcon size={14} /> Sichere, verschlüsselte Zahlung
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
