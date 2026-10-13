"""Motiv-Bibliothek: schlichte Grafiken (SVG) in grafiken/ und ihr Rendering.

Welche Szene welche Grafik bekommt, steht im Plan (siehe szenen.py).
Regeln für Motive: Lebewesen ohne Augen, Menschen als Piktogramme ohne Gesicht.
Neue Motive: in grafiken/_erzeugen.py ergänzen (gleicher Stil) und neu erzeugen.
"""

from __future__ import annotations

import io
import json
from pathlib import Path

from PIL import Image, ImageFilter

from render import Style, save_layer

GRAFIK_DIR = Path(__file__).resolve().parent / "grafiken"


def library() -> dict:
    return json.loads((GRAFIK_DIR / "motive.json").read_text("utf-8"))


def resolve(motiv: str, base: Path | None = None) -> Path:
    lib = GRAFIK_DIR / f"{motiv}.svg"
    if lib.exists():
        return lib
    for cand in (Path(motiv), (base / motiv) if base else None):
        if cand and cand.exists() and cand.suffix.lower() in (".svg", ".png"):
            return cand
    raise SystemExit(f"Grafik-Motiv unbekannt: {motiv!r} (siehe {GRAFIK_DIR / 'motive.json'})")


def render_graphic(source: Path, out: Path, style: Style, box: tuple[int, int, int, int]) -> Path:
    """Rendert eine Grafik als transparentes Vollbild-PNG in den Bereich box (x, y, b, h)."""
    x, y, w, h = box
    if source.suffix.lower() == ".svg":
        import resvg_py

        png = resvg_py.svg_to_bytes(svg_path=str(source), width=w, height=h)
        art = Image.open(io.BytesIO(bytes(png))).convert("RGBA")
        # Linien etwas kräftiger, damit sie im Video so präsent wirken wie der Text
        grow = max(3, (w // 260) | 1)
        art.putalpha(art.getchannel("A").filter(ImageFilter.MaxFilter(grow)))
    else:
        art = Image.open(source).convert("RGBA")
        art.thumbnail((w, h))
    # Linienfarbe = Textfarbe der Szene (die SVGs sind weiß gezeichnet)
    color = tuple(int(style.color.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    if color != (255, 255, 255):
        tint = Image.new("RGBA", art.size, color + (255,))
        tint.putalpha(art.getchannel("A"))
        art = tint
    canvas = Image.new("RGBA", (style.width, style.height), (0, 0, 0, 0))
    canvas.alpha_composite(art, (x + (w - art.width) // 2, y + (h - art.height) // 2))
    save_layer(canvas, out, style)
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

