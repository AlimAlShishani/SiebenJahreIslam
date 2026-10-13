"""Grafiken einer Szene ins Video-Format rendern.

Die Grafiken zeichnet Claude pro Video passend zum Abschnitt neu (piktogramm.py, baukasten.py),
der Plan (szenen.py) sagt, welche Datei ab welchem Wort erscheint.
Regeln: Lebewesen ohne Augen, Menschen nur als Piktogramm ohne Gesicht.
"""

from __future__ import annotations

import io
from pathlib import Path

from PIL import Image, ImageFilter

from render import Style, save_layer

def resolve(datei: str, base: Path | None = None) -> Path:
    """Pfad einer im Plan genannten Grafik (relativ zum Plan oder absolut)."""
    for cand in ((base / datei) if base else None, Path(datei)):
        if cand and cand.exists() and cand.suffix.lower() in (".svg", ".png"):
            return cand
    raise SystemExit(f"Grafik nicht gefunden: {datei!r} (SVG/PNG, Pfad relativ zum Plan)")


def render_graphic(source: Path, out: Path, style: Style, box: tuple[int, int, int, int]) -> Path:
    """Rendert eine Grafik als transparentes Vollbild-PNG in den Bereich box (x, y, b, h)."""
    x, y, w, h = box
    if source.suffix.lower() == ".svg":
        import resvg_py

        from baukasten import FONT_FILES

        png = resvg_py.svg_to_bytes(svg_path=str(source), width=w, height=h, font_files=FONT_FILES)
        art = Image.open(io.BytesIO(bytes(png))).convert("RGBA")
        # Linien etwas kräftiger, damit sie im Video so präsent wirken wie der Text.
        # Neu sichtbare Randpixel bekommen die Nachbarfarbe (sonst dunkle Säume).
        grow = max(3, (w // 260) | 1)
        alpha = art.getchannel("A")
        grown = alpha.filter(ImageFilter.MaxFilter(grow))
        spread = art.convert("RGB").filter(ImageFilter.MaxFilter(grow))
        rgb = Image.composite(art.convert("RGB"), spread, alpha.point(lambda a: 255 if a > 0 else 0))
        art = rgb.convert("RGBA")
        art.putalpha(grown)
    else:
        art = Image.open(source).convert("RGBA")
        art.thumbnail((w, h))
    # Farbe der Szene: Weiß → Szenenfarbe (multiplizieren), Grautöne bleiben als dunklere Stufen erhalten
    color = tuple(int(style.color.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    if color != (255, 255, 255):
        from PIL import ImageChops

        tinted = ImageChops.multiply(art.convert("RGB"), Image.new("RGB", art.size, color)).convert("RGBA")
        tinted.putalpha(art.getchannel("A"))
        art = tinted
    canvas = Image.new("RGBA", (style.width, style.height), (0, 0, 0, 0))
    canvas.alpha_composite(art, (x + (w - art.width) // 2, y + (h - art.height) // 2))
    save_layer(canvas, out, style, grafik=True)
    return out


def render_tint(out: Path, style: Style, color: str, strength: float = 0.22) -> Path:
    """Farbiges Leuchten im Hintergrund (Stimmung der Szene): weicher Lichtkegel von oben."""
    import numpy as np

    W, H = style.width, style.height
    y = np.linspace(0, 1, H)[:, None]
    x = np.linspace(-1, 1, W)[None, :]
    a = np.clip(1.0 - np.sqrt((x * 0.8) ** 2 + ((y - 0.35) * 1.3) ** 2), 0, 1) ** 1.6 * strength
    rgb = [int(color.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)]
    arr = np.zeros((H, W, 4), np.uint8)
    arr[..., :3] = rgb
    arr[..., 3] = (a * 255).astype(np.uint8)
    Image.fromarray(arr, "RGBA").save(out)
    return out

