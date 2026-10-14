"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ProductVisual } from "@/components/bottle/ProductVisual";
import { SHOP } from "@/lib/config";
import type { Scent } from "@/lib/products";
import { GoldDust } from "./GoldDust";
import styles from "./Hero.module.css";

const ROTATE_MS = 5200;
const FADE_MS = 1300;

type HeroScent = Pick<Scent, "slug" | "name" | "line" | "tint" | "inspiredBy">;

export function Hero({ scents, total }: { scents: HeroScent[]; total: number }) {
  const ref = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  // Ebenen für die Überblendung: die letzte ist die aktuelle
  const [layers, setLayers] = useState<number[]>([0]);
  const [reduced, setReduced] = useState(false);
  const current = scents[index];

  const goTo = useCallback((next: number) => {
    setIndex(next);
    setLayers((prev) => (prev[prev.length - 1] === next ? prev : [...prev.slice(-1), next]));
  }, []);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // automatischer Wechsel der Düfte
  useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => goTo((index + 1) % scents.length), ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [index, reduced, scents.length, goTo]);

  // alte Ebene nach der Überblendung entfernen
  useEffect(() => {
    if (layers.length < 2) return;
    const timer = window.setTimeout(() => setLayers((prev) => prev.slice(-1)), FADE_MS + 100);
    return () => window.clearTimeout(timer);
  }, [layers]);

  // Parallaxe (Maus) und Scroll-Fortschritt als CSS-Variablen
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let mx = 0;
    let my = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--mx", mx.toFixed(3));
      el.style.setProperty("--my", my.toFixed(3));
      const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, el.offsetHeight)));
      el.style.setProperty("--sp", progress.toFixed(3));
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      mx = (event.clientX - rect.left) / rect.width - 0.5;
      my = (event.clientY - rect.top) / rect.height - 0.5;
      queue();
    };
    el.addEventListener("pointermove", onMove);
    window.addEventListener("scroll", queue, { passive: true });
    queue();
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", queue);
    };
  }, []);

  return (
    <section ref={ref} className={styles.hero} style={{ "--tint": current.tint } as CSSProperties} aria-label="Willkommen bei Mr. Elixier">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.spot} />
        <div className={styles.halo} />
        <div className="grain" />
      </div>
      <GoldDust className={styles.dust} />

      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={`eyebrow eyebrow--line ${styles.eyebrow}`}>{SHOP.claim}</p>
          <h1 className={`display ${styles.title}`}>
            <span className={styles.line}>
              <span style={{ "--i": 0 } as CSSProperties}>Duft mit</span>
            </span>
            <span className={styles.line}>
              <span style={{ "--i": 1 } as CSSProperties}>
                <em className="gold-text">Haltung.</em>
              </span>
            </span>
          </h1>
          <p className={`lead ${styles.lead}`}>
            Ikonische Duftrichtungen, neu komponiert mit {SHOP.oilContent} % Duftöl. Intensiv, langanhaltend – und von Hand für
            dich verpackt.
          </p>
          <div className={styles.ctas}>
            <Link href="/#kollektion" className="btn btn--gold">
              Kollektion entdecken <span className="arrow">→</span>
            </Link>
            <Link href="/#formate" className="btn btn--ghost-light">
              Formate &amp; Preise
            </Link>
          </div>
          <dl className={styles.facts}>
            <div>
              <dt>Düfte</dt>
              <dd>{total}</dd>
            </div>
            <div>
              <dt>Duftöl</dt>
              <dd>{SHOP.oilContent} %</dd>
            </div>
            <div>
              <dt>Reiseflakon</dt>
              <dd>
                <small>ab</small> 15 €
              </dd>
            </div>
          </dl>
        </div>

        <div className={styles.stage}>
          <svg className={styles.ring} viewBox="0 0 400 400" aria-hidden="true">
            <defs>
              <path id="hero-ring-path" d="M200,200 m-176,0 a176,176 0 1,1 352,0 a176,176 0 1,1 -352,0" />
            </defs>
            <text>
              <textPath href="#hero-ring-path" startOffset="0">
                MR. ELIXIER · PARFUMES · EXTRAIT DE PARFUM · {SHOP.oilContent} % DUFTÖL · HANDVERPACKT ·
              </textPath>
            </text>
          </svg>

          <div className={styles.bottleWrap}>
            <div className={styles.bottle}>
              {layers.map((layerIndex, i) => {
                const scent = scents[layerIndex];
                return (
                  <div key={layerIndex} className={`${styles.layer} ${i === layers.length - 1 && layers.length > 1 ? styles.enter : ""}`}>
                    <ProductVisual scent={scent} ml={50} sweep priority sizes="(min-width: 900px) 30vw, 60vw" />
                  </div>
                );
              })}
            </div>
            <div className={styles.reflection} aria-hidden="true">
              <ProductVisual scent={current} ml={50} shadow={false} />
            </div>
            <div className={styles.pool} aria-hidden="true" />
          </div>

          <div className={styles.caption} aria-live="polite">
            <p key={current.slug} className={styles.captionInner}>
              <span className={styles.captionIndex}>
                Nº {String(index + 1).padStart(2, "0")} / {String(scents.length).padStart(2, "0")}
              </span>
              <Link href={`/duft/${current.slug}`} className={styles.captionName}>
                {current.name}
              </Link>
              {SHOP.showInspiration && <span className={styles.captionNote}>Inspiriert von {current.inspiredBy}</span>}
            </p>
            <div className={styles.dots} role="group" aria-label="Düfte im Fokus">
              {scents.map((scent, i) => (
                <button
                  key={scent.slug}
                  type="button"
                  aria-pressed={i === index}
                  aria-label={scent.name}
                  className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
                  style={{ "--dur": `${ROTATE_MS}ms` } as CSSProperties}
                  onClick={() => goTo(i)}
                >
                  <span />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <a href="#essenz" className={styles.scroll} aria-label="Weiter nach unten">
        <span>Entdecken</span>
        <i />
      </a>
    </section>
  );
}
