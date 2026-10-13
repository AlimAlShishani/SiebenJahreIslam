"""Grafiken für al-Mulk 15–19 – pro Abschnitt gezeichnet, konkret zum Inhalt.

Muster dafür, wie Claude bei jedem Video die Grafiken baut:
eine Szene pro Abschnitt (bzw. ab einem bestimmten Wort), aus den Bausteinen von
baukasten.py, mit Details (Gegenstände, Umgebung, Gefühls-Zeichen).
Regeln: Lebewesen ohne Augen, Menschen ohne Gesichtsdetails.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from baukasten import (Figur, bewegung, bird, buch, dot, feld, flammen, ground, haus, huegel,  # noqa: E402,F401
                       korb, palme, schriftzug, schweiss, speichern, stein, stock, tasche, tree,
                       sparkle, vogel, vorschau, warnschild, zeichen, zittern)

D = Path(__file__).parent / "grafiken"

# eigene Posen für diese Szenen
HACKEN = dict(neck=(8, 74), hip=(0, 42), head=(13, 90), arms=[((18, 62), (30, 50)), ((14, 60), (26, 46))],
              legs=[((-8, 21), (-14, 0)), ((10, 21), (14, 0))], vorne=(1,))
HINWEISEN = dict(neck=(-2, 78), hip=(0, 42), head=(-4, 96), arms=[((-14, 72), (-30, 80)), ((10, 62), (12, 44))],
                 legs=[((-6, 21), (-8, 0)), ((6, 21), (8, 0))])


def hacke(hand):
    x, y = hand
    return (f'<path d="M{x - 18:.1f},{y - 22:.1f} L{x + 34:.1f},{y + 52:.1f}" stroke-width="5"/>'
            f'<path d="M{x + 30:.1f},{y + 46:.1f} L{x + 50:.1f},{y + 44:.1f} L{x + 44:.1f},{y + 58:.1f}Z" fill="#fff" stroke-width="3"/>')


def berg_pfad():
    return ('<path d="M0,250 L120,90 L190,170 L270,60 L400,250" fill="#fff" fill-opacity="0.07"/>'
            '<path d="M104,112 L120,90 L136,112" stroke-width="5"/><path d="M254,82 L270,60 L288,86" stroke-width="5"/>'
            '<path d="M60,250 C140,236 220,226 196,206 C170,186 250,176 236,156 C222,138 280,128 268,106" '
            'stroke-dasharray="10 9" stroke-opacity="0.85"/>')


def riss_boden(y=200):
    return (f'<path d="M10,{y} L140,{y + 6} L168,{y - 12} L188,{y + 18} L214,{y - 6} L240,{y + 8} L390,{y - 4}" stroke-width="6"/>'
            f'<path d="M188,{y + 18} L178,{y + 44} L196,{y + 60} M168,{y - 12} L160,{y + 10}" stroke-opacity="0.75"/>')


def eingestuerzt(x, y):
    """Eingestürztes Haus: Wände schief, Dach abgerutscht."""
    return (f'<path d="M{x},{y} L{x + 4},{y - 44} L{x + 30},{y - 58} L{x + 52},{y - 40} L{x + 56},{y}" fill="#fff" fill-opacity="0.12"/>'
            f'<path d="M{x + 30},{y - 58} L{x + 70},{y - 30}" stroke-dasharray="6 6" stroke-opacity="0.7"/>'
            f'<path d="M{x + 20},{y} L{x + 20},{y - 18} L{x + 34},{y - 18} L{x + 34},{y}" stroke-opacity="0.7"/>')


szenen = {}

# ---------------------------------------------------------------- 67:15 Teil 1
# „Er ist es, Der euch die Erde untertan gemacht hat“ – bestelltes Land: Feld mit Furchen,
# ein Mensch hackt den Boden, Haus und Weg im Hintergrund.
f = Figur(118, 232, 135, HACKEN)
szenen["67-15_erde"] = (huegel(120, .5) + feld(150, 240, 230, 70, 7) + haus(292, 150, 46, 34) + tree(350, 152, .45)
                        + '<path d="M300,150 C280,170 250,186 236,240" stroke-dasharray="8 8" stroke-opacity="0.6"/>'
                        + f.svg + hacke(f.hand(1)) + ground(242, 20, 150, .6))

# ---------------------------------------------------------------- 67:15 Teil 2
# „wandert also auf ihren Wegen (Flanken)“ – Wanderer mit Stock und Bündel auf einem Bergpfad.
f = Figur(150, 238, 120, "walk")
szenen["67-15_wandern"] = berg_pfad() + f.svg + stock(f.hand(1), 64, -12) + tasche(*f.pt((-14, 70)), .9)
# ab „und genießt Seine Versorgung“ – sitzt unter der Dattelpalme und isst aus dem Korb.
f = Figur(140, 236, 150, "sitzen_essen")
szenen["67-15_versorgung"] = palme(322, 238, 1.2) + korb(250, 236, 1.0) + f.svg + ground(238, 60, 380, .5)

# ---------------------------------------------------------------- 67:15 Teil 3
# „Und zu Ihm führt die Auferstehung“ – Schriftzug ٱللَّه
szenen["67-15_allah"] = schriftzug("ٱللَّهُ", 200, 196, 170)

# ---------------------------------------------------------------- 67:16
# Teil 1 „Fühlt ihr euch sicher …?“ – Mensch steht selbstsicher vor seinem Haus, daneben ein Fragezeichen.
f = Figur(210, 236, 150, "selbstsicher")
szenen["67-16_sicher"] = (haus(60, 236, 90, 70) + tree(130, 236, .55) + f.svg + ground(238, 30, 370, .6)
                          + zeichen(280, 120, "?", 90))
# Teil 2 „… die Erde unter euch versinken lässt und sie ins Wanken gerät“ – Boden reißt auf, Haus kippt,
# Mensch stürzt.
f = Figur(214, 190, 130, "fallen")
szenen["67-16_wanken"] = ('<g transform="rotate(-9 90 200)">' + haus(40, 200, 80, 60) + '</g>' + riss_boden(200) + f.svg
                          + zittern(214, 120, 70, 2.4) + stein(300, 226, 9) + stein(130, 230, 7)
                          + schweiss(f.kopf()[0] + 30, f.kopf()[1] - 4, 1.1))

# ---------------------------------------------------------------- 67:17
# Teil 1 ab „schickt einen Steinsturm“ – Mensch schützt den Kopf, Steine fliegen, Palme biegt sich.
f = Figur(130, 236, 140, "schuetzen")
szenen["67-17_steinsturm"] = ('<g transform="rotate(14 330 238)">' + palme(330, 238, 1.2, datteln=False) + '</g>'
                              + '<path d="M10,70 L230,70 C272,70 280,28 246,26" stroke-opacity="0.75"/>'
                              + '<path d="M20,120 L170,120" stroke-opacity="0.5"/>'
                              + "".join(stein(x, y, r) for x, y, r in [(250, 80, 13), (300, 52, 9), (226, 128, 15), (280, 150, 10), (196, 90, 8), (320, 110, 7)])
                              + bewegung(250, 100, -1, 3, 30) + f.svg + ground(238, 20, 380, .6))
# Teil 2 „Dann werdet ihr wissen, wie Meine Warnung war!“ – Warnschild, Mensch kniet erschrocken davor.
f = Figur(120, 238, 120, "verzweifelt")
szenen["67-17_warnung"] = warnschild(270, 240, .95) + f.svg + schweiss(f.kopf()[0] + 22, f.kopf()[1] - 8, 1.1) + zeichen(60, 110, "!", 60)

# ---------------------------------------------------------------- 67:18
# „Und schon jene vor ihnen leugneten“ – das Buch (die Botschaft) leuchtet, die Gruppe wendet sich ab
# und hält abwehrend die Hand dagegen.
a = Figur(196, 236, 150, "abwenden")
b = Figur(118, 236, 135, "walk", spiegeln=True, o=.85)
c = Figur(52, 236, 120, "walk", spiegeln=True, o=.7)
szenen["67-18_leugnen"] = (c.svg + b.svg + a.svg + buch(316, 150, 1.6) + sparkle(266, 100, 10) + sparkle(368, 104, 8)
                           + sparkle(316, 82, 12) + '<path d="M316,190 L316,236" stroke-opacity="0.5"/>' + ground(238, 20, 380, .6))
# ab „wie war dann (die Folge) Meiner Verleugnung“ – ihre Häuser liegen eingestürzt und verlassen.
szenen["67-18_ruinen"] = (eingestuerzt(40, 236) + eingestuerzt(150, 236) + eingestuerzt(270, 236)
                          + stein(130, 230, 8) + stein(250, 228, 11) + stein(360, 230, 7)
                          + '<path d="M100,236 L104,200 L118,196 L120,236" stroke-opacity="0.7"/>' + ground(238, 10, 390, .7))

# ---------------------------------------------------------------- 67:19
# Teil 1 ab „die Vögel über ihnen, wie sie die Flügel ausbreiten und einziehen“ – Mensch zeigt nach oben,
# ein Vogel breitet die Flügel aus, einer gleitet mit angelegten Flügeln.
f = Figur(90, 238, 120, "zeigen")
szenen["67-19_voegel"] = (f.svg + ground(240, 30, 160, .5) + vogel(240, 96, 1.25, "offen") + vogel(320, 176, .7, "offen", o=.85)
                          + bird(160, 150, 22, .75) + bird(360, 70, 18, .7, 3) + bird(300, 214, 14, .55, 3))
# Teil 2 „Kein Anderer als der Allerbarmer hält sie zurück“ – Schriftzug ٱلرَّحْمَٰن, kleine Vögel darüber.
szenen["67-19_rahman"] = (schriftzug("ٱلرَّحْمَٰنُ", 200, 220, 120) + bird(150, 52, 22, .8) + bird(250, 40, 18, .7, 3)
                          + bird(200, 70, 12, .55, 3))

for name, body in szenen.items():
    speichern(D / f"{name}.svg", body)
if __name__ == "__main__":
    print(vorschau([D / f"{n}.svg" for n in szenen], D / "vorschau.jpg", spalten=4))
