import Link from "next/link";
import { Emblem } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <section
      style={{
        minHeight: "80vh",
        display: "grid",
        placeItems: "center",
        padding: "calc(var(--header-h) + 60px) var(--gutter) 80px",
        background: "var(--ink)",
        color: "var(--text-light)",
        textAlign: "center",
      }}
    >
      <div style={{ display: "grid", justifyItems: "center", gap: 18 }}>
        <Emblem className="nf-emblem" />
        <p className="eyebrow">Fehler 404</p>
        <h1 className="display" style={{ fontSize: "clamp(2.8rem, 7vw, 5rem)" }}>
          Diese Seite ist <em className="gold-text">verflogen.</em>
        </h1>
        <p className="lead" style={{ margin: "0 auto 12px" }}>
          Die gesuchte Seite gibt es nicht (mehr). Vielleicht findest du stattdessen deinen neuen Lieblingsduft?
        </p>
        <Link href="/#kollektion" className="btn btn--gold">
          Zur Kollektion
        </Link>
        <style>{`.nf-emblem{width:84px;height:84px;color:var(--gold)}`}</style>
      </div>
    </section>
  );
}
