import type Stripe from "stripe";
import { notifyOwner } from "@/lib/notify";
import { summarizeSession } from "@/lib/order-summary";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe meldet hier bezahlte Bestellungen. Der Inhaber bekommt daraufhin eine
 * E-Mail mit Artikeln und Lieferadresse (Packzettel).
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return new Response("Webhook nicht konfiguriert", { status: 501 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Signatur fehlt", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await request.text(), signature, secret);
  } catch (error) {
    console.warn("[webhook] Ungültige Signatur", error);
    return new Response("Ungültige Signatur", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = await stripe.checkout.sessions.retrieve(event.data.object.id, { expand: ["line_items"] });
      const order = summarizeSession(session);
      // Bei verzögerten Zahlarten (z. B. SEPA) kommt "completed" vor dem Geldeingang –
      // gemeldet wird erst, wenn bezahlt ist.
      if (order.paid) {
        try {
          await notifyOwner(order);
        } catch (error) {
          console.error("[webhook] Bestell-E-Mail fehlgeschlagen", error);
          return new Response("E-Mail fehlgeschlagen", { status: 500 });
        }
      }
      break;
    }
    case "checkout.session.async_payment_failed":
      console.warn(`[webhook] Zahlung fehlgeschlagen: ${event.data.object.id}`);
      break;
    default:
      break;
  }

  return Response.json({ received: true });
}
