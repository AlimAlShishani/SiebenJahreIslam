import type Stripe from "stripe";
import { escapeHtml, ownerRecipients, sendEmail } from "@/lib/notify";
import { getStripe } from "@/lib/stripe";

const ORDER_RE = /^ME-[A-Z0-9]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** E-Mail-Adresse, mit der die Bestellung bei Stripe bezahlt wurde – oder `null`. */
async function findOrderEmail(stripe: Stripe, orderNumber: string): Promise<string | null> {
  const found = await stripe.paymentIntents.search({ query: `metadata['order_number']:'${orderNumber}'`, limit: 1 });
  const paymentIntent = found.data[0];
  if (!paymentIntent) return null;
  const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent.id, limit: 1 });
  return sessions.data[0]?.customer_details?.email ?? null;
}

function field(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Elektronische Widerrufsfunktion („Vertrag hier widerrufen“): nimmt den Widerruf
 * entgegen, informiert den Inhaber und schickt dem Kunden eine Eingangsbestätigung.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const data = {
    name: field(body.name, 100),
    email: field(body.email, 120),
    orderNumber: field(body.orderNumber, 40).toUpperCase(),
    orderDate: field(body.orderDate, 40),
    items: field(body.items, 400),
    message: field(body.message, 1000),
  };
  const errors: Record<string, string> = {};
  if (!data.name) errors.name = "Bitte gib deinen Namen ein.";
  if (!EMAIL_RE.test(data.email)) errors.email = "Bitte gib eine gültige E-Mail-Adresse ein.";
  if (!data.orderNumber) errors.orderNumber = "Bitte gib die Bestellnummer an (z. B. ME-7K2Q9F).";
  if (Object.keys(errors).length > 0) return Response.json({ errors }, { status: 422 });

  const receivedAt = new Date();
  const stamp = receivedAt.toLocaleString("de-DE", { timeZone: "Europe/Berlin", dateStyle: "long", timeStyle: "short" });
  const rows: [string, string][] = [
    ["Name", data.name],
    ["E-Mail", data.email],
    ["Bestellnummer", data.orderNumber],
    ["Bestellt/erhalten am", data.orderDate || "–"],
    ["Betroffene Artikel", data.items || "alle Artikel der Bestellung"],
    ["Nachricht", data.message || "–"],
    ["Eingegangen am", `${stamp} Uhr`],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<table style="font-family:Arial,sans-serif;font-size:15px;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#6d6458">${k}</td><td style="padding:6px 0">${escapeHtml(v)}</td></tr>`)
    .join("")}</table>`;

  // Bestellung zuordnen: Die Eingangsbestätigung geht nur an die E-Mail-Adresse der
  // Bestellung – so lässt sich das Formular nicht zum Versand an fremde Adressen missbrauchen.
  let orderEmail: string | null = null;
  const stripe = getStripe();
  if (stripe && ORDER_RE.test(data.orderNumber)) {
    try {
      orderEmail = await findOrderEmail(stripe, data.orderNumber);
    } catch (error) {
      console.warn("[widerruf] Bestellung konnte nicht geprüft werden", error);
    }
  }

  let emailSent = false;
  try {
    await sendEmail({
      to: ownerRecipients(),
      replyTo: orderEmail ?? data.email,
      subject: `Widerruf zu Bestellung ${data.orderNumber}${orderEmail ? "" : " (nicht automatisch zugeordnet)"}`,
      html: `<p style="font-family:Arial,sans-serif">Ein Kunde hat über die Widerrufsfunktion den Widerruf erklärt.${
        orderEmail
          ? ` Die Bestellung wurde gefunden, die Eingangsbestätigung ging an ${escapeHtml(orderEmail)}.`
          : " <strong>Die Bestellung konnte nicht automatisch zugeordnet werden – bitte die Eingangsbestätigung selbst senden.</strong>"
      }</p>${html}`,
      text: `Ein Kunde hat über die Widerrufsfunktion den Widerruf erklärt.\n${
        orderEmail ? `Eingangsbestätigung ging an ${orderEmail}.` : "Bestellung nicht automatisch zugeordnet – bitte Eingangsbestätigung selbst senden."
      }\n\n${text}`,
    });
    if (orderEmail) {
      emailSent = await sendEmail({
        to: [orderEmail],
        subject: `Eingangsbestätigung deines Widerrufs – Bestellung ${data.orderNumber}`,
        html: `<p style="font-family:Arial,sans-serif">Hallo ${escapeHtml(data.name)},<br><br>wir bestätigen den Eingang deines Widerrufs mit folgenden Angaben:</p>${html}<p style="font-family:Arial,sans-serif">Wir melden uns mit allen weiteren Schritten zur Rücksendung bei dir.<br><br>Mr. Elixier</p>`,
        text: `Hallo ${data.name},\n\nwir bestätigen den Eingang deines Widerrufs mit folgenden Angaben:\n\n${text}\n\nWir melden uns mit allen weiteren Schritten zur Rücksendung bei dir.\n\nMr. Elixier`,
      });
    }
  } catch (error) {
    console.error("[widerruf] E-Mail-Versand fehlgeschlagen", error);
    return Response.json(
      { error: "Dein Widerruf konnte gerade nicht übermittelt werden. Bitte versuche es erneut oder schreib uns eine E-Mail." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true, receivedAt: receivedAt.toISOString(), emailSent });
}
