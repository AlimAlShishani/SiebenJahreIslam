"use client";

import { useId, type CSSProperties } from "react";
import { SPRITE, WORDMARK } from "@/components/brand/geometry";
import { shade } from "@/lib/color";
import type { SizeMl } from "@/lib/config";
import type { Line } from "@/lib/products";
import styles from "./Bottle.module.css";

/*
 * Platzhalter-Illustration der echten Flakons (nach den Produktfotos):
 *  15 ml  – schlanker Zylinder, weißes Etikett
 *  50 ml  – rechteckiger Flakon, schwarze Kappe, weißes Etikett mit Rahmen
 *  100 ml – großer Flakon, schwarzes Etikett mit Champagner-Schrift
 * Die Flüssigkeit trägt die Farbe des jeweiligen Duftes.
 */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

interface Geometry {
  w: number;
  h: number;
  round: boolean;
  cap: Rect;
  collar: Rect;
  body: Rect;
  liquid: Rect;
  baseTop: number;
  label: Rect;
  border: number;
  dark: boolean;
  emblem: { y: number; size: number };
  word: { y: number; h: number };
  sub?: { y: number; w: number };
  name: { y: number; size: number; maxW: number };
  info: { y: number; size: number };
  shadow: { cy: number; rx: number; ry: number };
}

const GEOMETRY: Record<SizeMl, Geometry> = {
  15: {
    w: 100,
    h: 322,
    round: true,
    cap: { x: 27, y: 8, w: 46, h: 84, r: 4 },
    collar: { x: 25.5, y: 88, w: 49, h: 8, r: 1.2 },
    body: { x: 18, y: 95, w: 64, h: 216, r: 8 },
    liquid: { x: 21.5, y: 108, w: 57, h: 182, r: 4.5 },
    baseTop: 290,
    label: { x: 20.5, y: 142, w: 59, h: 76, r: 0.6 },
    border: 0,
    dark: false,
    emblem: { y: 148, size: 22 },
    word: { y: 175, h: 5.9 },
    name: { y: 192, size: 4.6, maxW: 48 },
    info: { y: 206, size: 2.45 },
    shadow: { cy: 313, rx: 36, ry: 4 },
  },
  50: {
    w: 200,
    h: 412,
    round: false,
    cap: { x: 42, y: 6, w: 116, h: 94, r: 5 },
    collar: { x: 40, y: 94, w: 120, h: 11, r: 1.5 },
    body: { x: 20, y: 104, w: 160, h: 298, r: 10 },
    liquid: { x: 26.5, y: 117, w: 147, h: 241, r: 5 },
    baseTop: 358,
    label: { x: 39, y: 164, w: 122, h: 130, r: 0.8 },
    border: 3.6,
    dark: false,
    emblem: { y: 176, size: 46 },
    word: { y: 231, h: 12.2 },
    name: { y: 262, size: 8.2, maxW: 100 },
    info: { y: 281, size: 4.3 },
    shadow: { cy: 404, rx: 80, ry: 5 },
  },
  100: {
    w: 240,
    h: 452,
    round: false,
    cap: { x: 62, y: 6, w: 116, h: 94, r: 5 },
    collar: { x: 60, y: 94, w: 120, h: 11, r: 1.5 },
    body: { x: 12, y: 104, w: 216, h: 338, r: 12 },
    liquid: { x: 19.5, y: 119, w: 201, h: 272, r: 6 },
    baseTop: 391,
    label: { x: 49, y: 168, w: 142, h: 156, r: 1 },
    border: 4.2,
    dark: true,
    emblem: { y: 184, size: 48 },
    word: { y: 242, h: 12.6 },
    sub: { y: 260, w: 46 },
    name: { y: 288, size: 8, maxW: 112 },
    info: { y: 306, size: 4.1 },
    shadow: { cy: 444, rx: 108, ry: 5.5 },
  },
};

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

  const ink = g.dark ? "#ddd0b3" : "#16130f";
  const wordKey = line === "mrs" ? "mrs" : "mr";
  const wordW = (g.word.h * WORDMARK[wordKey].w) / WORDMARK[wordKey].h;
  const cx = g.w / 2;
  const nameText = name.toUpperCase();
  const nameSize = Math.min(g.name.size, g.name.maxW / (nameText.length * 0.68));
  const title = `${line === "mrs" ? "Mrs." : "Mr."} Elixier – ${name}, ${ml} ml`;

  const { body, liquid, label, cap, collar } = g;
  const rect = (r: Rect) => ({ x: r.x, y: r.y, width: r.w, height: r.h, rx: r.r });

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
          <stop offset="0" stopColor="#060606" />
          <stop offset="0.1" stopColor="#1d1d1d" />
          <stop offset="0.2" stopColor="#4d4d4d" />
          <stop offset="0.28" stopColor="#1f1f1f" />
          <stop offset="0.55" stopColor="#0b0b0b" />
          <stop offset="0.8" stopColor="#1b1b1b" />
          <stop offset="0.87" stopColor="#3d3d3d" />
          <stop offset="0.94" stopColor="#131313" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <linearGradient id={id("collar")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3a3a3a" />
          <stop offset="0.25" stopColor="#121212" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <linearGradient id={id("glass")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.05" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="0.95" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.42" />
        </linearGradient>
        <linearGradient id={id("liq")} x1="0" x2="0" y1="0" y2="1">
          <stop className={styles.stop} offset="0" style={{ stopColor: shade(tint, 0.36) }} />
          <stop className={styles.stop} offset="0.12" style={{ stopColor: shade(tint, 0.12) }} />
          <stop className={styles.stop} offset="0.55" style={{ stopColor: tint }} />
          <stop className={styles.stop} offset="0.9" style={{ stopColor: shade(tint, -0.2) }} />
          <stop className={styles.stop} offset="1" style={{ stopColor: shade(tint, 0.12) }} />
        </linearGradient>
        <linearGradient id={id("vol")} x1="0" x2="1" y1="0" y2="0">
          {g.round ? (
            <>
              <stop offset="0" stopColor="#000" stopOpacity="0.42" />
              <stop offset="0.18" stopColor="#000" stopOpacity="0.06" />
              <stop offset="0.38" stopColor="#fff" stopOpacity="0.2" />
              <stop offset="0.6" stopColor="#fff" stopOpacity="0.04" />
              <stop offset="0.86" stopColor="#000" stopOpacity="0.14" />
              <stop offset="1" stopColor="#000" stopOpacity="0.45" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#000" stopOpacity="0.3" />
              <stop offset="0.08" stopColor="#000" stopOpacity="0.07" />
              <stop offset="0.42" stopColor="#fff" stopOpacity="0.12" />
              <stop offset="0.58" stopColor="#fff" stopOpacity="0.06" />
              <stop offset="0.92" stopColor="#000" stopOpacity="0.1" />
              <stop offset="1" stopColor="#000" stopOpacity="0.34" />
            </>
          )}
        </linearGradient>
        <linearGradient id={id("base")} x1="0" x2="0" y1="0" y2="1">
          <stop className={styles.stop} offset="0" style={{ stopColor: tint }} stopOpacity="0.55" />
          <stop className={styles.stop} offset="0.35" style={{ stopColor: tint }} stopOpacity="0.16" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.38" />
        </linearGradient>
        <linearGradient id={id("paper")} x1="0" x2="1" y1="0" y2="0">
          {g.dark ? (
            <>
              <stop offset="0" stopColor="#0c0b0a" />
              <stop offset="0.45" stopColor="#1c1a17" />
              <stop offset="1" stopColor="#0d0c0b" />
            </>
          ) : g.round ? (
            <>
              <stop offset="0" stopColor="#d9d3c8" />
              <stop offset="0.3" stopColor="#fbfaf6" />
              <stop offset="0.55" stopColor="#fdfcf9" />
              <stop offset="1" stopColor="#d6cfc3" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#f1ede5" />
              <stop offset="0.5" stopColor="#fdfcf9" />
              <stop offset="1" stopColor="#efeae1" />
            </>
          )}
        </linearGradient>
        <linearGradient id={id("hl")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={id("caphl")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.32" />
        </linearGradient>
        <radialGradient id={id("glow")} cx="0.36" cy="0.26" r="0.78">
          <stop offset="0" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("sweep")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id("shadow")}>
          <stop offset="0" stopColor="#000" stopOpacity="0.42" />
          <stop offset="0.6" stopColor="#000" stopOpacity="0.14" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id("clip")}>
          <rect {...rect(body)} />
        </clipPath>
      </defs>

      {shadow && <ellipse cx={cx} cy={g.shadow.cy} rx={g.shadow.rx} ry={g.shadow.ry} fill={url("shadow")} />}

      {/* Kappe */}
      <rect {...rect(cap)} fill={url("cap")} />
      <rect x={cap.x + 2} y={cap.y + 1} width={cap.w - 4} height={1.6} rx={0.8} fill="#fff" opacity={0.28} />
      <rect x={cap.x + cap.w * 0.16} y={cap.y + 3} width={cap.w * 0.075} height={cap.h - 7} rx={1} fill={url("caphl")} opacity={0.5} />
      <rect x={cap.x + cap.w * 0.85} y={cap.y + 4} width={cap.w * 0.03} height={cap.h - 9} rx={1} fill={url("caphl")} opacity={0.32} />
      <rect {...rect(collar)} fill={url("collar")} />
      <rect x={collar.x + 1} y={collar.y + 0.6} width={collar.w - 2} height={0.8} fill="#fff" opacity={0.3} />

      {/* Glaskörper */}
      <rect {...rect(body)} fill="rgba(206, 211, 208, 0.22)" />
      <rect {...rect(body)} fill={url("glass")} />

      {/* Flüssigkeit */}
      <rect {...rect(liquid)} fill={url("liq")} />
      <rect {...rect(liquid)} fill={url("vol")} />
      <rect {...rect(liquid)} fill={url("glow")} />
      <rect x={liquid.x + 1} y={liquid.y} width={liquid.w - 2} height={2.2} rx={1} fill="#fff" opacity={0.4} />

      {/* massiver Glasboden */}
      <rect
        x={body.x + 2}
        y={g.baseTop}
        width={body.w - 4}
        height={body.y + body.h - g.baseTop - 2}
        rx={body.r - 2}
        fill={url("base")}
      />
      <rect x={liquid.x + 2} y={g.baseTop - 0.5} width={liquid.w - 4} height={1} fill="#000" opacity={0.18} />

      {/* Etikett */}
      <rect {...rect(label)} fill={url("paper")} />
      {g.border > 0 && (
        <rect
          x={label.x + g.border}
          y={label.y + g.border}
          width={label.w - g.border * 2}
          height={label.h - g.border * 2}
          fill="none"
          stroke={ink}
          strokeWidth={g.dark ? 0.7 : 0.9}
          opacity={g.dark ? 0.85 : 1}
        />
      )}
      <use
        href={`${SPRITE}#emblem`}
        x={cx - g.emblem.size / 2}
        y={g.emblem.y}
        width={g.emblem.size}
        height={g.emblem.size}
        style={{ color: ink, fill: ink }}
      />
      <use
        href={`${SPRITE}#word-${wordKey}`}
        x={cx - wordW / 2}
        y={g.word.y}
        width={wordW}
        height={g.word.h}
        style={{ fill: ink }}
      />
      {g.sub && (
        <use
          href={`${SPRITE}#word-sub`}
          x={cx - g.sub.w / 2}
          y={g.sub.y}
          width={g.sub.w}
          height={(g.sub.w * WORDMARK.sub.h) / WORDMARK.sub.w}
          style={{ fill: ink }}
        />
      )}
      <text x={cx} y={g.name.y} textAnchor="middle" className={styles.name} fontSize={nameSize} fill={ink}>
        {nameText}
      </text>
      <text x={cx} y={g.info.y} textAnchor="middle" className={styles.info} fontSize={g.info.size} fill={ink} opacity={0.7}>
        EXTRAIT DE PARFUM · {ml} ML
      </text>
      {g.round && <rect {...rect(label)} fill={url("vol")} opacity={0.35} />}

      {/* Lichtreflexe */}
      <rect x={body.x + 3} y={body.y + 6} width={g.round ? 3.4 : 4.6} height={body.h - 14} rx={2} fill={url("hl")} opacity={0.75} />
      <rect x={body.x + body.w - 6} y={body.y + 8} width={1.8} height={body.h - 18} rx={0.9} fill="#fff" opacity={0.28} />
      <rect x={body.x + 1} y={body.y + body.h - 3} width={body.w - 2} height={1.4} rx={0.7} fill="#fff" opacity={0.5} />
      {sweep && (
        <g clipPath={url("clip")}>
          <rect
            className={styles.sweep}
            x={-70}
            y={body.y - 20}
            width={g.round ? 26 : 46}
            height={body.h + 40}
            fill={url("sweep")}
            style={{ "--sweep-x": `${g.w + 150}px` } as CSSProperties}
          />
        </g>
      )}
      <rect {...rect(body)} fill="none" stroke="rgba(70, 60, 50, 0.32)" strokeWidth={0.7} />
      <rect
        x={body.x + 0.9}
        y={body.y + 0.9}
        width={body.w - 1.8}
        height={body.h - 1.8}
        rx={body.r - 0.9}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.3}
        strokeWidth={0.6}
      />
    </svg>
  );
}

/** Seitenverhältnis (Breite / Höhe) je Größe – für Layouts */
export const BOTTLE_ASPECT: Record<SizeMl, number> = {
  15: GEOMETRY[15].w / GEOMETRY[15].h,
  50: GEOMETRY[50].w / GEOMETRY[50].h,
  100: GEOMETRY[100].w / GEOMETRY[100].h,
};
