"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { SPRITE, WORDMARK } from "@/components/brand/geometry";
import { mix, shade } from "@/lib/color";
import { BOTTLE_STYLE, type CapFinish, type SizeMl } from "@/lib/config";
import type { Line } from "@/lib/products";
import styles from "./Bottle.module.css";

/*
 * Platzhalter-Illustration der Flakons, bis echte Produktfotos da sind –
 * gerade von vorn gesehen wie auf einem Produktfoto: satiniertes Glas, in dem die
 * Duftfarbe weich durchscheint, massiver Glasboden, polierte Kappe mit Ring und
 * ein schlichtes Etikett mit feinem Rahmen.
 *  15 ml  – schlanker Zylinder, Kappe so breit wie das Glas
 *  50 ml  – Zylinder mit schmalerer Kappe und Ring, weißes Etikett
 *  100 ml – großer Zylinder, schwarzes Etikett mit Champagner-Schrift
 * Maße in Einheiten von 1/4 mm, damit die Größen zueinander stimmen.
 */

interface Geometry {
  w: number;
  h: number;
  cx: number;
  /** Glaskörper: Breite, Ober-/Unterkante, Eckradius, Wölbung der Unterkante */
  body: { w: number; top: number; bottom: number; r: number; curve: number };
  /** Höhe des massiven Glasbodens */
  base: number;
  /** Kappe: Breite, Oberkante und – falls zweiteilig – Fuge zum Ring darunter */
  cap: { w: number; top: number; split?: number };
  label: { w: number; top: number; h: number; frame: number; dark: boolean };
  emblem: { y: number; size: number };
  word: { y: number; h: number };
  sub?: { y: number; w: number };
  name: { y: number; size: number; maxW: number };
  info: { y: number; size: number; gap: number };
}

const GEOMETRY: Record<SizeMl, Geometry> = {
  15: {
    w: 100,
    h: 330,
    cx: 50,
    body: { w: 80, top: 93, bottom: 321, r: 3.2, curve: 1.6 },
    base: 34,
    cap: { w: 78, top: 4 },
    label: { w: 68, top: 141, h: 106, frame: 1.5, dark: false },
    emblem: { y: 150, size: 19 },
    word: { y: 174, h: 5.4 },
    name: { y: 199, size: 9.5, maxW: 54 },
    info: { y: 219, size: 2.7, gap: 15 },
  },
  50: {
    w: 176,
    h: 422,
    cx: 88,
    body: { w: 152, top: 122, bottom: 412, r: 6, curve: 3 },
    base: 44,
    cap: { w: 100, top: 3, split: 98 },
    label: { w: 117, top: 183, h: 131, frame: 2.4, dark: false },
    emblem: { y: 196, size: 31 },
    word: { y: 233, h: 9 },
    name: { y: 271, size: 17, maxW: 96 },
    info: { y: 291, size: 4.1, gap: 13 },
  },
  100: {
    w: 222,
    h: 516,
    cx: 111,
    body: { w: 192, top: 145, bottom: 504, r: 7, curve: 3.8 },
    base: 57,
    cap: { w: 112, top: 3, split: 115.4 },
    label: { w: 138, top: 223, h: 158, frame: 2.9, dark: true },
    emblem: { y: 238, size: 38 },
    word: { y: 283, h: 10.5 },
    sub: { y: 298.5, w: 42 },
    name: { y: 333, size: 18, maxW: 114 },
    info: { y: 355, size: 4.4, gap: 14 },
  },
};

type Stops = readonly (readonly [number, string])[];

/** Spiegelungen der polierten Kappe (von links nach rechts) */
const FINISH: Record<CapFinish, { cap: Stops; collar: Stops }> = {
  gold: {
    cap: [
      [0, "#6f604b"],
      [0.025, "#dccdb0"],
      [0.05, "#a8977b"],
      [0.08, "#3a2f24"],
      [0.15, "#30271d"],
      [0.19, "#615442"],
      [0.23, "#241d16"],
      [0.3, "#15110d"],
      [0.5, "#100d0a"],
      [0.575, "#2d241b"],
      [0.615, "#ccb995"],
      [0.66, "#eee2c8"],
      [0.72, "#faf2df"],
      [0.8, "#f6ecd6"],
      [0.85, "#dbc8a4"],
      [0.885, "#ad946d"],
      [0.925, "#c8af88"],
      [0.965, "#a48a64"],
      [1, "#5e4e38"],
    ],
    collar: [
      [0, "#6a5a45"],
      [0.03, "#dfd0b2"],
      [0.06, "#7c6a52"],
      [0.08, "#18120c"],
      [0.15, "#2e251c"],
      [0.19, "#a89574"],
      [0.23, "#2a221a"],
      [0.27, "#110d0a"],
      [0.55, "#1b1611"],
      [0.59, "#3a2f23"],
      [0.62, "#bead8c"],
      [0.66, "#ece0c6"],
      [0.72, "#fbf5e6"],
      [0.81, "#f8f0de"],
      [0.85, "#cfbe9e"],
      [0.885, "#8f7b5c"],
      [0.925, "#d1bd99"],
      [0.965, "#b19874"],
      [1, "#5a4b37"],
    ],
  },
  black: {
    cap: [
      [0, "#030303"],
      [0.03, "#2b2b2b"],
      [0.06, "#0e0e0e"],
      [0.15, "#4f4f4f"],
      [0.21, "#1c1c1c"],
      [0.48, "#0a0a0a"],
      [0.74, "#131313"],
      [0.84, "#3b3b3b"],
      [0.92, "#111111"],
      [1, "#020202"],
    ],
    collar: [
      [0, "#3c3c3c"],
      [0.03, "#d4d4d4"],
      [0.07, "#7a7a7a"],
      [0.12, "#2c2c2c"],
      [0.34, "#3a3a3a"],
      [0.5, "#9b9b9b"],
      [0.65, "#f1f1f1"],
      [0.77, "#c8c8c8"],
      [0.9, "#6c6c6c"],
      [1, "#262626"],
    ],
  },
};

/** Farbe des satinierten Glases */
const FROST = "#f1ece6";

const LABEL_FADE_MS = 900;

const n = (v: number) => Math.round(v * 100) / 100;

/** Umriss des Glases: gerade von vorn, runde Ecken, Unterkante leicht gewölbt */
function bodyPath({ cx, body: { w, top, bottom, r, curve } }: Geometry) {
  const l = cx - w / 2;
  const R = cx + w / 2;
  const k = r * 0.45;
  return [
    `M${n(l)},${n(top + r)}`,
    `C${n(l)},${n(top + k)} ${n(l + k)},${n(top)} ${n(l + r)},${n(top)}`,
    `L${n(R - r)},${n(top)}`,
    `C${n(R - k)},${n(top)} ${n(R)},${n(top + k)} ${n(R)},${n(top + r)}`,
    `L${n(R)},${n(bottom - r)}`,
    `C${n(R)},${n(bottom - k)} ${n(R - k)},${n(bottom)} ${n(R - r)},${n(bottom)}`,
    `A${n(w / 2 - r)},${n(curve)} 0 0 1 ${n(l + r)},${n(bottom)}`,
    `C${n(l + k)},${n(bottom)} ${n(l)},${n(bottom - k)} ${n(l)},${n(bottom - r)}Z`,
  ].join("");
}

/** Kappe: oben leicht gerundete Kanten, unten gerade */
function capPath(cx: number, w: number, top: number, bottom: number) {
  const l = cx - w / 2;
  const R = cx + w / 2;
  const r = w * 0.025;
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
  const finish = FINISH[BOTTLE_STYLE.cap];
  const ink = label.dark ? "#d9c8a0" : "#17130f";
  const title = `${line === "mrs" ? "Mrs." : "Mr."} Elixier – ${name}, ${ml} ml`;

  const left = cx - body.w / 2;
  const right = cx + body.w / 2;
  const outline = bodyPath(g);
  const bodyH = body.bottom + body.curve - body.top;
  // Beginn des massiven Glasbodens, relativ zur Höhe des Glases
  const baseAt = (body.bottom - g.base - body.top) / bodyH;
  const capBottom = cap.split ?? body.top;
  const collarTop = cap.split !== undefined ? cap.split + 1.4 : undefined;
  const capOutline = capPath(cx, cap.w, cap.top, capBottom);
  const capL = cx - cap.w / 2;
  const labelL = cx - label.w / 2;

  // Duftfarbe als CSS-Eigenschaft, damit sie beim Duftwechsel weich überblendet
  const stop = (offset: number, color: string) => <stop className={styles.stop} offset={n(offset)} style={{ stopColor: color }} />;
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
        {/* Duftfarbe: fast gleichmäßig, nach unten etwas heller */}
        <linearGradient id={id("liq")} x1="0" x2="0" y1="0" y2="1">
          {stop(0, shade(tint, -0.05))}
          {stop(0.08, tint)}
          {stop(0.6, mix(tint, FROST, 0.06))}
          {stop(baseAt, mix(tint, FROST, 0.14))}
          {stop(1, mix(tint, FROST, 0.3))}
        </linearGradient>
        {/* Mattglas zur Seite hin: die Farbe verblasst weich zum Rand (wie satiniertes Glas) */}
        <linearGradient id={id("frostX")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={FROST} stopOpacity="0.8" />
          <stop offset="0.05" stopColor={FROST} stopOpacity="0.67" />
          <stop offset="0.1" stopColor={FROST} stopOpacity="0.54" />
          <stop offset="0.2" stopColor={FROST} stopOpacity="0.32" />
          <stop offset="0.3" stopColor={FROST} stopOpacity="0.14" />
          <stop offset="0.4" stopColor={FROST} stopOpacity="0.03" />
          <stop offset="0.46" stopColor={FROST} stopOpacity="0" />
          <stop offset="0.55" stopColor={FROST} stopOpacity="0" />
          <stop offset="0.62" stopColor={FROST} stopOpacity="0.05" />
          <stop offset="0.7" stopColor={FROST} stopOpacity="0.1" />
          <stop offset="0.8" stopColor={FROST} stopOpacity="0.2" />
          <stop offset="0.9" stopColor={FROST} stopOpacity="0.4" />
          <stop offset="0.95" stopColor={FROST} stopOpacity="0.6" />
          <stop offset="1" stopColor={FROST} stopOpacity="0.84" />
        </linearGradient>
        {/* massiver Glasboden: satiniert, fast weiß */}
        <linearGradient id={id("frostY")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={FROST} stopOpacity="0.3" />
          <stop offset="0.012" stopColor={FROST} stopOpacity="0" />
          <stop offset={n(baseAt - 0.035)} stopColor={FROST} stopOpacity="0" />
          <stop offset={n(baseAt + 0.012)} stopColor={FROST} stopOpacity="0.5" />
          <stop offset={n(baseAt + 0.04)} stopColor={FROST} stopOpacity="0.8" />
          <stop offset="1" stopColor={FROST} stopOpacity="0.86" />
        </linearGradient>
        {/* Schatten des Rings auf der Schulter */}
        <radialGradient id={id("neck")}>
          <stop offset="0" stopColor="#000" stopOpacity="0.2" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("cap")} x1="0" x2="1" y1="0" y2="0">
          {stops(finish.cap)}
        </linearGradient>
        <linearGradient id={id("collar")} x1="0" x2="1" y1="0" y2="0">
          {stops(finish.collar)}
        </linearGradient>
        {/* Kappe: helle Oberkante, unten etwas dunkler */}
        <linearGradient id={id("capY")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="0.025" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="0.12" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.82" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id={id("collarY")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.5" />
          <stop offset="0.14" stopColor="#000" stopOpacity="0.1" />
          <stop offset="0.35" stopColor="#000" stopOpacity="0" />
          <stop offset="0.86" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id={id("paper")} x1="0" x2="1" y1="0" y2="0">
          {label.dark ? (
            <>
              <stop offset="0" stopColor="#050505" />
              <stop offset="0.1" stopColor="#151412" />
              <stop offset="0.4" stopColor="#201e1b" />
              <stop offset="0.75" stopColor="#151412" />
              <stop offset="1" stopColor="#060606" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#e2ddd4" />
              <stop offset="0.08" stopColor="#f5f2ec" />
              <stop offset="0.35" stopColor="#fefdfb" />
              <stop offset="0.7" stopColor="#f8f6f1" />
              <stop offset="0.94" stopColor="#ebe6dd" />
              <stop offset="1" stopColor="#dcd6cb" />
            </>
          )}
        </linearGradient>
        <linearGradient id={id("sweep")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.3" />
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
          <rect x={n(capL)} y={cap.top} width={cap.w} height={n(body.top - cap.top)} />
        </clipPath>
      </defs>

      {shadow && (
        <ellipse
          cx={cx}
          cy={n(body.bottom + body.curve * 0.6)}
          rx={n(body.w * 0.56)}
          ry={n(body.w * 0.05)}
          fill={url("shadow")}
        />
      )}

      {/* Glas mit Duftfarbe und Mattglas-Schleier */}
      <path d={outline} fill={url("liq")} />
      <path d={outline} fill={url("frostX")} />
      <path d={outline} fill={url("frostY")} />
      <ellipse cx={cx} cy={body.top} rx={n(cap.w * 0.62)} ry={n(body.w * 0.07)} fill={url("neck")} clipPath={url("body")} />
      {/* Lichtkante an Schulter und Boden */}
      <path
        d={`M${n(left + body.r)},${n(body.top + 0.7)}H${n(right - body.r)}`}
        stroke="#fff"
        strokeOpacity={0.55}
        strokeWidth={n(body.w * 0.008)}
      />
      <path
        d={`M${n(left + body.r)},${n(body.bottom - 1)}A${n(body.w / 2 - body.r)},${n(body.curve)} 0 0 0 ${n(right - body.r)},${n(body.bottom - 1)}`}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.55}
        strokeWidth={n(body.w * 0.01)}
      />
      <path d={outline} fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={n(body.w * 0.016)} clipPath={url("all")} />
      <path d={outline} fill="none" stroke="rgba(70, 55, 35, 0.28)" strokeWidth={0.6} />

      {/* Etikett */}
      <rect x={n(labelL)} y={label.top} width={label.w} height={label.h} rx={0.6} fill={url("paper")} />
      <rect
        x={n(labelL + label.frame)}
        y={n(label.top + label.frame)}
        width={n(label.w - label.frame * 2)}
        height={n(label.h - label.frame * 2)}
        fill="none"
        stroke={ink}
        strokeWidth={n(label.w * 0.0068)}
        opacity={label.dark ? 0.8 : 1}
      />
      <use
        href={`${SPRITE}#emblem`}
        x={n(cx - g.emblem.size / 2)}
        y={g.emblem.y}
        width={g.emblem.size}
        height={g.emblem.size}
        style={{ color: ink, fill: ink }}
      />
      {labels.map((item, i) => {
        const current = i === labels.length - 1;
        const wordKey = item.line === "mrs" ? "mrs" : "mr";
        const wordW = (g.word.h * WORDMARK[wordKey].w) / WORDMARK[wordKey].h;
        const size = Math.min(g.name.size, g.name.maxW / (item.name.length * 0.5));
        const fade = labels.length > 1 ? (current ? styles.labelIn : styles.labelOut) : undefined;
        return (
          <g key={item.key} className={fade}>
            <use
              href={`${SPRITE}#word-${wordKey}`}
              x={n(cx - wordW / 2)}
              y={g.word.y}
              width={n(wordW)}
              height={g.word.h}
              style={{ fill: ink }}
            />
            <text x={cx} y={g.name.y} textAnchor="middle" className={styles.name} fontSize={n(size)} fill={ink}>
              {item.name}
            </text>
          </g>
        );
      })}
      {g.sub && (
        <use
          href={`${SPRITE}#word-sub`}
          x={n(cx - g.sub.w / 2)}
          y={g.sub.y}
          width={g.sub.w}
          height={n((g.sub.w * WORDMARK.sub.h) / WORDMARK.sub.w)}
          style={{ fill: ink }}
        />
      )}
      <text x={cx} y={g.info.y} textAnchor="middle" className={styles.info} fontSize={g.info.size} fill={ink}>
        EXTRAIT DE PARFUM
      </text>
      <text x={cx} y={g.info.y + g.info.gap} textAnchor="middle" className={styles.info} fontSize={g.info.size} fill={ink}>
        {ml} ML
      </text>

      {/* Kappe und Ring */}
      <path d={capOutline} fill={url("cap")} />
      <path d={capOutline} fill={url("capY")} />
      {collarTop !== undefined && (
        <>
          <rect x={n(capL)} y={n(capBottom)} width={cap.w} height={n(collarTop - capBottom)} fill="#120d07" />
          <rect x={n(capL)} y={n(collarTop)} width={cap.w} height={n(body.top - collarTop)} fill={url("collar")} />
          <rect x={n(capL)} y={n(collarTop)} width={cap.w} height={n(body.top - collarTop)} fill={url("collarY")} />
        </>
      )}
      <path d={`M${n(capL)},${n(body.top - 0.4)}H${n(capL + cap.w)}`} stroke="#000" strokeOpacity={0.35} strokeWidth={0.8} />

      {sweep && (
        <g clipPath={url("all")}>
          <rect
            className={styles.sweep}
            x={n(-body.w * 0.6)}
            y={cap.top - 20}
            width={n(body.w * 0.5)}
            height={n(body.bottom - cap.top + 40)}
            fill={url("sweep")}
            style={{ "--sweep-x": `${g.w + body.w}px` } as CSSProperties}
          />
        </g>
      )}
    </svg>
  );
}

/** Seitenverhältnis (Breite / Höhe) je Größe – für Layouts */
export const BOTTLE_ASPECT: Record<SizeMl, number> = {
  15: GEOMETRY[15].w / GEOMETRY[15].h,
  50: GEOMETRY[50].w / GEOMETRY[50].h,
  100: GEOMETRY[100].w / GEOMETRY[100].h,
};
