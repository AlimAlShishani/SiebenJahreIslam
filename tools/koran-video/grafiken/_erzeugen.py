"""Erzeugt die Motiv-Bibliothek (SVG-Strichgrafiken) für tools/koran-video/grafiken/.

Stil: weiße Linien (4 px auf 400x260), runde Enden, sparsame Flächen mit 12 % Deckkraft.
Regeln: Lebewesen ohne Augen, Menschen als Strichmännchen ohne Gesicht.
"""
import json
import math
import sys
from pathlib import Path

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
W, H = 400, 260
F = 'fill="#fff" fill-opacity="0.12"'      # zarte Fläche
FS = 'fill="#fff" stroke="none"'            # voll gefüllt
MOTIVE = {}


def svg(body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none" stroke="#fff" '
            f'stroke-width="4" stroke-linecap="round" stroke-linejoin="round">\n{body}\n</svg>\n')


def motiv(name, beschreibung, stichwoerter, body):
    MOTIVE[name] = {"beschreibung": beschreibung, "stichwoerter": stichwoerter}
    (OUT / f"{name}.svg").write_text(svg(body), "utf-8")


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
    """Piktogramm-Mensch ohne Gesicht. (x, y) = Fußpunkt, h = Größe."""
    s = h / 110
    j = POSES[pose]
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


# ================================================================= Himmel & Licht
motiv("sterne", "Sternenhimmel mit funkelnden Sternen", ["Sterne", "Sternbild", "Himmel geschmückt", "Lampen"],
      sparkle(200, 110, 34) + sparkle(110, 70, 18) + sparkle(300, 60, 22) + sparkle(320, 170, 14) + sparkle(90, 180, 12)
      + sparkle(250, 200, 10, .8) + "".join(dot(x, y, r, o) for x, y, r, o in
                                              [(150, 40, 2.5, .8), (60, 120, 2, .6), (360, 110, 2.5, .7), (170, 190, 2, .6),
                                               (240, 40, 2, .6), (350, 220, 2, .5), (40, 60, 2, .5), (270, 130, 2, .6)]))
motiv("sternschnuppen", "Sternschnuppen / Geschosse am Himmel", ["Geschosse", "Sternschnuppe", "Flammenstrahl", "Feuerschweif"],
      "".join(f'<path d="M{x},{y} L{x - l},{y + l * 0.55}" stroke-opacity="{o}"/>{sparkle(x, y, 10, 1)}'
              for x, y, l, o in [(320, 50, 150, .7), (230, 110, 110, .55), (360, 150, 90, .5)])
      + sparkle(110, 60, 8, .7) + dot(80, 150, 2, .6) + dot(160, 200, 2, .5))
motiv("mond", "Mondsichel mit Sternen", ["Mond", "Mondsichel", "Neumond", "Mondphasen"],
      crescent(190, 130, 72) + sparkle(290, 80, 16) + sparkle(270, 170, 9, .8) + dot(320, 130, 2.5) + dot(110, 50, 2, .6))
motiv("sonne", "Sonne mit Strahlen", ["Sonne", "Sonnenlicht", "Helligkeit", "Vormittag"], sun(200, 130, 46))
motiv("sonne_mond", "Sonne und Mond, jeweils auf ihrer Umlaufbahn", ["Sonne und Mond", "Umlaufbahn", "Tag und Nacht", "dienstbar gemacht"],
      '<ellipse cx="200" cy="130" rx="175" ry="62" stroke-opacity="0.45" stroke-dasharray="2 12"/>'
      + sun(115, 120, 30, 10, 1.4, 1.85) + crescent(290, 125, 38, .15))
motiv("sieben_himmel", "Sieben Himmel übereinander in Schichten", ["sieben Himmel", "Schichten", "übereinander", "Himmel"],
      ground(232, 10, 390, .7) + "".join(
          f'<path d="M{200 - rx},{232} A{rx},{rx * 0.92:.0f} 0 0 1 {200 + rx},{232}" stroke-opacity="{1 - i * 0.11:.2f}" stroke-width="{4 - i * 0.3:.1f}"/>'
          for i, rx in enumerate([30, 55, 80, 105, 130, 155, 180])) + sparkle(200, 214, 7))
motiv("licht", "Strahlendes Licht", ["Licht", "Nur", "erleuchtet", "Rechtleitung"],
      f'<circle cx="200" cy="130" r="26" {FS} fill-opacity="0.9"/>' + "".join(
          f'<line x1="{200 + 40 * math.cos(a):.1f}" y1="{130 + 40 * math.sin(a):.1f}" x2="{200 + (70 if i % 2 else 105) * math.cos(a):.1f}" '
          f'y2="{130 + (70 if i % 2 else 105) * math.sin(a):.1f}" stroke-width="{3 if i % 2 else 4}" stroke-opacity="{0.6 if i % 2 else 1}"/>'
          for i, a in enumerate(2 * math.pi * k / 24 for k in range(24))))
motiv("lampe", "Lampe in einer Nische, Glas wie ein funkelnder Stern (Lichtvers)", ["Nische", "Lampe", "Glas", "Licht über Licht", "Öl"],
      '<path d="M120,236 L120,110 A80,80 0 0 1 280,110 L280,236" stroke-opacity="0.7"/>'
      '<path d="M200,40 L200,70"/><path d="M178,70 L222,70 L214,82 L186,82Z"/>'
      '<path d="M186,82 C150,110 150,170 186,190 L214,190 C250,170 250,110 214,82" fill="#fff" fill-opacity="0.12"/>'
      '<path d="M200,165 C188,152 192,138 200,124 C208,138 212,152 200,165Z" fill="#fff" fill-opacity="0.9" stroke="none"/>'
      '<path d="M182,190 L218,190 L210,204 L190,204Z"/>' + sparkle(200, 145, 4, .0) +
      "".join(f'<line x1="{200 + 72 * math.cos(a):.1f}" y1="{144 + 72 * math.sin(a):.1f}" x2="{200 + 88 * math.cos(a):.1f}" y2="{144 + 88 * math.sin(a):.1f}" stroke-opacity="0.6" stroke-width="3"/>'
              for a in [math.radians(d) for d in (200, 225, 315, 340)]))
motiv("sonnenaufgang", "Sonnenaufgang / Morgendämmerung über dem Horizont", ["Morgendämmerung", "Morgen", "Tagesanbruch", "Fadschr", "Morgenröte"],
      ground(190, 20, 380, .9) + '<path d="M140,190 A60,60 0 0 1 260,190" fill="#fff" fill-opacity="0.12"/>'
      + "".join(f'<line x1="{200 + 76 * math.cos(a):.1f}" y1="{190 + 76 * math.sin(a):.1f}" x2="{200 + 104 * math.cos(a):.1f}" y2="{190 + 104 * math.sin(a):.1f}"/>'
                for a in [math.radians(d) for d in range(195, 350, 22)]) + wave(214, 70, 330, 5, 40, 3, .5) + wave(234, 110, 290, 4, 36, 3, .35))
motiv("nacht", "Nacht: Mondsichel und Sterne über Hügeln", ["Nacht", "Dunkelheit", "wenn sie hereinbricht", "Abend"],
      '<path d="M10,230 Q100,170 190,210 Q280,160 390,215" stroke-opacity="0.8"/>' + crescent(270, 80, 40, .15)
      + sparkle(120, 60, 12) + sparkle(180, 120, 7, .8) + dot(80, 120, 2) + dot(340, 140, 2, .6) + dot(220, 40, 2, .7))

# ================================================================= Wetter & Wasser
motiv("wolken", "Wolken", ["Wolken", "Schatten", "Wolkenschatten"], cloud(160, 120, 1.15) + cloud(285, 160, 0.75))
motiv("regen", "Wolke mit Regen", ["Regen", "Wasser vom Himmel", "herabgesandt", "Wolken", "beleben"],
      cloud(200, 80, 1.15) + "".join(f'<line x1="{x}" y1="{y}" x2="{x - 8}" y2="{y + 22}" stroke-opacity="0.85"/>'
                                     for x, y in [(140, 140), (175, 155), (210, 140), (245, 158), (280, 140), (160, 195), (195, 210), (230, 195), (265, 212)]))
motiv("gewitter", "Gewitterwolke mit Blitz", ["Blitz", "Donner", "Gewitter", "Furcht und Hoffnung"],
      cloud(200, 80, 1.2) + '<path d="M210,110 L185,165 L212,165 L190,225" stroke-width="5"/>'
      + "".join(f'<line x1="{x}" y1="{y}" x2="{x - 7}" y2="{y + 18}" stroke-opacity="0.6"/>' for x, y in [(135, 140), (150, 180), (265, 140), (280, 180)]))
motiv("wind", "Wind", ["Wind", "Winde", "Sturm", "treiben"],
      '<path d="M40,90 L250,90 C290,90 300,40 262,36 C236,34 232,62 248,66"/>'
      '<path d="M70,140 L320,140 C360,140 368,190 330,194 C306,196 300,170 314,166"/>'
      '<path d="M30,190 L200,190" stroke-opacity="0.6"/><path d="M110,60 L170,60" stroke-opacity="0.5"/>')
motiv("steinsturm", "Sturm, der Steine mit sich trägt", ["Steinsturm", "Sandsturm", "Steine", "Sturmwind", "Steinregen", "Vögel in Scharen werfen Steine"],
      '<path d="M30,80 L240,80 C280,80 286,36 254,34" stroke-opacity="0.8"/><path d="M60,130 L300,130" stroke-opacity="0.6"/>'
      '<path d="M40,180 L250,180 C290,180 296,224 264,226" stroke-opacity="0.8"/>'
      + "".join(f'<path d="M{x},{y} l{r},{-r * .4:.1f} l{r * .6:.1f},{r * .8:.1f} l{-r * .5:.1f},{r * .7:.1f} l{-r},{-r * .2:.1f}Z" {F}/>'
                for x, y, r in [(300, 70, 14), (340, 120, 10), (320, 170, 16), (360, 210, 9), (280, 110, 8)]))
motiv("meer", "Meer mit Wellen", ["Meer", "Meere", "Wellen", "Ozean"],
      wave(110, 20, 380, 12, 70) + wave(150, 40, 360, 10, 60, 4, .8) + wave(190, 20, 380, 9, 54, 4, .6) + wave(226, 60, 340, 7, 48, 3, .4))
motiv("wellen_wolken", "Tiefes Meer: Wellen über Wellen, darüber Wolken (Finsternisse)", ["Finsternisse übereinander", "tiefes Meer", "Woge über Woge"],
      cloud(200, 50, 0.9) + wave(130, 20, 380, 12, 70, 4, .9) + wave(162, 30, 370, 11, 64, 4, .7) + wave(194, 20, 380, 10, 58, 4, .5)
      + wave(226, 30, 370, 9, 52, 4, .3))
motiv("zwei_meere", "Zwei Meere, die sich treffen, mit einer Schranke dazwischen", ["zwei Meere", "Schranke", "süß und salzig", "Barriere"],
      wave(90, 20, 180, 9, 46) + wave(130, 20, 180, 9, 46, 4, .7) + wave(170, 20, 180, 9, 46, 4, .5)
      + wave(100, 220, 380, 9, 46) + wave(140, 220, 380, 9, 46, 4, .7) + wave(180, 220, 380, 9, 46, 4, .5)
      + '<path d="M200,50 L200,220" stroke-dasharray="4 14" stroke-opacity="0.8"/>')
motiv("wasser", "Wassertropfen / Quelle", ["Wasser", "Quelle", "fließendes Wasser", "Wasser versickert", "trinken"],
      '<path d="M200,40 C200,40 140,120 140,160 A60,60 0 0 0 260,160 C260,120 200,40 200,40Z" fill="#fff" fill-opacity="0.12"/>'
      '<path d="M172,165 A30,30 0 0 0 196,190" stroke-opacity="0.7"/>'
      '<ellipse cx="200" cy="236" rx="90" ry="12" stroke-opacity="0.5"/><ellipse cx="200" cy="236" rx="140" ry="18" stroke-opacity="0.25"/>')
motiv("schiff", "Schiff auf dem Meer", ["Schiff", "Schiffe", "Arche", "Boot", "Seefahrt"],
      '<path d="M100,170 L300,170 L270,205 L130,205Z" fill="#fff" fill-opacity="0.12"/><path d="M200,170 L200,40"/>'
      '<path d="M200,48 L200,160 L120,160Z" fill="#fff" fill-opacity="0.12"/><path d="M206,60 L206,160 L272,160Z" fill="#fff" fill-opacity="0.08"/>'
      + wave(222, 30, 370, 8, 50, 4, .8) + wave(246, 60, 340, 6, 44, 3, .45))
motiv("perlen", "Perlen und Korallen", ["Perlen", "Korallen", "Schmuck aus dem Meer", "Edelsteine"],
      '<path d="M120,230 L120,170 M120,195 L95,160 M120,180 L148,140 M148,140 L140,110 M148,140 L172,122 M95,160 L82,130 M95,160 L70,166"/>'
      + f'<circle cx="250" cy="150" r="30" {F}/><circle cx="305" cy="185" r="20" {F}/><circle cx="220" cy="205" r="16" {F}/>'
      + sparkle(240, 140, 6, .9) + sparkle(298, 178, 4, .9) + wave(236, 30, 370, 5, 40, 3, .4))

# ================================================================= Erde & Pflanzen
motiv("berge", "Berge", ["Berge", "Pflöcke", "fest gegründet", "Gebirge"],
      '<path d="M20,230 L130,80 L190,160 L250,60 L380,230" fill="#fff" fill-opacity="0.08"/>'
      '<path d="M108,110 L130,80 L152,110 L140,104 L128,114 L118,104Z" fill="#fff" fill-opacity="0.5"/>'
      '<path d="M226,92 L250,60 L276,96 L262,90 L250,100 L238,90Z" fill="#fff" fill-opacity="0.5"/>' + ground(230, 10, 390, .7))
motiv("erde_wege", "Hügeliges Land mit Wegen zum Darauf-Gehen", ["Erde", "Wege", "gefügig gemacht", "Pfade", "umhergehen", "Land"],
      '<path d="M10,150 Q90,110 170,140 Q260,175 390,120" stroke-opacity="0.7"/><path d="M10,200 Q120,160 220,190 Q310,215 390,175"/>'
      '<path d="M230,238 C220,210 160,200 175,180 C190,160 250,160 240,140 C232,126 205,128 210,118" stroke-dasharray="10 12"/>'
      + tree(90, 150, .45) + tree(330, 140, .4))
motiv("erde_beben", "Bebende Erde mit Rissen", ["Erdbeben", "Erschütterung", "verschlingen", "versinken", "erbeben", "beben", "Wanken"],
      '<path d="M20,170 L150,170 L170,150 L190,182 L214,160 L236,176 L380,176" stroke-width="5"/>'
      '<path d="M190,182 L196,214 L184,236 M214,160 L222,196" stroke-opacity="0.7"/>'
      '<path d="M60,140 Q50,120 60,100 M90,140 Q80,118 90,96" stroke-opacity="0.5"/><path d="M310,146 Q320,124 310,102 M340,146 Q350,122 340,98" stroke-opacity="0.5"/>'
      '<path d="M20,210 L130,210 M260,214 L380,214" stroke-opacity="0.4"/>')
motiv("pflanze", "Keimende Pflanze aus der Erde", ["Pflanze", "keimen", "sprießen", "Leben", "Saat", "hervorbringen", "beleben", "tote Erde"],
      '<path d="M90,214 Q200,186 310,214" fill="#fff" fill-opacity="0.08"/><path d="M60,224 L340,224" stroke-opacity="0.6"/>'
      '<path d="M200,200 C200,170 204,140 200,110"/>'
      '<path d="M201,140 C170,140 150,120 146,96 C176,94 196,112 201,140Z" fill="#fff" fill-opacity="0.12"/>'
      '<path d="M200,116 C226,112 246,90 248,66 C220,66 202,86 200,116Z" fill="#fff" fill-opacity="0.12"/>')
motiv("baum", "Baum", ["Baum", "Bäume", "guter Baum", "Wurzel fest"], tree(200, 230, 1.9) + ground(230, 90, 310, .6))
motiv("palme", "Dattelpalme mit Datteln", ["Palme", "Dattelpalme", "Datteln", "Palmen"],
      '<path d="M196,232 C200,190 192,150 206,96" stroke-width="7"/>'
      + "".join(f'<path d="M206,96 Q{206 + dx * .5},{96 + dy - 30} {206 + dx},{96 + dy}"/>' for dx, dy in
                [(-80, 10), (-60, 40), (-30, 52), (80, 6), (64, 40), (32, 54), (-20, -50), (30, -48)])
      + "".join(dot(x, y, 6, .9) for x, y in [(196, 112), (206, 116), (214, 110), (202, 124), (190, 122)]) + ground(232, 120, 280, .6))
motiv("garten_fluss", "Garten mit Bäumen, unter dem ein Fluss fließt", ["Gärten", "Paradies", "darunter Flüsse", "Garten", "Fluss"],
      tree(90, 150, .9) + tree(310, 145, .85) + tree(200, 120, .6)
      + '<path d="M150,250 C170,210 230,200 220,170 C214,150 196,150 200,130" stroke-opacity="0.9"/>'
      + '<path d="M250,250 C262,214 266,196 250,170 C240,154 222,148 222,130" stroke-opacity="0.9"/>'
      + '<path d="M185,215 q10,-6 20,0 M205,185 q8,-5 16,0" stroke-opacity="0.5" stroke-width="3"/>' + ground(170, 20, 380, .4))
motiv("trauben", "Weintrauben mit Blatt", ["Trauben", "Weinstöcke", "Früchte", "Rebstöcke"],
      '<path d="M200,40 C200,60 196,70 190,78"/><path d="M204,56 C236,30 270,44 270,70 C250,70 230,72 204,56Z" fill="#fff" fill-opacity="0.12"/>'
      + "".join(f'<circle cx="{x}" cy="{y}" r="15" {F}/>' for x, y in
                [(170, 95), (200, 92), (230, 98), (155, 124), (185, 122), (215, 124), (245, 128), (170, 152), (200, 152), (230, 156), (185, 180), (215, 182), (200, 208)]))
motiv("granatapfel", "Granatapfel", ["Granatäpfel", "Granatapfel", "Früchte", "Oliven"],
      '<path d="M200,70 C140,70 115,120 120,160 C126,206 170,230 200,230 C232,230 276,206 280,160 C285,120 260,70 200,70Z" fill="#fff" fill-opacity="0.12"/>'
      '<path d="M184,74 L178,50 L192,60 L200,44 L208,60 L222,50 L216,74"/><path d="M160,120 C150,140 150,170 166,190" stroke-opacity="0.5"/>')
motiv("weizen", "Kornähren (ein Korn, das sieben Ähren wachsen lässt)", ["Korn", "Ähren", "sieben Ähren", "Saatkorn", "Getreide"],
      "".join(f'<path d="M200,238 Q{200 + dx * .3:.0f},{170} {200 + dx},{90 + abs(dx) * .35:.0f}"/>' for dx in (-120, -80, -40, 0, 40, 80, 120))
      + "".join(f'<ellipse cx="{200 + dx}" cy="{70 + abs(dx) * .35:.0f}" rx="9" ry="24" {F} transform="rotate({dx * .25:.0f} {200 + dx} {70 + abs(dx) * .35:.0f})"/>'
                for dx in (-120, -80, -40, 0, 40, 80, 120)))
motiv("ruinen", "Verlassene Ruinen eingestürzter Häuser", ["Ruinen", "eingestürzt", "zerstörte Städte", "frühere Völker", "die vor ihnen", "vor ihnen waren", "Spuren"],
      '<path d="M60,230 L60,110 L130,110 L130,230" stroke-opacity="0.9"/><path d="M60,110 L95,80 L130,110" stroke-opacity="0.5" stroke-dasharray="6 10"/>'
      '<path d="M84,230 L84,190 L106,190 L106,230"/><path d="M180,230 L180,150 L196,140 L210,160 L210,230"/>'
      '<path d="M250,230 L250,120 L330,120 L330,170 L300,200 L300,230"/><path d="M270,140 L290,140 L290,160 L270,160Z"/>'
      '<path d="M226,230 l14,-14 l16,8 l-6,12Z M340,230 l10,-12 l14,6 l0,10Z" fill="#fff" fill-opacity="0.12"/>' + ground(230, 20, 380, .7))
motiv("feuer", "Flammen / Feuer", ["Feuer", "Flammen", "Höllenfeuer", "lodernd", "Brennstoff"], flame(200, 230, 1.35))

# ================================================================= Tiere (ohne Augen)
motiv("voegel", "Vögel im Flug, Flügel ausgebreitet", ["Vögel", "Flügel ausbreiten", "fliegen", "über ihnen", "Vogelschwärme"],
      bird(200, 110, 46) + bird(120, 70, 28, .9) + bird(290, 70, 32, .9) + bird(90, 150, 20, .7, 3) + bird(320, 150, 22, .7, 3)
      + bird(250, 190, 16, .55, 3) + bird(160, 196, 14, .5, 3))
motiv("kamel", "Kamel (ohne Augen)", ["Kamel", "Kamele", "Kamelstute", "Lasttiere"],
      '<path d="M112,128 C120,96 150,70 172,72 C196,74 204,104 222,110 C236,114 246,96 254,76 C260,62 272,56 284,60 '
      'L300,66 C306,70 304,78 296,80 L286,82 C278,104 270,130 254,150 C240,166 200,166 176,166 C150,166 120,160 112,128Z" fill="#fff" fill-opacity="0.12"/>'
      '<path d="M134,160 L130,232 M152,164 L156,232 M228,164 L224,232 M246,156 L252,232"/><path d="M112,128 C102,138 100,150 104,162" stroke-width="3"/>'
      + ground(234, 70, 330, .5))
motiv("vieh", "Schaf / Weidevieh (ohne Augen)", ["Vieh", "Herdentiere", "Schafe", "Weide", "Nutzvieh"],
      '<path d="M120,150 A24,24 0 0 1 140,110 A28,28 0 0 1 190,98 A28,28 0 0 1 240,106 A24,24 0 0 1 262,150 '
      'A22,22 0 0 1 230,176 A26,26 0 0 1 180,180 A24,24 0 0 1 136,172 A20,20 0 0 1 120,150Z" fill="#fff" fill-opacity="0.12"/>'
      '<path d="M258,124 C270,106 296,104 304,122 C310,138 296,152 280,150 C270,148 262,140 258,124Z" fill="#fff" fill-opacity="0.25"/>'
      '<path d="M282,108 L274,96" /><path d="M150,176 L148,226 M170,180 L172,226 M216,180 L214,226 M236,174 L240,226"/>' + ground(228, 90, 330, .5))
motiv("biene", "Biene mit Waben (ohne Augen)", ["Biene", "Bienen", "Honig", "Waben", "Heilung"],
      "".join(f'<path d="M{x},{y - 22} L{x + 19},{y - 11} L{x + 19},{y + 11} L{x},{y + 22} L{x - 19},{y + 11} L{x - 19},{y - 11}Z" stroke-opacity="0.45" stroke-width="3"/>'
              for x, y in [(80, 190), (118, 212), (118, 168), (156, 190), (80, 146)])
      + '<ellipse cx="250" cy="120" rx="54" ry="32" fill="#fff" fill-opacity="0.12"/>'
      '<path d="M238,90 C232,104 232,136 238,150 M262,90 C256,104 256,136 262,150" stroke-width="5"/>'
      '<circle cx="186" cy="114" r="18" fill="#fff" fill-opacity="0.12"/><path d="M304,120 L318,122"/>'
      '<path d="M176,98 C168,82 158,76 150,78 M190,96 C188,80 182,70 174,68" stroke-width="3"/>'
      '<ellipse cx="236" cy="70" rx="22" ry="34" fill="#fff" fill-opacity="0.08" transform="rotate(-25 236 70)"/>'
      '<ellipse cx="270" cy="72" rx="20" ry="30" fill="#fff" fill-opacity="0.08" transform="rotate(20 270 72)"/>')
motiv("ameise", "Ameise (ohne Augen)", ["Ameise", "Ameisen", "Ameisental", "Wohnstätten"],
      '<ellipse cx="140" cy="140" rx="26" ry="22" fill="#fff" fill-opacity="0.12"/><ellipse cx="200" cy="140" rx="24" ry="16" fill="#fff" fill-opacity="0.12"/>'
      '<ellipse cx="272" cy="136" rx="44" ry="30" fill="#fff" fill-opacity="0.12"/>'
      '<path d="M190,154 L170,190 L160,214 M200,156 L204,214 M212,154 L238,188 L250,214"/>'
      '<path d="M190,126 L168,100 L150,92 M206,126 L220,96 L240,86"/>'
      '<path d="M124,124 C110,96 96,84 82,86 M132,120 C128,92 120,78 108,72" stroke-width="3"/>' + ground(216, 60, 340, .4))
motiv("spinnennetz", "Spinnennetz (zerbrechliches Haus)", ["Spinne", "Spinnennetz", "schwächstes Haus", "zerbrechlich"],
      "".join(f'<line x1="200" y1="130" x2="{200 + 130 * math.cos(math.radians(a)):.1f}" y2="{130 + 112 * math.sin(math.radians(a)):.1f}" stroke-width="2.5" stroke-opacity="0.8"/>'
              for a in range(0, 360, 40))
      + "".join('<path d="' + "M" + " L".join(f"{200 + r * math.cos(math.radians(a)):.1f},{130 + r * .86 * math.sin(math.radians(a)):.1f}" for a in range(0, 361, 40)) + f'" stroke-width="2" stroke-opacity="{0.9 - r / 200:.2f}"/>'
                for r in (24, 48, 74, 102, 128)))
motiv("elefant", "Elefant (ohne Augen)", ["Elefant", "Leute des Elefanten", "Elefanten"],
      '<path d="M100,150 C96,104 130,80 180,80 C220,80 240,88 254,100 C270,86 300,88 312,110 C322,128 318,154 304,168 '
      'C298,190 300,214 312,226 C300,232 290,226 286,214 C282,196 284,180 290,170 C282,172 276,176 270,180 L266,226 L246,226 L246,184 '
      'L156,184 L156,226 L136,226 L134,180 C114,176 102,166 100,150Z" fill="#fff" fill-opacity="0.12"/>'
      '<path d="M254,100 C244,118 246,150 266,160" stroke-opacity="0.7"/><path d="M296,170 C288,182 276,184 268,180" stroke-width="3"/>'
      '<path d="M102,140 C90,150 86,164 90,176" stroke-width="3"/>' + ground(228, 70, 340, .5))
motiv("fisch", "Fisch (ohne Augen)", ["Fisch", "Fische", "großer Fisch", "Meeresgetier"],
      '<path d="M100,130 C140,80 230,76 280,130 C230,184 140,180 100,130Z" fill="#fff" fill-opacity="0.12"/>'
      '<path d="M280,130 L330,96 L322,130 L330,164Z" fill="#fff" fill-opacity="0.12"/><path d="M170,104 C182,92 200,88 214,92" stroke-opacity="0.6"/>'
      + dot(70, 100, 5, .4) + dot(56, 76, 3.5, .35) + dot(76, 58, 2.5, .3))

# ================================================================= Menschen (Strichmännchen ohne Gesicht)
motiv("mensch", "Ein Mensch (Piktogramm ohne Gesicht)", ["Mensch", "der Mensch", "erschaffen", "Diener"],
      person(200, 236, 200) + ground(238, 120, 280, .5))
motiv("mensch_gehend", "Gehender Mensch auf einem Weg", ["gehen", "umhergehen", "wandern", "reisen", "Weg", "Reise"],
      person(185, 228, 190, "walk") + '<path d="M50,232 L350,232" stroke-opacity="0.5" stroke-dasharray="14 12"/>')
motiv("mensch_weg_licht", "Mensch geht einen Weg zum Licht (Rechtleitung)", ["Rechtleitung", "leitet", "gerader Weg", "Weg", "Licht", "führt"],
      '<path d="M40,250 C120,240 200,200 250,150 C280,120 300,100 320,86" stroke-width="40" stroke-opacity="0.12"/>'
      + "".join(dot(x, y, r, .6) for x, y, r in [(80, 240, 5), (120, 232, 5), (165, 216, 4.5), (205, 194, 4), (240, 166, 3.5), (268, 138, 3), (292, 112, 2.5)])
      + f'<circle cx="330" cy="72" r="18" {FS} fill-opacity="0.9"/>'
      + "".join(f'<line x1="{330 + 26 * math.cos(a):.1f}" y1="{72 + 26 * math.sin(a):.1f}" x2="{330 + 40 * math.cos(a):.1f}" y2="{72 + 40 * math.sin(a):.1f}" stroke-width="3"/>' for a in [2 * math.pi * k / 10 for k in range(10)])
      + person(150, 236, 170, "walk"))
motiv("menschen", "Gruppe von Menschen (Piktogramme ohne Gesicht)", ["Menschen", "Leute", "Völker", "Gemeinschaft", "ihr alle"],
      person(72, 236, 125, o=.65) + person(328, 236, 130, o=.65) + person(136, 236, 160, o=.85) + person(264, 236, 155, o=.85) + person(200, 236, 190)
      + ground(238, 40, 360, .5))
motiv("mensch_sujud", "Mensch in Niederwerfung (Sudschud)", ["niederwerfen", "Niederwerfung", "Sudschud", "Gebet", "anbeten"],
      person_sujud(230, 218, 2.4) + ground(222, 50, 360, .6))
motiv("mensch_dua", "Mensch mit erhobenen Händen im Bittgebet", ["Bittgebet", "anrufen", "Dua", "bitten", "Gebet"],
      person(200, 236, 200, "dua") + ground(238, 120, 280, .5))
motiv("mensch_freude", "Mensch mit ausgebreiteten Armen, umgeben von Funkeln (Freude, Lohn)", ["Lohn", "großer Lohn", "Freude", "frohe Botschaft", "Glückseligkeit", "zufrieden", "Erfolg"],
      person(200, 236, 190, "freude") + sparkle(120, 50, 14) + sparkle(290, 46, 12) + sparkle(96, 120, 9, .8) + sparkle(310, 122, 10, .8)
      + sparkle(200, 18, 8, .7) + dot(140, 90, 3) + dot(262, 88, 3) + ground(238, 120, 280, .5))
motiv("mensch_verzweifelt", "Mensch hält sich verzweifelt den Kopf (Reue, Angst)", ["Reue", "bereuen", "Verzweiflung", "wehe", "ach hätte ich doch", "Angst", "Schrecken", "Bedauern"],
      person(200, 236, 190, "verzweifelt") + '<path d="M140,72 Q130,60 136,46 M262,72 Q272,60 266,46 M128,104 Q116,96 118,82 M274,104 Q286,96 284,82" stroke-width="3" stroke-opacity="0.7"/>'
      + ground(238, 120, 280, .5))
motiv("mensch_abwenden", "Mensch wendet sich ab und weist zurück (Leugnen, Abkehr)", ["abwenden", "kehrte sich ab", "leugnen", "erklärte für Lüge", "Hochmut", "ablehnen", "Ungläubige"],
      person(200, 236, 190, "abwenden") + '<path d="M300,86 L330,86 M300,104 L340,104" stroke-width="3" stroke-opacity="0.5"/>' + ground(238, 120, 300, .5))
motiv("mensch_sitzend", "Sitzender Mensch", ["sitzen", "sitzend", "Ruhe", "nachdenken", "warten"],
      person(160, 232, 210, "sitzen") + ground(234, 90, 320, .5))
motiv("eltern_kind", "Eltern mit Kind (Piktogramme ohne Gesicht)", ["Eltern", "Vater und Mutter", "Kinder", "Familie", "Güte zu den Eltern"],
      person(135, 236, 180) + person(265, 236, 165) + person(200, 236, 95) + ground(238, 70, 330, .5))
motiv("haende_dua", "Zwei zum Bittgebet geöffnete Hände", ["Hände", "Bittgebet", "anflehen", "Dua", "flehen"],
      "".join(
          f'<g transform="translate({x},230) scale({sx},1) rotate({rot})">'
          '<path d="M-22,0 L-26,-70 C-27,-84 -14,-84 -14,-72 L-13,-112 C-13,-126 2,-126 2,-112 L3,-118 C3,-132 18,-132 18,-118 '
          'L19,-110 C19,-124 34,-124 34,-110 L34,-56 L46,-74 C54,-86 68,-78 62,-64 L40,-18 C34,-6 30,0 26,0" fill="#fff" fill-opacity="0.12"/>'
          '<path d="M-14,-72 L-13,-56 M2,-112 L2,-60 M18,-118 L18,-60" stroke-width="2.5" stroke-opacity="0.6"/></g>'
          for x, sx, rot in [(150, 1, -8), (250, -1, -8)]))

# ================================================================= Symbole (aus den Referenzvideos)
motiv("fragezeichen", "Großes Fragezeichen (rhetorische Frage: Meint der Mensch etwa …?)", ["meint der Mensch", "glaubt der Mensch", "fühlt ihr euch sicher", "habt ihr nicht gesehen", "haben sie nicht gesehen", "wer ist es"],
      '<path d="M160,92 C160,50 194,36 214,36 C246,36 268,58 268,86 C268,118 236,126 222,146 C214,158 214,170 214,182" stroke-width="26"/>'
      '<circle cx="214" cy="226" r="16" fill="#fff" stroke="none"/>')
motiv("haken", "Häkchen (richtig, gute Taten, angenommen)", ["gute Werke", "rechtschaffen", "das Rechte tun", "richtig", "Wahrheit", "angenommen"],
      '<path d="M120,140 L180,200 L290,70" stroke-width="30"/>')
motiv("kreuz", "Kreuz/X (nicht, falsch, abgelehnt)", ["falsch", "abgelehnt", "nutzlos", "vergeblich"],
      '<path d="M130,60 L270,200 M270,60 L130,200" stroke-width="30"/>')
motiv("heilung", "Medizinisches Kreuz mit Pluszeichen (Heilung)", ["Heilung", "heilen", "Arzt", "Krankheit", "wer heilt", "Arznei"],
      '<path d="M180,60 L220,60 L220,110 L270,110 L270,150 L220,150 L220,200 L180,200 L180,150 L130,150 L130,110 L180,110Z" fill="#fff" fill-opacity="0.15"/>'
      '<path d="M94,96 A110,96 0 0 1 150,40" stroke-opacity="0.7"/><path d="M306,164 A110,96 0 0 1 250,220" stroke-opacity="0.7"/>'
      '<path d="M86,180 l0,20 M76,190 l20,0 M316,60 l0,20 M306,70 l20,0" stroke-width="3"/>')
motiv("mann_frau", "Symbole männlich und weiblich (Paare)", ["männlich und weiblich", "Mann und Frau", "Paare", "Gatten", "paarweise", "zwei Arten"],
      '<circle cx="168" cy="140" r="52"/><path d="M168,192 L168,246 M144,222 L192,222"/>'
      '<circle cx="232" cy="120" r="52"/><path d="M270,82 L314,38 M282,38 L314,38 L314,70"/>')
motiv("ausrufezeichen", "Warnzeichen mit Ausrufezeichen (Warnung)", ["Warnung", "warnen", "Warner", "hütet euch", "nehmt euch in Acht", "Strafe"],
      '<path d="M200,30 L330,236 L70,236Z" fill="#fff" fill-opacity="0.1" stroke-width="8"/>'
      '<path d="M200,96 L200,170" stroke-width="20"/><circle cx="200" cy="206" r="12" fill="#fff" stroke="none"/>')

# ================================================================= Gegenstände & Symbole
motiv("buch", "Aufgeschlagenes Buch", ["Buch", "Schrift", "lesen", "Koran", "Offenbarung", "Ermahnung"],
      '<path d="M200,80 C170,60 110,56 60,66 L60,200 C110,190 170,194 200,214 C230,194 290,190 340,200 L340,66 C290,56 230,60 200,80Z" fill="#fff" fill-opacity="0.12"/>'
      '<path d="M200,80 L200,214"/>' + "".join(f'<path d="M{x0},{y} C{x0 + 30},{y - 6} {x1 - 30},{y - 4} {x1},{y + 4}" stroke-width="2.5" stroke-opacity="0.55"/>'
                                                 for x0, x1 in [(80, 180), (220, 320)] for y in (96, 116, 136, 156, 176)))
motiv("schreibfeder", "Schreibfeder (Qalam) mit Tintenstrich", ["Schreibrohr", "Feder", "Qalam", "schreiben", "Tinte"],
      '<path d="M300,40 C250,60 180,120 150,190 L160,196 C196,130 260,76 310,48Z" fill="#fff" fill-opacity="0.12"/>'
      '<path d="M150,190 L142,214 L160,196"/><path d="M230,96 L248,110" stroke-opacity="0.6"/>'
      '<path d="M60,226 C110,206 150,236 200,220 C240,208 270,230 330,214" stroke-opacity="0.7"/>')
motiv("waage", "Waage", ["Waage", "Gewicht", "Maß", "Gerechtigkeit", "wiegen", "gerecht"],
      '<path d="M200,40 L200,220 M150,222 L250,222 M90,70 L310,70"/><circle cx="200" cy="40" r="7" fill="#fff" stroke="none"/>'
      '<path d="M90,70 L60,150 M90,70 L120,150 M310,70 L280,150 M310,70 L340,150" stroke-width="2.5" stroke-opacity="0.7"/>'
      '<path d="M52,150 A38,22 0 0 0 128,150Z M272,150 A38,22 0 0 0 348,150Z" fill="#fff" fill-opacity="0.12"/>')
motiv("sanduhr", "Sanduhr (Zeit)", ["Zeit", "Zeitalter", "Frist", "Stunde", "Nachmittag"],
      '<path d="M140,40 L260,40 M140,220 L260,220"/><path d="M150,40 C150,100 194,110 194,130 C194,150 150,160 150,220 '
      'L250,220 C250,160 206,150 206,130 C206,110 250,100 250,40Z" fill="#fff" fill-opacity="0.08"/>'
      '<path d="M170,80 L230,80 C222,100 206,112 200,122 C194,112 178,100 170,80Z M164,214 C176,190 224,190 236,214Z" fill="#fff" fill-opacity="0.45" stroke="none"/>'
      '<path d="M200,124 L200,196" stroke-width="2" stroke-dasharray="3 6"/>')
motiv("herz", "Herz", ["Herz", "Herzen", "Ruhe der Herzen", "Gefühl"],
      '<path d="M200,226 C140,180 80,140 80,96 C80,62 106,44 134,44 C164,44 186,62 200,86 C214,62 236,44 266,44 '
      'C294,44 320,62 320,96 C320,140 260,180 200,226Z" fill="#fff" fill-opacity="0.12"/>' + sparkle(270, 90, 10, .8))
motiv("kaaba", "Die Kaaba", ["Kaaba", "das Haus", "heiliges Haus", "Gebetsrichtung", "Pilgerfahrt", "Mekka"],
      '<path d="M120,90 L200,64 L300,84 L300,210 L200,236 L120,214Z" fill="#fff" fill-opacity="0.12"/>'
      '<path d="M120,90 L200,112 L300,84 M200,112 L200,236"/>'
      '<path d="M120,118 L200,140 L300,112" stroke-width="7" stroke-opacity="0.6"/><path d="M226,150 L262,140 L262,190 L226,200Z" stroke-opacity="0.6"/>'
      + ground(238, 40, 360, .4))

(OUT / "motive.json").write_text(json.dumps(MOTIVE, ensure_ascii=False, indent=2), "utf-8")
print(len(MOTIVE), "Motive geschrieben")
