import Stripe from "stripe";

let client: Stripe | null = null;

/** Stripe-Client – oder `null`, solange kein Schlüssel hinterlegt ist (Demo-Modus). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key, { appInfo: { name: "mr-elixier-shop" } });
  return client;
}

export function isDemoMode(): boolean {
  return !process.env.STRIPE_SECRET_KEY;
}

/** Öffentliche Basis-URL des Shops (für Weiterleitungen von Stripe zurück zum Shop). */
export function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}
