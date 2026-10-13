"""Grafiken für al-Ankabut 1–7 (Rezitation des Nutzers) – pro Abschnitt selbst gezeichnet.

Muster dafür, wie Claude bei jedem Video die Grafiken baut: eine Szene pro Abschnitt
(bzw. ab einem bestimmten Wort), konkret zum Inhalt. Piktogramm-Menschen aus
piktogramm.py (Posen über Gelenkwinkel, Körper statt Strichmännchen), Gegenstände mit
typischer Silhouette, Tiefe nur über Grautöne – keine dunklen Linien, keine Augen/Gesichter.
Ausführen aus dem Repo-Wurzelverzeichnis; danach grafiken/vorschau.jpg ansehen.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from baukasten import bewegung, ground, haken, kreuz, schriftzug, schweiss, sparkle, speichern, vorschau, zeichen  # noqa: E402
from piktogramm import (Mensch, baum, fels, gebetsteppich, haengematte, herz, palme, richterhammer,  # noqa: E402
                        sack, sanduhr, sonne_horizont, sprechblase, weltkugel)

D = Path(__file__).parent / "grafiken"
S = {}

# ---------------------------------------------------------------- 29:2 Teil 1
# „Meinen die Menschen, sie würden in Ruhe gelassen werden …“ – sorglos in der Hängematte, Fragezeichen
matte, tief = haengematte(106, 294, 150, 32)
m = Mensch(200, tief, 158, "haengematte")
S["29-2_sorglos"] = (palme(104, 250, 160, -4) + palme(296, 250, 160, 4) + ground(250, 14, 386, .45) + matte + m.svg
                     + zeichen(200, 86, "?", 66))

# ---------------------------------------------------------------- 29:2 Teil 2
# „… wenn sie bloß sagten: ‚Wir glauben‘“ – zwei Menschen, einer spricht: Sprechblase ءَامَنَّا
a = Mensch(78, 238, 158, "stehen", o=.55)
b = Mensch(138, 238, 176, "sprechen")
kx, ky, kr = b.kopf()
S["29-2_amanna"] = (a.svg + b.svg + ground(240, 30, 200, .5)
                    + sprechblase(290, 92, 190, 100, "ءَامَنَّا", 56, spitze=(kx + kr * 2.4, ky - kr * .6)))
# ab „und meinen sie, sie würden nicht auf die Probe gestellt?“ – schwere Last auf dem Rücken
m = Mensch(178, 238, 182, "last_ruecken")
hx, hy = m.hand("v")
kx, ky, kr = m.kopf()
S["29-2_pruefung"] = (fels(hx - 22, hy + 30, 56, rund=True, drehung=-12) + m.svg + ground(240, 70, 300, .5)
                      + schweiss(kx + kr * .7, ky - kr * 1.9, 1.4) + zeichen(338, 118, "?", 92))

# ---------------------------------------------------------------- 29:3
# Teil 1 „Wir stellten die auf die Probe, die vor ihnen waren“ – frühere Generationen, jede mit ihrer Last
teile = []
for x, h, o in [(96, 118, .38), (196, 146, .65), (310, 176, 1.0)]:
    m = Mensch(x, 238, h, "last_ruecken", o=o)
    hx, hy = m.hand("v")
    teile.append(fels(hx - h * .12, hy + h * .16, h * .3, o=o, rund=True, drehung=-12) + m.svg)
S["29-3_frueher"] = "".join(teile) + ground(240, 20, 380, .45)
# Teil 2 „… die wahrhaftig sind“ (grün) – stemmt die Last aufrecht und standhaft, Häkchen
m = Mensch(150, 244, 158, "front_last_hoch")
hx, hy = m.hand("l")
S["29-3_wahrhaftig"] = fels(150, hy - 26, 50, rund=True, drehung=4) + m.svg + ground(246, 60, 240, .5) + haken(312, 156, 1.15)
# Teil 3 „… und die Lügner“ (rot) – wirft die Last hin und rennt davon, Kreuz
m = Mensch(118, 238, 172, "rennen", spiegeln=True)
S["29-3_luegner"] = (m.svg + bewegung(178, 150, -1, 3, 34) + fels(286, 238, 50)
                     + '<path d="M232,226 l-14,-6 M234,212 l-12,-14 M338,226 l14,-6 M336,212 l12,-14" stroke-width="4" stroke-opacity="0.8"/>'
                     + ground(240, 20, 380, .5) + kreuz(312, 96, .62))

# ---------------------------------------------------------------- 29:4 (rot)
# Teil 1 „… die böse Taten begehen, meinen, sie könnten Uns entrinnen?“ – rennt mit dem Beutesack davon
#   (der Sack hängt an der nach hinten gestreckten Hand und schwingt beim Rennen nach hinten)
m = Mensch(232, 238, 186, "rennen", arm_v=(-82, 8), arm_h=(62, 88))
hx, hy = m.hand("v")
S["29-4_entkommen"] = (m.svg + f'<g transform="rotate(16 {hx:.1f} {hy:.1f})">{sack(hx, hy + 52 * .86, .86)}</g>'
                       + bewegung(166, 128, 1, 4, 40) + ground(240, 40, 360, .5) + zeichen(352, 100, "?", 88))
# Teil 2 „Übel ist es, wie sie urteilen“ – Richterhammer, Kreuz
S["29-4_urteil"] = richterhammer(150, 236, 1.5) + kreuz(334, 168, .6)

# ---------------------------------------------------------------- 29:5
# Teil 1 „Wer mit Allahs Begegnung rechnet …“ – Bittgebet, dem aufgehenden Licht zugewandt
m = Mensch(118, 238, 184, "dua")
S["29-5_hoffnung"] = sonne_horizont(284, 238, 64) + ground(240, 10, 390, .6) + m.svg
# ab „Allahs angesetzte Frist läuft sicher ab“ – Sanduhr, der Sand ist fast durchgelaufen
S["29-5_frist"] = sanduhr(200, 252, 240, .22)
# Teil 2 „Und Er ist der Allhörende, der Allwissende“ (gold)
S["29-5_namen"] = schriftzug("ٱلسَّمِيعُ ٱلْعَلِيمُ", 200, 172, 86) + sparkle(56, 92, 9, .8) + sparkle(346, 82, 11, .8)

# ---------------------------------------------------------------- 29:6
# Teil 1 „Wer sich abmüht, müht sich nur für sich selbst ab“ – schiebt einen Felsen den Hang hinauf
m = Mensch(150, 238, 196, "schieben")
hx, hy = m.hand("v")
kx, ky, kr = m.kopf()
hang = (m.svg + fels(hx + 58, 238, 66) + schweiss(kx - kr * 1.6, ky - kr * 1.2, 1.4)
        + '<path d="M-60,240 L460,240" stroke-width="6"/><rect x="-60" y="241" width="520" height="120" fill="#fff" fill-opacity="0.08" stroke="none"/>')
S["29-6_muehe"] = f'<g transform="translate(-6 -42) rotate(-16 200 240)">{hang}</g>'
# Teil 2 „Allah ist auf niemanden von allen Welten angewiesen“ (gold) – ٱلْغَنِيّ über der Weltkugel
S["29-6_ghani"] = schriftzug("ٱلْغَنِيُّ", 200, 118, 100) + weltkugel(200, 198, 48) + sparkle(116, 196, 8, .8) + sparkle(286, 190, 9, .8)

# ---------------------------------------------------------------- 29:7 (grün)
# Teil 1 „Und jene, die glauben …“ – Niederwerfung auf dem Gebetsteppich
S["29-7_glauben"] = gebetsteppich(40, 238, 300) + Mensch(208, 230, 236, "sudschud").svg
# ab „… und gute Werke tun“ – hilft einem Gestürzten auf, Herz
helfer = Mensch(150, 238, 180, "buecken_helfen")
hx, hy = helfer.hand("v")
probe = Mensch(300, 238, 176, "sitzen_greifen", spiegeln=True)
px, py = probe.hand("v")
sitzend = Mensch(300 + (hx + 6 - px), 238, 176, "sitzen_greifen", spiegeln=True)
S["29-7_gutes"] = helfer.svg + sitzend.svg + ground(240, 40, 370, .5) + herz((hx + 150) / 2 + 40, 64, 1.25)
# Teil 2 „Wir werden ihre Übel von ihnen nehmen“ – die Last zerfällt und steigt als Licht auf
#   (die Lasten steigen von seinen Schultern auf, werden kleiner, blasser und zu Licht)
m = Mensch(126, 238, 180, "front_erleichtert")
kx, ky, kr = m.kopf()
steine = [(kx + 58, ky + 16, 24, .85, 8), (kx + 112, ky - 10, 17, .62, -24), (kx + 158, ky - 30, 12, .42, 30), (kx + 194, ky - 44, 8, .26, 0)]
spuren = "".join(f'<path d="M{sx - r * 1.3:.1f},{sy + r * 1.1:.1f} l{-r * .9:.1f},{r * .8:.1f}" stroke-width="3" stroke-opacity="{o * .6:.2f}"/>'
                 for sx, sy, r, o, _ in steine)
S["29-7_tilgen"] = (m.svg + ground(240, 40, 220, .5) + spuren
                    + "".join(fels(sx, sy, r, o=o, rund=True, drehung=d) for sx, sy, r, o, d in steine)
                    + sparkle(kx + 222, ky - 58, 12) + sparkle(kx + 236, ky - 18, 8, .8) + sparkle(kx + 196, ky - 82, 7, .7))
# Teil 3 „… und ihnen den besten Lohn für ihre Taten geben“ – Freude im Garten mit Fluss
m = Mensch(200, 238, 186, "front_freude")
S["29-7_lohn"] = (baum(80, 240, 168) + baum(322, 240, 156) + m.svg
                  + '<path d="M0,250 Q50,242 100,250 T200,250 T300,250 T400,250" stroke-width="4" stroke-opacity="0.8"/>'
                  + ground(240, 0, 400, .45) + sparkle(120, 70, 12) + sparkle(282, 56, 10) + sparkle(250, 112, 6, .8)
                  + sparkle(146, 132, 6, .7))

for name, body in S.items():
    speichern(D / f"{name}.svg", body)
if __name__ == "__main__":
    print(vorschau([D / f"{n}.svg" for n in S], D / "vorschau.jpg", spalten=4))
