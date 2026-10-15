import { EMBLEM, SPRITE, WORDMARK } from "./geometry";

interface BaseProps {
  className?: string;
  /** Zugänglicher Name; ohne Titel ist die Grafik dekorativ */
  title?: string;
}

function a11y(title?: string) {
  return title ? { role: "img" as const, "aria-label": title } : { "aria-hidden": true as const };
}

/** Das runde Emblem mit dem Gentleman */
export function Emblem({ className, title }: BaseProps) {
  const s = EMBLEM.size;
  return (
    <svg viewBox={`0 0 ${s} ${s}`} className={className} fill="currentColor" focusable="false" {...a11y(title)}>
      <use href={`${SPRITE}#emblem`} width={s} height={s} />
    </svg>
  );
}

/** Schriftzug MR. ELIXIER bzw. MRS. ELIXIER, optional mit PARFUMES */
export function Wordmark({ className, title, line = "mr", sub = true }: BaseProps & { line?: "mr" | "mrs"; sub?: boolean }) {
  const main = WORDMARK[line];
  const height = sub ? main.h + WORDMARK.gap + WORDMARK.sub.h : main.h;
  return (
    <svg viewBox={`0 0 ${main.w} ${height}`} className={className} fill="currentColor" focusable="false" {...a11y(title)}>
      <use href={`${SPRITE}#word-${line}`} width={main.w} height={main.h} />
      {sub && (
        <use
          href={`${SPRITE}#word-sub`}
          x={(main.w - WORDMARK.sub.w) / 2}
          y={main.h + WORDMARK.gap}
          width={WORDMARK.sub.w}
          height={WORDMARK.sub.h}
        />
      )}
    </svg>
  );
}

/** Komplettes Logo wie im Original: Emblem über dem Schriftzug */
export function Lockup({ className, title }: BaseProps) {
  const w = WORDMARK.mr.w;
  const e = 428;
  const gap = 66;
  const wordH = WORDMARK.mr.h + WORDMARK.gap + WORDMARK.sub.h;
  return (
    <svg viewBox={`0 0 ${w} ${e + gap + wordH}`} className={className} fill="currentColor" focusable="false" {...a11y(title)}>
      <use href={`${SPRITE}#emblem`} x={(w - e) / 2} width={e} height={e} />
      <use href={`${SPRITE}#word-mr`} y={e + gap} width={w} height={WORDMARK.mr.h} />
      <use
        href={`${SPRITE}#word-sub`}
        x={(w - WORDMARK.sub.w) / 2}
        y={e + gap + WORDMARK.mr.h + WORDMARK.gap}
        width={WORDMARK.sub.w}
        height={WORDMARK.sub.h}
      />
    </svg>
  );
}
