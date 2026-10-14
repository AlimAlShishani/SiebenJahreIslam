import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { isDemoMode } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Kasse",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutForm demo={isDemoMode()} />;
}
