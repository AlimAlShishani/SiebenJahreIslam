/** Daten für die Bestellbestätigung (aus Stripe oder – im Demo-Modus – aus dem Browser). */
export interface ConfirmationData {
  number: string;
  firstName: string;
  email: string | null;
  paid: boolean;
  items: { name: string; qty: number; totalCents: number }[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  address: string[];
}

export const DEMO_ORDER_KEY = "mr-elixier-demo-order";
