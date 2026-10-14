import type { Metadata } from "next";
import type { ConfirmationData } from "@/components/checkout/confirmation";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { summarizeSession } from "@/lib/order-summary";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Vielen Dank",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ session_id?: string; demo?: string }> };

async function loadOrder(sessionId: string | undefined): Promise<ConfirmationData | null> {
  const stripe = getStripe();
  if (!stripe || !sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
    const order = summarizeSession(session);
    return {
      number: order.number,
      firstName: order.firstName,
      email: order.email,
      paid: order.paid,
      items: order.items,
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      totalCents: order.totalCents,
      address: order.address,
    };
  } catch (error) {
    console.error("[erfolg] Session konnte nicht geladen werden", error);
    return null;
  }
}

export default async function SuccessPage({ searchParams }: Props) {
  const { session_id: sessionId, demo } = await searchParams;
  const order = await loadOrder(sessionId);
  return <OrderConfirmation order={order} demo={demo === "1" && !order} />;
}
