"""Dezente Effekte: schwebende Lichtpartikel und Glitch.

Partikel: eine nahtlos loopende Videoebene auf Schwarz (partikel.mp4). Im Video
wird sie per „Screen“-Mischung über den Hintergrund gelegt; in CapCut genauso
(Mischmodus „Bildschirm“/„Screen“).

Glitch: beim Erscheinen eines Verses kurz versetzte Bildstreifen und
Farbkanäle (eigene PNG-Variante je Vers) plus ab und zu ein winziger
RGB-Versatz über das ganze Bild.
"""

from __future__ import annotations

import math
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image

FPS = 30


def _sprite(radius: float) -> np.ndarray:
    """Weicher, runder Lichtpunkt (Bokeh) als Graustufen-Array 0..1."""
    r = max(1.0, radius)
    n = int(math.ceil(r * 3)) * 2 + 1
    y, x = np.mgrid[:n, :n] - n // 2
    d = np.sqrt(x**2 + y**2) / r
    core = np.exp(-(d**2) * 2.2)
    halo = 0.25 * np.exp(-(d**2) * 0.45)
    return (core + halo).astype(np.float32)


def render_particles(out: Path, size: tuple[int, int], strength: float = 0.5, color: str = "#FFE9B8",
                     loop: float = 24.0, seed: int = 3) -> Path:
    """Rendert eine nahtlos loopende Partikel-Ebene (auf Schwarz) als MP4."""
    W, H = size
    # in halber Auflösung rendern (Partikel sind weich), ffmpeg skaliert hoch
    w, h = W // 2, H // 2
    rng = np.random.default_rng(seed)
    unit = math.sqrt(w * h)
    count = int(55 * (unit / 720))
    rgb = np.array([int(color.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255

    # Bewegung so gewählt, dass nach `loop` Sekunden alles exakt wieder am Anfang ist
    cycles = rng.integers(1, 3, count)               # Durchläufe von unten nach oben pro Loop
    y0 = rng.uniform(0, 1, count)
    x0 = rng.uniform(0, 1, count)
    sway_amp = rng.uniform(0.004, 0.02, count)
    sway_k = rng.integers(1, 4, count)
    phase = rng.uniform(0, 2 * math.pi, count)
    tw_k = rng.integers(2, 7, count)                   # Funkeln
    depth = rng.uniform(0, 1, count) ** 1.5            # 0 = fern/klein/dunkel, 1 = nah/groß
    radius = unit * (0.0018 + 0.006 * depth)
    bright = 0.25 + 0.75 * depth
    sprites = {}

    cmd = ["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-", "-vf", f"scale={W}:{H}:flags=bicubic",
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", str(out)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    margin = 0.06
    frames = int(round(loop * FPS))
    for f in range(frames):
        p = f / frames                                   # 0..1 über den Loop
        acc = np.zeros((h, w), np.float32)
        for i in range(count):
            yy = ((y0[i] - cycles[i] * p) % 1.0) * (1 + 2 * margin) - margin
            xx = x0[i] + sway_amp[i] * math.sin(2 * math.pi * sway_k[i] * p + phase[i])
            tw = 0.65 + 0.35 * math.sin(2 * math.pi * tw_k[i] * p + phase[i] * 2)
            # am oberen/unteren Rand ein- und ausblenden
            edge = min(1.0, max(0.0, min(yy, 1 - yy) / 0.12))
            a = bright[i] * tw * edge * strength
            if a <= 0.01:
                continue
            key = round(float(radius[i]), 1)
            spr = sprites.get(key)
            if spr is None:
                spr = sprites[key] = _sprite(key)
            n = spr.shape[0]
            cx, cy = int(xx * w) - n // 2, int(yy * h) - n // 2
            x1, y1 = max(cx, 0), max(cy, 0)
            x2, y2 = min(cx + n, w), min(cy + n, h)
            if x1 >= x2 or y1 >= y2:
                continue
            acc[y1:y2, x1:x2] += a * spr[y1 - cy:y2 - cy, x1 - cx:x2 - cx]
        frame = np.clip(acc[..., None] * rgb * 255, 0, 255).astype(np.uint8)
        proc.stdin.write(frame.tobytes())
    proc.stdin.close()
    if proc.wait() != 0:
        raise RuntimeError("ffmpeg (Partikel) fehlgeschlagen")
    return out


def glitch_variant(src: Path, dst: Path, strength: float = 0.5, seed: int = 0) -> Path:
    """Erzeugt aus einem transparenten Text-PNG eine Glitch-Variante."""
    rng = np.random.default_rng(seed)
    img = np.asarray(Image.open(src).convert("RGBA")).astype(np.int16)
    h, w, _ = img.shape
    shift = max(2, int(w * 0.004 * strength))
    out = img.copy()
    # Farbkanäle gegeneinander verschieben (chromatische Aberration)
    out[..., 0] = np.roll(img[..., 0], shift, axis=1)
    out[..., 2] = np.roll(img[..., 2], -shift, axis=1)
    out[..., 3] = np.maximum(np.maximum(np.roll(img[..., 3], shift, axis=1), np.roll(img[..., 3], -shift, axis=1)), img[..., 3])
    # einige horizontale Streifen seitlich versetzen
    ys = np.nonzero(img[..., 3].max(axis=1) > 0)[0]
    if len(ys):
        top, bottom = ys.min(), ys.max()
        for _ in range(int(2 + 3 * strength)):
            sh = int(rng.integers(max(2, h // 220), max(4, h // 70)))
            y = int(rng.integers(top, max(top + 1, bottom - sh)))
            dx = (1 if rng.random() < 0.5 else -1) * int(rng.integers(shift, shift * 3 + 1))
            out[y:y + sh] = np.roll(out[y:y + sh], dx, axis=1)
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA").save(dst)
    return dst


def glitch_times(starts: list[float], duration: float, strength: float, seed: int = 11) -> tuple[list, list]:
    """Zeitfenster: (Vers-Glitches [(start, ende, vers_index)], kleine RGB-Zucker [(start, ende)])."""
    rng = np.random.default_rng(seed)
    verse = []
    for i, t in enumerate(starts):
        verse.append((t + 0.02, t + 0.09, i))
        verse.append((t + 0.16, t + 0.21, i))
    micro = []
    t = rng.uniform(3, 6)
    gap = 9.0 / max(strength, 0.1)
    while t < duration - 0.5:
        micro.append((t, t + rng.uniform(0.04, 0.09)))
        t += rng.uniform(0.6, 1.4) * gap
    return verse, micro
