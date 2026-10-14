"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Coffret, Tube, WindowBox } from "@/components/bottle/Packaging";
import { ProductVisual } from "@/components/bottle/ProductVisual";
import { useCart } from "@/components/cart/CartProvider";
import { CheckIcon, DropIcon, GiftIcon, MinusIcon, PlusIcon, TruckIcon } from "@/components/ui/Icons";
import { DEFAULT_SIZE, MAX_QTY, SHIPPING, SHOP, SIZES, getSize, type SizeMl } from "@/lib/config";
import { formatBasePrice, formatPrice, formatPriceShort } from "@/lib/format";
import { FAMILIES, type Scent } from "@/lib/products";
import styles from "./ProductDetail.module.css";

type View = "flakon" | "verpackung";

// Höhen im echten Größenverhältnis der Flakons
const VISUAL_HEIGHT: Record<SizeMl, string> = { 15: "59%", 50: "75%", 100: "92%" };

export function ProductDetail({ scent }: { scent: Scent }) {
  const { add } = useCart();
  const [ml, setMl] = useState<SizeMl>(DEFAULT_SIZE);
  const [qty, setQty] = useState(1);
  const [view, setView] = useState<View>("flakon");
  const [added, setAdded] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const buyRef = useRef<HTMLDivElement>(null);
  const size = getSize(ml) ?? SIZES[1];
  const lineLabel = scent.line === "mrs" ? "Mrs. Elixier" : "Mr. Elixier";

  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 2200);
    return () => window.clearTimeout(timer);
  }, [added]);

  const addToCart = () => {
    if (scent.soldOut) return;
    add(scent.slug, ml, qty);
    setAdded(true);
  };

  const packaging = ml === 15 ? <WindowBox scent={scent} /> : ml === 50 ? <Tube scent={scent} /> : <Coffret scent={scent} />;

  return (
    <section className={styles.section} style={{ "--tint": scent.tint } as CSSProperties}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.gallery}>
          <div className={styles.stage}>
            <div className={styles.aura} aria-hidden="true" />
            {view === "flakon" ? (
              <div key={`b-${ml}`} className={styles.visual} style={{ height: VISUAL_HEIGHT[ml] }}>
                <ProductVisual scent={scent} ml={ml} sweep priority sizes="(min-width: 900px) 40vw, 80vw" />
              </div>
            ) : (
              <div key={`p-${ml}`} className={`${styles.visual} ${styles.pack} ${styles[`pack${ml}`]}`}>
                {packaging}
              </div>
            )}
            {scent.soldOut && <span className={styles.soldBadge}>Ausverkauft</span>}
          </div>
          <div className={styles.views} role="group" aria-label="Ansicht">
            {(["flakon", "verpackung"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                className={`${styles.viewBtn} ${view === v ? styles.viewActive : ""}`}
                onClick={() => setView(v)}
              >
                {v === "flakon" ? "Flakon" : "Verpackung"}
              </button>
            ))}
          </div>
          <p className={styles.placeholderNote}>Abbildung beispielhaft – Produktfotos folgen.</p>
        </div>

        <div className={styles.panel}>
          <nav className={styles.crumbs} aria-label="Brotkrumen">
            <Link href="/#kollektion">Kollektion</Link>
            <span aria-hidden="true">/</span>
            <Link href={scent.line === "mrs" ? "/#damen" : "/#herren"}>{scent.line === "mrs" ? "Damen" : "Herren"}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{scent.name}</span>
          </nav>

          <p className={`eyebrow ${styles.eyebrow} ${scent.line === "mrs" ? styles.mrs : ""}`}>{lineLabel} · Extrait de Parfum</p>
          <h1 className={styles.title}>{scent.name}</h1>
          {SHOP.showInspiration && <p className={styles.inspired}>Inspiriert von {scent.inspiredBy}</p>}
          <p className={styles.mood}>{scent.mood}</p>

          <ul className={styles.families} role="list">
            {scent.families.map((f) => (
              <li key={f}>{FAMILIES[f]}</li>
            ))}
            {scent.audience === "unisex" && <li>Unisex</li>}
          </ul>

          <dl className={styles.notes}>
            <div>
              <dt>Kopfnote</dt>
              <dd>{scent.notes.top.join(", ")}</dd>
            </div>
            <div>
              <dt>Herznote</dt>
              <dd>{scent.notes.heart.join(", ")}</dd>
            </div>
            <div>
              <dt>Basisnote</dt>
              <dd>{scent.notes.base.join(", ")}</dd>
            </div>
          </dl>

          <fieldset className={styles.sizes}>
            <legend className={styles.legend}>Größe wählen</legend>
            <div className={styles.sizeGrid}>
              {SIZES.map((option) => (
                <label key={option.ml} className={`${styles.size} ${ml === option.ml ? styles.sizeActive : ""}`}>
                  <input
                    type="radio"
                    name="size"
                    value={option.ml}
                    checked={ml === option.ml}
                    onChange={() => setMl(option.ml)}
                    className="visually-hidden"
                  />
                  <span className={styles.sizeMl}>{option.ml} ml</span>
                  <span className={styles.sizeTitle}>{option.title}</span>
                  <span className={styles.sizePrice}>{formatPriceShort(option.priceCents)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.priceRow}>
            <p className={styles.price}>{formatPrice(size.priceCents * qty)}</p>
            <p className={styles.priceMeta}>
              {formatBasePrice(size.priceCents, size.ml)} · {SHOP.priceNote}, zzgl.{" "}
              <Link href="/versand" className={styles.link}>
                Versand
              </Link>
            </p>
          </div>

          <div ref={buyRef} className={styles.buy}>
            <div className={styles.qty} role="group" aria-label="Menge">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Menge verringern">
                <MinusIcon size={14} />
              </button>
              <span aria-live="polite">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
                disabled={qty >= MAX_QTY}
                aria-label="Menge erhöhen"
              >
                <PlusIcon size={14} />
              </button>
            </div>
            <button type="button" className={`btn btn--dark ${styles.add}`} onClick={addToCart} disabled={scent.soldOut}>
              {scent.soldOut ? (
                "Derzeit vergriffen"
              ) : added ? (
                <>
                  <CheckIcon size={18} /> Hinzugefügt
                </>
              ) : (
                <>In den Warenkorb</>
              )}
            </button>
          </div>

          <ul className={styles.trust} role="list">
            <li>
              <DropIcon size={20} /> {SHOP.oilContent} % Duftöl
            </li>
            <li>
              <GiftIcon size={20} /> {size.packaging}
            </li>
            <li>
              <TruckIcon size={20} /> Ab {formatPriceShort(SHIPPING.freeFromCents)} versandkostenfrei
            </li>
          </ul>

          <div className={styles.details}>
            <details>
              <summary>Anwendung</summary>
              <p>
                Aus etwa 15 cm Abstand auf die Pulspunkte sprühen – Handgelenke, Hals, hinter die Ohren. Nicht verreiben, so
                entfaltet sich der Duft in Ruhe. Für noch mehr Haltbarkeit zusätzlich auf Kleidung oder Haare sprühen.
              </p>
            </details>
            <details>
              <summary>Inhaltsstoffe &amp; Hinweise</summary>
              <p>
                Extrait de Parfum mit {SHOP.oilContent} % Duftöl. Die vollständige Liste der Inhaltsstoffe (INCI) und Warnhinweise
                findest du auf der Verpackung. {/* TODO: INCI-Liste ergänzen */}
              </p>
            </details>
            <details>
              <summary>Versand &amp; Rückgabe</summary>
              <p>
                Jede Bestellung wird von Hand verpackt und persönlich zur Post gebracht. Versand innerhalb
                Deutschlands {formatPrice(SHIPPING.costCents)}, ab {formatPrice(SHIPPING.freeFromCents)} kostenlos. Details zu
                Rückgabe und Widerruf findest du in der{" "}
                <Link href="/widerruf" className={styles.link}>
                  Widerrufsbelehrung
                </Link>
                .
              </p>
            </details>
          </div>
        </div>
      </div>

      <div className={`${styles.bar} ${showBar ? styles.barVisible : ""}`} aria-hidden={!showBar} inert={!showBar}>
        <div className={styles.barInfo}>
          <span className={styles.barName}>{scent.name}</span>
          <span className={styles.barMeta}>
            {ml} ml · {formatPriceShort(size.priceCents)}
          </span>
        </div>
        <button type="button" className="btn btn--gold" onClick={addToCart} disabled={scent.soldOut}>
          {scent.soldOut ? "Vergriffen" : added ? "Hinzugefügt" : "In den Warenkorb"}
        </button>
      </div>
    </section>
  );
}
