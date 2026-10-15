"use client";

import { useId } from "react";
import { SPRITE, WORDMARK } from "@/components/brand/geometry";
import type { Scent } from "@/lib/products";
import { ProductVisual } from "./ProductVisual";
import styles from "./Packaging.module.css";

/*
 * Verpackungs-Illustrationen nach den Produktfotos:
 *  15 ml  – schwarze Faltschachtel mit Sichtfenster
 *  50 ml  – weiße Zylinderbox mit schwarzem Logo
 *  100 ml – schwarze Magnetbox, innen Satin
 */

type ScentLike = Pick<Scent, "slug" | "name" | "line" | "tint">;

function useIds() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (part: string) => `p${uid}-${part}`;
}

function Logo({ x, y, w, color }: { x: number; y: number; w: number; color: string }) {
  const emblem = w * 0.5;
  const wordH = (w * WORDMARK.mr.h) / WORDMARK.mr.w;
  const subW = w * 0.52;
  const subH = (subW * WORDMARK.sub.h) / WORDMARK.sub.w;
  return (
    <g style={{ color, fill: color }}>
      <use href={`${SPRITE}#emblem`} x={x - emblem / 2} y={y} width={emblem} height={emblem} />
      <use href={`${SPRITE}#word-mr`} x={x - w / 2} y={y + emblem + w * 0.1} width={w} height={wordH} />
      <use href={`${SPRITE}#word-sub`} x={x - subW / 2} y={y + emblem + w * 0.1 + wordH + w * 0.055} width={subW} height={subH} />
    </g>
  );
}

/** 15 ml: Flakon in der schwarzen Box mit Sichtfenster */
export function WindowBox({ scent }: { scent: ScentLike }) {
  const id = useIds();
  return (
    <div className={styles.composition} style={{ aspectRatio: "160 / 300" }}>
      <svg viewBox="0 0 160 300" className={styles.layer} aria-hidden="true">
        <defs>
          <linearGradient id={id("inside")} x1="0" x2="1">
            <stop offset="0" stopColor="#050505" />
            <stop offset="0.5" stopColor="#1b1a18" />
            <stop offset="1" stopColor="#050505" />
          </linearGradient>
        </defs>
        <rect x="44" y="72" width="66" height="196" fill={`url(#${id("inside")})`} />
      </svg>
      <div className={styles.item} style={{ left: "30.6%", width: "38%", bottom: "5%" }}>
        <ProductVisual scent={scent} ml={15} shadow={false} />
      </div>
      <svg viewBox="0 0 160 300" className={styles.layer} aria-hidden="true">
        <defs>
          <linearGradient id={id("front")} x1="0" x2="1">
            <stop offset="0" stopColor="#1d1d1d" />
            <stop offset="0.45" stopColor="#111" />
            <stop offset="1" stopColor="#0a0a0a" />
          </linearGradient>
          <linearGradient id={id("side")} x1="0" x2="1">
            <stop offset="0" stopColor="#050505" />
            <stop offset="1" stopColor="#141414" />
          </linearGradient>
        </defs>
        {/* Seite und Deckel (leichte Perspektive) */}
        <path d="M134 36 L146 26 L146 280 L134 292 Z" fill={`url(#${id("side")})`} />
        <path d="M22 36 L134 36 L146 26 L34 26 Z" fill="#262626" />
        <path d="M22 36 L134 36" stroke="#fff" strokeOpacity="0.14" strokeWidth="0.8" />
        {/* Front mit Fenster */}
        <path
          fillRule="evenodd"
          fill={`url(#${id("front")})`}
          d="M22 36 H134 V292 H22 Z M48 78 V262 a4 4 0 0 0 4 4 H106 a4 4 0 0 0 4 -4 V78 a4 4 0 0 0 -4 -4 H52 a4 4 0 0 0 -4 4 Z"
        />
        <rect x="47.5" y="73.5" width="63" height="193" rx="4.5" fill="none" stroke="#000" strokeWidth="1.6" />
        <rect x="46.4" y="72.4" width="65.2" height="195.2" rx="5" fill="none" stroke="#fff" strokeOpacity="0.08" />
        <use href={`${SPRITE}#emblem`} x="71" y="47" width="16" height="16" style={{ color: "#c9a66b", fill: "#c9a66b" }} />
        <rect x="22" y="36" width="112" height="256" fill="none" stroke="#fff" strokeOpacity="0.06" />
      </svg>
    </div>
  );
}

/** 50 ml: Flakon vor der weißen Zylinderbox */
export function Tube({ scent }: { scent: ScentLike }) {
  const id = useIds();
  return (
    <div className={styles.composition} style={{ aspectRatio: "230 / 330" }}>
      <svg viewBox="0 0 230 330" className={styles.layer} aria-hidden="true">
        <defs>
          <linearGradient id={id("cyl")} x1="0" x2="1">
            <stop offset="0" stopColor="#c9c2b5" />
            <stop offset="0.16" stopColor="#efebe4" />
            <stop offset="0.38" stopColor="#ffffff" />
            <stop offset="0.62" stopColor="#f5f2ec" />
            <stop offset="0.88" stopColor="#d6cfc2" />
            <stop offset="1" stopColor="#bdb5a7" />
          </linearGradient>
          <radialGradient id={id("shadow")}>
            <stop offset="0" stopColor="#000" stopOpacity="0.35" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="88" cy="318" rx="86" ry="9" fill={`url(#${id("shadow")})`} />
        {/* Unterteil */}
        <path d="M22 240 V312 a66 7 0 0 0 132 0 V240 Z" fill={`url(#${id("cyl")})`} />
        {/* Deckel */}
        <path d="M20 22 V238 a68 7.5 0 0 0 136 0 V22 Z" fill={`url(#${id("cyl")})`} />
        <path d="M20 238 a68 7.5 0 0 0 136 0" fill="none" stroke="#000" strokeOpacity="0.16" strokeWidth="1" />
        <ellipse cx="88" cy="22" rx="68" ry="7.5" fill="#f9f7f3" stroke="#000" strokeOpacity="0.06" />
        <ellipse cx="88" cy="22" rx="60" ry="5.2" fill="none" stroke="#fff" strokeOpacity="0.9" />
        <Logo x={88} y={70} w={100} color="#141110" />
        <text x="88" y="289" textAnchor="middle" className={styles.print}>
          LE PARFUM · 50 ML
        </text>
      </svg>
      <div className={styles.item} style={{ left: "50%", width: "36%", bottom: "1.5%" }}>
        <ProductVisual scent={scent} ml={50} />
      </div>
    </div>
  );
}

/** 100 ml: Flakon vor der geöffneten schwarzen Magnetbox */
export function Coffret({ scent }: { scent: ScentLike }) {
  const id = useIds();
  return (
    <div className={styles.composition} style={{ aspectRatio: "270 / 330" }}>
      <svg viewBox="0 0 270 330" className={styles.layer} aria-hidden="true">
        <defs>
          <linearGradient id={id("lid")} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3a3a3a" />
            <stop offset="1" stopColor="#1f1f1f" />
          </linearGradient>
          <linearGradient id={id("satin")} x1="0" x2="1" y1="0" y2="0.4">
            <stop offset="0" stopColor="#060606" />
            <stop offset="0.3" stopColor="#2c2a28" />
            <stop offset="0.45" stopColor="#0b0b0b" />
            <stop offset="0.7" stopColor="#242220" />
            <stop offset="1" stopColor="#080808" />
          </linearGradient>
          <linearGradient id={id("front")} x1="0" x2="1">
            <stop offset="0" stopColor="#1a1a1a" />
            <stop offset="0.5" stopColor="#0e0e0e" />
            <stop offset="1" stopColor="#151515" />
          </linearGradient>
          <radialGradient id={id("shadow")}>
            <stop offset="0" stopColor="#000" stopOpacity="0.4" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="150" cy="316" rx="128" ry="10" fill={`url(#${id("shadow")})`} />
        {/* Deckel (aufgeklappt) */}
        <rect x="58" y="22" width="190" height="168" rx="2" fill="#0c0c0c" />
        <rect x="66" y="30" width="174" height="152" fill={`url(#${id("lid")})`} />
        <Logo x={153} y={62} w={82} color="#cdbf9f" />
        {/* Öffnung mit Satin */}
        <path d="M48 196 L258 196 L248 178 L58 178 Z" fill={`url(#${id("satin")})`} />
        <path
          d="M64 190 C 100 182, 130 194, 160 186 S 220 190, 244 184"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.12"
          strokeWidth="1.2"
        />
        {/* Box-Front */}
        <rect x="48" y="196" width="210" height="112" fill={`url(#${id("front")})`} />
        <path d="M48 196 H258" stroke="#fff" strokeOpacity="0.12" />
        <rect x="48" y="196" width="210" height="112" fill="none" stroke="#fff" strokeOpacity="0.05" />
      </svg>
      <div className={styles.item} style={{ left: "6%", width: "33%", bottom: "2%" }}>
        <ProductVisual scent={scent} ml={100} />
      </div>
    </div>
  );
}

/** Schwarze Tragetasche mit Logo – für den Bereich „Von Hand verpackt“ */
export function GiftBag({ className }: { className?: string }) {
  const id = useIds();
  return (
    <svg viewBox="0 0 240 320" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id("bag")} x1="0" x2="1">
          <stop offset="0" stopColor="#1c1c1c" />
          <stop offset="0.5" stopColor="#111" />
          <stop offset="1" stopColor="#0b0b0b" />
        </linearGradient>
        <radialGradient id={id("shadow")}>
          <stop offset="0" stopColor="#000" stopOpacity="0.45" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="122" cy="306" rx="104" ry="9" fill={`url(#${id("shadow")})`} />
      <path d="M100 92 C 98 36, 160 36, 158 92" fill="none" stroke="#050505" strokeWidth="4" strokeLinecap="round" />
      <path d="M100 92 C 98 36, 160 36, 158 92" fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="1" />
      <path d="M206 84 L222 92 L222 298 L206 304 Z" fill="#070707" />
      <rect x="30" y="84" width="176" height="220" fill={`url(#${id("bag")})`} />
      <rect x="30" y="84" width="176" height="18" fill="#191919" />
      <path d="M30 102 H206" stroke="#000" strokeOpacity="0.6" />
      <circle cx="84" cy="94" r="2.6" fill="#8d8d8d" />
      <circle cx="146" cy="94" r="2.6" fill="#8d8d8d" />
      <path d="M84 94 C 80 30, 150 30, 146 94" fill="none" stroke="#050505" strokeWidth="4" strokeLinecap="round" />
      <path d="M84 94 C 80 30, 150 30, 146 94" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="1" />
      <Logo x={118} y={140} w={112} color="#d6cbb1" />
    </svg>
  );
}
