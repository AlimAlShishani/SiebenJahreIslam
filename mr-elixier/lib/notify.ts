import { formatPrice } from "./format";
import type { OrderSummary } from "./order-summary";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

function textEmail(order: OrderSummary): string {
  const lines = [
    `Neue Bestellung ${order.number}`,
    order.paid ? "Status: BEZAHLT – bitte verpacken und versenden." : "Status: Zahlung noch ausstehend – bitte noch NICHT versenden.",
    "",
    "ARTIKEL",
    ...order.items.map((item) => `${item.qty} × ${item.name} – ${formatPrice(item.totalCents)}`),
    "",
    `Zwischensumme: ${formatPrice(order.subtotalCents)}`,
    `Versand: ${order.shippingCents === 0 ? "kostenlos" : formatPrice(order.shippingCents)}`,
    `Gesamt: ${formatPrice(order.totalCents)}`,
    "",
    "LIEFERADRESSE (für das Paket)",
    ...order.address,
    "",
    `E-Mail: ${order.email ?? "–"}`,
    `Telefon: ${order.phone ?? "–"}`,
  ];
  if (order.note) lines.push("", "ANMERKUNG DES KUNDEN", order.note);
  if (order.paymentId) lines.push("", `Stripe: https://dashboard.stripe.com/payments/${order.paymentId}`);
  return lines.join("\n");
}

function htmlEmail(order: OrderSummary): string {
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:6px 0;color:#6d6458">${label}</td><td style="padding:6px 0;text-align:right;${strong ? "font-weight:700" : ""}">${value}</td></tr>`;
  const status = order.paid
    ? `<p style="margin:0 0 24px;padding:12px 16px;background:#eef6ee;color:#1d5a2a;border-radius:4px">Bezahlt – bitte verpacken und versenden.</p>`
    : `<p style="margin:0 0 24px;padding:12px 16px;background:#fff4e5;color:#8a4b00;border-radius:4px">Zahlung noch ausstehend – bitte noch nicht versenden.</p>`;
  return `<!doctype html><html lang="de"><body style="margin:0;background:#f3ede3;font-family:Arial,Helvetica,sans-serif;color:#1b1713">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#7a5c2c">Mr. Elixier · Neue Bestellung</p>
  <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-weight:400;font-size:30px">${escapeHtml(order.number)}</h1>
  ${status}
  <table style="width:100%;border-collapse:collapse;font-size:15px">
    ${order.items
      .map(
        (item) =>
          `<tr><td style="padding:10px 0;border-bottom:1px solid #e2d8c8"><strong>${item.qty} ×</strong> ${escapeHtml(item.name)}</td><td style="padding:10px 0;border-bottom:1px solid #e2d8c8;text-align:right">${formatPrice(item.totalCents)}</td></tr>`,
      )
      .join("")}
    ${row("Zwischensumme", formatPrice(order.subtotalCents))}
    ${row("Versand", order.shippingCents === 0 ? "kostenlos" : formatPrice(order.shippingCents))}
    ${row("Gesamt", formatPrice(order.totalCents), true)}
  </table>
  <h2 style="margin:28px 0 8px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#7a5c2c">Lieferadresse</h2>
  <p style="margin:0;padding:16px;background:#fff;border:1px dashed #c9a66b;font-size:16px;line-height:1.5">${order.address.map(escapeHtml).join("<br>")}</p>
  <p style="margin:16px 0 0;font-size:14px;line-height:1.6">E-Mail: ${escapeHtml(order.email ?? "–")}<br>Telefon: ${escapeHtml(order.phone ?? "–")}</p>
  ${order.note ? `<h2 style="margin:28px 0 8px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#7a5c2c">Anmerkung</h2><p style="margin:0;font-size:15px">${escapeHtml(order.note)}</p>` : ""}
  ${order.paymentId ? `<p style="margin:28px 0 0"><a href="https://dashboard.stripe.com/payments/${escapeHtml(order.paymentId)}" style="color:#7a5c2c">Zahlung im Stripe-Dashboard öffnen</a></p>` : ""}
</div></body></html>`;
}

interface EmailMessage {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
}

/** Inhaber-Adresse(n) für Benachrichtigungen */
export function ownerRecipients(): string[] {
  return (process.env.ORDER_NOTIFICATION_EMAIL ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}

/**
 * Versendet eine E-Mail über Resend. Gibt `false` zurück, wenn kein E-Mail-Dienst
 * konfiguriert ist (die Nachricht landet dann nur im Server-Log).
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || message.to.length === 0) {
    console.info(`[e-mail] ${message.subject} (E-Mail-Versand nicht konfiguriert)\n${message.text}`);
    return false;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.ORDER_FROM_EMAIL || "Mr. Elixier Shop <onboarding@resend.dev>",
      to: message.to,
      reply_to: message.replyTo ?? undefined,
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend antwortete mit ${response.status}: ${await response.text()}`);
  }
  return true;
}

/**
 * Schickt die Bestellung per E-Mail an den Inhaber (Packzettel).
 * Ohne Konfiguration wird sie nur ins Server-Log geschrieben –
 * im Stripe-Dashboard ist sie in jedem Fall vollständig sichtbar.
 */
export async function notifyOwner(order: OrderSummary): Promise<boolean> {
  return sendEmail({
    to: ownerRecipients(),
    replyTo: order.email,
    subject: `${order.paid ? "Neue Bestellung" : "Bestellung (Zahlung ausstehend)"} ${order.number} – ${formatPrice(order.totalCents)}`,
    html: htmlEmail(order),
    text: textEmail(order),
  });
}

export { escapeHtml };
