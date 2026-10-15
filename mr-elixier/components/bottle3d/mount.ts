import type { SizeMl } from "@/lib/config";
import type { LabelScent } from "./label";
import { frameView } from "./specs";
import type { Stage } from "./stage";

export interface MountOptions {
  ml: SizeMl;
  scent: LabelScent;
  /** Seitenhintergrund hinter dem Flakon */
  background: string;
  /** so weit ragt die Zeichenfläche oben/unten über den Rahmen der Zeichnung (Anteil) */
  bleed: number;
  /** Auftritt mit Drehung, wenn der Flakon gerade erst erscheint */
  intro: boolean;
  /** dem Mauszeiger leicht zuneigen */
  followPointer: boolean;
}

/**
 * Lädt three.js im Browser nach und setzt einen 3D-Flakon in `host`. Ziehen auf `drag` dreht
 * ihn (auf dem Handy nur waagerecht, senkrecht scrollt die Seite). Gerendert wird nur, solange
 * er sichtbar ist. Ohne WebGL passiert nichts – dann bleibt die gezeichnete Version stehen.
 * Gibt eine Aufräumfunktion zurück.
 */
export function mountStage(
  host: HTMLElement,
  drag: HTMLElement | null,
  options: MountOptions,
  onStage: (stage: Stage | null) => void,
): () => void {
  let stage: Stage | null = null;
  let cancelled = false;
  const cleanups: (() => void)[] = [];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const introDelay = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--intro-delay")) || 0;

  import("./stage")
    .then(({ createStage }) => {
      // Auftritt nur, solange die Seite gerade erst erscheint – sonst wird nur übergeblendet
      const now = performance.now() / 1000;
      const introAt = options.intro && now < introDelay + 1.2 ? Math.max(now, introDelay + 0.1) : options.intro ? now : null;
      return createStage(host, {
        ml: options.ml,
        scent: options.scent,
        background: options.background,
        view: frameView(options.ml, options.bleed),
        reducedMotion: reduced,
        introAt,
        idle: true,
      });
    })
    .then((created) => {
      if (cancelled) {
        created.dispose();
        return;
      }
      stage = created;

      // verliert der Browser den WebGL-Kontext (z. B. im Hintergrund auf dem Handy),
      // springt wieder die gezeichnete Version ein
      const lost = () => {
        if (stage !== created) return;
        stage = null;
        cleanups.forEach((fn) => fn());
        cleanups.length = 0;
        onStage(null);
        created.dispose();
      };
      created.canvas.addEventListener("webglcontextlost", lost);
      cleanups.push(() => created.canvas.removeEventListener("webglcontextlost", lost));

      let visible = true;
      const update = () => created.setActive(visible && !document.hidden);
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        update();
      });
      io.observe(host);
      document.addEventListener("visibilitychange", update);
      const ro = new ResizeObserver(() => created.resize());
      ro.observe(host);
      update();
      cleanups.push(() => {
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", update);
      });

      if (options.followPointer) {
        const follow = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          const rect = host.getBoundingClientRect();
          const x = (e.clientX - (rect.left + rect.width / 2)) / window.innerWidth;
          const y = (e.clientY - (rect.top + rect.height / 2)) / window.innerHeight;
          created.setPointer(Math.max(-0.5, Math.min(0.5, x)), Math.max(-0.5, Math.min(0.5, y)));
        };
        window.addEventListener("pointermove", follow, { passive: true });
        cleanups.push(() => window.removeEventListener("pointermove", follow));
      }

      if (drag) {
        let pointerId: number | null = null;
        let lastX = 0;
        const down = (e: PointerEvent) => {
          if (e.button !== 0 || pointerId !== null) return;
          pointerId = e.pointerId;
          lastX = e.clientX;
          created.dragStart();
        };
        const move = (e: PointerEvent) => {
          if (e.pointerId !== pointerId) return;
          created.dragMove(e.clientX - lastX);
          lastX = e.clientX;
        };
        const up = (e: PointerEvent) => {
          if (e.pointerId !== pointerId) return;
          pointerId = null;
          created.dragEnd();
        };
        drag.addEventListener("pointerdown", down);
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
        cleanups.push(() => {
          drag.removeEventListener("pointerdown", down);
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          window.removeEventListener("pointercancel", up);
        });
      }

      onStage(created);
    })
    .catch(() => {
      // kein WebGL o. Ä. – die gezeichnete Version bleibt
    });

  return () => {
    cancelled = true;
    cleanups.forEach((fn) => fn());
    if (stage) {
      onStage(null);
      stage.dispose();
    }
  };
}
