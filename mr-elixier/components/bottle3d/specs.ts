import type { SizeMl } from "@/lib/config";

/*
 * Maße der Flakons in Millimetern – nach Fotos baugleicher Flakons (15/50/100 ml).
 * Dieselben Proportionen nutzt auch die 2D-Zeichnung (dort in 1/4 mm).
 */

export interface BottleSpec {
  /** Glaskörper: Radius, Höhe, Kantenradius an Schulter und Boden */
  radius: number;
  height: number;
  fillet: number;
  /** Glaswand, massiver Boden und Luft über der Flüssigkeit */
  wall: number;
  base: number;
  headspace: number;
  /** Kappe (glänzend schwarz) und Chromring darunter */
  cap: { radius: number; height: number; ring: number };
  /** Etikett: sichtbare Breite von vorn, Höhe, Abstand zur Schulter */
  label: { width: number; height: number; top: number; dark: boolean };
}

export const SPECS: Record<SizeMl, BottleSpec> = {
  15: {
    radius: 10,
    height: 57,
    fillet: 1.3,
    wall: 1.5,
    base: 7.5,
    headspace: 4.5,
    cap: { radius: 9.75, height: 22.25, ring: 0 },
    label: { width: 17, height: 26.5, top: 12, dark: false },
  },
  50: {
    radius: 19,
    height: 72.5,
    fillet: 2,
    wall: 2.2,
    base: 10,
    headspace: 5.5,
    cap: { radius: 12.5, height: 26.1, ring: 3.3 },
    label: { width: 29.25, height: 32.75, top: 15.25, dark: false },
  },
  100: {
    radius: 24,
    height: 89.75,
    fillet: 2.4,
    wall: 2.6,
    base: 12.5,
    headspace: 6.5,
    cap: { radius: 14, height: 31.2, ring: 3.9 },
    label: { width: 34.5, height: 39.5, top: 19.5, dark: true },
  },
};

/**
 * Bildausschnitt je Größe in 1/4 mm: Breite, Höhe und Unterkante des Glases. Die gezeichnete
 * Version nutzt ihn als viewBox, das 3D-Modell richtet seine Kamera daran aus – so liegen beide
 * deckungsgleich übereinander.
 */
export const FRAME: Record<SizeMl, { w: number; h: number; bottom: number }> = {
  15: { w: 100, h: 330, bottom: 321 },
  50: { w: 176, h: 422, bottom: 412 },
  100: { w: 222, h: 516, bottom: 504 },
};

/** Kamera-Ausschnitt in mm für eine Zeichenfläche, die oben/unten um `bleed` über den Rahmen ragt */
export function frameView(ml: SizeMl, bleed: number) {
  const { h, bottom } = FRAME[ml];
  const height = h / 4;
  return { height: height * (1 + bleed * 2), centerY: -(h - bottom) / 4 + height / 2 };
}

/** Fuge zwischen Kappe und Chromring */
export const CAP_GAP = 0.4;

/** Gesamthöhe vom Glasboden bis zur Oberkante der Kappe */
export function totalHeight(spec: BottleSpec) {
  return spec.height + spec.cap.ring + (spec.cap.ring > 0 ? CAP_GAP : 0.25) + spec.cap.height;
}

/** Bogenwinkel des Etiketts auf dem Zylinder (Etikett ist von vorn `width` breit) */
export function labelArc(spec: BottleSpec) {
  const theta = 2 * Math.asin(Math.min(0.98, spec.label.width / (2 * spec.radius)));
  return { theta, length: theta * spec.radius };
}

/*
 * Aufteilung des Etiketts (Anteile der Etikett-Höhe): Emblem, Schriftzug MR./MRS. ELIXIER,
 * „PARFUMES“ (nur 100 ml), Duftname und Zeile „EXTRAIT DE PARFUM · 50 ML“.
 */
export interface LabelLayout {
  frame: number;
  emblem: { y: number; size: number };
  word: { y: number; h: number };
  sub?: { y: number; w: number };
  name: { y: number; size: number; maxW: number };
  info: { y: number; size: number };
}

export const LABEL_LAYOUT: Record<SizeMl, LabelLayout> = {
  15: {
    frame: 0.016,
    emblem: { y: 0.142, size: 0.255 },
    word: { y: 0.462, h: 0.062 },
    name: { y: 0.67, size: 0.051, maxW: 0.53 },
    info: { y: 0.849, size: 0.0245 },
  },
  50: {
    frame: 0.018,
    emblem: { y: 0.107, size: 0.336 },
    word: { y: 0.511, h: 0.087 },
    name: { y: 0.748, size: 0.061, maxW: 0.733 },
    info: { y: 0.893, size: 0.0313 },
  },
  100: {
    frame: 0.018,
    emblem: { y: 0.114, size: 0.291 },
    word: { y: 0.468, h: 0.0772 },
    sub: { y: 0.582, w: 0.291 },
    name: { y: 0.759, size: 0.0494, maxW: 0.709 },
    info: { y: 0.88, size: 0.0253 },
  },
};
