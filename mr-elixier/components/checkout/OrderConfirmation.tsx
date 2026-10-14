"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EMBLEM, SPRITE } from "@/components/brand/geometry";
import { useCart } from "@/components/cart/CartProvider";
import { GiftIcon, MailIcon, TruckIcon } from "@/components/ui/Icons";
import { SHOP } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { DEMO_ORDER_KEY, type ConfirmationData } from "./confirmation";
import styles from "./OrderConfirmation.module.css";

export function OrderConfirmation({ order: serverOrder, demo }: { order: ConfirmationData | null; demo: boolean }) {
  const { clear, ready } = useCart();
  const [order, setOrder] = useState<ConfirmationData | null>(serverOrder);

  // Bestellung abgeschlossen → Warenkorb leeren
  useEffect(() => {
    if (ready && (serverOrder || demo)) clear();
  }, [ready, serverOrder, demo, clear]);

  useEffect(() => {
    if (!demo || serverOrder) return;
    try {
      const raw = window.sessionStorage.getItem(DEMO_ORDER_KEY);
      if (raw) setOrder(JSON.parse(raw) as ConfirmationData);
    } catch {
      /* ignorieren */
    }
  }, [demo, serverOrder]);

  const s = EMBLEM.size;
  const steps = [
    {
      icon: MailIcon,
      title: "Bestätigung",
      text: order?.email ? `Eine Zahlungsbestätigung geht an ${order.email}.` : "Du erhältst eine Zahlungsbestätigung per E-Mail.",
    },
    { icon: GiftIcon, title: "Von Hand verpackt", text: "Wir prüfen deine Bestellung und verpacken sie persönlich." },
    { icon: TruckIcon, title: "Ab zur Post", text: "Wir bringen dein Paket persönlich zur Post – direkt zu dir nach Hause." },
  ];

  return (
    <section className={styles.section}>
      <div className="grain" aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        <svg viewBox={`0 0 ${s} ${s}`} className={styles.emblem} aria-hidden="true">
          <circle
            className={styles.ring}
            cx={s / 2}
            cy={s / 2}
            r={EMBLEM.ringR}
            fill="none"
            stroke="currentColor"
            strokeWidth={EMBLEM.ringW * 0.8}
            pathLength={1}
            transform={`rotate(-90 ${s / 2} ${s / 2})`}
          />
          <use className={styles.silhouette} href={`${SPRITE}#silhouette`} width={s} height={s} fill="currentColor" />
        </svg>

        <p className="eyebrow">{order?.paid === false ? "Bestellung eingegangen" : "Bestellung bestätigt"}</p>
        <h1 className={styles.title}>
          Vielen Dank{order?.firstName ? <>, {order.firstName}</> : null}.
        </h1>
        <p className={styles.lead}>
          {order ? (
            <>
              Deine Bestellung <strong className={styles.number}>{order.number}</strong>{" "}
              {order.paid ? "ist bei uns eingegangen." : "ist eingegangen – wir warten nur noch auf die Bestätigung deiner Zahlung."}
            </>
          ) : (
            "Deine Bestellung ist bei uns eingegangen."
          )}
        </p>
        {demo && <p className={styles.demo}>Demo-Bestellung – es wurde nichts berechnet.</p>}

        <ol className={styles.steps} role="list">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className={styles.step}>
              <span className={styles.stepNum}>0{i + 1}</span>
              <Icon size={22} className={styles.stepIcon} />
              <p className={styles.stepTitle}>{title}</p>
              <p className={styles.stepText}>{text}</p>
            </li>
          ))}
        </ol>

        {order && order.items.length > 0 && (
          <div className={styles.summary}>
            <div>
              <h2 className={styles.summaryTitle}>Übersicht</h2>
              <ul className={styles.items} role="list">
                {order.items.map((item) => (
                  <li key={item.name}>
                    <span>
                      {item.qty} × {item.name}
                    </span>
                    <span>{formatPrice(item.totalCents)}</span>
                  </li>
                ))}
                <li className={styles.muted}>
                  <span>Versand</span>
                  <span>{order.shippingCents === 0 ? "kostenlos" : formatPrice(order.shippingCents)}</span>
                </li>
                <li className={styles.total}>
                  <span>Gesamt</span>
                  <span>{formatPrice(order.totalCents)}</span>
                </li>
              </ul>
            </div>
            {order.address.length > 0 && (
              <div>
                <h2 className={styles.summaryTitle}>Lieferadresse</h2>
                <address className={styles.address}>
                  {order.address.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </address>
              </div>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <Link href="/#kollektion" className="btn btn--gold">
            Weiter stöbern
          </Link>
          <a href={`mailto:${SHOP.email}`} className="btn btn--ghost-light">
            Fragen? Schreib uns
          </a>
        </div>
      </div>
    </section>
  );
}
