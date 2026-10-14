const EUR = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

/** 3500 -> "35,00 €" */
export function formatPrice(cents: number): string {
  return EUR.format(cents / 100);
}

/** 3500 -> "35 €", 3550 -> "35,50 €" – für Werbeflächen */
export function formatPriceShort(cents: number): string {
  return cents % 100 === 0 ? `${cents / 100} €` : formatPrice(cents);
}

/** Grundpreis nach PAngV, bezogen auf 1 Liter */
export function formatBasePrice(cents: number, ml: number): string {
  return `${formatPrice(Math.round((cents / ml) * 1000))} / 1 l`;
}
