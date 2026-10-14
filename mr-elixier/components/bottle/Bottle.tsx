"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { SPRITE, WORDMARK } from "@/components/brand/geometry";
import { CAP_GAP, FRAME, LABEL_LAYOUT, SPECS } from "@/components/bottle3d/specs";
import { mix, perfumeDepth, perfumeLiquid, shade } from "@/lib/color";
import type { SizeMl } from "@/lib/config";
import type { Line } from "@/lib/products";
import styles from "./Bottle.module.css";

/*
 * Gezeichneter Mr.-Elixier-Flakon, gerade von vorn – für Karten, Warenkorb und überall,
 * wo kein 3D-Flakon läuft, und als Platzhalter, bis der 3D-Flakon geladen ist. Gleiche Maße
 * und gleiches Etikett wie das 3D-Modell: klares Glas, Flüssigkeit in der Duftfarbe,
 * massiver Glasboden, glänzend schwarze Kappe mit Chromring.
 */

/** Zeichenfläche je Größe (Einheiten = 1/4 mm) – deckungsgleich mit dem 3D-Modell */
const VIEW = FRAME;

const U = 4;
/** leicht erhöhter Blick wie beim 3D-Flakon: Ober- und Unterkanten als flache Ellipsen */
const LIFT = Math.sin((3.2 * Math.PI) / 180);

function build(ml: SizeMl) {
  const spec = SPECS[ml];
  const view = VIEW[ml];
  const layout = LABEL_LAYOUT[ml];
  const cx = view.w / 2;
  const rx = spec.radius * U;
  const bottom = view.bottom;
  const top = bottom - spec.height * U;
  const ringTop = top - spec.cap.ring * U;
  const capBottom = spec.cap.ring > 0 ? ringTop - CAP_GAP * U : top - 0.25 * U;
  const labelTop = top + spec.label.top * U;
  const labelH = spec.label.height * U;
  const at = (fraction: number) => labelTop + fraction * labelH;
  return {
    ...view,
    cx,
    body: { rx, top, bottom, r: spec.fillet * U, curve: rx * LIFT },
    wall: spec.wall * U,
    base: spec.base * U,
    headspace: spec.headspace * U,
    cap: { rx: spec.cap.radius * U, top: capBottom - spec.cap.height * U, bottom: capBottom, ring: spec.cap.ring * U, ringTop },
    label: { w: spec.label.width * U, top: labelTop, h: labelH, frame: layout.frame * labelH, dark: spec.label.dark },
    emblem: { y: at(layout.emblem.y), size: layout.emblem.size * labelH },
    word: { y: at(layout.word.y), h: layout.word.h * labelH },
    sub: layout.sub && { y: at(layout.sub.y), w: layout.sub.w * labelH },
    name: { y: at(layout.name.y), size: layout.name.size * labelH, maxW: layout.name.maxW * labelH },
    info: { y: at(layout.info.y), size: layout.info.size * labelH },
  };
}

type Geometry = ReturnType<typeof build>;

const GEOMETRY: Record<SizeMl, Geometry> = { 15: build(15), 50: build(50), 100: build(100) };

type Stops = readonly (readonly [number, string])[];

/** glänzend schwarze Kappe und Chromring – Spiegelungen von links nach rechts */
const CAP: Stops = [
  [0, "#060606"],
  [0.03, "#2e2e2e"],
  [0.06, "#0e0e0e"],
  [0.12, "#1e1e1e"],
  [0.17, "#5c5c5c"],
  [0.21, "#8a8a8a"],
  [0.25, "#3a3a3a"],
  [0.33, "#121212"],
  [0.6, "#080808"],
  [0.78, "#121212"],
  [0.86, "#3a3a3a"],
  [0.9, "#181818"],
  [0.96, "#2a2a2a"],
  [1, "#050505"],
];

const RING: Stops = [
  [0, "#3a3a3a"],
  [0.03, "#d6d6d6"],
  [0.07, "#7c7c7c"],
  [0.12, "#2e2e2e"],
  [0.3, "#3c3c3c"],
  [0.48, "#a0a0a0"],
  [0.62, "#f4f4f4"],
  [0.74, "#cfcfcf"],
  [0.88, "#6e6e6e"],
  [0.95, "#9a9a9a"],
  [1, "#262626"],
];

const LABEL_FADE_MS = 900;

const n = (v: number) => Math.round(v * 100) / 100;

/** Umriss des Glases: runde Kanten, Unterkante als flacher Ellipsenbogen */
function bodyPath({ cx, body: { rx, top, bottom, r, curve } }: Geometry) {
  const l = cx - rx;
  const R = cx + rx;
  const k = r * 0.45;
  return [
    `M${n(l)},${n(top + r)}`,
    `C${n(l)},${n(top + k)} ${n(l + k)},${n(top)} ${n(l + r)},${n(top)}`,
    `L${n(R - r)},${n(top)}`,
    `C${n(R - k)},${n(top)} ${n(R)},${n(top + k)} ${n(R)},${n(top + r)}`,
    `L${n(R)},${n(bottom - r)}`,
    `C${n(R)},${n(bottom - k)} ${n(R - k)},${n(bottom)} ${n(R - r)},${n(bottom)}`,
    `A${n(rx - r)},${n(curve)} 0 0 1 ${n(l + r)},${n(bottom)}`,
    `C${n(l + k)},${n(bottom)} ${n(l)},${n(bottom - k)} ${n(l)},${n(bottom - r)}Z`,
  ].join("");
}

/** Flüssigkeit im Glas: oben der Spiegel, unten runde Ecken auf dem Glasboden */
function liquidPath(l: number, R: number, top: number, bottom: number, r: number) {
  const k = r * 0.45;
  return `M${n(l)},${n(top)}H${n(R)}V${n(bottom - r)}C${n(R)},${n(bottom - k)} ${n(R - k)},${n(bottom)} ${n(R - r)},${n(bottom)}H${n(l + r)}C${n(l + k)},${n(bottom)} ${n(l)},${n(bottom - k)} ${n(l)},${n(bottom - r)}Z`;
}

/** Kappe: oben runde Kante, unten gerade */
function capPath(cx: number, rx: number, top: number, bottom: number) {
  const l = cx - rx;
  const R = cx + rx;
  const r = rx * 0.11;
  const k = r * 0.45;
  return `M${n(l)},${n(bottom)}L${n(l)},${n(top + r)}C${n(l)},${n(top + k)} ${n(l + k)},${n(top)} ${n(l + r)},${n(top)}L${n(R - r)},${n(top)}C${n(R - k)},${n(top)} ${n(R)},${n(top + k)} ${n(R)},${n(top + r)}L${n(R)},${n(bottom)}Z`;
}

export interface BottleProps {
  ml: SizeMl;
  name: string;
  line: Line;
  tint: string;
  /** animierter Lichtreflex */
  sweep?: boolean;
  shadow?: boolean;
  /** rein dekorativ (z. B. Spiegelung) – für Screenreader verborgen */
  decorative?: boolean;
  className?: string;
}

export function Bottle({ ml, name, line, tint, sweep = false, shadow = true, decorative = false, className }: BottleProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const g = GEOMETRY[ml];
  const id = (part: string) => `b${uid}-${part}`;
  const url = (part: string) => `url(#${id(part)})`;

  // Wechselt Name oder Linie (z. B. im Hero), wird nur die Etikettschrift überblendet –
  // der Flakon selbst bleibt stehen und die Flüssigkeit wechselt fließend die Farbe.
  const labelKey = `${line}|${name}`;
  const [labels, setLabels] = useState([{ key: labelKey, name, line }]);
  useEffect(() => {
    setLabels((prev) => (prev[prev.length - 1].key === labelKey ? prev : [...prev.slice(-1), { key: labelKey, name, line }]));
  }, [labelKey, name, line]);
  useEffect(() => {
    if (labels.length < 2) return;
    const timer = window.setTimeout(() => setLabels((prev) => prev.slice(-1)), LABEL_FADE_MS);
    return () => window.clearTimeout(timer);
  }, [labels]);

  const { cx, body, cap, label } = g;
  const ink = label.dark ? "#dcc9a0" : "#16130f";
  const title = `${line === "mrs" ? "Mrs." : "Mr."} Elixier – ${name}, ${ml} ml`;

  const left = cx - body.rx;
  const right = cx + body.rx;
  const height = body.bottom - body.top;
  const outline = bodyPath(g);
  const liquidTop = body.top + g.headspace;
  const liquidBottom = body.bottom - g.base;
  const lr = Math.min(body.r * 1.4, body.rx * 0.25);
  const liquid = liquidPath(left + g.wall, right - g.wall, liquidTop, liquidBottom, lr);
  const surfaceRy = (body.rx - g.wall) * LIFT;
  // Parfümfarbe (Stroh bis Bernstein) und wie dicht sie wirkt
  const deep = perfumeLiquid(tint);
  const density = perfumeDepth(tint);
  const liquidAlpha = 0.12 + density * 0.2;
  const tube = Math.max(0.7, body.rx * 0.026);
  const inner = body.rx - g.wall;
  const tipY = liquidBottom - tube * 0.7;
  const reach = liquidBottom - body.top;
  const tubePath = [
    `M${n(cx)},${n(body.top + 3)}`,
    `V${n(liquidBottom - reach * 0.6)}`,
    `C${n(cx)},${n(liquidBottom - reach * 0.25)} ${n(cx + inner * 0.35)},${n(tipY)} ${n(cx + inner * 0.78)},${n(tipY)}`,
  ].join("");
  const capL = cx - cap.rx;
  const labelL = cx - label.w / 2;

  // Duftfarbe als CSS-Eigenschaft, damit sie beim Duftwechsel weich überblendet
  const stop = (offset: number, color: string, opacity?: number) => (
    <stop className={styles.stop} offset={offset} style={{ stopColor: color, stopOpacity: opacity }} />
  );
  const stops = (list: Stops) => list.map(([offset, color]) => <stop key={offset} offset={offset} stopColor={color} />);

  return (
    <svg
      viewBox={`0 0 ${g.w} ${g.h}`}
      className={[styles.bottle, className].filter(Boolean).join(" ")}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative || undefined}
      focusable="false"
    >
      <defs>
        {/* klares Glas: zum Rand hin etwas sichtbarer */}
        <linearGradient id={id("glass")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="0.05" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.95" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.3" />
        </linearGradient>
        {/* klare Flüssigkeit: satte Farbe, halb durchsichtig – zum Rand dichter */}
        <linearGradient id={id("liq")} x1="0" x2="1" y1="0" y2="0">
          {stop(0, shade(deep, -0.4), 0.85)}
          {stop(0.06, deep, liquidAlpha + 0.12)}
          {stop(0.5, deep, liquidAlpha)}
          {stop(0.94, deep, liquidAlpha + 0.12)}
          {stop(1, shade(deep, -0.4), 0.85)}
        </linearGradient>
        {/* durchscheinendes Licht: helles Band links der Mitte, rechts ein schmaler Reflex */}
        <linearGradient id={id("vol")} x1="0" x2="1" y1="0" y2="0">
          {stop(0.2, deep, 0)}
          {stop(0.31, mix(deep, "#ffffff", 0.4), 0.22)}
          {stop(0.42, deep, 0)}
          {stop(0.89, deep, 0)}
          {stop(0.925, mix(deep, "#ffffff", 0.4), 0.18)}
          {stop(0.95, deep, 0)}
        </linearGradient>
        {/* nach unten satter, am Boden bündelt sich Licht */}
        <linearGradient id={id("depth")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="0.2" stopColor="#000" stopOpacity="0" />
          <stop offset="0.85" stopColor="#000" stopOpacity="0.12" />
          <stop offset="1" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id={id("caustic")}>
          {stop(0, mix(deep, "#ffffff", 0.3), 0.4)}
          {stop(1, deep, 0)}
        </radialGradient>
        <linearGradient id={id("surface")} x1="0" x2="0" y1="0" y2="1">
          {stop(0, deep, 0.35)}
          {stop(1, deep, 0.5)}
        </linearGradient>
        {/* massiver Glasboden: spiegelt oben die Duftfarbe, wird nach unten klarer */}
        <linearGradient id={id("base")} x1="0" x2="0" y1="0" y2="1">
          {stop(0, deep, 0.12)}
          {stop(0.4, deep, 0.04)}
          <stop offset="0.85" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.14" />
        </linearGradient>
        {/* Glaswand: helle Außenkante */}
        <linearGradient id={id("edge")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.012" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="0.03" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.06" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.94" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.97" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.988" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={id("hl")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.2" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={id("cap")} x1="0" x2="1" y1="0" y2="0">
          {stops(CAP)}
        </linearGradient>
        <linearGradient id={id("ring")} x1="0" x2="1" y1="0" y2="0">
          {stops(RING)}
        </linearGradient>
        <linearGradient id={id("capY")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="0.03" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="0.12" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.85" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={id("ringY")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.45" />
          <stop offset="0.3" stopColor="#000" stopOpacity="0" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id={id("paper")} x1="0" x2="1" y1="0" y2="0">
          {label.dark ? (
            <>
              <stop offset="0" stopColor="#050505" />
              <stop offset="0.12" stopColor="#141312" />
              <stop offset="0.4" stopColor="#1c1a18" />
              <stop offset="0.8" stopColor="#121110" />
              <stop offset="1" stopColor="#050505" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#cfcac1" />
              <stop offset="0.1" stopColor="#efece6" />
              <stop offset="0.38" stopColor="#fdfcf9" />
              <stop offset="0.75" stopColor="#f5f2ec" />
              <stop offset="1" stopColor="#ccc6bc" />
            </>
          )}
        </linearGradient>
        <linearGradient id={id("sweep")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id("shadow")}>
          <stop offset="0" stopColor="#000" stopOpacity="0.42" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0.14" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id("body")}>
          <path d={outline} />
        </clipPath>
        <clipPath id={id("all")}>
          <path d={outline} />
          <rect x={n(capL)} y={n(cap.top)} width={n(cap.rx * 2)} height={n(body.top - cap.top)} />
        </clipPath>
      </defs>

      {shadow && (
        <ellipse cx={cx} cy={n(body.bottom + body.curve * 0.6)} rx={n(body.rx * 1.12)} ry={n(body.rx * 0.1)} fill={url("shadow")} />
      )}

      {/* klares Glas, massiver Boden, Flüssigkeit */}
      <path d={outline} fill={url("glass")} />
      <rect
        x={n(left)}
        y={n(liquidBottom - lr)}
        width={n(body.rx * 2)}
        height={n(body.bottom + body.curve - liquidBottom + lr)}
        fill={url("base")}
        clipPath={url("body")}
      />
      <path d={liquid} fill={url("liq")} />
      <path d={liquid} fill={url("depth")} />
      <path d={liquid} fill={url("vol")} />
      <ellipse
        cx={cx}
        cy={n(liquidBottom - lr * 0.5)}
        rx={n((body.rx - g.wall) * 0.55)}
        ry={n(body.rx * 0.16)}
        fill={url("caustic")}
      />
      {/* Steigrohr des Zerstäubers – am Boden zur Seite gebogen */}
      <path d={tubePath} fill="none" stroke="#000" strokeOpacity={0.16} strokeWidth={n(tube)} strokeLinecap="round" />
      <path d={tubePath} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={n(tube * 0.6)} strokeLinecap="round" />
      <ellipse cx={cx} cy={n(liquidTop)} rx={n(body.rx - g.wall)} ry={n(surfaceRy)} fill={url("surface")} />
      <path
        d={`M${n(left + g.wall)},${n(liquidTop)}A${n(body.rx - g.wall)},${n(surfaceRy)} 0 0 0 ${n(right - g.wall)},${n(liquidTop)}`}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.5}
        strokeWidth={n(body.rx * 0.012)}
      />
      <path
        d={`M${n(left + g.wall + lr)},${n(liquidBottom)}H${n(right - g.wall - lr)}`}
        stroke="#000"
        strokeOpacity={0.16}
        strokeWidth={n(body.rx * 0.014)}
      />
      <path
        d={`M${n(left + body.r)},${n(body.bottom - 1)}A${n(body.rx - body.r)},${n(body.curve)} 0 0 0 ${n(right - body.r)},${n(body.bottom - 1)}`}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.55}
        strokeWidth={n(body.rx * 0.02)}
      />

      {/* Glaswand, Schulter und Glanzlichter */}
      <path d={outline} fill={url("edge")} />
      <ellipse
        cx={cx}
        cy={n(body.top + body.r * 0.35)}
        rx={n(body.rx - body.r * 0.6)}
        ry={n(body.curve)}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.4}
        strokeWidth={n(body.rx * 0.012)}
      />
      <g clipPath={url("body")}>
        <rect x={n(left + body.rx * 0.17)} y={body.top} width={n(body.rx * 0.06)} height={height} rx={n(body.rx * 0.03)} fill={url("hl")} opacity={0.75} />
        <rect x={n(left + body.rx * 0.32)} y={body.top} width={n(body.rx * 0.15)} height={height} fill="#fff" opacity={0.08} />
        <rect x={n(right - body.rx * 0.22)} y={body.top} width={n(body.rx * 0.044)} height={height} fill={url("hl")} opacity={0.45} />
        <rect x={n(right - body.rx * 0.12)} y={body.top} width={n(body.rx * 0.016)} height={height} fill="#fff" opacity={0.3} />
      </g>

      {/* Etikett */}
      <rect x={n(labelL)} y={n(label.top)} width={n(label.w)} height={n(label.h)} rx={0.5} fill={url("paper")} />
      <rect
        x={n(labelL + label.frame)}
        y={n(label.top + label.frame)}
        width={n(label.w - label.frame * 2)}
        height={n(label.h - label.frame * 2)}
        fill="none"
        stroke={ink}
        strokeWidth={n(label.h * 0.0062)}
        opacity={label.dark ? 0.85 : 1}
      />
      <use
        href={`${SPRITE}#emblem`}
        x={n(cx - g.emblem.size / 2)}
        y={n(g.emblem.y)}
        width={n(g.emblem.size)}
        height={n(g.emblem.size)}
        style={{ color: ink, fill: ink }}
      />
      {labels.map((item, i) => {
        const current = i === labels.length - 1;
        const wordKey = item.line === "mrs" ? "mrs" : "mr";
        const wordW = (g.word.h * WORDMARK[wordKey].w) / WORDMARK[wordKey].h;
        const text = item.name.toUpperCase();
        const size = Math.min(g.name.size, g.name.maxW / (text.length * 0.72));
        const fade = labels.length > 1 ? (current ? styles.labelIn : styles.labelOut) : undefined;
        return (
          <g key={item.key} className={fade}>
            <use
              href={`${SPRITE}#word-${wordKey}`}
              x={n(cx - wordW / 2)}
              y={n(g.word.y)}
              width={n(wordW)}
              height={n(g.word.h)}
              style={{ fill: ink }}
            />
            <text x={cx} y={n(g.name.y)} textAnchor="middle" className={styles.name} fontSize={n(size)} fill={ink}>
              {text}
            </text>
          </g>
        );
      })}
      {g.sub && (
        <use
          href={`${SPRITE}#word-sub`}
          x={n(cx - g.sub.w / 2)}
          y={n(g.sub.y)}
          width={n(g.sub.w)}
          height={n((g.sub.w * WORDMARK.sub.h) / WORDMARK.sub.w)}
          style={{ fill: ink }}
        />
      )}
      <text x={cx} y={n(g.info.y)} textAnchor="middle" className={styles.info} fontSize={n(g.info.size)} fill={ink} opacity={0.8}>
        EXTRAIT DE PARFUM · {ml} ML
      </text>

      <path d={outline} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={n(body.rx * 0.03)} clipPath={url("body")} />
      <path d={outline} fill="none" stroke="rgba(30, 24, 18, 0.35)" strokeWidth={0.6} />

      {/* Kappe mit Chromring */}
      {cap.ring > 0 && (
        <>
          <rect x={n(capL)} y={n(cap.ringTop)} width={n(cap.rx * 2)} height={n(cap.ring)} fill={url("ring")} />
          <rect x={n(capL)} y={n(cap.ringTop)} width={n(cap.rx * 2)} height={n(cap.ring)} fill={url("ringY")} />
          <rect x={n(capL + 0.5)} y={n(cap.bottom)} width={n(cap.rx * 2 - 1)} height={n(cap.ringTop - cap.bottom)} fill="#050505" />
        </>
      )}
      <path d={capPath(cx, cap.rx, cap.top, cap.bottom)} fill={url("cap")} />
      <path d={capPath(cx, cap.rx, cap.top, cap.bottom)} fill={url("capY")} />
      <ellipse
        cx={cx}
        cy={n(cap.top + cap.rx * 0.06)}
        rx={n(cap.rx * 0.9)}
        ry={n(cap.rx * LIFT)}
        fill="#fff"
        fillOpacity={0.08}
        stroke="#fff"
        strokeOpacity={0.25}
        strokeWidth={n(cap.rx * 0.02)}
      />
      <path d={`M${n(capL)},${n(body.top - 0.4)}H${n(capL + cap.rx * 2)}`} stroke="#000" strokeOpacity={0.4} strokeWidth={0.8} />

      {sweep && (
        <g clipPath={url("all")}>
          <rect
            className={styles.sweep}
            x={n(-body.rx * 1.2)}
            y={n(cap.top - 20)}
            width={n(body.rx)}
            height={n(body.bottom - cap.top + 40)}
            fill={url("sweep")}
            style={{ "--sweep-x": `${g.w + body.rx * 2}px` } as CSSProperties}
          />
        </g>
      )}
    </svg>
  );
}

/** Seitenverhältnis (Breite / Höhe) je Größe – für Layouts */
export const BOTTLE_ASPECT: Record<SizeMl, number> = {
  15: VIEW[15].w / VIEW[15].h,
  50: VIEW[50].w / VIEW[50].h,
  100: VIEW[100].w / VIEW[100].h,
};
