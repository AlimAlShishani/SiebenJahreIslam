"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { SPRITE, WORDMARK } from "@/components/brand/geometry";
import { shade } from "@/lib/color";
import type { SizeMl } from "@/lib/config";
import type { Line } from "@/lib/products";
import styles from "./Bottle.module.css";

/*
 * Platzhalter-Illustration der echten, runden Flakons (nach den Produktfotos),
 * in leichter Aufsicht: Kappe, Schulter, Flüssigkeitsoberfläche und Boden
 * erscheinen als Ellipsen, das Etikett folgt der Wölbung des Glases.
 *  15 ml  – schlanker Zylinder, weißes Etikett
 *  50 ml  – runder Flakon, schwarze Kappe, weißes Etikett mit Rahmen
 *  100 ml – großer runder Flakon, schwarzes Etikett mit Champagner-Schrift
 */

interface Geometry {
  w: number;
  h: number;
  cx: number;
  /** Glaskörper: Radius, Mitte der oberen/unteren Ellipse, Ellipsenhöhe, Schulterrundung */
  body: { rx: number; top: number; bottom: number; ry: number; r: number };
  wall: number;
  base: number;
  liquidTop: number;
  cap: { rx: number; top: number; bottom: number; ry: number };
  label: { w: number; top: number; h: number; border: number; dark: boolean };
  emblem: { y: number; size: number };
  word: { y: number; h: number };
  sub?: { y: number; w: number };
  name: { y: number; size: number; maxW: number };
  info: { y: number; size: number };
}

const GEOMETRY: Record<SizeMl, Geometry> = {
  15: {
    w: 100,
    h: 330,
    cx: 50,
    body: { rx: 31, top: 100, bottom: 314, ry: 4.4, r: 6 },
    wall: 3,
    base: 16,
    liquidTop: 112,
    cap: { rx: 22.5, top: 16, bottom: 102, ry: 3.3 },
    label: { w: 50, top: 150, h: 74, border: 0, dark: false },
    emblem: { y: 156, size: 20 },
    word: { y: 181, h: 5.4 },
    name: { y: 197, size: 4.4, maxW: 42 },
    info: { y: 210, size: 2.4 },
  },
  50: {
    w: 200,
    h: 412,
    cx: 100,
    body: { rx: 76, top: 106, bottom: 390, ry: 9, r: 12 },
    wall: 5,
    base: 34,
    liquidTop: 124,
    cap: { rx: 55, top: 16, bottom: 110, ry: 6.6 },
    label: { w: 112, top: 160, h: 126, border: 3.6, dark: false },
    emblem: { y: 170, size: 44 },
    word: { y: 223, h: 11.6 },
    name: { y: 252, size: 8, maxW: 92 },
    info: { y: 271, size: 4.1 },
  },
  100: {
    w: 240,
    h: 452,
    cx: 120,
    body: { rx: 104, top: 106, bottom: 422, ry: 12, r: 14 },
    wall: 6,
    base: 40,
    liquidTop: 124,
    cap: { rx: 56, top: 17, bottom: 111, ry: 6.6 },
    label: { w: 140, top: 164, h: 156, border: 4.2, dark: true },
    emblem: { y: 180, size: 46 },
    word: { y: 236, h: 12.4 },
    sub: { y: 254, w: 46 },
    name: { y: 282, size: 7.8, maxW: 112 },
    info: { y: 300, size: 4 },
  },
};

const LABEL_FADE_MS = 900;

const n = (v: number) => Math.round(v * 100) / 100;

/** Umriss des Glases: abgerundete Schulter, Ober- und Unterkante als Ellipsenbogen */
function bodyPath({ cx, body: { rx, top: t, bottom: b, ry, r } }: Geometry) {
  const l = cx - rx;
  const R = cx + rx;
  return [
    `M${n(l)},${n(t + r)}`,
    `C${n(l)},${n(t + r * 0.4)} ${n(l + r * 0.4)},${n(t)} ${n(l + r)},${n(t)}`,
    `A${rx},${ry} 0 0 1 ${n(R - r)},${n(t)}`,
    `C${n(R - r * 0.4)},${n(t)} ${n(R)},${n(t + r * 0.4)} ${n(R)},${n(t + r)}`,
    `L${n(R)},${n(b)}`,
    `A${rx},${ry} 0 0 1 ${n(l)},${n(b)}Z`,
  ].join("");
}

/** Zylinder zwischen zwei Höhen (vorne unten gewölbt, oben die hintere Ellipsenhälfte) */
function cylinderPath(cx: number, rx: number, ry: number, top: number, bottom: number) {
  const l = n(cx - rx);
  const R = n(cx + rx);
  return `M${l},${n(top)}L${l},${n(bottom)}A${n(rx)},${n(ry)} 0 0 0 ${R},${n(bottom)}L${R},${n(top)}A${n(rx)},${n(ry)} 0 0 0 ${l},${n(top)}Z`;
}

/** Etikett: Ober- und Unterkante folgen der Wölbung des Zylinders */
function labelPath(g: Geometry, inset = 0) {
  const { cx, body, label } = g;
  const hw = label.w / 2 - inset;
  const sag = body.ry * (1 - Math.sqrt(Math.max(0, 1 - (hw / body.rx) ** 2)));
  const t = label.top + inset;
  const b = label.top + label.h - inset;
  return `M${n(cx - hw)},${n(t)}Q${cx},${n(t + 2 * sag)} ${n(cx + hw)},${n(t)}L${n(cx + hw)},${n(b)}Q${cx},${n(b + 2 * sag)} ${n(cx - hw)},${n(b)}Z`;
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
  const ink = label.dark ? "#ddd0b3" : "#16130f";
  const title = `${line === "mrs" ? "Mrs." : "Mr."} Elixier – ${name}, ${ml} ml`;

  const left = cx - body.rx;
  const right = cx + body.rx;
  const rl = body.rx - g.wall;
  const ryl = (body.ry * rl) / body.rx;
  const liquidBottom = body.bottom - g.base;
  const liquid = cylinderPath(cx, rl, ryl, g.liquidTop, liquidBottom);
  const shoulderRx = body.rx - body.r;
  const shoulderCy = body.top + body.ry * Math.sqrt(1 - (shoulderRx / body.rx) ** 2);
  const capL = cx - cap.rx;
  const capPath = cylinderPath(cx, cap.rx, cap.ry, cap.top, cap.bottom);
  const outline = bodyPath(g);
  const stop = (offset: number, color: string, opacity?: number) => (
    <stop className={styles.stop} offset={offset} style={{ stopColor: color, stopOpacity: opacity }} />
  );

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
        <linearGradient id={id("cap")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#020202" />
          <stop offset="0.07" stopColor="#1b1b1b" />
          <stop offset="0.16" stopColor="#5e5e5e" />
          <stop offset="0.22" stopColor="#262626" />
          <stop offset="0.48" stopColor="#0c0c0c" />
          <stop offset="0.76" stopColor="#141414" />
          <stop offset="0.85" stopColor="#404040" />
          <stop offset="0.92" stopColor="#151515" />
          <stop offset="1" stopColor="#020202" />
        </linearGradient>
        <linearGradient id={id("capTop")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#474747" />
          <stop offset="1" stopColor="#0d0d0d" />
        </linearGradient>
        <linearGradient id={id("edge")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.62" />
          <stop offset="0.035" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.12" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.88" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.965" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={id("liq")} x1="0" x2="0" y1="0" y2="1">
          {stop(0, shade(tint, 0.3))}
          {stop(0.18, shade(tint, 0.06))}
          {stop(0.62, tint)}
          {stop(1, shade(tint, -0.22))}
        </linearGradient>
        <linearGradient id={id("vol")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.5" />
          <stop offset="0.07" stopColor="#000" stopOpacity="0.22" />
          <stop offset="0.2" stopColor="#000" stopOpacity="0.02" />
          <stop offset="0.32" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.46" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.72" stopColor="#000" stopOpacity="0.03" />
          <stop offset="0.9" stopColor="#000" stopOpacity="0.2" />
          <stop offset="1" stopColor="#000" stopOpacity="0.52" />
        </linearGradient>
        <radialGradient id={id("glow")} cx="0.38" cy="0.32" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("surface")} x1="0" x2="0" y1="0" y2="1">
          {stop(0, shade(tint, 0.5))}
          {stop(0.55, shade(tint, 0.24))}
          {stop(1, shade(tint, 0.04))}
        </linearGradient>
        <linearGradient id={id("base")} x1="0" x2="0" y1="0" y2="1">
          {stop(0, tint, 0.55)}
          {stop(0.4, tint, 0.18)}
          <stop offset="0.85" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={id("paper")} x1="0" x2="1" y1="0" y2="0">
          {label.dark ? (
            <>
              <stop offset="0" stopColor="#030303" />
              <stop offset="0.38" stopColor="#1f1d1a" />
              <stop offset="0.6" stopColor="#151412" />
              <stop offset="1" stopColor="#040404" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#d3ccbf" />
              <stop offset="0.14" stopColor="#f2eee6" />
              <stop offset="0.4" stopColor="#fefdfb" />
              <stop offset="0.72" stopColor="#f5f1ea" />
              <stop offset="1" stopColor="#cfc7ba" />
            </>
          )}
        </linearGradient>
        <linearGradient id={id("hl")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="0.25" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id={id("sweep")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id("shadow")}>
          <stop offset="0" stopColor="#000" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="#000" stopOpacity="0.14" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id("clip")}>
          <path d={outline} />
        </clipPath>
        <clipPath id={id("capClip")}>
          <path d={capPath} />
        </clipPath>
      </defs>

      {shadow && (
        <ellipse cx={cx} cy={n(body.bottom + body.ry * 0.9)} rx={n(body.rx * 1.12)} ry={n(body.ry * 1.5)} fill={url("shadow")} />
      )}

      {/* Glas (Rückwand) */}
      <path d={outline} fill="rgba(214, 220, 217, 0.16)" />

      {/* Flüssigkeit mit Rundung, Lichtschein und Oberfläche */}
      <path d={liquid} fill={url("liq")} />
      <path d={liquid} fill={url("vol")} />
      <path d={liquid} fill={url("glow")} />
      <ellipse cx={cx} cy={g.liquidTop} rx={rl} ry={n(ryl)} fill={url("surface")} />
      <path
        d={`M${n(cx - rl)},${g.liquidTop}A${rl},${n(ryl)} 0 0 1 ${n(cx + rl)},${g.liquidTop}`}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.4}
        strokeWidth={0.7}
      />
      <path
        d={`M${n(cx - rl)},${liquidBottom}A${rl},${n(ryl)} 0 0 0 ${n(cx + rl)},${liquidBottom}`}
        fill="none"
        stroke="#000"
        strokeOpacity={0.2}
        strokeWidth={0.9}
      />

      {/* massiver Glasboden */}
      <path
        d={`M${n(left)},${liquidBottom}L${n(left)},${body.bottom}A${body.rx},${body.ry} 0 0 0 ${n(right)},${body.bottom}L${n(right)},${liquidBottom}A${body.rx},${body.ry} 0 0 1 ${n(left)},${liquidBottom}Z`}
        fill={url("base")}
        clipPath={url("clip")}
      />
      <path
        d={`M${n(left + body.rx * 0.2)},${n(body.bottom - g.base * 0.3)}A${n(body.rx * 0.8)},${n(body.ry * 0.8)} 0 0 0 ${n(right - body.rx * 0.2)},${n(body.bottom - g.base * 0.3)}`}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.3}
        strokeWidth={0.9}
      />

      {/* Glas (Vorderseite): Kanten, Schulter, Glanzlichter */}
      <path d={outline} fill={url("edge")} />
      <ellipse
        cx={cx}
        cy={n(shoulderCy)}
        rx={shoulderRx}
        ry={n((body.ry * shoulderRx) / body.rx)}
        fill="#fff"
        fillOpacity={0.08}
        stroke="#fff"
        strokeOpacity={0.45}
        strokeWidth={0.8}
      />
      <g clipPath={url("clip")}>
        <rect
          x={n(left + body.rx * 0.15)}
          y={body.top}
          width={n(body.rx * 0.075)}
          height={body.bottom - body.top}
          rx={n(body.rx * 0.04)}
          fill={url("hl")}
          opacity={0.75}
        />
        <rect x={n(left + body.rx * 0.32)} y={body.top} width={n(body.rx * 0.022)} height={body.bottom - body.top} fill="#fff" opacity={0.28} />
        <rect x={n(right - body.rx * 0.22)} y={body.top} width={n(body.rx * 0.04)} height={body.bottom - body.top} fill={url("hl")} opacity={0.35} />
      </g>
      <path
        d={`M${n(left + 2)},${body.bottom}A${body.rx - 2},${body.ry} 0 0 0 ${n(right - 2)},${body.bottom}`}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.6}
        strokeWidth={1.3}
      />

      {/* Etikett (folgt der Rundung) */}
      <path d={labelPath(g)} fill={url("paper")} />
      {label.border > 0 && (
        <path d={labelPath(g, label.border)} fill="none" stroke={ink} strokeWidth={label.dark ? 0.7 : 0.85} opacity={label.dark ? 0.85 : 1} />
      )}
      <use
        href={`${SPRITE}#emblem`}
        x={cx - g.emblem.size / 2}
        y={g.emblem.y}
        width={g.emblem.size}
        height={g.emblem.size}
        style={{ color: ink, fill: ink }}
      />
      {labels.map((item, i) => {
        const current = i === labels.length - 1;
        const wordKey = item.line === "mrs" ? "mrs" : "mr";
        const wordW = (g.word.h * WORDMARK[wordKey].w) / WORDMARK[wordKey].h;
        const text = item.name.toUpperCase();
        const size = Math.min(g.name.size, g.name.maxW / (text.length * 0.68));
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
              {text}
            </text>
          </g>
        );
      })}
      {g.sub && (
        <use
          href={`${SPRITE}#word-sub`}
          x={cx - g.sub.w / 2}
          y={g.sub.y}
          width={g.sub.w}
          height={n((g.sub.w * WORDMARK.sub.h) / WORDMARK.sub.w)}
          style={{ fill: ink }}
        />
      )}
      <text x={cx} y={g.info.y} textAnchor="middle" className={styles.info} fontSize={g.info.size} fill={ink} opacity={0.7}>
        EXTRAIT DE PARFUM · {ml} ML
      </text>

      {sweep && (
        <g clipPath={url("clip")}>
          <rect
            className={styles.sweep}
            x={-70}
            y={body.top - 20}
            width={n(body.rx * 0.55)}
            height={body.bottom - body.top + 40}
            fill={url("sweep")}
            style={{ "--sweep-x": `${g.w + 150}px` } as CSSProperties}
          />
        </g>
      )}
      <path d={outline} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={2} clipPath={url("clip")} />
      <path d={outline} fill="none" stroke="rgba(60, 50, 40, 0.3)" strokeWidth={0.7} />

      {/* Kappe: glänzender schwarzer Zylinder */}
      <path d={capPath} fill={url("cap")} />
      <g clipPath={url("capClip")}>
        <rect
          x={n(capL + cap.rx * 0.2)}
          y={cap.top}
          width={n(cap.rx * 0.1)}
          height={cap.bottom - cap.top + cap.ry}
          fill={url("hl")}
          opacity={0.5}
        />
        <rect
          x={n(capL + cap.rx * 0.42)}
          y={cap.top}
          width={n(cap.rx * 0.025)}
          height={cap.bottom - cap.top + cap.ry}
          fill="#fff"
          opacity={0.18}
        />
        <rect
          x={n(capL + cap.rx * 1.66)}
          y={cap.top}
          width={n(cap.rx * 0.05)}
          height={cap.bottom - cap.top + cap.ry}
          fill="#fff"
          opacity={0.2}
        />
      </g>
      <path
        d={`M${n(capL)},${n(cap.bottom - 6)}A${cap.rx},${cap.ry} 0 0 0 ${n(capL + cap.rx * 2)},${n(cap.bottom - 6)}`}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.22}
        strokeWidth={0.9}
      />
      <ellipse cx={cx} cy={cap.top} rx={cap.rx} ry={cap.ry} fill={url("capTop")} stroke="#fff" strokeOpacity={0.2} strokeWidth={0.6} />
    </svg>
  );
}

/** Seitenverhältnis (Breite / Höhe) je Größe – für Layouts */
export const BOTTLE_ASPECT: Record<SizeMl, number> = {
  15: GEOMETRY[15].w / GEOMETRY[15].h,
  50: GEOMETRY[50].w / GEOMETRY[50].h,
  100: GEOMETRY[100].w / GEOMETRY[100].h,
};
