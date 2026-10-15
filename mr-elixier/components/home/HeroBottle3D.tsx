"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { LabelScent } from "@/components/bottle3d/label";
import { mountStage } from "@/components/bottle3d/mount";
import type { Stage } from "@/components/bottle3d/stage";
import styles from "./Hero.module.css";

/**
 * 3D-Flakon im Hero. three.js wird erst im Browser nachgeladen; bis dahin (und ohne WebGL)
 * bleibt die gezeichnete Version sichtbar. Die Zeichenfläche ragt über die Box hinaus
 * (siehe .stage3d), damit Neigen und Schweben Platz haben.
 */
export function HeroBottle3D({
  scent,
  dragTarget,
  onStage,
}: {
  scent: LabelScent;
  /** Fläche, auf der man den Flakon greifen und drehen kann */
  dragTarget: RefObject<HTMLElement | null>;
  onStage: (stage: Stage | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const initial = useRef(scent);
  const notify = useRef(onStage);
  useEffect(() => {
    notify.current = onStage;
  }, [onStage]);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    return mountStage(
      host,
      dragTarget.current,
      { ml: 50, scent: initial.current, background: "#17120d", bleed: 0.1, intro: true, followPointer: true },
      (stage) => notify.current(stage),
    );
  }, [dragTarget]);

  return <div ref={ref} className={styles.stage3d} aria-hidden="true" />;
}
