"""Vers-Bilder (transparente PNGs) mit den QCF-Glyphenfonts (V1 oder V2) rendern."""

from __future__ import annotations

import textwrap
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, features

from quran_data import Segment, font_path

FORMATS = {"9:16": (1080, 1920), "16:9": (1920, 1080), "1:1": (1080, 1080), "4:5": (1080, 1350)}

REPO_ROOT = Path(__file__).resolve().parents[2]
UTHMANIC_FONT = REPO_ROOT / "UthmanicHafs.otf"  # nur für die Isti'adha (hat keine Glyphen-Codes)
# Schriften für die Übersetzung (Google Fonts, OFL-Lizenz) – werden bei Bedarf geladen.
# name: (Datei im google/fonts-Repo, Gewicht bei variablen Fonts, Größenfaktor)
TRANSLATION_FONTS = {
    "marcellus": ("ofl/marcellus/Marcellus-Regular.ttf", None, 1.0),
    "cormorant": ("ofl/cormorantgaramond/CormorantGaramond[wght].ttf", 500, 1.3),
    "ebgaramond": ("ofl/ebgaramond/EBGaramond[wght].ttf", 420, 1.15),
    "lora": ("ofl/lora/Lora-Italic[wght].ttf", 400, 1.0),
}
FONT_REPO = "https://raw.githubusercontent.com/google/fonts/main/"

LATIN_FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
]


def _hex(color: str) -> tuple[int, int, int]:
    c = color.lstrip("#")
    return tuple(int(c[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


@dataclass
class Style:
    width: int = 1080
    height: int = 1920
    color: str = "#FFFFFF"
    shadow: bool = True
    arabic_size: int = 0  # 0 = automatisch
    translation_size: int = 0
    latin_font: str | None = None
    latin_weight: int | None = None  # nur bei variablen Fonts (z. B. 500)
    glyphs: str = "v1"  # QCF-Version: v1 oder v2
    glow: float = 0.0  # Leuchten um den arabischen Text, 0 = aus, ~0.6 dezent, 1 = kräftig
    glow_color: str = "#FFFFFF"

    translation_font: str = "marcellus"  # Name aus TRANSLATION_FONTS, "system" oder Pfad zu .ttf/.otf

    @property
    def unit(self) -> float:
        """Bezugsgröße, damit Schrift in 9:16 und 16:9 gleich wirkt."""
        return (self.width * self.height) ** 0.5

    @property
    def text_width(self) -> int:
        frac = 0.86 if self.width <= self.height else 0.78
        return int(self.width * frac)


class Renderer:
    def __init__(self, style: Style):
        self.style = style
        self._fonts: dict = {}
        self.latin_scale = 1.0
        self.latin_font_path = style.latin_font
        name = style.translation_font
        if not self.latin_font_path and name in TRANSLATION_FONTS:
            rel, weight, self.latin_scale = TRANSLATION_FONTS[name]
            self.latin_font_path = str(_google_font(rel))
            if weight and not style.latin_weight:
                style.latin_weight = weight
        elif not self.latin_font_path and name not in ("system", ""):
            if not Path(name).exists():
                raise SystemExit(f"Übersetzungs-Schrift unbekannt: {name} (erlaubt: {', '.join(TRANSLATION_FONTS)}, system oder Pfad)")
            self.latin_font_path = name
        if not self.latin_font_path:
            self.latin_font_path = next((p for p in LATIN_FONTS if Path(p).exists()), None)

    # ------------------------------------------------------------------ Fonts
    def glyph_font(self, page: int, size: int) -> ImageFont.FreeTypeFont:
        key = ("p", page, size)
        if key not in self._fonts:
            # V1-Fonts sind kleiner gezeichnet als V2, die Seiten 1–2 (Fatiha/Anfang Baqara) nochmals kleiner
            scale = 1.0
            if self.style.glyphs == "v1":
                scale = 1.2 * (1.4 if page <= 2 else 1.0)
            path = font_path(page, self.style.glyphs)
            self._fonts[key] = ImageFont.truetype(str(path), max(8, int(size * scale)))
        return self._fonts[key]

    def latin(self, size: int):
        key = ("lat", size)
        if key not in self._fonts:
            if self.latin_font_path:
                font = ImageFont.truetype(self.latin_font_path, size)
                if self.style.latin_weight:
                    try:
                        font.set_variation_by_axes([self.style.latin_weight])
                    except OSError:
                        pass  # kein variabler Font
                self._fonts[key] = font
            else:
                self._fonts[key] = ImageFont.load_default(size)
        return self._fonts[key]

    # ------------------------------------------------------------------ Layout Arabisch
    def _arabic_lines(self, seg: Segment, size: int):
        """Bricht die Wörter (rechts→links) in Zeilen um. Gibt [(zeile, breite)], Wortabstand zurück."""
        space = size * 0.22
        tokens = []
        for w in seg.words:
            code, page = w.glyphs[self.style.glyphs]
            font = self.glyph_font(page, size)
            tokens.append(((code, page), font.getlength(code)))
        lines, cur, cur_w = [], [], 0.0
        for tok in tokens:
            add = tok[1] + (space if cur else 0)
            if cur and cur_w + add > self.style.text_width:
                lines.append((cur, cur_w))
                cur, cur_w = [], 0.0
                add = tok[1]
            cur.append(tok)
            cur_w += add
        if cur:
            lines.append((cur, cur_w))
        return _balance(lines, space, self.style.text_width), space

    def line_count(self, words) -> int:
        """Wie viele Zeilen ergeben diese Wörter in der Standardgröße?"""
        size = self.style.arabic_size or int(self.style.unit * 0.066)
        lines, _ = self._arabic_lines(Segment("vers", "", list(words), "", ""), size)
        return len(lines)

    def _arabic_layout(self, seg: Segment, max_height: int):
        size = self.style.arabic_size or int(self.style.unit * 0.066)
        while True:
            lines, space = self._arabic_lines(seg, size)
            line_h = int(size * 1.85)
            if self.style.arabic_size or len(lines) * line_h <= max_height or size <= 28:
                return size, lines, space, line_h
            size = int(size * 0.93)

    # ------------------------------------------------------------------ Zeichnen
    def _draw_arabic(self, img: Image.Image, seg: Segment, top: int, layout) -> None:
        size, lines, space, line_h = layout
        draw = ImageDraw.Draw(img)
        fill = _hex(self.style.color) + (255,)
        cx = self.style.width / 2
        for li, (line, line_w) in enumerate(lines):
            x = cx + line_w / 2
            y = top + li * line_h
            for (code, page), tw in line:
                x -= tw
                draw.text((x, y), code, font=self.glyph_font(page, size), fill=fill)
                x -= space

    def _istiadha_font(self, size: int):
        key = ("uth", size)
        if key not in self._fonts:
            self._fonts[key] = ImageFont.truetype(str(UTHMANIC_FONT), size)
        return self._fonts[key]

    def _translation_lines(self, text: str, size: int) -> list[str]:
        font = self.latin(size)
        avg = max(1.0, font.getlength("abcdefghijklmnopqrstuvwxyz") / 26)
        width_chars = max(10, int(self.style.text_width / avg))
        return textwrap.wrap(text, width=width_chars)

    def render(self, seg: Segment, out_ar: Path, out_tr: Path | None, layout: str = "mitte",
               with_graphic: bool = False) -> int:
        """Rendert Arabisch + Übersetzung als transparente Vollbild-PNGs.

        layout "mitte": Textblock mittig. layout "oben": Textblock oben (darunter ist Platz für Grafiken).
        with_graphic: Textblock kompakter halten, damit die Grafik groß genug bleibt.
        Rückgabe: y-Koordinate der Unterkante des Textblocks.
        """
        W, H = self.style.width, self.style.height
        area_top = 0
        area_h = H
        tr_size = self.style.translation_size or int(self.style.unit * 0.029 * self.latin_scale)
        tr_lines = self._translation_lines(seg.translation, tr_size) if (out_tr and seg.translation) else []
        tr_line_h = int(tr_size * 1.4)
        tr_h = len(tr_lines) * tr_line_h
        gap = int(H * 0.035) if tr_lines else 0

        ar_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        if seg.kind == "istiadha":
            size = int(self.style.unit * 0.055)
            font = self._istiadha_font(size)
            kw = {"direction": "rtl", "language": "ar"} if features.check("raqm") else {}
            bbox = font.getbbox(seg.text, **kw)
            ar_h = bbox[3] - bbox[1]
            top = int(H * 0.07) if layout == "oben" else area_top + int((area_h - (ar_h + gap + tr_h)) / 2)
            x = (W - (bbox[2] - bbox[0])) / 2 - bbox[0]
            fill = _hex(self.style.color) + (255,)
            ImageDraw.Draw(ar_img).text((x, top - bbox[1]), seg.text, font=font, fill=fill, **kw)
        else:
            max_ar_h = int(H * (0.34 if with_graphic else 0.62)) - (0 if with_graphic else tr_h)
            ar_layout = self._arabic_layout(seg, max(max_ar_h, int(H * 0.16)))
            ar_h = len(ar_layout[1]) * ar_layout[3]
            if layout == "oben":
                top = int(H * 0.05)
            else:
                top = area_top + int((area_h - (ar_h + gap + tr_h)) / 2)
            self._draw_arabic(ar_img, seg, top, ar_layout)
        _save(ar_img, out_ar, self.style.shadow, self.style.glow, self.style.glow_color, self.style.unit)

        if out_tr is not None:
            tr_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            draw = ImageDraw.Draw(tr_img)
            font = self.latin(tr_size)
            y = top + ar_h + gap
            for line in tr_lines:
                lw = font.getlength(line)
                draw.text(((W - lw) / 2, y), line, font=font, fill=_hex(self.style.color) + (235,))
                y += tr_line_h
            _save(tr_img, out_tr, self.style.shadow, 0.0, "#FFFFFF", self.style.unit)
        return top + ar_h + gap + tr_h


def graphic_box(style: Style, text_bottom: int) -> tuple[int, int, int, int]:
    """(x, y, breite, höhe) für eine Grafik unterhalb des Textblocks (Seitenverhältnis 400:260)."""
    W, H = style.width, style.height
    top = text_bottom + int(H * 0.04)
    avail_h = max(int(H * 0.2), H - top - int(H * 0.03))
    w = min(int(W * (0.62 if W >= H else 0.86)), int(avail_h * 400 / 260))
    h = int(w * 260 / 400)
    return (W - w) // 2, top + (avail_h - h) // 2, w, h


def save_layer(img: Image.Image, path: Path, style: Style) -> None:
    """Speichert eine Ebene mit demselben Schatten/Glow wie der arabische Text."""
    _save(img, path, style.shadow, style.glow, style.glow_color, style.unit)


def _google_font(rel: str) -> Path:
    from quran_data import CACHE_DIR, _get

    path = CACHE_DIR / "fonts" / "uebersetzung" / Path(rel).name
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        url = FONT_REPO + rel.replace("[", "%5B").replace("]", "%5D")
        path.write_bytes(_get(url, binary=True))
    return path


def _balance(lines, space, max_w):
    """Verteilt die Wörter gleichmäßiger, damit die letzte Zeile nicht nur aus einem Wort besteht."""
    if len(lines) < 2:
        return lines
    toks = [t for line, _ in lines for t in line]
    n = len(lines)
    total = sum(t[1] for t in toks) + space * (len(toks) - n)
    target = min(max_w, total / n * 1.08)
    out, cur, cur_w = [], [], 0.0
    for tok in toks:
        add = tok[1] + (space if cur else 0)
        if cur and cur_w + add > target and len(out) < n - 1:
            out.append((cur, cur_w))
            cur, cur_w, add = [], 0.0, tok[1]
        cur.append(tok)
        cur_w += add
    out.append((cur, cur_w))
    if any(w > max_w for _, w in out):
        return lines
    return out


def _save(img: Image.Image, path: Path, shadow: bool, glow: float, glow_color: str, unit: float) -> None:
    alpha = img.getchannel("A")
    if alpha.getbbox():
        layers = []
        if shadow:
            sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
            sh.putalpha(alpha.point(lambda a: int(a * 0.75)))
            layers.append(sh.filter(ImageFilter.GaussianBlur(max(4, unit / 280))))
        if glow > 0:
            import numpy as np

            # zwei Unschärfen: enger heller Kern + weiter weicher Schein
            inner = np.asarray(alpha.filter(ImageFilter.GaussianBlur(unit / 160)), np.float32) / 255
            outer = np.asarray(alpha.filter(ImageFilter.GaussianBlur(unit / 45)), np.float32) / 255
            g = np.clip((inner * 1.4 + outer * 2.2) * glow, 0, 0.95)
            layer = Image.new("RGBA", img.size, _hex(glow_color) + (0,))
            layer.putalpha(Image.fromarray((g * 255).astype("uint8"), "L"))
            layers.append(layer)
        for layer in reversed(layers):
            img = Image.alpha_composite(layer, img)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)


def make_background(size: tuple[int, int], path: Path) -> None:
    """Standard-Hintergrund: dunkler, ruhiger Verlauf mit Vignette."""
    import numpy as np

    W, H = size
    y = np.linspace(0, 1, H)[:, None, None]
    x = np.linspace(-1, 1, W)[None, :, None]
    top = np.array([18, 30, 40], float)
    bottom = np.array([5, 8, 12], float)
    base = top * (1 - y) + bottom * y
    r2 = x**2 * 0.6 + ((y - 0.42) * 1.6) ** 2
    vign = 1.12 - 0.35 * np.clip(r2, 0, 1.6)
    # leichtes Rauschen gegen Farbstreifen (Banding) nach der Video-Kompression
    noise = np.random.default_rng(7).normal(0, 1.2, (H, W, 1))
    rgb = np.clip(base * vign + noise, 0, 255).round().astype("uint8")
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgb, "RGB").save(path)
