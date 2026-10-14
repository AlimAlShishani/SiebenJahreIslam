import { MAX_QTY, SHIPPING, getSize, isSizeMl, type SizeMl } from "./config";
import { getScent, type Scent } from "./products";

export interface CartLine {
  slug: string;
  ml: SizeMl;
  qty: number;
}

export interface PricedLine extends CartLine {
  scent: Scent;
  unitCents: number;
  totalCents: number;
}

export interface Totals {
  lines: PricedLine[];
  count: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  /** Fehlender Betrag bis zum kostenlosen Versand (0 = erreicht) */
  freeShippingGapCents: number;
}

export function lineKey(line: Pick<CartLine, "slug" | "ml">): string {
  return `${line.slug}:${line.ml}`;
}

/** Preist Warenkorb-Positionen anhand des Katalogs. Unbekannte Positionen fallen weg. */
export function priceLines(lines: CartLine[]): Totals {
  const priced: PricedLine[] = [];
  for (const line of lines) {
    const scent = getScent(line.slug);
    const size = getSize(line.ml);
    if (!scent || !size || line.qty < 1) continue;
    const qty = Math.min(Math.floor(line.qty), MAX_QTY);
    priced.push({ ...line, qty, scent, unitCents: size.priceCents, totalCents: size.priceCents * qty });
  }
  const subtotalCents = priced.reduce((sum, l) => sum + l.totalCents, 0);
  const free = subtotalCents >= SHIPPING.freeFromCents;
  const shippingCents = priced.length === 0 || free ? 0 : SHIPPING.costCents;
  return {
    lines: priced,
    count: priced.reduce((sum, l) => sum + l.qty, 0),
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    freeShippingGapCents: free ? 0 : SHIPPING.freeFromCents - subtotalCents,
  };
}

// ------------------------------------------------------------ Checkout-Daten

export interface CustomerDetails {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  street: string;
  addressExtra: string;
  zip: string;
  city: string;
  country: string;
  note: string;
}

export const EMPTY_CUSTOMER: CustomerDetails = {
  email: "",
  phone: "",
  firstName: "",
  lastName: "",
  street: "",
  addressExtra: "",
  zip: "",
  city: "",
  country: "DE",
  note: "",
};

export type FieldErrors = Partial<Record<keyof CustomerDetails | "items" | "terms", string>>;

const LIMITS: Record<keyof CustomerDetails, number> = {
  email: 120,
  phone: 40,
  firstName: 60,
  lastName: 60,
  street: 100,
  addressExtra: 100,
  zip: 10,
  city: 60,
  country: 2,
  note: 400,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Prüft die Kundendaten (Client und Server nutzen dieselbe Logik). */
export function validateCustomer(input: Partial<Record<keyof CustomerDetails, unknown>>): {
  data: CustomerDetails;
  errors: FieldErrors;
} {
  const data = { ...EMPTY_CUSTOMER };
  for (const key of Object.keys(LIMITS) as (keyof CustomerDetails)[]) {
    const raw = input[key];
    data[key] = typeof raw === "string" ? raw.trim().slice(0, LIMITS[key]) : data[key];
  }
  const errors: FieldErrors = {};
  if (!EMAIL_RE.test(data.email)) errors.email = "Bitte gib eine gültige E-Mail-Adresse ein.";
  if (!data.firstName) errors.firstName = "Bitte gib deinen Vornamen ein.";
  if (!data.lastName) errors.lastName = "Bitte gib deinen Nachnamen ein.";
  if (!data.street || !/\d/.test(data.street)) errors.street = "Bitte gib Straße und Hausnummer ein.";
  if (!/^\d{5}$/.test(data.zip)) errors.zip = "Bitte gib eine gültige Postleitzahl ein.";
  if (!data.city) errors.city = "Bitte gib deinen Ort ein.";
  if (!SHIPPING.countries.some((c) => c.code === data.country)) {
    errors.country = "In dieses Land liefern wir leider noch nicht.";
  }
  if (data.phone && !/^[+\d][\d\s/()-]{4,}$/.test(data.phone)) {
    errors.phone = "Bitte gib eine gültige Telefonnummer ein.";
  }
  return { data, errors };
}

/** Prüft Warenkorb-Positionen aus einer Anfrage (Server). */
export function parseCartLines(input: unknown): { lines: CartLine[]; error?: string } {
  if (!Array.isArray(input) || input.length === 0) return { lines: [], error: "Dein Warenkorb ist leer." };
  if (input.length > 30) return { lines: [], error: "Zu viele Positionen im Warenkorb." };
  const merged = new Map<string, CartLine>();
  for (const item of input) {
    if (!item || typeof item !== "object") return { lines: [], error: "Ungültige Position im Warenkorb." };
    const { slug, ml, qty } = item as Record<string, unknown>;
    const scent = typeof slug === "string" ? getScent(slug) : undefined;
    if (!scent || !isSizeMl(ml) || typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      return { lines: [], error: "Ungültige Position im Warenkorb." };
    }
    if (scent.soldOut) return { lines: [], error: `„${scent.name}“ ist leider ausverkauft.` };
    const key = lineKey({ slug: scent.slug, ml });
    const prev = merged.get(key);
    merged.set(key, { slug: scent.slug, ml, qty: Math.min((prev?.qty ?? 0) + qty, MAX_QTY) });
  }
  return { lines: [...merged.values()] };
}

/** Kurze, gut lesbare Bestellnummer, z. B. ME-7K2Q9F */
export function createOrderNumber(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return "ME-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
