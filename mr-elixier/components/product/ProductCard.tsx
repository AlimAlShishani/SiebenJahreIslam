"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ProductVisual } from "@/components/bottle/ProductVisual";
import { useCart } from "@/components/cart/CartProvider";
import { PlusIcon } from "@/components/ui/Icons";
import { DEFAULT_SIZE, SHOP, SIZES } from "@/lib/config";
import { formatPriceShort } from "@/lib/format";
import { FAMILIES, type Scent } from "@/lib/products";
import styles from "./ProductCard.module.css";

export function ProductCard({ scent, index = 0 }: { scent: Scent; index?: number }) {
  const { add } = useCart();
  const href = `/duft/${scent.slug}`;
  const notes = [scent.notes.top[0], scent.notes.heart[0], scent.notes.base[0]].filter(Boolean).join(" · ");
  const badge = scent.soldOut ? "Ausverkauft" : scent.line === "mrs" ? "Mrs. Elixier" : scent.audience === "unisex" ? "Unisex" : null;

  return (
    <article
      className={`${styles.card} ${scent.soldOut ? styles.soldOut : ""}`}
      style={{ "--tint": scent.tint, "--reveal-delay": `${(index % 4) * 0.07}s` } as CSSProperties}
      data-reveal
    >
      <div className={styles.stage}>
        <Link href={href} className={styles.stageLink} aria-label={`${scent.name} ansehen`} tabIndex={-1}>
          <div className={styles.bottle}>
            <ProductVisual scent={scent} ml={DEFAULT_SIZE} sizes="(min-width: 1100px) 22vw, (min-width: 700px) 30vw, 45vw" />
          </div>
        </Link>
        {badge && (
          <span className={`${styles.badge} ${scent.soldOut ? styles.badgeSold : scent.line === "mrs" ? styles.badgeMrs : ""}`}>
            {badge}
          </span>
        )}
        {!scent.soldOut && (
          <>
            <div className={styles.quick} role="group" aria-label={`${scent.name} in den Warenkorb`}>
              {SIZES.map((size) => (
                <button
                  key={size.ml}
                  type="button"
                  className={styles.quickBtn}
                  onClick={() => add(scent.slug, size.ml)}
                  aria-label={`${scent.name}, ${size.ml} ml für ${formatPriceShort(size.priceCents)} in den Warenkorb`}
                >
                  <span>{size.ml} ml</span>
                  <span className={styles.quickPrice}>{formatPriceShort(size.priceCents)}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.plus}
              onClick={() => add(scent.slug, DEFAULT_SIZE)}
              aria-label={`${scent.name}, ${DEFAULT_SIZE} ml in den Warenkorb`}
            >
              <PlusIcon size={18} />
            </button>
          </>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>
          <Link href={href}>{scent.name}</Link>
        </h3>
        {SHOP.showInspiration && <p className={styles.inspired}>Inspiriert von {scent.inspiredBy}</p>}
        <p className={styles.notes}>{notes}</p>
        <div className={styles.meta}>
          <span className={styles.family}>{FAMILIES[scent.families[0]]}</span>
          <span className={styles.price}>{scent.soldOut ? "Derzeit vergriffen" : `ab ${formatPriceShort(SIZES[0].priceCents)}`}</span>
        </div>
      </div>
    </article>
  );
}
