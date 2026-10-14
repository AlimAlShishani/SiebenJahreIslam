import { SPRITE } from "@/components/brand/geometry";
import type { SizeMl } from "@/lib/config";
import type { Line } from "@/lib/products";
import { LABEL_LAYOUT, SPECS, labelArc } from "./specs";

/*
 * Zeichnet das Mr.-Elixier-Etikett als Bild für das 3D-Modell: Emblem und Schriftzug aus
 * dem Logo-Sprite, Duftname und Inhaltsangabe in den Schriften der Seite.
 */

export interface LabelScent {
  name: string;
  line: Line;
  tint: string;
}

interface Glyph {
  w: number;
  h: number;
  path: Path2D;
}

interface Glyphs {
  emblem: Glyph & { ring: { r: number; width: number } };
  mr: Glyph;
  mrs: Glyph;
  sub: Glyph;
}

let glyphs: Promise<Glyphs> | null = null;

function loadGlyphs(): Promise<Glyphs> {
  glyphs ??= fetch(SPRITE)
    .then((response) => response.text())
    .then((text) => {
      const doc = new DOMParser().parseFromString(text, "image/svg+xml");
      const read = (id: string): Glyph => {
        const symbol = doc.querySelector(`symbol[id="${id}"]`);
        if (!symbol) throw new Error(`Logo-Symbol ${id} fehlt`);
        const [, , w, h] = (symbol.getAttribute("viewBox") ?? "").split(/[\s,]+/).map(Number);
        const d = Array.from(symbol.querySelectorAll("path"), (p) => p.getAttribute("d") ?? "").join(" ");
        return { w, h, path: new Path2D(d) };
      };
      const ring = doc.querySelector('symbol[id="emblem"] circle');
      return {
        emblem: {
          ...read("emblem"),
          ring: { r: Number(ring?.getAttribute("r") ?? 0), width: Number(ring?.getAttribute("stroke-width") ?? 0) },
        },
        mr: read("word-mr"),
        mrs: read("word-mrs"),
        sub: read("word-sub"),
      };
    });
  return glyphs;
}

function fontFamily(variable: "--serif" | "--sans") {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || (variable === "--serif" ? "Georgia, serif" : "Arial, sans-serif");
}

/** Text mit Laufweite (als Anteil der Schriftgröße), mittig an x */
function spacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, tracking: number) {
  const chars = Array.from(text);
  const gap = size * tracking;
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (chars.length - 1);
  let cursor = x - total / 2;
  chars.forEach((c, i) => {
    ctx.fillText(c, cursor, y);
    cursor += widths[i] + gap;
  });
  return total;
}

function measureSpaced(ctx: CanvasRenderingContext2D, text: string, size: number, tracking: number) {
  const chars = Array.from(text);
  return chars.reduce((sum, c) => sum + ctx.measureText(c).width, 0) + size * tracking * (chars.length - 1);
}

function drawGlyph(ctx: CanvasRenderingContext2D, glyph: Glyph, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(w / glyph.w, h / glyph.h);
  ctx.fill(glyph.path, "evenodd");
  ctx.restore();
}

export interface LabelImages {
  /** Farbbild des Etiketts */
  color: HTMLCanvasElement;
  /** Nur beim schwarzen Etikett: Prägung (G = Rauheit, B = Metall) für die Folienschrift */
  foil?: HTMLCanvasElement;
}

/** Etikett als Bild, `px` = Höhe in Pixeln */
export async function drawLabel(ml: SizeMl, scent: Pick<LabelScent, "name" | "line">, px = 1024): Promise<LabelImages> {
  const spec = SPECS[ml];
  const layout = LABEL_LAYOUT[ml];
  const serif = fontFamily("--serif");
  const sans = fontFamily("--sans");
  // Ausweichschriften, die es auf dem Gerät nicht gibt, sollen das Etikett nicht blockieren
  const loadFont = (font: string, text: string) => document.fonts.load(font, text).catch(() => []);
  const [g] = await Promise.all([
    loadGlyphs(),
    loadFont(`600 64px ${serif}`, scent.name),
    loadFont(`600 64px ${sans}`, "EXTRAIT DE PARFUM"),
  ]);

  const H = px;
  const W = Math.round((px * labelArc(spec).length) / spec.label.height);
  const dark = spec.label.dark;
  const word = scent.line === "mrs" ? g.mrs : g.mr;
  const name = scent.name.toUpperCase();
  const info = `EXTRAIT DE PARFUM · ${ml} ML`;

  const paint = (ctx: CanvasRenderingContext2D, paper: string, ink: string, infoInk: string) => {
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;

    // feiner Rahmen
    const inset = layout.frame * H;
    ctx.lineWidth = H * 0.0062;
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);

    // Emblem mit Ring
    const es = layout.emblem.size * H;
    const ex = W / 2 - es / 2;
    const ey = layout.emblem.y * H;
    const k = es / g.emblem.w;
    ctx.lineWidth = g.emblem.ring.width * k;
    ctx.beginPath();
    ctx.arc(W / 2, ey + es / 2, g.emblem.ring.r * k, 0, Math.PI * 2);
    ctx.stroke();
    drawGlyph(ctx, g.emblem, ex, ey, es, es);

    // MR. / MRS. ELIXIER
    const wh = layout.word.h * H;
    const ww = (wh * word.w) / word.h;
    drawGlyph(ctx, word, W / 2 - ww / 2, layout.word.y * H, ww, wh);
    if (layout.sub) {
      const sw = layout.sub.w * H;
      drawGlyph(ctx, g.sub, W / 2 - sw / 2, layout.sub.y * H, sw, (sw * g.sub.h) / g.sub.w);
    }

    // Duftname (passt sich der Länge an)
    let size = layout.name.size * H;
    ctx.textBaseline = "alphabetic";
    ctx.font = `600 ${size}px ${serif}`;
    const width = measureSpaced(ctx, name, size, 0.1);
    if (width > layout.name.maxW * H) {
      size *= (layout.name.maxW * H) / width;
      ctx.font = `600 ${size}px ${serif}`;
    }
    spacedText(ctx, name, W / 2, layout.name.y * H, size, 0.1);

    // Inhaltsangabe
    const infoSize = layout.info.size * H;
    ctx.font = `600 ${infoSize}px ${sans}`;
    ctx.fillStyle = infoInk;
    spacedText(ctx, info, W / 2, layout.info.y * H, infoSize, 0.2);
  };

  const canvas = (draw: (ctx: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Canvas nicht verfügbar");
    draw(ctx);
    return c;
  };

  if (!dark) {
    return { color: canvas((ctx) => paint(ctx, "#fbfaf6", "#16130f", "rgba(22, 19, 15, 0.78)")) };
  }
  return {
    color: canvas((ctx) => paint(ctx, "#0e0d0c", "#dcc9a0", "rgba(220, 201, 160, 0.85)")),
    // Folienschrift glänzt metallisch, das Papier bleibt matt
    foil: canvas((ctx) => paint(ctx, "rgb(0, 150, 0)", "rgb(0, 70, 255)", "rgb(0, 70, 255)")),
  };
}
