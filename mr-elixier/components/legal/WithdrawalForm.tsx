"use client";

import { useState } from "react";
import styles from "./WithdrawalForm.module.css";

type Values = { name: string; email: string; orderNumber: string; orderDate: string; items: string; message: string };
const EMPTY: Values = { name: "", email: "", orderNumber: "", orderDate: "", items: "", message: "" };

/** „Vertrag hier widerrufen“ – elektronische Widerrufsfunktion für Online-Bestellungen. */
export function WithdrawalForm() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Values>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [result, setResult] = useState<{ receivedAt: string; emailSent: boolean } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const bind = (name: keyof Values) => ({
    id: `w-${name}`,
    value: values[name],
    onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [name]: e.target.value })),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `w-${name}-error` : undefined,
    className: styles.input,
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    setServerError(null);
    try {
      const response = await fetch("/api/widerruf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.ok) {
        setResult({ receivedAt: data.receivedAt, emailSent: data.emailSent });
        setStatus("done");
        return;
      }
      setErrors(data.errors ?? {});
      setServerError(data.error ?? (data.errors ? "Bitte prüfe deine Angaben." : "Etwas ist schiefgelaufen."));
    } catch {
      setServerError("Die Verbindung ist fehlgeschlagen. Bitte versuche es erneut.");
    }
    setStatus("idle");
  };

  if (status === "done" && result) {
    const date = new Date(result.receivedAt).toLocaleString("de-DE", { dateStyle: "long", timeStyle: "short" });
    return (
      <div className={styles.box} role="status">
        <p className={styles.title}>Dein Widerruf ist eingegangen.</p>
        <p>
          Eingang: {date} Uhr · Bestellung {values.orderNumber.trim().toUpperCase()}.{" "}
          {result.emailSent
            ? "Eine Eingangsbestätigung haben wir an die E-Mail-Adresse deiner Bestellung gesendet."
            : "Wir ordnen deinen Widerruf deiner Bestellung zu und senden dir die Eingangsbestätigung per E-Mail."}
        </p>
      </div>
    );
  }

  return (
    <div id="widerrufen" className={styles.box}>
      <p className={styles.title}>Vertrag hier widerrufen</p>
      <p className={styles.text}>Du möchtest deine Bestellung widerrufen? Das geht direkt hier – ohne Begründung.</p>
      {!open ? (
        <button type="button" className="btn btn--dark" onClick={() => setOpen(true)}>
          Vertrag widerrufen
        </button>
      ) : (
        <form className={styles.form} onSubmit={submit} noValidate>
          <div className={styles.field}>
            <label htmlFor="w-name">Name</label>
            <input {...bind("name")} autoComplete="name" required />
            {errors.name && <p id="w-name-error" className={styles.error}>{errors.name}</p>}
          </div>
          <div className={styles.field}>
            <label htmlFor="w-email">E-Mail für die Eingangsbestätigung</label>
            <input {...bind("email")} type="email" autoComplete="email" required />
            {errors.email && <p id="w-email-error" className={styles.error}>{errors.email}</p>}
          </div>
          <div className={styles.field}>
            <label htmlFor="w-orderNumber">Bestellnummer</label>
            <input {...bind("orderNumber")} placeholder="ME-…" required />
            {errors.orderNumber && <p id="w-orderNumber-error" className={styles.error}>{errors.orderNumber}</p>}
          </div>
          <div className={styles.field}>
            <label htmlFor="w-orderDate">
              Bestellt bzw. erhalten am <span>(optional)</span>
            </label>
            <input {...bind("orderDate")} placeholder="TT.MM.JJJJ" />
          </div>
          <div className={`${styles.field} ${styles.wide}`}>
            <label htmlFor="w-items">
              Betroffene Artikel <span>(optional – leer = gesamte Bestellung)</span>
            </label>
            <input {...bind("items")} />
          </div>
          <div className={`${styles.field} ${styles.wide}`}>
            <label htmlFor="w-message">
              Nachricht <span>(optional)</span>
            </label>
            <textarea {...bind("message")} rows={3} />
          </div>
          {serverError && (
            <p className={styles.serverError} role="alert">
              {serverError}
            </p>
          )}
          <button type="submit" className={`btn btn--dark ${styles.wide}`} disabled={status === "sending"}>
            {status === "sending" ? "Wird übermittelt …" : "Widerruf bestätigen"}
          </button>
        </form>
      )}
    </div>
  );
}
