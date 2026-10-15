import { SHIPPING } from "@/lib/config";
import { createOrderNumber, parseCartLines, priceLines, validateCustomer, type CustomerDetails } from "@/lib/order";
import { META } from "@/lib/order-summary";
import { getStripe, siteOrigin } from "@/lib/stripe";

/** Stripe-Metadaten dürfen keine leeren Werte enthalten. */
function withoutEmpty(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
}

/**
 * Legt die Bestellung an: prüft Warenkorb und Lieferdaten serverseitig
 * (Preise kommen ausschließlich aus dem Katalog) und erstellt eine
 * Stripe-Checkout-Session. Ohne Stripe-Schlüssel: Demo-Antwort.
 */
export async function POST(request: Request) {
  let body: { items?: unknown; customer?: Partial<Record<keyof CustomerDetails, unknown>>; termsAccepted?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const cart = parseCartLines(body.items);
  if (cart.error) return Response.json({ error: cart.error }, { status: 400 });

  const { data: customer, errors } = validateCustomer(body.customer ?? {});
  if (body.termsAccepted !== true) errors.terms = "Bitte bestätige die AGB und die Widerrufsbelehrung.";
  if (Object.keys(errors).length > 0) return Response.json({ errors }, { status: 422 });

  const totals = priceLines(cart.lines);
  const orderNumber = createOrderNumber();
  const stripe = getStripe();

  if (!stripe) {
    // Demo-Modus: keine Zahlung, nur Bestätigung
    return Response.json({ demo: true, orderNumber, totalCents: totals.totalCents });
  }

  const origin = siteOrigin(request);
  const fullName = `${customer.firstName} ${customer.lastName}`;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "de",
      customer_email: customer.email,
      client_reference_id: orderNumber,
      line_items: totals.lines.map((line) => ({
        quantity: line.qty,
        price_data: {
          currency: "eur",
          unit_amount: line.unitCents,
          product_data: {
            name: `${line.scent.name} · ${line.ml} ml`,
            description: `${line.scent.line === "mrs" ? "Mrs." : "Mr."} Elixier · Extrait de Parfum`,
            metadata: { slug: line.slug, ml: String(line.ml) },
          },
        },
      })),
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: totals.shippingCents === 0 ? `Kostenloser Versand per ${SHIPPING.carrier}` : `Versand per ${SHIPPING.carrier}`,
            fixed_amount: { amount: totals.shippingCents, currency: "eur" },
          },
        },
      ],
      payment_intent_data: {
        description: `Bestellung ${orderNumber}`,
        metadata: { [META.order]: orderNumber },
        shipping: {
          name: fullName,
          phone: customer.phone || undefined,
          address: {
            line1: customer.street,
            line2: customer.addressExtra || undefined,
            postal_code: customer.zip,
            city: customer.city,
            country: customer.country,
          },
        },
      },
      metadata: withoutEmpty({
        [META.order]: orderNumber,
        [META.firstName]: customer.firstName,
        [META.lastName]: customer.lastName,
        [META.line1]: customer.street,
        [META.line2]: customer.addressExtra,
        [META.zip]: customer.zip,
        [META.city]: customer.city,
        [META.country]: customer.country,
        [META.phone]: customer.phone,
        [META.note]: customer.note,
      }),
      custom_text: {
        submit: { message: `Bestellnummer ${orderNumber} · Von Hand verpackt und versendet per ${SHIPPING.carrier}.` },
      },
      success_url: `${origin}/bestellung/erfolg?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/kasse?abgebrochen=1`,
    });
    if (!session.url) throw new Error("Stripe hat keine Weiterleitungs-URL geliefert.");
    return Response.json({ url: session.url });
  } catch (error) {
    console.error("[checkout] Stripe-Fehler", error);
    return Response.json(
      { error: "Die Bezahlseite konnte gerade nicht geöffnet werden. Bitte versuche es in einem Moment erneut." },
      { status: 502 },
    );
  }
}
