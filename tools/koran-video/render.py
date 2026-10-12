"""Vers-Bilder (transparente PNGs) mit den QCF-V2-Glyphenfonts rendern."""

from __future__ import annotations

import textwrap
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, features

from quran_data import Segment, font_path

FORMATS = {"9:16": (1080, 1920), "16:9": (1920, 1080), "1:1": (1080, 1080), "4:5": (1080, 1350)}

REPO_ROOT = Path(__file__).resolve().parents[2]
UTHMANIC_FONT = REPO_ROOT / "UthmanicHafs.otf"  # nur für die Isti'adha (hat keine Glyphen-Codes)
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

    @property
    def text_width(self) -> int:
        return int(self.width * 0.86)


class Renderer:
    def __init__(self, style: Style):
        self.style = style
        self._fonts: dict = {}
        self.latin_font_path = style.latin_font or next((p for p in LATIN_FONTS if Path(p).exists()), None)

    # ------------------------------------------------------------------ Fonts
    def glyph_font(self, page: int, size: int) -> ImageFont.FreeTypeFont:
        key = ("p", page, size)
        if key not in self._fonts:
            self._fonts[key] = ImageFont.truetype(str(font_path(page)), size)
        return self._fonts[key]

    def latin(self, size: int):
        key = ("lat", size)
        if key not in self._fonts:
            if self.latin_font_path:
                self._fonts[key] = ImageFont.truetype(self.latin_font_path, size)
            else:
                self._fonts[key] = ImageFont.load_default(size)
        return self._fonts[key]

    # ------------------------------------------------------------------ Layout Arabisch
    def _arabic_lines(self, seg: Segment, size: int):
        """Bricht die Wörter (rechts→links) in Zeilen um. Gibt [(zeile, breite)], Wortabstand zurück."""
        space = size * 0.22
        tokens = []
        for w in seg.words:
            font = self.glyph_font(w.page, size)
            tokens.append((w, font.getlength(w.code)))
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

    def _arabic_layout(self, seg: Segment, max_height: int):
        size = self.style.arabic_size or int(self.style.width * 0.085)
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
            for w, tw in line:
                x -= tw
                draw.text((x, y), w.code, font=self.glyph_font(w.page, size), fill=fill)
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

    def render(self, seg: Segment, out_ar: Path, out_tr: Path | None) -> None:
        W, H = self.style.width, self.style.height
        tr_size = self.style.translation_size or int(W * 0.036)
        tr_lines = self._translation_lines(seg.translation, tr_size) if (out_tr and seg.translation) else []
        tr_line_h = int(tr_size * 1.4)
        tr_h = len(tr_lines) * tr_line_h
        gap = int(H * 0.035) if tr_lines else 0

        ar_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        if seg.kind == "istiadha":
            size = int(min(W, H * 0.75) * 0.075)
            font = self._istiadha_font(size)
            kw = {"direction": "rtl", "language": "ar"} if features.check("raqm") else {}
            bbox = font.getbbox(seg.text, **kw)
            ar_h = bbox[3] - bbox[1]
            top = int((H - (ar_h + gap + tr_h)) / 2)
            x = (W - (bbox[2] - bbox[0])) / 2 - bbox[0]
            fill = _hex(self.style.color) + (255,)
            ImageDraw.Draw(ar_img).text((x, top - bbox[1]), seg.text, font=font, fill=fill, **kw)
        else:
            max_ar_h = int(H * 0.62) - tr_h
            layout = self._arabic_layout(seg, max(max_ar_h, int(H * 0.25)))
            ar_h = len(layout[1]) * layout[3]
            top = int((H - (ar_h + gap + tr_h)) / 2)
            self._draw_arabic(ar_img, seg, top, layout)
        _save(ar_img, out_ar, self.style.shadow)

        if out_tr is not None:
            tr_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            draw = ImageDraw.Draw(tr_img)
            font = self.latin(tr_size)
            y = top + ar_h + gap
            for line in tr_lines:
                lw = font.getlength(line)
                draw.text(((W - lw) / 2, y), line, font=font, fill=_hex(self.style.color) + (235,))
                y += tr_line_h
            _save(tr_img, out_tr, self.style.shadow)


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


def _save(img: Image.Image, path: Path, shadow: bool) -> None:
    if shadow:
        alpha = img.getchannel("A")
        bbox = alpha.getbbox()
        if bbox:
            sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
            sh.putalpha(alpha.point(lambda a: int(a * 0.75)))
            sh = sh.filter(ImageFilter.GaussianBlur(max(4, img.width // 200)))
            img = Image.alpha_composite(sh, img)
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
