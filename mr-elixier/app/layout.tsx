// Globale Styles zuerst, damit Komponenten-Styles sie gezielt überschreiben können
import "./globals.css";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PhotoProvider } from "@/components/bottle/PhotoContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { RevealObserver } from "@/components/ui/RevealObserver";
import { SHOP } from "@/lib/config";
import { getPhotoMap } from "@/lib/photos";
import { siteUrl } from "@/lib/site";

const serif = localFont({
  src: [
    { path: "./fonts/cormorant-garamond.woff2", style: "normal", weight: "300 700" },
    { path: "./fonts/cormorant-garamond-italic.woff2", style: "italic", weight: "300 700" },
  ],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const sans = localFont({
  src: "./fonts/montserrat.woff2",
  weight: "100 900",
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "Helvetica Neue", "Arial", "sans-serif"],
});

const description = `Extrait de Parfum mit ${SHOP.oilContent} % Duftöl – ikonische Duftrichtungen für Sie und Ihn in 15, 50 und 100 ml. Von Hand verpackt und persönlich versendet.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `Mr. Elixier – Extrait de Parfum mit ${SHOP.oilContent} % Duftöl`,
    template: "%s | Mr. Elixier",
  },
  description,
  applicationName: SHOP.fullName,
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: SHOP.fullName,
    title: "Mr. Elixier – Duft mit Haltung.",
    description,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0d0b09",
  colorScheme: "light",
};

/**
 * Läuft vor dem ersten Paint: markiert JS-Unterstützung und entscheidet, ob das
 * Logo-Intro (nur Startseite, einmal pro Sitzung) gezeigt wird.
 */
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');try{if(location.pathname==='/'&&!sessionStorage.getItem('mr-elixier-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('intro-play')}}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${serif.variable} ${sans.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <PhotoProvider photos={getPhotoMap()}>
          <CartProvider>
            <Header />
            <main id="inhalt">{children}</main>
            <Footer />
            <CartDrawer />
          </CartProvider>
        </PhotoProvider>
        <RevealObserver />
      </body>
    </html>
  );
}
