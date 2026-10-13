"""Grafik-Baukasten: Bausteine für Szenen-Grafiken im Piktogramm-Stil.

Claude zeichnet bei jedem Video die Grafiken passend zum jeweiligen Abschnitt NEU
und setzt sie aus diesen Bausteinen zusammen – konkret und mit Details zum Inhalt
(Gegenstände in der Hand, Interaktion zwischen Figuren, Gefühls-Zeichen,
Umgebung), keine allgemeinen Symbolbilder.

Leinwand 400×260 (wird ins Video skaliert), weiße Linien/Flächen, runde Enden.
Regeln des Nutzers: Lebewesen OHNE Augen, Menschen OHNE Gesichtsdetails.
Erlaubt sind z. B. der Schriftzug ٱللَّه als Grafik und Menschen im Feuer.

Wichtigste Bausteine:
  Figur(x, y, h, pose, kleid=, kopftuch=, kappe=, spiegeln=)  .svg, .hand(i), .kopf(), .fuss(i)
      Posen: abwenden, dua, fallen, freude, geben, halten, knien, qiyam, rennen, schuetzen, selbstsicher, sitzen, sitzen_essen, stand, verzweifelt, walk, zeigen
      oder eigenes dict(neck=, hip=, head=, arms=[(ellbogen, hand), …], legs=[(knie, fuss), …], vorne=(…))
  person_sujud, vogel(fluegel="offen"/"angelegt"), bird (einfach), tree, palme, cloud, wave, sun, crescent,
  sparkle, huegel, feld, haus, stein, flammen(verdecken=), ketten, buch, korb, stock, tasche,
  gebetsteppich, schweiss, bewegung, zittern, zeichen("?"), fragezeichen, haken, kreuz, warnschild,
  schriftzug("ٱللَّهُ"), ground, dot
  TRENN = dunkle Farbe für Trennlinien zwischen überlappenden Teilen.

Beispiel (eigenes Skript im Ausgabeordner, Muster: beispiel_mulk_15-19/grafiken_zeichnen.py):

    import sys; sys.path.insert(0, "tools/koran-video")
    from baukasten import *
    f = Figur(160, 236, 160, "halten", kleid=True)
    speichern("grafiken/2-2_buch.svg", f.svg + buch(*f.hand(0), s=.9) + ground(238, 80, 260))
    vorschau(["grafiken/2-2_buch.svg"], "grafiken/vorschau.jpg")
"""

import io
import math
from pathlib import Path

W, H = 400, 260
FONT_FILES = [str(Path(__file__).resolve().parents[2] / "UthmanicHafs.otf")]  # für schriftzug()
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
        png = resvg_py.svg_to_bytes(svg_path=str(p), width=400, height=260, font_files=FONT_FILES)
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


POSES.update({
    # Gegenstand vor der Brust halten (Buch, Schale …) – Hände bei figur.hand(0/1)
    "halten": dict(neck=(0, 78), hip=(0, 42), head=(0, 96), arms=[((-13, 62), (-4, 66)), ((13, 62), (4, 66))],
                   legs=[((-6, 21), (-8, 0)), ((6, 21), (8, 0))], vorne=(0, 1)),
    # etwas nach rechts reichen/geben
    "geben": dict(neck=(0, 78), hip=(0, 42), head=(0, 96), arms=[((-12, 62), (-15, 44)), ((14, 72), (32, 72))],
                  legs=[((-6, 21), (-8, 0)), ((6, 21), (8, 0))]),
    # im Gebet stehen, Hände vor der Brust
    "qiyam": dict(neck=(0, 78), hip=(0, 42), head=(0, 96), arms=[((-12, 62), (-2, 68)), ((12, 62), (3, 70))],
                  legs=[((-6, 21), (-7, 0)), ((6, 21), (7, 0))], vorne=(0, 1)),
    # nach oben zeigen
    "zeigen": dict(neck=(0, 78), hip=(0, 42), head=(1, 96), arms=[((12, 88), (24, 104)), ((-12, 62), (-15, 44))],
                   legs=[((-6, 21), (-8, 0)), ((6, 21), (8, 0))]),
    # Arm schützend über dem Kopf, gegen den Wind gelehnt (nach rechts)
    "schuetzen": dict(neck=(8, 74), hip=(0, 40), head=(13, 90), arms=[((22, 92), (6, 102)), ((24, 80), (34, 92))],
                      legs=[((-12, 20), (-22, 0)), ((10, 20), (14, 0))]),
    # nach hinten fallen, Arme hochgerissen
    "fallen": dict(neck=(-14, 70), hip=(0, 40), head=(-20, 86), arms=[((-26, 84), (-34, 100)), ((-2, 88), (6, 104))],
                   legs=[((10, 22), (4, 2)), ((14, 24), (26, 12))]),
    # rennen (nach rechts)
    "rennen": dict(neck=(6, 78), hip=(0, 42), head=(9, 95), arms=[((-10, 64), (-20, 72)), ((18, 64), (26, 52))],
                   legs=[((-14, 24), (-28, 10)), ((14, 22), (14, 0))]),
    # aufrecht knien (Blick nach rechts), Hände auf den Oberschenkeln
    "knien": dict(neck=(0, 66), hip=(-2, 30), head=(1, 84), arms=[((4, 48), (10, 30)), ((6, 48), (12, 30))],
                  legs=[((4, 4), (-24, 3)), ((4, 4), (-24, 3))]),
    # sitzen und essen (Hand zum Mund)
    "sitzen_essen": dict(neck=(-2, 54), hip=(0, 12), head=(-3, 72), arms=[((10, 44), (4, 64)), ((8, 36), (18, 16))],
                         legs=[((28, 9), (54, 5)), ((28, 9), (54, 5))]),
    # entspannt, Hände in die Hüften (selbstsicher)
    "selbstsicher": dict(neck=(0, 78), hip=(0, 42), head=(0, 96), arms=[((-18, 62), (-6, 48)), ((18, 62), (6, 48))],
                         legs=[((-7, 21), (-10, 0)), ((7, 21), (10, 0))]),
})

TRENN = "#0E141C"   # Trennlinien zwischen überlappenden Teilen (wirkt auf dunklem Grund wie eine Lücke)
_mask_id = [0]


class Figur:
    """Piktogramm-Mensch OHNE Gesicht, mit Zugriff auf die Gelenke (um Dinge in die Hand zu geben).

    f = Figur(200, 236, 150, "halten", kleid=True)
    szene = f.svg + buch(*f.hand(0), s=.8)

    kleid: langes Gewand (Thobe/Kleid) · kopftuch: Kopftuch (Frau) · kappe: Gebetskappe
    pose: Name aus POSES oder eigenes dict (neck, hip, head, arms, legs, optional vorne=(arm-indizes vor dem Körper)).
    spiegeln: Figur blickt nach links statt nach rechts.
    """

    def __init__(self, x, y, h=110, pose="stand", o=1.0, kleid=False, kopftuch=False, kappe=False, spiegeln=False):
        self.x, self.y, self.s = x, y, h / 110
        self.j = POSES[pose] if isinstance(pose, str) else pose
        self.o, self.kleid, self.kopftuch, self.kappe = o, kleid, kopftuch, kappe
        self.m = -1 if spiegeln else 1

    def pt(self, p):
        return self.x + self.m * p[0] * self.s, self.y - p[1] * self.s

    def P(self, p):
        x, y = self.pt(p)
        return f"{x:.1f},{y:.1f}"

    def hand(self, i=0):
        return self.pt(self.j["arms"][i][1])

    def fuss(self, i=0):
        return self.pt(self.j["legs"][i][1])

    def kopf(self):
        """(x, y, radius) des Kopfes."""
        x, y = self.pt(self.j["head"])
        return x, y, 11 * self.s

    @property
    def svg(self):
        j, s = self.j, self.s
        limb, torso = 9 * s, 17 * s
        vorne = set(j.get("vorne", ()))
        out = [f'<g opacity="{self.o}" stroke-width="{limb:.1f}">']
        arm = lambda e, h: f'M{self.P(j["neck"])} L{self.P(e)} L{self.P(h)}'
        for i, (e, h) in enumerate(j["arms"]):
            if i not in vorne:
                out.append(f'<path d="{arm(e, h)}"/>')
        for knee, foot in j["legs"]:
            out.append(f'<path d="M{self.P(j["hip"])} L{self.P(knee)} L{self.P(foot)}"/>')
        out.append(f'<path d="M{self.P(j["neck"])} L{self.P(j["hip"])}" stroke-width="{torso:.1f}"/>')
        if self.kleid:
            nx, ny = j["neck"]
            hx, hy = j["hip"]
            out.append(f'<path d="M{self.P((nx - 8, ny))} L{self.P((hx - 15, hy))} L{self.P((hx - 22, 10))} '
                       f'L{self.P((hx + 22, 10))} L{self.P((hx + 15, hy))} L{self.P((nx + 8, ny))}Z" '
                       f'fill="#fff" stroke-width="{4 * s:.1f}"/>')
        for i, (e, h) in enumerate(j["arms"]):
            if i in vorne:
                out.append(f'<path d="{arm(e, h)}" stroke="{TRENN}" stroke-width="{limb + 5 * s:.1f}"/>')
                out.append(f'<path d="{arm(e, h)}"/>')
        hx, hy, r = self.kopf()
        if self.kopftuch:
            nx, ny = self.pt(j["neck"])
            out.append(f'<path d="M{hx - r * 1.3:.1f},{hy:.1f} A{r * 1.3:.1f},{r * 1.3:.1f} 0 0 1 {hx + r * 1.3:.1f},{hy:.1f} '
                       f'L{nx + r * 1.2:.1f},{ny + r * .5:.1f} L{nx - r * 1.2:.1f},{ny + r * .5:.1f}Z" fill="#fff" stroke="none"/>')
        out.append(f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="{r:.1f}" fill="#fff" stroke="none"/>')
        if self.kappe:
            out.append(f'<path d="M{hx - r * 1.05:.1f},{hy - r * .25:.1f} A{r * 1.05:.1f},{r * 1.05:.1f} 0 0 1 {hx + r * 1.05:.1f},{hy - r * .25:.1f}Z" '
                       f'fill="#fff" stroke="{TRENN}" stroke-width="{2.5 * s:.1f}"/>')
        out.append("</g>")
        return "".join(out)


def person(x, y, h=110, pose="stand", o=1.0, **kw):
    """Kurzform: Figur(...).svg"""
    return Figur(x, y, h, pose, o, **kw).svg


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




# ----------------------------------------------------------------- Requisiten & Zeichen
def buch(x, y, s=1.0, offen=True):
    """Buch, Mittelpunkt (x, y)."""
    if offen:
        return (f'<g transform="translate({x},{y}) scale({s})">'
                f'<path d="M0,-6 C-8,-12 -22,-13 -30,-10 L-30,12 C-22,9 -8,10 0,16 C8,10 22,9 30,12 L30,-10 C22,-13 8,-12 0,-6Z" fill="#fff" stroke-width="3"/>'
                f'<path d="M0,-6 L0,16 M-24,-4 L-6,-2 M-24,2 L-6,4 M6,-2 L24,-4 M6,4 L24,2" stroke="{TRENN}" stroke-width="2"/></g>')
    return (f'<g transform="translate({x},{y}) scale({s})"><rect x="-16" y="-20" width="32" height="40" rx="3" fill="#fff" stroke="none"/>'
            f'<path d="M-10,-12 L10,-12 M-10,-6 L6,-6" stroke="{TRENN}" stroke-width="2.5"/></g>')


def korb(x, y, s=1.0, fruechte=True):
    """Korb (Unterkante Mitte bei x, y), optional mit Früchten."""
    f = "".join(f'<circle cx="{dx}" cy="{dy}" r="{r}" fill="#fff" stroke="{TRENN}" stroke-width="2"/>'
                for dx, dy, r in [(-22, -38, 9), (-4, -42, 11), (16, -38, 9), (-12, -46, 7), (8, -50, 7)]) if fruechte else ""
    return (f'<g transform="translate({x},{y}) scale({s})">{f}'
            f'<path d="M-34,-34 L34,-34 L26,0 L-26,0Z" fill="#fff" fill-opacity="0.15"/>'
            f'<path d="M-30,-22 L30,-22 M-28,-11 L28,-11" stroke-width="2.5" stroke-opacity="0.7"/></g>')


def stock(hand, laenge=60, winkel=8):
    """Wanderstock von der Hand schräg zum Boden."""
    x, y = hand
    a = math.radians(90 - winkel)
    return f'<path d="M{x:.1f},{y - 8:.1f} L{x + laenge * math.cos(a):.1f},{y + laenge * math.sin(a):.1f}" stroke-width="4"/>'


def tasche(x, y, s=1.0):
    """Umhängetasche/Bündel, Mittelpunkt."""
    return f'<g transform="translate({x},{y}) scale({s})"><path d="M-12,-8 Q0,-14 12,-8 L14,10 Q0,16 -14,10Z" fill="#fff" stroke="{TRENN}" stroke-width="2"/></g>'


def gebetsteppich(x, y, w=120, s=1.0):
    """Gebetsteppich, linke Unterkante (x, y)."""
    h = 10 * s
    return (f'<path d="M{x},{y} L{x + w * s},{y} L{x + w * s - 8 * s},{y - h} L{x + 8 * s},{y - h}Z" fill="#fff" fill-opacity="0.2"/>'
            f'<path d="M{x + 14 * s},{y - h / 2} L{x + w * s - 14 * s},{y - h / 2}" stroke-width="2" stroke-dasharray="4 5"/>')


def schweiss(x, y, s=1.0, n=3):
    """Schweißtropfen/Angsttropfen neben dem Kopf."""
    out = []
    for i in range(n):
        dx, dy = i * 9 * s, -i * 7 * s
        out.append(f'<path d="M{x + dx:.1f},{y + dy - 7 * s:.1f} Q{x + dx + 5 * s:.1f},{y + dy:.1f} {x + dx:.1f},{y + dy + 3 * s:.1f} '
                   f'Q{x + dx - 5 * s:.1f},{y + dy:.1f} {x + dx:.1f},{y + dy - 7 * s:.1f}Z" fill="#fff" stroke="none"/>')
    return "".join(out)


def bewegung(x, y, richtung=1, n=3, laenge=26, s=1.0):
    """Bewegungslinien (richtung 1 = Bewegung nach rechts, Linien links davon)."""
    return "".join(f'<path d="M{x - richtung * (6 + i % 2 * 8) * s:.1f},{y + (i - (n - 1) / 2) * 10 * s:.1f} '
                   f'l{-richtung * laenge * s * (1 - i % 2 * .3):.1f},0" stroke-width="3" stroke-opacity="0.7"/>' for i in range(n))


def zittern(x, y, h=40, s=1.0):
    """Zitter-/Bebe-Bögen links und rechts eines Punktes."""
    return (f'<path d="M{x - 20 * s},{y - h / 2} Q{x - 30 * s},{y} {x - 20 * s},{y + h / 2} M{x + 20 * s},{y - h / 2} '
            f'Q{x + 30 * s},{y} {x + 20 * s},{y + h / 2}" stroke-width="3" stroke-opacity="0.7"/>')


def zeichen(x, y, text="?", groesse=28):
    """Kleines Zeichen wie ? ! ?? über einer Figur."""
    return (f'<text x="{x}" y="{y}" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" '
            f'font-size="{groesse}" fill="#fff" stroke="none">{text}</text>')


def schriftzug(text, x=200, y=170, groesse=110):
    """Arabischer Schriftzug als Grafik (z. B. ٱللَّه, ٱلرَّحْمَٰن) in Uthmani-Schrift."""
    return (f'<text x="{x}" y="{y}" text-anchor="middle" font-family="KFGQPC HAFS Uthmanic Script" '
            f'font-size="{groesse}" fill="#fff" stroke="none">{text}</text>')


def flammen(x, y, breite=220, hoehe=120, n=5, verdecken=True):
    """Flammenfeld (Unterkante Mitte x, y). verdecken=True: Flammen verdecken, was dahinter steht
    (z. B. eine Figur, die knietief im Feuer steht – Figur VOR den Flammen zeichnen)."""
    fill = f'fill="{TRENN}"' if verdecken else F
    out = []
    for i in range(n):
        fx = x - breite / 2 + breite * (i + .5) / n
        h = hoehe * (0.55 + 0.45 * math.sin(math.pi * (i + .5) / n)) * (0.85 + 0.3 * ((i * 37) % 7) / 7)
        w = breite / n * 1.25
        lean = (1 if i % 2 else -1) * w * 0.18
        out.append(f'<path d="M{fx - w / 2:.1f},{y} C{fx - w / 2:.1f},{y - h * .45:.1f} {fx - w * .2 + lean:.1f},{y - h * .55:.1f} '
                   f'{fx + lean:.1f},{y - h:.1f} C{fx + w * .1 + lean:.1f},{y - h * .7:.1f} {fx + w * .2:.1f},{y - h * .62:.1f} '
                   f'{fx + w * .28:.1f},{y - h * .78:.1f} C{fx + w * .5:.1f},{y - h * .5:.1f} {fx + w / 2:.1f},{y - h * .3:.1f} {fx + w / 2:.1f},{y}Z" '
                   f'{fill} stroke-width="4"/>')
        ih = h * 0.45
        out.append(f'<path d="M{fx - w * .18:.1f},{y - 4} C{fx - w * .2:.1f},{y - ih * .5:.1f} {fx:.1f},{y - ih * .7:.1f} {fx + lean * .5:.1f},{y - ih:.1f} '
                   f'C{fx + w * .1:.1f},{y - ih * .6:.1f} {fx + w * .2:.1f},{y - ih * .4:.1f} {fx + w * .18:.1f},{y - 4}" stroke-width="3" stroke-opacity="0.8"/>')
    return "".join(out)


def ketten(x1, y1, x2, y2, glieder=6):
    """Kette zwischen zwei Punkten."""
    out = []
    for i in range(glieder):
        t = (i + .5) / glieder
        cx, cy = x1 + (x2 - x1) * t, y1 + (y2 - y1) * t
        ang = math.degrees(math.atan2(y2 - y1, x2 - x1)) + (0 if i % 2 else 90) * 0
        rx = math.hypot(x2 - x1, y2 - y1) / glieder * 0.6
        out.append(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx:.1f}" ry="{rx * (0.45 if i % 2 else 0.25):.1f}" '
                   f'transform="rotate({ang:.0f} {cx:.1f} {cy:.1f})" stroke-width="3"/>')
    return "".join(out)


def haus(x, y, w=50, h=40, tuer=True):
    """Haus, linke Unterkante (x, y)."""
    t = (f'<path d="M{x + w / 2 - 7},{y} L{x + w / 2 - 7},{y - 16} L{x + w / 2 + 7},{y - 16} L{x + w / 2 + 7},{y}" stroke="{TRENN}" stroke-width="3"/>'
         if tuer else "")
    return f'<path d="M{x},{y} L{x},{y - h} L{x + w / 2},{y - h - 22} L{x + w},{y - h} L{x + w},{y}Z" fill="#fff" fill-opacity="0.15"/>' + t


def feld(x, y, w=160, h=40, reihen=5):
    """Bestelltes Feld mit Furchen (perspektivisch), linke Unterkante."""
    out = [f'<path d="M{x},{y} L{x + w},{y} L{x + w * .8},{y - h} L{x + w * .2},{y - h}Z" fill="#fff" fill-opacity="0.08"/>']
    for i in range(1, reihen):
        t = i / reihen
        out.append(f'<path d="M{x + w * t},{y} L{x + w * .2 + w * .6 * t},{y - h}" stroke-width="2.5" stroke-opacity="0.6"/>')
    return "".join(out)


def stein(x, y, r):
    return (f'<path d="M{x},{y} l{r},{-r * .45:.1f} l{r * .7:.1f},{r * .8:.1f} l{-r * .5:.1f},{r * .75:.1f} '
            f'l{-r * 1.1:.1f},{-r * .2:.1f}Z" fill="#fff" fill-opacity="0.85" stroke-width="2.5"/>')


def warnschild(x=200, y=240, s=1.0):
    """Warndreieck mit Ausrufezeichen, Unterkante Mitte (x, y)."""
    return (f'<g transform="translate({x},{y}) scale({s})"><path d="M0,-200 L120,0 L-120,0Z" fill="#fff" fill-opacity="0.1" stroke-width="9"/>'
            f'<path d="M0,-140 L0,-70" stroke-width="18"/><circle cx="0" cy="-36" r="11" fill="#fff" stroke="none"/></g>')


def fragezeichen(x, y, s=1.0):
    """Großes Fragezeichen (Mittelpunkt etwa x, y)."""
    P = lambda dx, dy: f"{x + dx * s:.1f},{y + dy * s:.1f}"
    return (f'<path d="M{P(-26, -46)} C{P(-26, -78)} {P(-4, -90)} {P(10, -90)} C{P(32, -90)} {P(46, -74)} {P(46, -54)} '
            f'C{P(46, -30)} {P(22, -24)} {P(14, -8)} L{P(14, 4)}" stroke-width="{16 * s:.1f}"/>'
            f'<circle cx="{x + 14 * s:.1f}" cy="{y + 28 * s:.1f}" r="{9 * s:.1f}" fill="#fff" stroke="none"/>')


def haken(x, y, s=1.0):
    return f'<path d="M{x - 55 * s:.1f},{y:.1f} L{x - 10 * s:.1f},{y + 45 * s:.1f} L{x + 60 * s:.1f},{y - 50 * s:.1f}" stroke-width="{22 * s:.1f}"/>'


def kreuz(x, y, s=1.0):
    d = 50 * s
    return f'<path d="M{x - d},{y - d} L{x + d},{y + d} M{x + d},{y - d} L{x - d},{y + d}" stroke-width="{22 * s:.1f}"/>'


def huegel(y=170, op=0.75):
    return (f'<path d="M0,{y} Q80,{y - 50} 170,{y - 15} Q260,{y + 20} 400,{y - 40}" stroke-opacity="{op}"/>'
            f'<path d="M0,{y + 50} Q120,{y + 5} 230,{y + 35} Q320,{y + 60} 400,{y + 25}"/>')


def palme(x, y, s=1.0, datteln=True):
    P = lambda dx, dy: f"{x + dx * s:.1f},{y + dy * s:.1f}"
    fr = "".join(f'<path d="M{P(4, -118)} Q{P(4 + dx * .5, -118 + dy - 26)} {P(4 + dx, -118 + dy)}"/>'
                 for dx, dy in [(-62, 12), (-46, 40), (-20, 50), (62, 8), (48, 38), (24, 52), (-14, -40), (24, -38)])
    d = "".join(dot(x + dx * s, y + dy * s, 5 * s, .95) for dx, dy in [(-4, -104), (6, -100), (0, -94), (-10, -96)]) if datteln else ""
    return f'<path d="M{P(-2, 0)} C{P(2, -40)} {P(-6, -80)} {P(4, -118)}" stroke-width="7"/>' + fr + d



def vogel(x, y, s=1.0, fluegel="offen", spiegeln=False, o=1.0):
    """Detaillierter Vogel OHNE Auge (Silhouette). fluegel: "offen" (ausgebreitet) oder "angelegt" (gleitend)."""
    m = -1 if spiegeln else 1
    body = ('<ellipse cx="0" cy="0" rx="26" ry="9" fill="#fff" stroke="none" transform="rotate(-6)"/>'
            '<circle cx="28" cy="-7" r="8" fill="#fff" stroke="none"/>'
            '<path d="M35,-9 L48,-5 L35,-2Z" fill="#fff" stroke="none"/>'
            '<path d="M-22,-2 L-46,-12 L-40,0 L-46,10 L-22,4Z" fill="#fff" stroke="none"/>')
    if fluegel == "offen":
        wings = ('<path d="M-6,-4 C-18,-30 -38,-52 -66,-60 L-58,-50 L-66,-46 L-54,-40 L-60,-33 L-44,-28 C-30,-18 -18,-8 -8,2Z" '
                 'fill="#fff" stroke="none"/>'
                 f'<path d="M4,-6 C10,-34 28,-58 54,-70 L50,-58 L60,-56 L50,-46 L58,-42 L44,-34 C34,-22 20,-10 10,0Z" '
                 f'fill="#fff" stroke="{TRENN}" stroke-width="3"/>')
    else:
        wings = f'<path d="M-14,-4 C6,-16 26,-12 32,-2 C10,0 -6,4 -14,-4Z" fill="#fff" stroke="{TRENN}" stroke-width="3"/>'
    return (f'<g transform="translate({x},{y}) scale({m * s},{s})" opacity="{o}">' + body + wings + '</g>')


if __name__ == "__main__":
    import sys

    if len(sys.argv) >= 3 and sys.argv[1] == "vorschau":
        print(vorschau(sys.argv[3:], sys.argv[2]))
    else:
        print("Aufruf: python3 baukasten.py vorschau AUSGABE.jpg datei1.svg datei2.svg …")
