"""Grafik-Baukasten: Bausteine für schlichte Szenen-Grafiken im Piktogramm-Stil.

Claude zeichnet bei jedem Video die Grafiken passend zum jeweiligen Abschnitt neu
und setzt sie aus diesen Bausteinen zusammen (keine fertigen Motive).

Leinwand 400×260 (wird ins Video skaliert), weiße Linien, runde Enden.
Regeln: Lebewesen OHNE Augen, Menschen NUR als Piktogramm ohne Gesicht,
niemals Allah, Propheten, Engel oder Verborgenes darstellen.

Beispiel (eigenes Skript im Ausgabeordner):

    import sys; sys.path.insert(0, "tools/koran-video")
    from baukasten import *
    speichern("grafiken/67-19_voegel.svg",
              bird(200, 110, 46) + bird(120, 70, 28, .9) + person(200, 236, 120, "stand"))
    vorschau(["grafiken/67-19_voegel.svg"], "grafiken/vorschau.jpg")

Posen für person(): stand, walk, dua, freude, verzweifelt, abwenden, sitzen. Eigene Pose: person(x, y, h, dict(neck=…, hip=…,
head=…, arms=[(ellbogen, hand), …], legs=[(knie, fuss), …])) – Koordinaten wie in POSES.
"""

import io
import math
from pathlib import Path

W, H = 400, 260
F = 'fill="#fff" fill-opacity="0.12"'      # zarte Fläche
FS = 'fill="#fff" stroke="none"'            # voll gefüllt


def svg(body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none" stroke="#fff" '
            f'stroke-width="4" stroke-linecap="round" stroke-linejoin="round">\n{body}\n</svg>\n')


def speichern(pfad, body) -> Path:
    """Schreibt eine Szene (SVG-Elemente) als SVG-Datei."""
    p = Path(pfad)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(svg(body), "utf-8")
    return p


def vorschau(pfade, ausgabe, spalten=4):
    """Kontaktbogen der SVGs (zum Ansehen und Prüfen der Regeln vor dem Rendern)."""
    import resvg_py
    from PIL import Image, ImageDraw

    pfade = [Path(p) for p in pfade]
    cw, ch = 440, 320
    rows = (len(pfade) + spalten - 1) // spalten
    sheet = Image.new("RGB", (spalten * cw, max(1, rows) * ch), (14, 20, 28))
    dr = ImageDraw.Draw(sheet)
    for i, p in enumerate(pfade):
        png = resvg_py.svg_to_bytes(svg_path=str(p), width=400, height=260)
        im = Image.open(io.BytesIO(bytes(png))).convert("RGBA")
        x, y = (i % spalten) * cw, (i // spalten) * ch
        sheet.paste(im, (x + 20, y + 14), im)
        dr.text((x + 20, y + 290), p.stem, fill=(255, 210, 120))
    Path(ausgabe).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(ausgabe, quality=90)
    return ausgabe


# ----------------------------------------------------------------- Bausteine
def sparkle(x, y, r, o=1.0):
    return (f'<path d="M{x},{y - r} Q{x},{y} {x + r},{y} Q{x},{y} {x},{y + r} Q{x},{y} {x - r},{y} '
            f'Q{x},{y} {x},{y - r}Z" fill="#fff" fill-opacity="{o}" stroke="none"/>')


def dot(x, y, r=2.5, o=0.8):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" fill-opacity="{o}" stroke="none"/>'


def wave(y, x0=20, x1=380, amp=9, wl=56, sw=4, op=1.0):
    n = int((x1 - x0) / (wl / 2))
    d = f"M{x0},{y} q{wl / 4:.1f},{-amp} {wl / 2:.1f},0" + f" t{wl / 2:.1f},0" * (n - 1)
    return f'<path d="{d}" stroke-width="{sw}" stroke-opacity="{op}"/>'


def cloud(cx, cy, s=1.0, fill=True):
    p = lambda x, y: f"{cx + x * s:.1f},{cy + y * s:.1f}"
    r = lambda v: f"{v * s:.1f}"
    d = (f"M{p(-78, 24)} A{r(26)},{r(26)} 0 0 1 {p(-56, -8)} A{r(40)},{r(40)} 0 0 1 {p(2, -38)} "
         f"A{r(36)},{r(36)} 0 0 1 {p(58, -10)} A{r(24)},{r(24)} 0 0 1 {p(78, 24)} Z")
    return f'<path d="{d}" {F if fill else ""}/>'


def crescent(cx, cy, r, o=0.12):
    # Sichel, Öffnung nach rechts oben
    a1 = math.radians(-60)
    a2 = math.radians(140)
    x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
    x2, y2 = cx + r * math.cos(a2), cy + r * math.sin(a2)
    return (f'<path d="M{x1:.1f},{y1:.1f} A{r},{r} 0 1 0 {x2:.1f},{y2:.1f} '
            f'A{r * 0.82:.1f},{r * 0.82:.1f} 0 1 1 {x1:.1f},{y1:.1f}Z" fill="#fff" fill-opacity="{o}"/>')


def sun(cx, cy, r, rays=12, l1=1.35, l2=1.8, sw=4):
    out = [f'<circle cx="{cx}" cy="{cy}" r="{r}" {F}/>']
    for i in range(rays):
        a = 2 * math.pi * i / rays
        out.append(f'<line x1="{cx + r * l1 * math.cos(a):.1f}" y1="{cy + r * l1 * math.sin(a):.1f}" '
                   f'x2="{cx + r * l2 * math.cos(a):.1f}" y2="{cy + r * l2 * math.sin(a):.1f}" stroke-width="{sw}"/>')
    return "".join(out)


# Piktogramm-Figuren: kräftige runde Glieder, Kopf als Kreis – bewusst OHNE Gesicht.
POSES = {
    # Gelenke (x nach rechts, y nach oben, Fußpunkt = 0,0, Größe 110): Hals, Hüfte, Arme [(Ellbogen, Hand)], Beine [(Knie, Fuß)]
    "stand": dict(neck=(0, 78), hip=(0, 42), head=(0, 96), arms=[((-12, 62), (-15, 44)), ((12, 62), (15, 44))],
                  legs=[((-6, 21), (-8, 0)), ((6, 21), (8, 0))]),
    "walk": dict(neck=(3, 78), hip=(0, 42), head=(5, 96), arms=[((-9, 60), (-17, 46)), ((12, 62), (22, 52))],
                 legs=[((-9, 22), (-20, 2)), ((9, 22), (11, 0))]),
    "dua": dict(neck=(0, 78), hip=(0, 42), head=(0, 96), arms=[((-18, 66), (-22, 84)), ((18, 66), (22, 84))],
                legs=[((-6, 21), (-8, 0)), ((6, 21), (8, 0))]),
    "freude": dict(neck=(0, 78), hip=(0, 42), head=(0, 96), arms=[((-20, 86), (-36, 98)), ((20, 86), (36, 98))],
                   legs=[((-8, 21), (-14, 0)), ((8, 21), (14, 0))]),
    "verzweifelt": dict(neck=(2, 74), hip=(0, 40), head=(4, 91), arms=[((-16, 80), (-6, 100)), ((20, 80), (12, 101))],
                        legs=[((-8, 20), (-10, 0)), ((10, 19), (12, 0))]),
    "abwenden": dict(neck=(-3, 78), hip=(0, 42), head=(-5, 96), arms=[((14, 74), (32, 78)), ((-8, 60), (-12, 44))],
                     legs=[((-9, 22), (-18, 1)), ((7, 21), (12, 0))]),
    "sitzen": dict(neck=(-2, 54), hip=(0, 12), head=(-3, 72), arms=[((6, 34), (16, 14)), ((8, 36), (18, 16))],
                   legs=[((28, 9), (54, 5)), ((28, 9), (54, 5))]),
}


def person(x, y, h=110, pose="stand", o=1.0):
    """Piktogramm-Mensch ohne Gesicht. (x, y) = Fußpunkt, h = Größe, pose = Name aus POSES oder eigenes dict."""
    s = h / 110
    j = POSES[pose] if isinstance(pose, str) else pose
    P = lambda pt: f"{x + pt[0] * s:.1f},{y - pt[1] * s:.1f}"
    limb = 9 * s
    out = [f'<g opacity="{o}" stroke-width="{limb:.1f}">']  # Gruppen-Deckkraft: keine sichtbaren Überlappungen
    for elbow, hand in j["arms"]:
        out.append(f'<path d="M{P(j["neck"])} L{P(elbow)} L{P(hand)}"/>')
    for knee, foot in j["legs"]:
        out.append(f'<path d="M{P(j["hip"])} L{P(knee)} L{P(foot)}"/>')
    out.append(f'<path d="M{P(j["neck"])} L{P(j["hip"])}" stroke-width="{17 * s:.1f}"/>')
    hx, hy = j["head"]
    out.append(f'<circle cx="{x + hx * s:.1f}" cy="{y - hy * s:.1f}" r="{11 * s:.1f}" fill="#fff" stroke="none"/>')
    out.append("</g>")
    return "".join(out)


def person_sujud(x, y, s=1.0):
    """Niederwerfung (Sudschud), Kopf nach links, Piktogramm-Stil. (x, y) = Knie auf dem Boden."""
    P = lambda dx, dy: f"{x + dx * s:.1f},{y - dy * s:.1f}"
    return (f'<g stroke-width="{9 * s:.1f}">'
            f'<path d="M{P(40, 4)} L{P(2, 5)} L{P(12, 44)}"/>'                       # Unterschenkel, Oberschenkel
            f'<path d="M{P(-30, 18)} L{P(-38, 4)} L{P(-50, 4)}"/>'                   # Arm, Hand am Boden
            f'<path d="M{P(10, 44)} L{P(-34, 22)}" stroke-width="{17 * s:.1f}"/>'    # Rücken
            f'<circle cx="{x - 52 * s:.1f}" cy="{y - 12 * s:.1f}" r="{11 * s:.1f}" {FS}/></g>')


def bird(x, y, w=30, o=1.0, sw=4):
    h = w * 0.55
    return (f'<path d="M{x - w:.1f},{y - 2:.1f} Q{x - w * 0.45:.1f},{y - h:.1f} {x:.1f},{y + h * 0.22:.1f} '
            f'Q{x + w * 0.45:.1f},{y - h:.1f} {x + w:.1f},{y - 2:.1f}" stroke-opacity="{o}" stroke-width="{sw}"/>')


def tree(x, y, s=1.0):
    p = lambda dx, dy: f"{x + dx * s:.1f},{y + dy * s:.1f}"
    r = lambda v: f"{v * s:.1f}"
    crown = (f'<path d="M{p(-34, -50)} A{r(26)},{r(26)} 0 0 1 {p(-20, -96)} A{r(30)},{r(30)} 0 0 1 {p(26, -100)} '
             f'A{r(26)},{r(26)} 0 0 1 {p(38, -56)} A{r(22)},{r(22)} 0 0 1 {p(10, -38)} '
             f'A{r(22)},{r(22)} 0 0 1 {p(-34, -50)}Z" {F}/>')
    trunk = f'<path d="M{p(-5, 0)} L{p(-3, -42)} M{p(5, 0)} L{p(3, -42)} M{p(0, -50)} L{p(-12, -64)} M{p(2, -54)} L{p(14, -70)}"/>'
    return crown + trunk


def flame(cx, base, s=1.0):
    p = lambda dx, dy: f"{cx + dx * s:.1f},{base + dy * s:.1f}"
    outer = (f'<path d="M{p(0, 0)} C{p(-52, 0)} {p(-60, -60)} {p(-22, -100)} C{p(-24, -70)} {p(-6, -64)} {p(-2, -80)} '
             f'C{p(2, -112)} {p(18, -130)} {p(30, -150)} C{p(30, -120)} {p(66, -90)} {p(50, -40)} C{p(42, -12)} {p(24, 0)} {p(0, 0)}Z" {F}/>')
    inner = f'<path d="M{p(2, -8)} C{p(-22, -8)} {p(-24, -40)} {p(-6, -58)} C{p(-2, -44)} {p(10, -46)} {p(12, -70)} C{p(30, -48)} {p(30, -10)} {p(2, -8)}Z"/>'
    return outer + inner


def ground(y=228, x0=30, x1=370, op=0.6):
    return f'<path d="M{x0},{y} L{x1},{y}" stroke-opacity="{op}"/>'




if __name__ == "__main__":
    import sys

    if len(sys.argv) >= 3 and sys.argv[1] == "vorschau":
        print(vorschau(sys.argv[3:], sys.argv[2]))
    else:
        print("Aufruf: python3 baukasten.py vorschau AUSGABE.jpg datei1.svg datei2.svg …")
