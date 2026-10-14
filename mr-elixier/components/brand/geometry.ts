// Maße des vektorisierten Logos. Die Pfade selbst liegen in public/brand/sprite.svg.
export const SPRITE = "/brand/sprite.svg";

export const EMBLEM = { size: 427.6, ringR: 207.66, ringW: 12.28 } as const;

export const WORDMARK = {
  mr: { w: 898, h: 114 },
  mrs: { w: 983.0, h: 114 },
  sub: { w: 550, h: 57 },
  /** Abstand MR. ELIXIER -> PARFUMES im Original-Logo */
  gap: 48,
} as const;
