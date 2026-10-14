/**
 * Zentrale Shop-Einstellungen. Alles, was der Inhaber anpassen möchte
 * (Preise, Versand, Kontakt), steht hier an einer Stelle.
 */

export const SHOP = {
  name: "Mr. Elixier",
  fullName: "Mr. Elixier Parfumes",
  claim: "Extrait de Parfum · 40 % Duftöl",
  /** Duftölanteil in Prozent */
  oilContent: 40,
  /** Zeigt „Inspiriert von …“ an Produkten an. Auf `false` setzen, um die Markenhinweise auszublenden. */
  showInspiration: true,
  /** Preishinweis. Bei Kleinunternehmerregelung z. B. „gem. § 19 UStG ohne MwSt.“ */
  priceNote: "inkl. MwSt.",
  // TODO: echte Kontaktdaten eintragen
  email: "kontakt@deine-domain.de",
  instagram: "https://www.instagram.com/",
} as const;

export type SizeMl = 15 | 50 | 100;

export interface SizeOption {
  ml: SizeMl;
  priceCents: number;
  /** Kurzname des Formats */
  title: string;
  /** Verpackung, in der das Format geliefert wird */
  packaging: string;
}

export const SIZES: readonly SizeOption[] = [
  { ml: 15, priceCents: 1500, title: "Reiseflakon", packaging: "Schwarze Box mit Sichtfenster" },
  { ml: 50, priceCents: 3500, title: "Flakon", packaging: "Weiße Zylinderbox" },
  { ml: 100, priceCents: 6000, title: "Grand Flakon", packaging: "Schwarze Magnetbox mit Satin" },
] as const;

export const DEFAULT_SIZE: SizeMl = 50;

export const SHIPPING = {
  carrier: "Deutsche Post",
  /** Versandkosten in Cent */
  costCents: 490,
  /** Ab diesem Warenwert (Cent) ist der Versand kostenlos */
  freeFromCents: 5000,
  countries: [{ code: "DE", name: "Deutschland" }],
} as const;

/** Maximale Stückzahl pro Position im Warenkorb */
export const MAX_QTY = 10;

export function getSize(ml: number): SizeOption | undefined {
  return SIZES.find((s) => s.ml === ml);
}

export function isSizeMl(value: unknown): value is SizeMl {
  return value === 15 || value === 50 || value === 100;
}
