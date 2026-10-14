"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Emblem } from "@/components/brand/Logo";
import { ProductVisual } from "@/components/bottle/ProductVisual";
import { useCart } from "@/components/cart/CartProvider";
import { LockIcon } from "@/components/ui/Icons";
import { PaymentBadges } from "@/components/ui/PaymentBadges";
import { SHIPPING, SHOP } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { EMPTY_CUSTOMER, lineKey, validateCustomer, type CustomerDetails, type FieldErrors } from "@/lib/order";
import { DEMO_ORDER_KEY, type ConfirmationData } from "./confirmation";
import styles from "./CheckoutForm.module.css";

type FieldName = keyof CustomerDetails;

const FIELD_ORDER: (FieldName | "terms")[] = ["email", "phone", "firstName", "lastName", "street", "addressExtra", "zip", "city", "country", "note", "terms"];

function Field({
  id,
  label,
  error,
  optional,
  wide,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`${styles.field} ${wide ? styles.wide : ""} ${error ? styles.invalid : ""}`}>
      <label htmlFor={id} className={styles.label}>
        {label} {optional && <span className={styles.optional}>(optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutForm({ demo }: { demo: boolean }) {
  const cart = useCart();
  const router = useRouter();
  const [values, setValues] = useState<CustomerDetails>(EMPTY_CUSTOMER);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setCancelled(new URLSearchParams(window.location.search).has("abgebrochen"));
  }, []);

  const set = (name: FieldName) => (event: { target: { value: string } }) => {
    const value = event.target.value;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateField = (name: FieldName) => {
    const { errors: all } = validateCustomer(values);
    setErrors((prev) => ({ ...prev, [name]: all[name] }));
  };

  const inputProps = (name: FieldName) => ({
    id: `f-${name}`,
    name,
    value: values[name],
    onChange: set(name),
    onBlur: () => validateField(name),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `f-${name}-error` : undefined,
    className: styles.input,
  });

  const focusFirstError = (found: FieldErrors) => {
    const first = FIELD_ORDER.find((key) => found[key as keyof FieldErrors]);
    if (first) formRef.current?.querySelector<HTMLElement>(`#f-${first}`)?.focus();
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const { data, errors: found } = validateCustomer(values);
    if (!terms) found.terms = "Bitte bestätige die AGB und die Widerrufsbelehrung.";
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length > 0) {
      focusFirstError(found);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart.items, customer: data, termsAccepted: terms }),
      });
      const result: { url?: string; demo?: boolean; orderNumber?: string; error?: string; errors?: FieldErrors } = await response
        .json()
        .catch(() => ({}));

      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      if (result.demo && result.orderNumber) {
        const confirmation: ConfirmationData = {
          number: result.orderNumber,
          firstName: data.firstName,
          email: data.email,
          paid: true,
          items: cart.lines.map((l) => ({ name: `${l.scent.name} · ${l.ml} ml`, qty: l.qty, totalCents: l.totalCents })),
          subtotalCents: cart.subtotalCents,
          shippingCents: cart.shippingCents,
          totalCents: cart.totalCents,
          address: [
            `${data.firstName} ${data.lastName}`,
            data.street,
            data.addressExtra,
            `${data.zip} ${data.city}`,
            SHIPPING.countries.find((c) => c.code === data.country)?.name ?? data.country,
          ].filter(Boolean),
        };
        try {
          window.sessionStorage.setItem(DEMO_ORDER_KEY, JSON.stringify(confirmation));
        } catch {
          /* ignorieren */
        }
        router.push(`/bestellung/erfolg?demo=1&order=${encodeURIComponent(result.orderNumber)}`);
        return;
      }
      if (result.errors) {
        setErrors(result.errors);
        focusFirstError(result.errors);
      }
      setServerError(result.error ?? "Bitte prüfe deine Angaben.");
    } catch {
      setServerError("Die Verbindung ist fehlgeschlagen. Bitte versuche es erneut.");
    }
    setSubmitting(false);
  };

  if (!cart.ready) {
    return <section className={styles.section} aria-busy="true" />;
  }

  if (cart.lines.length === 0 && !submitting) {
    return (
      <section className={`${styles.section} ${styles.emptySection}`}>
        <div className={`container ${styles.empty}`}>
          <Emblem className={styles.emptyEmblem} />
          <h1 className={styles.emptyTitle}>Dein Warenkorb ist leer.</h1>
          <p>Wähle zuerst deinen Duft – danach geht es hier weiter.</p>
          <Link href="/#kollektion" className="btn btn--dark">
            Zur Kollektion
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className="container">
        <header className={styles.head}>
          <p className="eyebrow eyebrow--line">Sichere Kasse</p>
          <h1 className={styles.title}>Lieferdaten</h1>
          <ol className={styles.steps} role="list" aria-label="Fortschritt">
            <li className={styles.done}>Warenkorb</li>
            <li className={styles.current} aria-current="step">
              Lieferdaten
            </li>
            <li>Zahlung</li>
          </ol>
        </header>

        {demo && (
          <p className={styles.demo} role="note">
            <strong>Demo-Modus:</strong> Es ist noch kein Zahlungsanbieter verbunden – Bestellungen werden nur simuliert, es wird
            nichts berechnet.
          </p>
        )}
        {cancelled && !serverError && (
          <p className={styles.notice} role="status">
            Die Zahlung wurde abgebrochen – dein Warenkorb ist noch da. Du kannst es einfach erneut versuchen.
          </p>
        )}

        <div className={styles.grid}>
          <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate>
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>
                <span>01</span> Kontakt
              </legend>
              <div className={styles.fields}>
                <Field id="f-email" label="E-Mail-Adresse" error={errors.email} wide>
                  <input {...inputProps("email")} type="email" autoComplete="email" inputMode="email" required />
                </Field>
                <Field id="f-phone" label="Telefon für Rückfragen" error={errors.phone} optional wide>
                  <input {...inputProps("phone")} type="tel" autoComplete="tel" inputMode="tel" />
                </Field>
              </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>
                <span>02</span> Lieferadresse
              </legend>
              <div className={styles.fields}>
                <Field id="f-firstName" label="Vorname" error={errors.firstName}>
                  <input {...inputProps("firstName")} autoComplete="given-name" required />
                </Field>
                <Field id="f-lastName" label="Nachname" error={errors.lastName}>
                  <input {...inputProps("lastName")} autoComplete="family-name" required />
                </Field>
                <Field id="f-street" label="Straße und Hausnummer" error={errors.street} wide>
                  <input {...inputProps("street")} autoComplete="address-line1" required />
                </Field>
                <Field id="f-addressExtra" label="Adresszusatz, c/o, Packstation" error={errors.addressExtra} optional wide>
                  <input {...inputProps("addressExtra")} autoComplete="address-line2" />
                </Field>
                <Field id="f-zip" label="PLZ" error={errors.zip}>
                  <input {...inputProps("zip")} autoComplete="postal-code" inputMode="numeric" maxLength={5} required />
                </Field>
                <Field id="f-city" label="Ort" error={errors.city}>
                  <input {...inputProps("city")} autoComplete="address-level2" required />
                </Field>
                <Field id="f-country" label="Land" error={errors.country} wide>
                  <select {...inputProps("country")} autoComplete="country">
                    {SHIPPING.countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>
                <span>03</span> Versand
              </legend>
              <div className={styles.shippingOption}>
                <span className={styles.radio} aria-hidden="true" />
                <div>
                  <p className={styles.shippingTitle}>{SHIPPING.carrier} – von Hand verpackt</p>
                  <p className={styles.shippingText}>Wir verpacken deine Bestellung persönlich und geben sie selbst bei der Post auf.</p>
                </div>
                <p className={styles.shippingPrice}>{cart.shippingCents === 0 ? "kostenlos" : formatPrice(cart.shippingCents)}</p>
              </div>
              <Field id="f-note" label="Anmerkung zur Bestellung" error={errors.note} optional wide>
                <textarea {...inputProps("note")} rows={3} maxLength={400} placeholder="z. B. Geschenk – bitte ohne Rechnung beilegen" />
              </Field>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>
                <span>04</span> Zahlung
              </legend>
              <div className={styles.payment}>
                <LockIcon size={20} />
                <p>
                  Im nächsten Schritt wirst du zu unserer verschlüsselten Bezahlseite (Stripe) weitergeleitet und wählst dort deine
                  Zahlungsart.
                </p>
              </div>
              <PaymentBadges />
            </fieldset>

            <div className={`${styles.terms} ${errors.terms ? styles.invalid : ""}`}>
              <label className={styles.check}>
                <input
                  id="f-terms"
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => {
                    setTerms(e.target.checked);
                    if (e.target.checked) setErrors((prev) => ({ ...prev, terms: undefined }));
                  }}
                  aria-invalid={errors.terms ? true : undefined}
                  aria-describedby={errors.terms ? "f-terms-error" : undefined}
                />
                <span className={styles.box} aria-hidden="true" />
                <span>
                  Ich habe die{" "}
                  <Link href="/agb" target="_blank">
                    AGB
                  </Link>{" "}
                  und die{" "}
                  <Link href="/widerruf" target="_blank">
                    Widerrufsbelehrung
                  </Link>{" "}
                  gelesen und akzeptiere sie. Informationen zur Verarbeitung meiner Daten finde ich in der{" "}
                  <Link href="/datenschutz" target="_blank">
                    Datenschutzerklärung
                  </Link>
                  .
                </span>
              </label>
              {errors.terms && (
                <p id="f-terms-error" className={styles.error}>
                  {errors.terms}
                </p>
              )}
            </div>

            {serverError && (
              <p className={styles.serverError} role="alert">
                {serverError}
              </p>
            )}

            <button type="submit" className={`btn btn--gold btn--block ${styles.submit}`} disabled={submitting}>
              {submitting ? "Einen Moment …" : `Zahlungspflichtig bestellen · ${formatPrice(cart.totalCents)}`}
            </button>
            <p className={styles.after}>
              <LockIcon size={14} /> {demo ? "Demo: Es wird keine Zahlung ausgelöst." : "Weiter zur sicheren Bezahlseite von Stripe."}
            </p>
          </form>

          <aside className={styles.summary} aria-labelledby="summary-title">
            <h2 id="summary-title" className={styles.summaryTitle}>
              Deine Bestellung
            </h2>
            <ul className={styles.items} role="list">
              {cart.lines.map((line) => (
                <li key={lineKey(line)} className={styles.item}>
                  <div className={styles.itemThumb}>
                    <ProductVisual scent={line.scent} ml={line.ml} shadow={false} sizes="56px" />
                    <span className={styles.itemQty}>{line.qty}</span>
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{line.scent.name}</p>
                    <p className={styles.itemMeta}>
                      {line.ml} ml · {line.scent.line === "mrs" ? "Mrs." : "Mr."} Elixier
                    </p>
                  </div>
                  <p className={styles.itemPrice}>{formatPrice(line.totalCents)}</p>
                </li>
              ))}
            </ul>
            <dl className={styles.sums}>
              <div>
                <dt>Zwischensumme</dt>
                <dd>{formatPrice(cart.subtotalCents)}</dd>
              </div>
              <div>
                <dt>Versand</dt>
                <dd>{cart.shippingCents === 0 ? "kostenlos" : formatPrice(cart.shippingCents)}</dd>
              </div>
              <div className={styles.total}>
                <dt>Gesamt</dt>
                <dd>{formatPrice(cart.totalCents)}</dd>
              </div>
            </dl>
            <p className={styles.vat}>{SHOP.priceNote}</p>
            {cart.freeShippingGapCents > 0 && (
              <p className={styles.hint}>
                Noch {formatPrice(cart.freeShippingGapCents)} bis zum kostenlosen Versand –{" "}
                <Link href="/#kollektion">weiter stöbern</Link>
              </p>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
