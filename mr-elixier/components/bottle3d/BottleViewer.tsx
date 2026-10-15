"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { SizeMl } from "@/lib/config";
import type { LabelScent } from "./label";
import { mountStage } from "./mount";
import { FRAME } from "./specs";
import styles from "./BottleViewer.module.css";

/**
 * Drehbarer 3D-Flakon, z. B. auf der Produktseite. `children` ist die gezeichnete Version:
 * Sie steht da, bis das 3D-Modell geladen ist, und bleibt ohne WebGL einfach stehen.
 */
export function BottleViewer({
  scent,
  ml,
  background,
  children,
}: {
  scent: LabelScent;
  ml: SizeMl;
  /** Seitenhintergrund hinter dem Flakon */
  background: string;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [turned, setTurned] = useState(false);
  const { name, line, tint } = scent;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    return mountStage(
      el,
      box.current,
      { ml, scent: { name, line, tint }, background, bleed: 0.1, intro: true, followPointer: true },
      (stage) => setReady(stage !== null),
    );
  }, [ml, name, line, tint, background]);

  return (
    <div
      ref={box}
      className={`${styles.viewer} ${ready ? styles.ready : ""}`}
      style={{ aspectRatio: FRAME[ml].w / FRAME[ml].h }}
      onPointerDown={() => setTurned(true)}
    >
      <div className={styles.fallback}>{children}</div>
      <div ref={host} className={styles.stage} aria-hidden="true" />
      {ready && !turned && (
        <span className={styles.hint} aria-hidden="true">
          Zum Drehen ziehen
        </span>
      )}
    </div>
  );
}
