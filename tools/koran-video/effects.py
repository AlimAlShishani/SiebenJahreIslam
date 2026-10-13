"""Dezente Effekte: schwebende Lichtpartikel, Glitch, Hitzeflimmern und VHS-Linie.

Partikel: eine nahtlos loopende Videoebene auf Schwarz (partikel.mp4). Im Video
wird sie per „Screen“-Mischung über den Hintergrund gelegt; in CapCut genauso
(Mischmodus „Bildschirm“/„Screen“).

Glitch: nur ab und zu ein winziger RGB-Versatz über das ganze Bild für ein
bis zwei Frames – unabhängig vom Verswechsel.

Hitzeflimmern und VHS-Linie (wie in den Referenzvideos des Nutzers): eine Verschiebungskarte
(ffmpeg „displace“) verschiebt Bildzeilen waagerecht. Hitzeflimmern = kurze Schübe, in denen die
Zeilen wellenförmig gegeneinander versetzt werden (Schrift wirkt „zerschnitten“); VHS-Linie = ein
dünner waagerechter Streifen, der für einen Moment seitlich versetzt durchs Bild läuft. Beides nie
in der Nähe eines Verswechsels.
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


def stoer_ereignisse(duration: float, hitze: float, vhs: float, avoid: list[float] = (), seed: int = 23):
    """Zeitfenster für Hitzeflimmern-Schübe und VHS-Linien (zufällig, aber reproduzierbar)."""
    rng = np.random.default_rng(seed)

    def reihe(staerke, abstand, d_min, d_max, start):
        out = []
        if staerke <= 0:
            return out
        gap = abstand / max(staerke, 0.1)
        t = start
        while t < duration - 1.5:
            d = rng.uniform(d_min, d_max)
            if all(t + d < a - 1.0 or t > a + 1.0 for a in avoid):
                out.append((t, t + d))
            t += rng.uniform(0.7, 1.3) * gap
        return out

    return (reihe(hitze, 6.0, 0.7, 1.2, rng.uniform(5, 9)),     # bei 0.5 etwa alle 12 s
            reihe(vhs, 4.5, 0.18, 0.4, rng.uniform(3, 6)))       # bei 0.5 etwa alle 9 s


def verzerrung_ausdruck(heat, vhs_ev, H: int, hitze: float, vhs: float, seed: int = 5) -> str | None:
    """geq-Ausdruck der waagerechten Verschiebung je Bildzeile (128 = keine Verschiebung)."""
    terme = []
    if heat:
        amp = max(1, round(H * 0.0075 * hitze))                      # 0.5 → ~4 px bei 1080p
        env = "+".join(f"between(T,{a:.3f},{b:.3f})*sin(PI*(T-{a:.3f})/{b - a:.3f})" for a, b in heat)
        terme.append(f"{amp}*({env})*(0.65*sin(2*PI*(Y/{H * 0.013:.1f}+T*3))+0.35*sin(2*PI*(Y/{H * 0.034:.1f}-T*1.7)))")
    for (a, b), (y0, h, shift) in zip(vhs_ev, vhs_streifen(vhs_ev, H, vhs, seed)):
        an = f"between(T,{a:.3f},{b:.3f})"
        terme.append(f"{shift}*{an}*between(Y,{y0},{y0 + h})")
        terme.append(f"{round(shift / 3)}*{an}*between(Y,{y0 + h},{y0 + h * 3})")   # schwächerer Nachzieher
    return ("128+" + "+".join(terme)) if terme else None


def vhs_streifen(vhs_ev, H: int, vhs: float, seed: int = 5) -> list[tuple[int, int, int]]:
    """Lage der VHS-Streifen: (y oben, Höhe, waagerechter Versatz in px) je Ereignis."""
    rng = np.random.default_rng(seed)
    out = []
    for _ in vhs_ev:
        h = max(4, round(H * rng.uniform(0.006, 0.013)))
        out.append((round(rng.uniform(0.15, 0.85) * H), h, round(H * 0.05 * vhs) * int(rng.choice([-1, 1]))))
    return out


def vhs_linien_filter(vhs_ev, H: int, vhs: float, seed: int = 5) -> str:
    """Feine helle Linien an den VHS-Streifen (sonst wäre der Versatz auf dunklem Grund unsichtbar)."""
    teile = []
    for (a, b), (y0, h, _) in zip(vhs_ev, vhs_streifen(vhs_ev, H, vhs, seed)):
        an = f"between(t,{a:.3f},{b:.3f})"
        teile.append(f"drawbox=x=0:y={y0}:w=iw:h={max(2, h // 3)}:color=white@{0.10 + 0.08 * vhs:.2f}:t=fill:enable='{an}'")
        teile.append(f"drawbox=x=0:y={y0 + h}:w=iw:h={max(2, h)}:color=white@{0.04 + 0.04 * vhs:.2f}:t=fill:enable='{an}'")
    return ",".join(teile)
