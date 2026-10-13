"""Piktogramm-Menschen in der Art professioneller Piktogramme (wie in den Referenzvideos).

Aufbau statt Strichmännchen: Rumpf als Körper, Schulter- und Hüftgelenk, sich verjüngende
Glieder, Hände und Füße (zeigen die Richtung), Kopf mit kleinem Abstand zum Körper.
Kein Gesicht, keine Augen, keine dunklen Linien: Tiefe entsteht dadurch, dass Arm/Bein
auf der abgewandten Seite etwas transparenter gezeichnet werden.

Posen werden über Gelenkwinkel angegeben (Grad), damit die Proportionen immer stimmen.
Seitenansicht (ansicht="seite", Figur blickt nach rechts, spiegeln=True → nach links):
    rumpf      Neigung des Oberkörpers: 0 = aufrecht, + = nach vorn, - = nach hinten
    kopf       zusätzliche Neigung des Kopfes (+ = nach vorn/unten)
    arm_v/arm_h  (schulter, ellbogen) vorderer/hinterer Arm
               schulter: Richtung des Oberarms, 0 = hängt nach unten, 90 = nach vorn, 180 = nach oben,
               -60 = nach hinten. ellbogen: Beugung, + = Unterarm klappt nach vorn/oben.
    bein_v/bein_h  (huefte, knie) vorderes/hinteres Bein
               huefte: Richtung des Oberschenkels, 0 = nach unten, + = nach vorn (Knie hebt sich),
               - = nach hinten. knie: Beugung, + = Unterschenkel klappt nach hinten.
Frontansicht (ansicht="front"): arm_l/arm_r und bein_l/bein_r, Winkel 0 = nach unten,
    + = vom Körper weg nach außen (90 = waagerecht zur Seite, 180 = nach oben).

    m = Mensch(200, 236, 180, "gehen")                       # Pose aus POSEN …
    m = Mensch(200, 236, 180, "rennen", arm_v=(-82, 8))     # … einzelne Gelenke überschreiben
    szene = m.svg + ...        m.hand("v"), m.kopf(), m.schulter(), m.becken(), m.fuss("v")
    Frontansicht: m.hand("l"/"r") usw.

Gegenstände (gefüllte Silhouetten, Tiefe über Grautöne, keine dunklen Linien):
    fels(x, y, r, rund=, drehung=)  kantiger Brocken (rund=True: zum Tragen/Fliegen, (x, y) = Mitte)
    sack, palme, baum, haengematte (→ svg, tiefster Punkt), sprechblase(…, spitze=(x, y)),
    richterhammer, sanduhr, gebetsteppich, weltkugel, sonne_horizont, herz, blatt
"""

from __future__ import annotations

import math

# Körpermaße in Einheiten (stehende Figur ≈ 100 hoch)
SCHIEN, OBERSCHENKEL, RUMPF, OBERARM, UNTERARM = 23.0, 23.0, 29.0, 15.0, 13.5
KNOECHEL_H = 3.4
KOPF_R, HALS = 8.2, 4.2
R = dict(schulter=4.8, ellbogen=3.8, handgelenk=3.2, hand=3.6, huefte=6.4, knie=4.9, knoechel=3.6,
         zehe=2.4, brust=9.6, becken=8.4)
HINTEN_DECKKRAFT = 0.55

POSEN = {
    # --- Seitenansicht (Blick nach rechts)
    "stehen": dict(ansicht="seite", rumpf=0, arm_v=(4, 6), arm_h=(-4, 6), bein_v=(3, 0), bein_h=(-3, 0)),
    "gehen": dict(ansicht="seite", rumpf=4, arm_v=(28, 22), arm_h=(-30, 12), bein_v=(24, 6), bein_h=(-20, 26)),
    "rennen": dict(ansicht="seite", rumpf=16, kopf=4, arm_v=(55, 85), arm_h=(-55, 70), bein_v=(62, 85), bein_h=(-38, 70)),
    "sprechen": dict(ansicht="seite", rumpf=0, arm_v=(40, 95), arm_h=(-5, 10), bein_v=(5, 0), bein_h=(-5, 0)),
    "dua": dict(ansicht="seite", rumpf=2, kopf=14, arm_v=(48, 98), arm_h=(40, 106), bein_v=(4, 0), bein_h=(-4, 0)),
    "zeigen_hoch": dict(ansicht="seite", rumpf=-6, kopf=-16, arm_v=(138, 4), arm_h=(-6, 10), bein_v=(6, 0), bein_h=(-6, 0)),
    "last_ruecken": dict(ansicht="seite", rumpf=40, kopf=10, arm_v=(168, 72), arm_h=(160, 80), bein_v=(26, 32), bein_h=(-18, 22)),
    "haengematte": dict(ansicht="seite", rumpf=-72, kopf=-6, arm_v=(-166, -96), arm_h=(-172, -100),
                        bein_v=(104, 34), bein_h=(98, 4)),
    "schieben": dict(ansicht="seite", rumpf=52, kopf=6, arm_v=(98, 4), arm_h=(92, 10), bein_v=(42, 62), bein_h=(-36, 4)),
    "buecken_helfen": dict(ansicht="seite", rumpf=46, kopf=8, arm_v=(62, 8), arm_h=(-6, 20), bein_v=(14, 16), bein_h=(-6, 10)),
    "sitzen_greifen": dict(ansicht="seite", rumpf=-12, kopf=-10, arm_v=(118, 10), arm_h=(-40, 10), bein_v=(84, 4), bein_h=(80, 8)),
    "knien": dict(ansicht="seite", rumpf=2, arm_v=(10, 30), arm_h=(4, 30), bein_v=(0, 92), bein_h=(0, 92)),
    "sudschud": dict(ansicht="seite", rumpf=112, kopf=26, arm_v=(-2, 92), arm_h=(-6, 96), bein_v=(-6, 96), bein_h=(-6, 96)),
    "liegen_entspannt": dict(ansicht="seite", rumpf=-80, kopf=-10, arm_v=(-150, -80), arm_h=(-158, -86),
                             bein_v=(70, 60), bein_h=(88, 8)),
    "fallen": dict(ansicht="seite", rumpf=-34, kopf=-20, arm_v=(150, 20), arm_h=(-160, -10), bein_v=(60, 50), bein_h=(30, 10)),
    "tragen_schulter": dict(ansicht="seite", rumpf=18, kopf=4, arm_v=(150, 105), arm_h=(-50, 70), bein_v=(60, 80), bein_h=(-36, 66)),
    # --- Frontansicht
    "front_stehen": dict(ansicht="front", arm_l=(8, 4), arm_r=(8, 4), bein_l=(3, 0), bein_r=(3, 0)),
    "front_dua": dict(ansicht="front", arm_l=(22, 118), arm_r=(22, 118), bein_l=(3, 0), bein_r=(3, 0)),
    "front_freude": dict(ansicht="front", arm_l=(140, 10), arm_r=(140, 10), bein_l=(9, 0), bein_r=(9, 0)),
    "front_erleichtert": dict(ansicht="front", arm_l=(38, 10), arm_r=(38, 10), bein_l=(5, 0), bein_r=(5, 0)),
    "front_kopf_halten": dict(ansicht="front", arm_l=(150, 128), arm_r=(150, 128), bein_l=(4, 0), bein_r=(4, 0)),
    "front_last_hoch": dict(ansicht="front", arm_l=(148, 52), arm_r=(148, 52), bein_l=(11, 0), bein_r=(11, 0)),
    "front_haende_hueften": dict(ansicht="front", arm_l=(40, -95), arm_r=(40, -95), bein_l=(6, 0), bein_r=(6, 0)),
}


def _dir(winkel):
    """Richtung für einen Winkel ab „nach unten“, + = nach vorn (+x). y nach oben."""
    a = math.radians(winkel)
    return math.sin(a), -math.cos(a)


def _glied(p1, r1, p2, r2):
    """Sich verjüngendes Glied: zwei Kreise + Verbindungs-Viereck (alles weiß gefüllt)."""
    (x1, y1), (x2, y2) = p1, p2
    dx, dy = x2 - x1, y2 - y1
    d = math.hypot(dx, dy)
    out = [f'<circle cx="{x1:.1f}" cy="{y1:.1f}" r="{r1:.2f}"/>', f'<circle cx="{x2:.1f}" cy="{y2:.1f}" r="{r2:.2f}"/>']
    if d > abs(r1 - r2) + 1e-6:
        a = math.atan2(dy, dx)
        phi = math.acos(max(-1.0, min(1.0, (r1 - r2) / d)))
        pts = [(x1 + r1 * math.cos(a + phi), y1 + r1 * math.sin(a + phi)), (x2 + r2 * math.cos(a + phi), y2 + r2 * math.sin(a + phi)),
               (x2 + r2 * math.cos(a - phi), y2 + r2 * math.sin(a - phi)), (x1 + r1 * math.cos(a - phi), y1 + r1 * math.sin(a - phi))]
        out.append('<path d="M' + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + 'Z"/>')
    return "".join(out)


class Mensch:
    """Piktogramm-Mensch. (x, y) = Bodenpunkt unter dem Becken, h = Größe einer stehenden Figur.

    kleid=True: langes Gewand (Thobe/Kleid), kopftuch=True: Kopftuch. o = Deckkraft.
    """

    def __init__(self, x, y, h=170, pose="stehen", spiegeln=False, kleid=False, kopftuch=False, o=1.0, **aenderungen):
        self.p = dict(POSEN[pose]) if isinstance(pose, str) else dict(pose)
        self.p.update(aenderungen)
        self.s = h / 100.0
        self.m = -1 if spiegeln and self.p.get("ansicht") != "front" else 1
        self.kleid, self.kopftuch, self.o = kleid, kopftuch, o
        self._baue()
        # Platzierung: tiefster Punkt auf den Boden, Becken über x
        tief = min(py - r for (px, py), r in self._kontakt)
        self.ox, self.oy = x - self.m * self.j["becken"][0] * self.s, y + tief * self.s

    # ------------------------------------------------------------------ Gelenke (Einheiten, y nach oben)
    def _baue(self):
        p = self.p
        j = {}
        front = p.get("ansicht") == "front"
        becken = (0.0, KNOECHEL_H + SCHIEN + OBERSCHENKEL)
        j["becken"] = becken
        if front:
            schulter_y = becken[1] + RUMPF
            j["brust"] = (0.0, schulter_y)
            j["kopf"] = (0.0, schulter_y + HALS + KOPF_R)
            for seite, sx in (("l", -1), ("r", 1)):
                sch = (sx * 9.0, schulter_y - 2.0)
                w, b = p.get(f"arm_{seite}", (8, 4))
                d1 = _dir(w)
                ell = (sch[0] + sx * d1[0] * OBERARM, sch[1] + d1[1] * OBERARM)
                d2 = _dir(w + b)
                hg = (ell[0] + sx * d2[0] * UNTERARM, ell[1] + d2[1] * UNTERARM)
                j[f"schulter_{seite}"], j[f"ellbogen_{seite}"], j[f"hand_{seite}"] = sch, ell, hg
                hue = (sx * 4.8, becken[1])
                w, b = p.get(f"bein_{seite}", (3, 0))
                d1 = _dir(w)
                knie = (hue[0] + sx * d1[0] * OBERSCHENKEL, hue[1] + d1[1] * OBERSCHENKEL)
                d2 = _dir(w - b)
                kn = (knie[0] + sx * d2[0] * SCHIEN, knie[1] + d2[1] * SCHIEN)
                zehe = (kn[0] + sx * 5.5, kn[1] - 1.0)
                j[f"huefte_{seite}"], j[f"knie_{seite}"], j[f"knoechel_{seite}"], j[f"zehe_{seite}"] = hue, knie, kn, zehe
        else:
            # Rumpf: Winkel ab „nach oben“, + = nach vorn geneigt
            a = math.radians(p.get("rumpf", 0))
            up = (math.sin(a), math.cos(a))
            sch = (becken[0] + up[0] * RUMPF, becken[1] + up[1] * RUMPF)
            j["brust"] = sch
            ak = math.radians(p.get("rumpf", 0) + p.get("kopf", 0))
            j["kopf"] = (sch[0] + math.sin(ak) * (HALS + KOPF_R), sch[1] + math.cos(ak) * (HALS + KOPF_R))
            for seite in ("v", "h"):
                w, b = p.get(f"arm_{seite}", (0, 6))
                s0 = (sch[0] - up[0] * 2.5, sch[1] - up[1] * 2.5)
                d1 = _dir(w)
                ell = (s0[0] + d1[0] * OBERARM, s0[1] + d1[1] * OBERARM)
                d2 = _dir(w + b)
                hg = (ell[0] + d2[0] * UNTERARM, ell[1] + d2[1] * UNTERARM)
                j[f"schulter_{seite}"], j[f"ellbogen_{seite}"], j[f"hand_{seite}"] = s0, ell, hg
                w, b = p.get(f"bein_{seite}", (0, 0))
                d1 = _dir(w)
                knie = (becken[0] + d1[0] * OBERSCHENKEL, becken[1] + d1[1] * OBERSCHENKEL)
                d2 = _dir(w - b)
                kn = (knie[0] + d2[0] * SCHIEN, knie[1] + d2[1] * SCHIEN)
                df = _dir(w - b + 90 + p.get(f"fuss_{seite}", 0))
                zehe = (kn[0] + df[0] * 7.5, kn[1] + df[1] * 7.5)
                j[f"huefte_{seite}"], j[f"knie_{seite}"], j[f"knoechel_{seite}"], j[f"zehe_{seite}"] = becken, knie, kn, zehe
        self.j = j
        # Punkte, die den Boden berühren können (für die Platzierung)
        seiten = ("l", "r") if front else ("v", "h")
        kontakt = [(j["becken"], R["becken"]), (j["brust"], R["brust"]), (j["kopf"], KOPF_R)]
        for sd in seiten:
            kontakt += [(j[f"knie_{sd}"], R["knie"]), (j[f"knoechel_{sd}"], R["knoechel"]), (j[f"zehe_{sd}"], R["zehe"]),
                        (j[f"hand_{sd}"], R["hand"]), (j[f"ellbogen_{sd}"], R["ellbogen"])]
        self._kontakt = kontakt

    # ------------------------------------------------------------------ Koordinaten im Bild
    def pt(self, name_or_pt):
        x, y = self.j[name_or_pt] if isinstance(name_or_pt, str) else name_or_pt
        return self.ox + self.m * x * self.s, self.oy - y * self.s

    def hand(self, seite="v"):
        return self.pt(f"hand_{seite}")

    def fuss(self, seite="v"):
        return self.pt(f"zehe_{seite}")

    def kopf(self):
        x, y = self.pt("kopf")
        return x, y, KOPF_R * self.s

    def schulter(self, seite="v"):
        return self.pt(f"schulter_{seite}")

    def becken(self):
        return self.pt("becken")

    # ------------------------------------------------------------------ Zeichnen
    def _arm(self, sd):
        P, s = self.pt, self.s
        return (_glied(P(f"schulter_{sd}"), R["schulter"] * s, P(f"ellbogen_{sd}"), R["ellbogen"] * s)
                + _glied(P(f"ellbogen_{sd}"), R["ellbogen"] * s, P(f"hand_{sd}"), R["handgelenk"] * s)
                + f'<circle cx="{P(f"hand_{sd}")[0]:.1f}" cy="{P(f"hand_{sd}")[1]:.1f}" r="{R["hand"] * s:.2f}"/>')

    def _bein(self, sd):
        P, s = self.pt, self.s
        return (_glied(P(f"huefte_{sd}"), R["huefte"] * s, P(f"knie_{sd}"), R["knie"] * s)
                + _glied(P(f"knie_{sd}"), R["knie"] * s, P(f"knoechel_{sd}"), R["knoechel"] * s)
                + _glied(P(f"knoechel_{sd}"), R["knoechel"] * s, P(f"zehe_{sd}"), R["zehe"] * s))

    def _rumpf(self):
        P, s = self.pt, self.s
        if self.p.get("ansicht") == "front":
            sl, sr = P("schulter_l"), P("schulter_r")
            hl, hr = P("huefte_l"), P("huefte_r")
            pts = [(sl[0] + 1.2 * s, sl[1] - 1.5 * s), (sr[0] - 1.2 * s, sr[1] - 1.5 * s), (hr[0] + 1.6 * s, hr[1]),
                   (hl[0] - 1.6 * s, hl[1])]
            return (f'<path d="M{" L".join(f"{x:.1f},{y:.1f}" for x, y in pts)}Z" stroke="#fff" '
                    f'stroke-width="{7 * s:.1f}" stroke-linejoin="round"/>')
        return _glied(P("brust"), R["brust"] * s, P("becken"), R["becken"] * s)

    def _gewand(self):
        """Langes Gewand vom Hals bis knapp über die Knöchel (Beine darunter sichtbar)."""
        P, s = self.pt, self.s
        seiten = ("l", "r") if self.p.get("ansicht") == "front" else ("v", "h")
        sch = P("brust")
        knoechel = [P(f"knoechel_{sd}") for sd in seiten] + [P(f"knie_{sd}") for sd in seiten]
        saum_y = max(k[1] for k in knoechel[:2]) - 9 * s
        xs = [k[0] for k in knoechel] + [P("becken")[0]]
        vorne, hinten = max(xs) + 6 * s, min(xs) - 6 * s
        bx, by = P("becken")
        pts = [(sch[0] - 7.5 * s, sch[1] - 1 * s), (sch[0] + 7.5 * s, sch[1] - 1 * s), (bx + 8 * s, by),
               (vorne, saum_y), (hinten, saum_y), (bx - 8 * s, by)]
        return (f'<path d="M{" L".join(f"{x:.1f},{y:.1f}" for x, y in pts)}Z" stroke="#fff" '
                f'stroke-width="{4 * s:.1f}" stroke-linejoin="round"/>')

    def _kopf(self):
        x, y, r = self.kopf()
        out = f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.2f}"/>'
        if self.kopftuch:
            bx, by = self.pt("brust")
            out = (f'<path d="M{x - r * 1.28:.1f},{y:.1f} A{r * 1.28:.1f},{r * 1.28:.1f} 0 0 1 {x + r * 1.28:.1f},{y:.1f} '
                   f'L{bx + r * 1.15:.1f},{by + r * .2:.1f} L{bx - r * 1.15:.1f},{by + r * .2:.1f}Z"/>' + out)
        return out

    @property
    def svg(self):
        front = self.p.get("ansicht") == "front"
        teile = []
        if not front:
            teile.append(f'<g opacity="{HINTEN_DECKKRAFT}">{self._bein("h")}{self._arm("h")}</g>')
            vorne = self._bein("v") + self._rumpf() + (self._gewand() if self.kleid else "") + self._arm("v")
        else:
            vorne = (self._bein("l") + self._bein("r") + self._rumpf() + (self._gewand() if self.kleid else "")
                     + self._arm("l") + self._arm("r"))
        teile.append(vorne + self._kopf())
        return f'<g fill="#fff" stroke="none" opacity="{self.o}">' + "".join(teile) + "</g>"


# ====================================================================== Gegenstände
# Alle weiß bzw. in hellen Grautönen (Deckkraft) – nie dunkle Linien.

def _pfad(pts, schliessen=True):
    return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + ("Z" if schliessen else "")


def fels(x, y, r=40, o=1.0, rund=False, drehung=0):
    """Kantiger Felsbrocken (Low-Poly): Oberseite hell, Seiten in Grautönen – wirkt wie ein Stein.

    (x, y) = Mitte der Unterkante (liegt auf dem Boden); rund=True: rundum kantig
    (zum Tragen/Fliegen), dann ist (x, y) der Mittelpunkt.
    """
    if rund:
        P = {0: (-1.05, .12), 1: (-.92, -.5), 2: (-.38, -.95), 3: (.32, -.92), 4: (.98, -.42), 5: (1.06, .18),
             6: (.62, .72), 7: (-.18, .82), 8: (-.8, .56), "a": (-.3, -.32), "b": (.36, .04)}
        flaechen = [([1, 2, 3, 4, "b", "a"], .96), ([0, 1, "a", 8], .74), ([8, "a", "b", 6, 7], .58), (["b", 4, 5, 6], .44)]
        umriss = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    else:
        P = {0: (-1.02, 0), 1: (-1.14, -.44), 2: (-.8, -.86), 3: (-.18, -1.06), 4: (.46, -.98), 5: (.96, -.6),
             6: (1.1, -.14), 7: (.92, 0), "a": (-.36, -.56), "b": (.34, -.4)}
        flaechen = [([2, 3, 4, "b", "a"], .96), ([0, 1, 2, "a"], .76), ([0, "a", "b", 7], .6), (["b", 4, 5, 6, 7], .46)]
        umriss = [0, 1, 2, 3, 4, 5, 6, 7]
    a = math.radians(drehung)
    rot = {k: (x + (u * math.cos(a) - v * math.sin(a)) * r, y + (u * math.sin(a) + v * math.cos(a)) * r) for k, (u, v) in P.items()}
    teile = "".join(f'<path d="{_pfad([rot[i] for i in f])}" fill="#fff" fill-opacity="{t * o:.2f}" stroke="#fff" '
                    f'stroke-opacity="{t * o:.2f}" stroke-width="1" stroke-linejoin="round"/>' for f, t in flaechen)
    return teile + (f'<path d="{_pfad([rot[i] for i in umriss])}" fill="none" stroke="#fff" stroke-width="{max(2.5, r * .07):.1f}" '
                    f'stroke-opacity="{o}" stroke-linejoin="round"/>')


def sack(x, y, s=1.0, o=1.0):
    """Prall gefüllter, zugebundener Sack (Silhouette). (x, y) = Mitte der Unterkante."""
    P = lambda a, b: f"{x + a * s:.1f},{y + b * s:.1f}"
    return (f'<g opacity="{o}"><path d="M{P(-6, -48)} C{P(-30, -46)} {P(-38, -10)} {P(-28, -2)} C{P(-18, 4)} {P(18, 4)} {P(28, -2)} '
            f'C{P(38, -10)} {P(30, -46)} {P(6, -48)}Z" fill="#fff" stroke="none"/>'
            f'<path d="M{P(-8, -48)} L{P(-14, -62)} L{P(-2, -56)} L{P(0, -64)} L{P(4, -56)} L{P(14, -62)} L{P(8, -48)}Z" fill="#fff" stroke="none"/>'
            f'<path d="M{P(-10, -49)} L{P(10, -49)}" stroke="#fff" stroke-width="{4 * s:.1f}"/></g>')


def blatt(x0, y0, x1, y1, bauch=0.25, biegung=0.0):
    """Gefülltes Blatt von (x0,y0) nach (x1,y1); biegung > 0 lässt die Spitze hängen."""
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy)
    nx, ny = -dy / L, dx / L
    mx, my = x0 + dx * .5 + nx * biegung * L, y0 + dy * .5 + ny * biegung * L
    w = bauch * L * (1 if biegung >= 0 else -1)   # die dicke Seite folgt dem Bogen
    return (f'<path d="M{x0:.1f},{y0:.1f} Q{mx + nx * w:.1f},{my + ny * w:.1f} {x1:.1f},{y1:.1f} '
            f'Q{mx - nx * w * .35:.1f},{my - ny * w * .35:.1f} {x0:.1f},{y0:.1f}Z" fill="#fff"/>')


def palme(x, y, h=180, neigung=12, o=1.0):
    """Kokos-/Dattelpalme: gebogener Stamm, bogenförmig überhängende Wedel. (x, y) = Fuß des Stammes."""
    tx, ty = x + math.sin(math.radians(neigung)) * h * .78, y - h * .8
    cx, cy = x + (tx - x) * .1, y - h * .45
    links, rechts = [], []
    for i in range(13):
        t = i / 12
        px = (1 - t) ** 2 * x + 2 * (1 - t) * t * cx + t * t * tx
        py = (1 - t) ** 2 * y + 2 * (1 - t) * t * cy + t * t * ty
        w = h * (0.05 - 0.024 * t)
        links.append((px - w, py))
        rechts.append((px + w, py))
    stamm = f'<path d="{_pfad(links + rechts[::-1])}" fill="#fff"/>'
    wedel = ""
    # (Richtung der Sehne in Grad, 0 = rechts, 90 = oben; Länge; Bogen nach oben)
    for ang, lang, bogen in [(208, .5, .3), (172, .52, .26), (132, .4, .16), (-28, .5, .3), (8, .52, .26),
                             (48, .4, .16), (94, .3, .06)]:
        a = math.radians(ang)
        ex, ey = tx + math.cos(a) * h * lang, ty - math.sin(a) * h * lang
        # Bogen immer nach oben: Normalenrichtung von blatt() zeigt bei Wedeln nach links nach oben
        wedel += blatt(tx, ty, ex, ey, .2, bogen if math.cos(a) < 0 else -bogen)
    nuesse = "".join(f'<circle cx="{tx + dx * h / 180:.1f}" cy="{ty + dy * h / 180:.1f}" r="{h * .026:.1f}" fill="#fff"/>'
                     for dx, dy in [(-8, 10), (6, 11), (-1, 17)])
    return f'<g opacity="{o}">{stamm}{wedel}{nuesse}</g>'


def haengematte(x1, x2, y_aufh, durchhang=40):
    """Hängematte zwischen zwei Aufhängepunkten (x1|y_aufh) und (x2|y_aufh). Gibt (svg, tiefster Punkt) zurück."""
    a1, a2 = x1 + (x2 - x1) * .14, x2 - (x2 - x1) * .14
    yb = y_aufh + durchhang * .45
    tief = y_aufh + durchhang
    mx = (a1 + a2) / 2
    svg = (f'<path d="M{x1},{y_aufh} L{a1:.1f},{yb:.1f} M{x2},{y_aufh} L{a2:.1f},{yb:.1f}" stroke="#fff" stroke-width="3"/>'
           f'<path d="M{a1:.1f},{yb:.1f} Q{mx:.1f},{tief + durchhang * .55:.1f} {a2:.1f},{yb:.1f} '
           f'Q{mx:.1f},{tief + durchhang * .2:.1f} {a1:.1f},{yb:.1f}Z" fill="#fff" fill-opacity="0.55" stroke="#fff" stroke-width="3"/>')
    return svg, tief + durchhang * .12


def sprechblase(x, y, w, h, text="", groesse=44, spitze=None):
    """Sprechblase (Mitte x, y) mit arabischem Text; spitze = (x, y) wohin der Zipfel zeigt.

    Der Zipfel sitzt auf der Seite der Blase, die der Spitze zugewandt ist (unten, links oder rechts).
    """
    r = min(w, h) * .3
    x0, y0, x1, y1 = x - w / 2, y - h / 2, x + w / 2, y + h / 2
    tx, ty = spitze or (x0 + w * .2, y1 + 26)
    zb = min(22, h - 2 * r - 4)                     # Breite des Zipfels an der Blase
    unten = links = rechts = ""
    if tx < x0 and ty <= y1:
        ya = min(max(ty + zb / 2, y0 + r + zb), y1 - r)
        links = f" L{x0},{ya:.1f} L{tx:.1f},{ty:.1f} L{x0},{ya - zb:.1f}"
    elif tx > x1 and ty <= y1:
        ya = min(max(ty - zb / 2, y0 + r), y1 - r - zb)
        rechts = f" L{x1},{ya:.1f} L{tx:.1f},{ty:.1f} L{x1},{ya + zb:.1f}"
    else:
        bx = min(max(tx - 11, x0 + r + 4), x1 - r - 26)
        unten = f" L{bx + 22:.1f},{y1} L{tx:.1f},{ty:.1f} L{bx:.1f},{y1}"
    body = (f"M{x0 + r},{y0} L{x1 - r},{y0} Q{x1},{y0} {x1},{y0 + r}{rechts} L{x1},{y1 - r} Q{x1},{y1} {x1 - r},{y1}"
            f"{unten} L{x0 + r},{y1} Q{x0},{y1} {x0},{y1 - r}{links} L{x0},{y0 + r} Q{x0},{y0} {x0 + r},{y0}Z")
    t = (f'<text x="{x}" y="{y + groesse * .32:.1f}" text-anchor="middle" font-family="KFGQPC HAFS Uthmanic Script" '
         f'font-size="{groesse}" fill="#fff" stroke="none">{text}</text>') if text else ""
    return f'<path d="{body}" fill="#fff" fill-opacity="0.16" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>' + t


def richterhammer(x, y, s=1.0, winkel=-32):
    """Richterhammer über dem Schallblock. (x, y) = Mitte der Unterkante des Blocks."""
    block = (f'<rect x="{x - 52 * s:.1f}" y="{y - 16 * s:.1f}" width="{104 * s:.1f}" height="{16 * s:.1f}" rx="{5 * s:.1f}" fill="#fff"/>'
             f'<rect x="{x - 40 * s:.1f}" y="{y - 26 * s:.1f}" width="{80 * s:.1f}" height="{12 * s:.1f}" rx="{4 * s:.1f}" fill="#fff" fill-opacity="0.7"/>')
    hx, hy = x - 8 * s, y - 62 * s
    hammer = (f'<g transform="rotate({winkel} {hx:.1f} {hy:.1f})">'
              f'<rect x="{hx - 4 * s:.1f}" y="{hy - 4 * s:.1f}" width="{96 * s:.1f}" height="{12 * s:.1f}" rx="{6 * s:.1f}" fill="#fff"/>'
              f'<rect x="{hx - 30 * s:.1f}" y="{hy - 22 * s:.1f}" width="{56 * s:.1f}" height="{44 * s:.1f}" rx="{9 * s:.1f}" fill="#fff"/>'
              f'<rect x="{hx - 36 * s:.1f}" y="{hy - 26 * s:.1f}" width="{10 * s:.1f}" height="{52 * s:.1f}" rx="{4 * s:.1f}" fill="#fff"/>'
              f'<rect x="{hx + 20 * s:.1f}" y="{hy - 26 * s:.1f}" width="{10 * s:.1f}" height="{52 * s:.1f}" rx="{4 * s:.1f}" fill="#fff"/></g>')
    ix, iy = x - 4 * s, y - 26 * s                  # Aufschlagpunkt: Strahlen rundherum (links und rechts)
    schlag = "".join(f'<path d="M{ix + math.cos(math.radians(a)) * 64 * s:.1f},{iy - math.sin(math.radians(a)) * 30 * s:.1f} '
                     f'l{math.cos(math.radians(a)) * 18 * s:.1f},{-math.sin(math.radians(a)) * 18 * s:.1f}" '
                     f'stroke="#fff" stroke-width="{4.5 * s:.1f}" stroke-linecap="round"/>'
                     for a in (150, 172, 194, 30, 8, -14))
    return block + hammer + schlag


def sanduhr(x, y, h=200, oben=.35):
    """Sanduhr, (x, y) = Mitte der Unterkante. oben = Anteil Sand noch oben (0..1)."""
    s = h / 200
    P = lambda a, b: (x + a * s, y + b * s)
    platte = lambda yy: f'<rect x="{x - 62 * s:.1f}" y="{y + yy * s:.1f}" width="{124 * s:.1f}" height="{14 * s:.1f}" rx="{5 * s:.1f}" fill="#fff"/>'
    pfosten = "".join(f'<rect x="{x + dx * s:.1f}" y="{y - 186 * s:.1f}" width="{7 * s:.1f}" height="{172 * s:.1f}" rx="{3 * s:.1f}" fill="#fff"/>'
                      for dx in (-56, 49))
    glas = [P(-38, -186), P(38, -186), P(38, -170), P(6, -104), P(6, -96), P(38, -30), P(38, -14), P(-38, -14), P(-38, -30),
            P(-6, -96), P(-6, -104), P(-38, -170)]
    so = 66 * oben
    sand_o = _pfad([P(-6 - 30 * oben, -104 - so), P(6 + 30 * oben, -104 - so), P(6, -104), P(-6, -104)])
    su = 20 + 46 * (1 - oben)
    sand_u = f"M{P(-36, -16)[0]:.1f},{P(-36, -16)[1]:.1f} Q{P(0, -16 - su * 1.6)[0]:.1f},{P(0, -16 - su * 1.6)[1]:.1f} {P(36, -16)[0]:.1f},{P(36, -16)[1]:.1f}Z"
    return (f'<path d="{_pfad(glas)}" fill="#fff" fill-opacity="0.12" stroke="#fff" stroke-width="{4 * s:.1f}" stroke-linejoin="round"/>'
            f'<path d="{sand_o}" fill="#fff"/><path d="{sand_u}" fill="#fff"/>'
            f'<path d="M{x:.1f},{y - 100 * s:.1f} L{x:.1f},{y - 30 * s:.1f}" stroke="#fff" stroke-width="{3 * s:.1f}" stroke-dasharray="{4 * s:.1f} {5 * s:.1f}"/>'
            + platte(-200) + platte(-14) + pfosten)


def baum(x, y, h=120, o=1.0):
    """Laubbaum als Silhouette (Krone aus Kreisen), (x, y) = Stammfuß."""
    s = h / 120
    stamm = _pfad([(x - 7 * s, y), (x - 4 * s, y - 50 * s), (x + 4 * s, y - 50 * s), (x + 7 * s, y)])
    krone = "".join(f'<circle cx="{x + dx * s:.1f}" cy="{y + dy * s:.1f}" r="{r * s:.1f}"/>'
                    for dx, dy, r in [(0, -92, 30), (-26, -74, 24), (26, -74, 24), (-14, -60, 20), (14, -60, 20)])
    return f'<g fill="#fff" opacity="{o}"><path d="{stamm}"/>{krone}</g>'


def gebetsteppich(x, y, breite=150):
    """Gebetsteppich in Seitenansicht (flach), (x, y) = linke Unterkante."""
    fr = "".join(f'<path d="M{x + dx:.1f},{y - 3:.1f} l{-6 if dx < breite / 2 else 6},0" stroke="#fff" stroke-width="2.5"/>'
                 for dx in (0, breite))
    return f'<rect x="{x}" y="{y - 8}" width="{breite}" height="8" rx="2" fill="#fff" fill-opacity="0.75"/>' + fr


def weltkugel(x, y, r=46):
    """Weltkugel mit Längen- und Breitengraden, Mittelpunkt (x, y)."""
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" fill-opacity="0.12" stroke="#fff" stroke-width="5"/>'
            f'<path d="M{x - r},{y} L{x + r},{y} M{x},{y - r} C{x - r * .6},{y - r * .5} {x - r * .6},{y + r * .5} {x},{y + r} '
            f'M{x},{y - r} C{x + r * .6},{y - r * .5} {x + r * .6},{y + r * .5} {x},{y + r} '
            f'M{x - r * .85},{y - r * .5} Q{x},{y - r * .3} {x + r * .85},{y - r * .5} M{x - r * .85},{y + r * .5} Q{x},{y + r * .3} {x + r * .85},{y + r * .5}" '
            f'fill="none" stroke="#fff" stroke-width="3"/>')


def sonne_horizont(x, y, r=60, strahlen=9):
    """Aufgehende Sonne am Horizont (Mittelpunkt x, y auf der Horizontlinie)."""
    st = "".join(f'<path d="M{x + math.cos(a) * r * 1.3:.1f},{y + math.sin(a) * r * 1.3:.1f} '
                 f'L{x + math.cos(a) * r * 1.65:.1f},{y + math.sin(a) * r * 1.65:.1f}" stroke="#fff" stroke-width="6" stroke-linecap="round"/>'
                 for a in [math.radians(190 + i * 160 / (strahlen - 1)) for i in range(strahlen)])
    return f'<path d="M{x - r},{y} A{r},{r} 0 0 1 {x + r},{y}Z" fill="#fff"/>' + st


def herz(x, y, s=1.0, o=1.0):
    P = lambda a, b: f"{x + a * s:.1f},{y + b * s:.1f}"
    return (f'<path d="M{P(0, 26)} C{P(-30, 6)} {P(-34, -22)} {P(-16, -26)} C{P(-6, -28)} {P(0, -20)} {P(0, -14)} '
            f'C{P(0, -20)} {P(6, -28)} {P(16, -26)} C{P(34, -22)} {P(30, 6)} {P(0, 26)}Z" fill="#fff" fill-opacity="{o}"/>')
