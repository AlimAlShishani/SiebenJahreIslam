"use client";

import { useEffect } from "react";
import { EMBLEM, SPRITE } from "@/components/brand/geometry";
import { Wordmark } from "@/components/brand/Logo";
import styles from "./Intro.module.css";

export const INTRO_STORAGE_KEY = "mr-elixier-intro";
/** Dauer bis der Vorhang aufgeht – Hero-Animationen warten so lange (siehe globals.css). */
const INTRO_MS = 2900;

/**
 * Kurzes Logo-Intro beim ersten Besuch pro Sitzung. Läuft rein über CSS, damit
 * es schon vor dem Laden von JavaScript startet; das Inline-Script im Layout
 * entscheidet über die Klasse `intro-play`, ob es überhaupt gezeigt wird.
 */
export function Intro() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("intro-play")) return;
    try {
      window.sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {
      /* ignorieren */
    }
    const timer = window.setTimeout(() => root.classList.remove("intro-play"), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const s = EMBLEM.size;
  const c = s / 2;
  return (
    <div className={styles.intro} aria-hidden="true">
      <div className={`${styles.curtain} ${styles.top}`} />
      <div className={`${styles.curtain} ${styles.bottom}`} />
      <div className={styles.content}>
        <svg viewBox={`0 0 ${s} ${s}`} className={styles.emblem}>
          <circle
            className={styles.ring}
            cx={c}
            cy={c}
            r={EMBLEM.ringR}
            fill="none"
            stroke="currentColor"
            strokeWidth={EMBLEM.ringW * 0.8}
            pathLength={1}
            transform={`rotate(-90 ${c} ${c})`}
          />
          <use className={styles.silhouette} href={`${SPRITE}#silhouette`} width={s} height={s} fill="currentColor" />
        </svg>
        <Wordmark className={styles.word} />
      </div>
    </div>
  );
}
