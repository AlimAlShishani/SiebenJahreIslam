# Mr. Elixier – Online-Shop

Eleganter Shop für **Mr. Elixier Parfumes**: Extrait de Parfum mit 40 % Duftöl, 44 Düfte (MR. ELIXIER für Herren,
MRS. ELIXIER für Damen) in drei Größen. Kunden legen Düfte in den Warenkorb, geben ihre Lieferdaten ein und bezahlen
über Stripe. Der Inhaber bekommt die Bestellung per E-Mail (Packzettel mit Lieferadresse), verpackt sie und bringt sie
selbst zur Post.

**Technik:** Next.js 16 (App Router) · React 19 · TypeScript · CSS Modules · Stripe Checkout · Resend (optional)

---

## Schnellstart

```bash
cd mr-elixier
npm install
npm run dev        # http://localhost:3000
```

Ohne Stripe-Schlüssel läuft der Shop im **Demo-Modus**: Der komplette Ablauf (Warenkorb → Kasse → Bestätigung)
funktioniert, es wird aber nichts berechnet. Ideal zum Vorzeigen.

```bash
npm run build && npm start   # Produktions-Build lokal testen
npm run typecheck            # TypeScript prüfen
```

## Inhalte anpassen

| Was | Wo |
| --- | --- |
| Düfte (Namen, Noten, Beschreibung, Farbe, „ausverkauft“) | `lib/products.ts` |
| Preise, Größen, Versandkosten, Kontakt-E-Mail, Instagram | `lib/config.ts` |
| Hinweis „Inspiriert von …“ ein-/ausblenden | `SHOP.showInspiration` in `lib/config.ts` |
| Düfte im Hero (Startseite) | `HERO_SCENTS` in `lib/products.ts` |
| Rechtstexte | `app/impressum`, `app/datenschutz`, `app/agb`, `app/widerruf`, `app/versand` |

- **Neuer Duft:** Eintrag in `SCENTS` kopieren, `slug` (URL), `name`, `line` (`"mr"` oder `"mrs"` → Etikett),
  `tint` (Farbe im Flakon) anpassen. Die Produktseite entsteht automatisch.
- **Ausverkauft:** `soldOut: true` setzen.

## Produktfotos hinzufügen

Bis echte Fotos da sind, zeigt der Shop die Flakons im Mr.-Elixier-Design: klares Glas mit der Farbe des
jeweiligen Duftes, glänzend schwarze Kappe mit Chromring, MR./MRS.-Etikett (100 ml mit schwarzem Etikett).
Auf der Startseite dreht sich ein echtes 3D-Modell (three.js, `components/bottle3d/`), überall sonst steht die
gezeichnete Version (`components/bottle/Bottle.tsx`) – beide nutzen dieselben Maße aus
`components/bottle3d/specs.ts`.

Fotos werden **automatisch erkannt**, sobald sie in `public/produkte/` liegen:

```
public/produkte/layton.webp        → für alle Größen
public/produkte/layton-100.webp    → nur für 100 ml
```

Der Dateiname ist der `slug` aus `lib/products.ts`. Am besten freigestellte Hochformat-Fotos (transparenter
Hintergrund, `.webp` oder `.png`, ca. 1000 × 2000 px).

## Zahlungen aktivieren (Stripe)

1. Konto anlegen auf [stripe.com](https://stripe.com) und das Unternehmen verifizieren.
2. Unter **Einstellungen → Zahlungsmethoden** gewünschte Zahlarten aktivieren (Karte, Apple Pay, Google Pay,
   PayPal, Klarna …) – der Shop nutzt automatisch alle aktivierten.
3. Umgebungsvariablen setzen (lokal in `.env.local`, bei Vercel unter *Settings → Environment Variables*):
   ```
   STRIPE_SECRET_KEY=sk_live_…        # zum Testen zuerst sk_test_…
   NEXT_PUBLIC_SITE_URL=https://www.deine-domain.de
   ```
4. **Webhook** anlegen (*Entwickler → Webhooks*): Endpunkt `https://www.deine-domain.de/api/stripe/webhook`,
   Ereignisse `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`. Das Signatur-Secret als `STRIPE_WEBHOOK_SECRET` eintragen.
5. Unter *Einstellungen → Kunden-E-Mails* „Erfolgreiche Zahlungen“ aktivieren → Kunden erhalten eine Quittung.

Testkarte im Testmodus: `4242 4242 4242 4242`, beliebiges Datum in der Zukunft, beliebige Prüfziffer.

**So kommt die Bestellung beim Inhaber an:** Jede bezahlte Bestellung erscheint im Stripe-Dashboard (auch in der
Stripe-App) inklusive Artikeln und Lieferadresse. Zusätzlich verschickt der Shop eine E-Mail mit Packzettel, wenn
Resend eingerichtet ist:

```
RESEND_API_KEY=re_…
ORDER_NOTIFICATION_EMAIL=inhaber@deine-domain.de
ORDER_FROM_EMAIL="Mr. Elixier Shop <shop@deine-domain.de>"   # Domain bei Resend verifizieren
```

Sicherheit: Preise kommen ausschließlich aus `lib/config.ts` auf dem Server – manipulierte Warenkörbe werden
abgelehnt.

## Veröffentlichen (Vercel)

1. Auf [vercel.com](https://vercel.com) „Add New Project“ → dieses GitHub-Repository importieren.
2. **Root Directory:** `mr-elixier` (der Shop liegt in diesem Unterordner).
3. Umgebungsvariablen eintragen (siehe oben) → Deploy.
4. Eigene Domain unter *Settings → Domains* verbinden.

Tipp: Vorschau-Links von Vercel sind standardmäßig passwortgeschützt (*Deployment Protection*). Zum Teilen mit
dem CEO entweder die Produktions-URL verwenden oder den Schutz für Previews ausschalten.

## Vor dem Livegang (Checkliste)

- [ ] **Markennamen:** Produktnamen und „Inspiriert von …“ nennen fremde Marken. Das ist in Deutschland
      abmahngefährdet (vergleichende Werbung, Markenrecht) – Namen ändern bzw. rechtlich prüfen lassen.
      Die Hinweise lassen sich mit `showInspiration: false` sofort ausblenden.
- [ ] Impressum, Datenschutz, AGB und Widerrufsbelehrung durch geprüfte Texte ersetzen (Platzhalter sind markiert).
- [ ] Mehrwertsteuer: `priceNote` in `lib/config.ts` (z. B. Kleinunternehmerregelung § 19 UStG).
- [ ] Versandkosten, Lieferzeit und Versandland in `lib/config.ts` bestätigen.
- [ ] Kontakt-E-Mail und Instagram-Link in `lib/config.ts` eintragen.
- [ ] Liste prüfen: „Creed Aventus (Louis Vuitton)“ und „Armani (Acqua di Parma)“ wirken vertauscht.
- [ ] Inhaltsstoffe (INCI) und Warnhinweise ergänzen (Produktseite → „Inhaltsstoffe & Hinweise“).
- [ ] Duftnoten und Beschreibungen sind Entwürfe – bei Bedarf anpassen.

Bereits umgesetzt: Grundpreis pro Liter (PAngV), Bestell-Button „Zahlungspflichtig bestellen“, Widerrufsfunktion
„Vertrag widerrufen“ (Pflicht für Online-Shops seit 19.06.2026), lokal eingebundene Schriften (kein Google-Fonts-
Abruf), keine Tracking-Cookies, Kasse und Bestätigungsseite auf `noindex`.

## Projektstruktur

```
app/                 Seiten (Startseite, /duft/[slug], /kasse, /bestellung/erfolg, Rechtliches, API)
components/brand/    vektorisiertes Logo (public/brand/sprite.svg)
components/bottle/   Flakon- und Verpackungs-Illustrationen, Foto-Erkennung
components/home/     Abschnitte der Startseite
components/product/  Produktkarte, Produktseite, Duftpyramide
components/cart/     Warenkorb (im Browser gespeichert)
components/checkout/ Kasse und Bestellbestätigung
lib/                 Katalog, Einstellungen, Preise, Stripe, E-Mail
```
