"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { CloseIcon, SearchIcon } from "@/components/ui/Icons";
import { FILTER_EVENT, type AudienceFilter } from "@/lib/events";
import { FAMILIES, matchesAudience, type Family, type Scent } from "@/lib/products";
import styles from "./Collection.module.css";

const AUDIENCE_TABS: { id: AudienceFilter; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "herren", label: "Herren" },
  { id: "damen", label: "Damen" },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss");
}

function audienceFromHash(): AudienceFilter | null {
  const hash = window.location.hash.replace("#", "");
  return hash === "herren" || hash === "damen" ? hash : hash === "kollektion" ? "alle" : null;
}

export function Collection({ scents }: { scents: Scent[] }) {
  const [audience, setAudience] = useState<AudienceFilter>("alle");
  const [family, setFamily] = useState<Family | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fromHash = audienceFromHash();
    if (fromHash) setAudience(fromHash);
    const onFilter = (event: Event) => {
      setAudience((event as CustomEvent<AudienceFilter>).detail);
      setFamily(null);
      setQuery("");
    };
    const onHash = () => {
      const next = audienceFromHash();
      if (next) setAudience(next);
    };
    window.addEventListener(FILTER_EVENT, onFilter);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener(FILTER_EVENT, onFilter);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  const counts = useMemo(
    () => ({
      alle: scents.length,
      herren: scents.filter((s) => matchesAudience(s, "herren")).length,
      damen: scents.filter((s) => matchesAudience(s, "damen")).length,
    }),
    [scents],
  );

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return scents
      .filter((s) => audience === "alle" || matchesAudience(s, audience))
      .filter((s) => !family || s.families.includes(family))
      .filter((s) => {
        if (!q) return true;
        const haystack = normalize(
          [s.name, s.inspiredBy, ...s.notes.top, ...s.notes.heart, ...s.notes.base, ...s.families.map((f) => FAMILIES[f])].join(" "),
        );
        return haystack.includes(q);
      })
      .sort((a, b) => Number(!!a.soldOut) - Number(!!b.soldOut) || a.name.localeCompare(b.name, "de"));
  }, [scents, audience, family, query]);

  const filtered = audience !== "alle" || family !== null || query !== "";
  const reset = () => {
    setAudience("alle");
    setFamily(null);
    setQuery("");
  };

  return (
    <section id="kollektion" className={`section ${styles.section}`} aria-labelledby="kollektion-title">
      <span id="herren" className={styles.anchor} aria-hidden="true" />
      <span id="damen" className={styles.anchor} aria-hidden="true" />

      <div className={`container ${styles.head}`}>
        <div>
          <p className="eyebrow eyebrow--line" data-reveal>
            Die Kollektion
          </p>
          <h2 id="kollektion-title" className="h2" data-reveal>
            Finde deinen <em style={{ whiteSpace: "nowrap" }}>Signature-Duft.</em>
          </h2>
        </div>
        <p className="lead" data-reveal>
          Jeder Duft in drei Größen erhältlich: 15 ml, 50 ml und 100 ml. Filtere nach Linie, Duftfamilie oder nach deiner
          Lieblingsnote – etwa „Vanille“ oder „Oud“.
        </p>
      </div>

      <div className={styles.toolbar}>
        <div className={`container ${styles.toolbarInner}`}>
          <div className={styles.tabs} role="group" aria-label="Linie">
            {AUDIENCE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={audience === tab.id}
                className={`${styles.tab} ${audience === tab.id ? styles.tabActive : ""}`}
                onClick={() => setAudience(tab.id)}
              >
                {tab.label}
                <span className={styles.tabCount}>{counts[tab.id]}</span>
              </button>
            ))}
          </div>

          <label className={styles.search}>
            <SearchIcon size={18} />
            <span className="visually-hidden">Düfte durchsuchen</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Duft oder Note suchen …"
              autoComplete="off"
              enterKeyHint="search"
            />
            {query && (
              <button type="button" className={styles.clear} onClick={() => setQuery("")} aria-label="Suche leeren">
                <CloseIcon size={16} />
              </button>
            )}
          </label>

          <div className={styles.families} role="group" aria-label="Duftfamilie">
            {(Object.keys(FAMILIES) as Family[]).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={family === f}
                className={`${styles.chip} ${family === f ? styles.chipActive : ""}`}
                onClick={() => setFamily((cur) => (cur === f ? null : f))}
              >
                {FAMILIES[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.status} aria-live="polite">
          <span>
            {visible.length} {visible.length === 1 ? "Duft" : "Düfte"}
          </span>
          {filtered && (
            <button type="button" className={styles.reset} onClick={reset}>
              Filter zurücksetzen
            </button>
          )}
        </div>

        {visible.length > 0 ? (
          <div className={styles.grid}>
            {visible.map((scent, i) => (
              <ProductCard key={scent.slug} scent={scent} index={i} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Kein Duft gefunden.</p>
            <p>Versuche eine andere Note oder setze die Filter zurück.</p>
            <button type="button" className="btn btn--ghost" onClick={reset}>
              Alle Düfte zeigen
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
