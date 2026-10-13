"""Grafiken für al-Mulk 15–19, pro Abschnitt gezeichnet (Baukasten, Piktogramm-Stil).

Regeln: Lebewesen ohne Augen, Menschen ohne Gesicht, nichts Verborgenes.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from baukasten import F, FS, bird, dot, ground, person, speichern, vorschau  # noqa: E402

D = Path(__file__).parent / "grafiken"


def hills(y0=170):
    return (f'<path d="M0,{y0} Q80,{y0 - 50} 170,{y0 - 15} Q260,{y0 + 20} 400,{y0 - 40}" stroke-opacity="0.75"/>'
            f'<path d="M0,{y0 + 50} Q120,{y0 + 5} 230,{y0 + 35} Q320,{y0 + 60} 400,{y0 + 25}"/>')


def path_dotted(points, r=4.5):
    return "".join(dot(x, y, r * (0.55 + 0.45 * i / max(1, len(points) - 1)), 0.75) for i, (x, y) in enumerate(points))


def small_tree(x, y, s=1.0):
    return (f'<path d="M{x},{y} L{x},{y - 22 * s}" stroke-width="5"/>'
            f'<circle cx="{x}" cy="{y - 36 * s:.1f}" r="{16 * s:.1f}" {F}/>')


def palm(x, y, s=1.0):
    P = lambda dx, dy: f"{x + dx * s:.1f},{y + dy * s:.1f}"
    fr = "".join(f'<path d="M{P(4, -118)} Q{P(4 + dx * .5, -118 + dy - 26)} {P(4 + dx, -118 + dy)}"/>'
                 for dx, dy in [(-62, 12), (-46, 40), (-20, 50), (62, 8), (48, 38), (24, 52), (-14, -40), (24, -38)])
    dates = "".join(dot(x + dx * s, y + dy * s, 5 * s, .95) for dx, dy in [(-4, -104), (6, -100), (0, -94), (-10, -96)])
    return f'<path d="M{P(-2, 0)} C{P(2, -40)} {P(-6, -80)} {P(4, -118)}" stroke-width="7"/>' + fr + dates


def question_mark(x, y, s=1.0):
    P = lambda dx, dy: f"{x + dx * s:.1f},{y + dy * s:.1f}"
    return (f'<path d="M{P(-26, -46)} C{P(-26, -78)} {P(-4, -90)} {P(10, -90)} C{P(32, -90)} {P(46, -74)} {P(46, -54)} '
            f'C{P(46, -30)} {P(22, -24)} {P(14, -8)} L{P(14, 4)}" stroke-width="{16 * s:.1f}"/>'
            f'<circle cx="{x + 14 * s:.1f}" cy="{y + 28 * s:.1f}" r="{9 * s:.1f}" {FS}/>')


def house(x, y, w=44, h=38):
    return (f'<path d="M{x},{y} L{x},{y - h} L{x + w / 2},{y - h - 22} L{x + w},{y - h} L{x + w},{y}" {F}/>'
            f'<path d="M{x + w / 2 - 7},{y} L{x + w / 2 - 7},{y - 16} L{x + w / 2 + 7},{y - 16} L{x + w / 2 + 7},{y}"/>')


def stone(x, y, r):
    return f'<path d="M{x},{y} l{r},{-r * .45:.1f} l{r * .7:.1f},{r * .8:.1f} l{-r * .5:.1f},{r * .75:.1f} l{-r * 1.1:.1f},{-r * .2:.1f}Z" {FS} fill-opacity="0.85"/>'


# Posen für diese Szenen (ohne Gesicht, nur Haltung)
ZEIGEN = dict(neck=(0, 78), hip=(0, 42), head=(1, 96), arms=[((12, 88), (24, 104)), ((-12, 62), (-15, 44))],
              legs=[((-6, 21), (-8, 0)), ((6, 21), (8, 0))])
SCHUETZEN = dict(neck=(8, 74), hip=(0, 40), head=(13, 90), arms=[((22, 92), (6, 102)), ((24, 80), (34, 92))],
                 legs=[((-12, 20), (-22, 0)), ((10, 20), (14, 0))])
STEHEN_RUHIG = dict(neck=(0, 78), hip=(0, 42), head=(0, 96), arms=[((-12, 60), (-4, 46)), ((12, 60), (4, 46))],
                    legs=[((-6, 21), (-8, 0)), ((6, 21), (8, 0))])

szenen = {
    # 67:15 Teil 1 – die Erde gefügig gemacht: weites Hügelland mit Weg
    "67-15_erde": hills(160) + path_dotted([(210, 250), (200, 226), (214, 204), (236, 186), (252, 170), (262, 158), (270, 148)])
                  + small_tree(70, 128, 1.1) + small_tree(330, 112, 0.9) + small_tree(108, 144, .7),
    # 67:15 Teil 2 – „so wandert auf ihren Wegen …“
    "67-15_wandern": '<path d="M0,120 Q100,96 200,112 Q300,128 400,100" stroke-opacity="0.6"/>'
                     + '<path d="M40,258 C110,200 170,150 196,112 M360,258 C290,200 236,150 214,112" stroke-opacity="0.85"/>'
                     + path_dotted([(206, 120), (206, 136), (206, 156), (205, 180)], 4.5)
                     + small_tree(60, 160, .9) + small_tree(350, 170, 1.0) + small_tree(320, 118, .55)
                     + person(200, 246, 120, "walk"),
    # 67:15 Teil 2 ab „und esst von Seiner Versorgung“ – Dattelpalme und Korb mit Früchten
    "67-15_versorgung": palm(150, 236, 1.6) + ground(238, 60, 360, .5)
                        + '<path d="M236,236 L226,196 L326,196 L316,236Z" fill="#fff" fill-opacity="0.12"/>'
                        + '<path d="M232,210 L320,210 M236,222 L316,222" stroke-width="2.5" stroke-opacity="0.6"/>'
                        + "".join(f'<circle cx="{x}" cy="{y}" r="{r}" {F}/>' for x, y, r in [(246, 184, 13), (270, 178, 15), (296, 182, 13), (316, 188, 10)]),
    # 67:16 Teil 1 – „Fühlt ihr euch sicher …?“ Mensch steht ruhig, darüber ein Fragezeichen
    "67-16_sicher": person(200, 236, 150, STEHEN_RUHIG) + ground(238, 90, 310, .7) + question_mark(268, 126, 1.05),
    # 67:16 Teil 2 – die Erde gerät ins Wanken: Boden reißt, Mensch hält sich den Kopf
    "67-16_wanken": person(200, 196, 140, "verzweifelt")
                    + '<path d="M20,200 L150,206 L176,190 L198,214 L222,196 L250,204 L380,194" stroke-width="6"/>'
                    + '<path d="M198,214 L190,236 L204,252 M176,190 L168,212" stroke-opacity="0.7"/>'
                    + '<path d="M40,226 L140,232 M262,226 L370,218" stroke-opacity="0.4"/>'
                    + '<path d="M90,150 Q78,126 92,104 M60,160 Q46,132 62,106 M310,150 Q322,126 308,104 M340,160 Q354,132 338,106" stroke-width="3.5" stroke-opacity="0.6"/>',
    # 67:17 Teil 1 ab „schickt“ – Sturm mit Steinen, Mensch schützt sich
    "67-17_steinsturm": '<path d="M10,70 L230,70 C272,70 280,28 246,26" stroke-opacity="0.8"/>'
                        + '<path d="M30,116 L270,116" stroke-opacity="0.55"/><path d="M10,160 L200,160 C240,160 246,200 214,202" stroke-opacity="0.8"/>'
                        + "".join(stone(x, y, r) for x, y, r in [(250, 80, 13), (300, 60, 9), (290, 120, 15), (340, 100, 10), (320, 160, 12), (360, 140, 8), (270, 170, 7)])
                        + person(110, 236, 120, SCHUETZEN) + ground(238, 30, 380, .5),
    # 67:17 Teil 2 – „wie Meine Warnung war“: Warnzeichen
    "67-17_warnung": '<path d="M200,26 L334,240 L66,240Z" fill="#fff" fill-opacity="0.1" stroke-width="9"/>'
                     + '<path d="M200,96 L200,172" stroke-width="20"/><circle cx="200" cy="208" r="12" fill="#fff" stroke="none"/>',
    # 67:18 – die vor ihnen leugneten: verlassene, eingestürzte Häuser
    "67-18_ruinen": house(50, 236, 60, 60)
                    + '<path d="M150,236 L150,170 L172,154 L190,178 L190,236" fill="#fff" fill-opacity="0.08"/>'
                    + '<path d="M230,236 L230,150 L320,150 L320,190 L292,214 L292,236" fill="#fff" fill-opacity="0.08"/>'
                    + '<path d="M250,170 L272,170 L272,190 L250,190Z" stroke-opacity="0.6"/>'
                    + stone(200, 228, 10) + stone(332, 226, 12) + stone(120, 230, 8) + ground(238, 20, 380, .7),
    # 67:19 Teil 1 – „Haben sie nicht die Vögel über sich gesehen …“: Mensch zeigt nach oben, Vögel mit ausgebreiteten Flügeln
    "67-19_voegel": person(110, 236, 130, ZEIGEN) + ground(238, 50, 200, .5)
                    + bird(240, 70, 50) + bird(330, 50, 32, .9) + bird(300, 120, 28, .85) + bird(190, 120, 22, .7, 3)
                    + bird(360, 160, 18, .6, 3) + bird(250, 170, 14, .5, 3),
}

for name, body in szenen.items():
    speichern(D / f"{name}.svg", body)
print(vorschau([D / f"{n}.svg" for n in szenen], D / "vorschau.jpg", spalten=3))
