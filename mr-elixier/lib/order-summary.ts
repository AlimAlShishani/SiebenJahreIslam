import type Stripe from "stripe";
import { SHIPPING } from "./config";

/** Einheitliche Sicht auf eine Bestellung – für Bestell-E-Mail und Bestätigungsseite. */
export interface OrderSummary {
  number: string;
  createdAt: Date;
  paid: boolean;
  email: string | null;
  phone: string | null;
  firstName: string;
  /** Lieferadresse, zeilenweise – so wie sie auf das Paket kommt */
  address: string[];
  items: { name: string; qty: number; totalCents: number }[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  note: string;
  paymentId: string | null;
}

/** Schlüssel der Metadaten, die beim Checkout an Stripe übergeben werden. */
export const META = {
  order: "order_number",
  firstName: "first_name",
  lastName: "last_name",
  line1: "ship_line1",
  line2: "ship_line2",
  zip: "ship_zip",
  city: "ship_city",
  country: "ship_country",
  phone: "phone",
  note: "note",
} as const;

function countryName(code: string): string {
  return SHIPPING.countries.find((c) => c.code === code)?.name ?? code;
}

/** Erwartet eine Checkout-Session mit `expand: ["line_items"]`. */
export function summarizeSession(session: Stripe.Checkout.Session): OrderSummary {
  const m = session.metadata ?? {};
  const name = [m[META.firstName], m[META.lastName]].filter(Boolean).join(" ");
  const address = [
    name,
    m[META.line1],
    m[META.line2],
    [m[META.zip], m[META.city]].filter(Boolean).join(" "),
    m[META.country] ? countryName(m[META.country]) : "",
  ].filter((line): line is string => Boolean(line && line.trim()));

  const paymentIntent = session.payment_intent;
  return {
    number: m[META.order] || session.client_reference_id || session.id,
    createdAt: new Date(session.created * 1000),
    paid: session.payment_status === "paid" || session.payment_status === "no_payment_required",
    email: session.customer_details?.email ?? session.customer_email ?? null,
    phone: m[META.phone] || session.customer_details?.phone || null,
    firstName: m[META.firstName] || session.customer_details?.name?.split(" ")[0] || "",
    address,
    items: (session.line_items?.data ?? []).map((item) => ({
      name: item.description ?? "Artikel",
      qty: item.quantity ?? 1,
      totalCents: item.amount_total,
    })),
    subtotalCents: session.amount_subtotal ?? 0,
    shippingCents: session.shipping_cost?.amount_total ?? 0,
    totalCents: session.amount_total ?? 0,
    note: m[META.note] ?? "",
    paymentId: typeof paymentIntent === "string" ? paymentIntent : (paymentIntent?.id ?? null),
  };
}
