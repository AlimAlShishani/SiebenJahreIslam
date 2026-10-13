"""Dezente Effekte: schwebende Lichtpartikel, Glitch, Hitzeflimmern und VHS-Linie.

Partikel: eine nahtlos loopende Videoebene auf Schwarz (partikel.mp4). Im Video
wird sie per „Screen“-Mischung über den Hintergrund gelegt; in CapCut genauso
(Mischmodus „Bildschirm“/„Screen“).

Glitch: nur ab und zu ein winziger RGB-Versatz über das ganze Bild für ein
bis zwei Frames – unabhängig vom Verswechsel.

Hitzeflimmern und VHS-Linie (wie in den Referenzvideos des Nutzers) über eine Verschiebungskarte
(ffmpeg „displace“): Hitzeflimmern = ständiges, sanftes Wabern des ganzen Bildes als nahtlose
Schleife; VHS-Linie = ab und zu wandert eine feine, leicht versetzte Zeile mit weichem Verlauf
in ein paar Sekunden von oben nach unten durchs Bild (keine helle Linie, nichts Hartes).
"""

from __future__ import annotations

import math
import subprocess
from pathlib import Path

import numpy as np

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


def glitch_times(duration: float, strength: float, avoid: list[float] = (), seed: int = 11) -> list[tuple[float, float]]:
    """Seltene, sehr kurze Zeitfenster für den leichten Farbversatz (unabhängig von den Versen)."""
    rng = np.random.default_rng(seed)
    out = []
    gap = 7.0 / max(strength, 0.1)  # bei 0.5 etwa alle 14 s
    t = rng.uniform(4, 8)
    while t < duration - 0.5:
        # nie in der Nähe eines Verswechsels, damit es nicht wie ein Übergangs-Effekt wirkt
        if all(abs(t - a) > 1.0 for a in avoid):
            out.append((t, t + rng.uniform(0.03, 0.07)))
        t += rng.uniform(0.7, 1.3) * gap
    return out



def vhs_durchlaeufe(duration: float, vhs: float, seed: int = 23) -> list[tuple[float, float]]:
    """Zeitfenster, in denen eine VHS-Linie einmal von oben nach unten durchs Bild wandert."""
    if vhs <= 0:
        return []
    rng = np.random.default_rng(seed)
    out, gap = [], 4.0 / max(vhs, 0.1)                 # bei 0.5 etwa alle 8 s ein Durchlauf
    t = rng.uniform(2, 5)
    while t < duration - 1.0:
        d = rng.uniform(2.6, 3.8)                      # so lange braucht die Linie von oben nach unten
        out.append((t, min(t + d, duration)))
        t += d + rng.uniform(0.6, 1.4) * gap
    return out


def verschiebung_x(H: int, hitze: float, vhs: float, durchlaeufe) -> str | None:
    """geq-Ausdruck: waagerechte Verschiebung je Bildzeile (128 = keine).

    Hitzeflimmern: ständig, langsam und großflächig wabernd, nahtlose Schleife (Periode 12 s).
    VHS-Linie: ein dünner Streifen mit weichem Verlauf (Mitte am stärksten), der von oben nach unten wandert.
    """
    terme = []
    if hitze > 0:
        a = H * 0.0066 * hitze                          # 0.5 → ~3,5 px bei 1080p
        terme.append(f"{a:.2f}*(0.6*sin(2*PI*(Y/{H * 0.22:.1f}-T/6))+0.4*sin(2*PI*(Y/{H * 0.09:.1f}+T/4)))")
    if durchlaeufe:
        amp = H * 0.018 * vhs                           # 0.5 → ~10 px Versatz in der Mitte des Streifens
        h = max(4.0, H * 0.008)                         # halbe Streifenhöhe (~9 px bei 1080p)
        for a, b in durchlaeufe:
            y = f"(-{h:.1f}+{H + 2 * h:.1f}*(T-{a:.3f})/{b - a:.3f})"
            terme.append(f"{amp:.1f}*between(T,{a:.3f},{b:.3f})*max(0,1-abs(Y-{y})/{h:.1f})")
    return ("128+" + "+".join(terme)) if terme else None


def verschiebung_y(W: int, H: int, hitze: float) -> str | None:
    """geq-Ausdruck: senkrechte Verschiebung je Bildspalte – das Hitzeflimmern wabert auch leicht auf und ab."""
    if hitze <= 0:
        return None
    a = H * 0.0038 * hitze                              # 0.5 → ~2 px
    return f"128+{a:.2f}*(0.6*sin(2*PI*(X/{W * 0.14:.1f}+T/6))+0.4*sin(2*PI*(X/{W * 0.06:.1f}-T/4)))"
