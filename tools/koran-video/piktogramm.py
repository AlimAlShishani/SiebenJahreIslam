"""Piktogramm-Menschen in der Art professioneller Piktogramme (wie in den Referenzvideos).

Aufbau statt Strichmännchen: Rumpf als Körper, Schulter- und Hüftgelenk, sich verjüngende
Glieder, Hände und Füße (zeigen die Richtung), Kopf mit kleinem Abstand zum Körper.
Kein Gesicht, keine Augen, keine schwarzen Trennlinien. Tiefe und Details entstehen über
abgestuftes Weiß (grau()): abgewandter Arm/abgewandtes Bein deckend grau, feine hellgraue
Kante, wo ein Arm vor dem Körper liegt, Gegenstände etwas dunkler als die Figur.

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

Gegenstände (gefüllte Silhouetten in abgestuftem Weiß, hell= dunkelt das ganze Objekt ab):
    fels(x, y, r, rund=, drehung=)  kantiger Brocken (rund=True: zum Tragen/Fliegen, (x, y) = Mitte)
    sack, palme, baum, haengematte (→ svg, tiefster Punkt), sprechblase(…, spitze=(x, y)),
    richterhammer, sanduhr, gebetsteppich, weltkugel, sonne_horizont, herz, blatt
"""

from __future__ import annotations

import math

# Körpermaße in Einheiten (stehende Figur ≈ 100 hoch)
SCHIEN, OBERSCHENKEL, RUMPF, OBERARM, UNTERARM = 23.0, 23.0, 29.0, 15.0, 13.5
KNOECHEL_H = 3.4
KOPF_R = 8.2
LUECKE = 3.0       # sichtbarer Spalt zwischen Kopf und Rumpf (Piktogramm-Stil, Kopf nicht im Körper)
KAPPE = 6.0        # Seitenansicht: Mitte der runden Rumpf-Oberkante liegt so weit unter dem Schultergelenk
R = dict(schulter=4.8, ellbogen=3.8, handgelenk=3.2, hand=3.6, huefte=6.4, knie=4.9, knoechel=3.6,
         zehe=2.4, brust=9.6, becken=8.4)
HINTEN_TON = 0.6      # abgewandter Arm/abgewandtes Bein: deckendes Grau (statt Transparenz)
KONTUR_TON = 0.72     # feine, etwas dunklere Kante, wo ein Arm vor dem Körper liegt
_ids = [0]


def grau(wert, hell=1.0):
    """Deckender Grauton: 1 = Weiß, 0.85 = etwas dunkleres Weiß … (hell < 1 dunkelt ganze Figuren/Objekte ab).

    Etwas abgedunkeltes Weiß hebt Gegenstände und Details voneinander ab (Wunsch des Nutzers);
    nur schwarze/dunkle Trennlinien mitten in Figuren sind tabu.
    """
    v = max(0, min(255, round(255 * wert * hell)))
    return f"#{v:02x}{v:02x}{v:02x}"

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
    hell < 1: ganze Figur in dunklerem Grau (z. B. Figuren im Hintergrund, frühere Generationen) –
    deckend, also ohne Durchscheinen. kontur: feine graue Kante um Arme, die vor dem Körper liegen
    (Standard: nur in der Seitenansicht; in der Frontansicht wirkt sie an den Schultern wie Träger).
    """

    def __init__(self, x, y, h=170, pose="stehen", spiegeln=False, kleid=False, kopftuch=False, o=1.0, hell=1.0,
                 kontur=None, **aenderungen):
        self.p = dict(POSEN[pose]) if isinstance(pose, str) else dict(pose)
        self.p.update(aenderungen)
        self.s = h / 100.0
        self.m = -1 if spiegeln and self.p.get("ansicht") != "front" else 1
        self.kleid, self.kopftuch, self.o, self.hell = kleid, kopftuch, o, hell
        self.kontur = (self.p.get("ansicht") != "front") if kontur is None else kontur
        self.farbe = grau(1.0, hell)
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
            # Oberkante des Rumpfs: Schulterpunkte (−2 + 1,5) plus halbe Strichbreite (3,5)
            j["kopf"] = (0.0, schulter_y + 3.0 + LUECKE + KOPF_R)
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
            j["rumpf_oben"] = (sch[0] - up[0] * KAPPE, sch[1] - up[1] * KAPPE)
            ak = math.radians(p.get("rumpf", 0) + p.get("kopf", 0))
            d = R["brust"] - KAPPE + LUECKE + KOPF_R
            j["kopf"] = (sch[0] + math.sin(ak) * d, sch[1] + math.cos(ak) * d)
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
        kontakt = [(j["becken"], R["becken"]), (j.get("rumpf_oben", j["brust"]), R["brust"]), (j["kopf"], KOPF_R)]
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
            return (f'<path d="M{" L".join(f"{x:.1f},{y:.1f}" for x, y in pts)}Z" stroke="{self.farbe}" '
                    f'stroke-width="{7 * s:.1f}" stroke-linejoin="round"/>')
        return _glied(P("rumpf_oben"), R["brust"] * s, P("becken"), R["becken"] * s)

    def _rumpf_flaeche(self):
        """Fläche von Rumpf (und Gewand) ohne Striche – für den Zuschnitt der Arm-Kante."""
        P, s = self.pt, self.s
        if self.p.get("ansicht") == "front":
            sl, sr = P("schulter_l"), P("schulter_r")
            hl, hr = P("huefte_l"), P("huefte_r")
            pts = [(sl[0] + 1.2 * s, sl[1] - 1.5 * s), (sr[0] - 1.2 * s, sr[1] - 1.5 * s), (hr[0] + 1.6 * s, hr[1]),
                   (hl[0] - 1.6 * s, hl[1])]
            cx, cy = sum(p[0] for p in pts) / 4, sum(p[1] for p in pts) / 4
            weit = []
            for px, py in pts:                       # um die halbe Strichbreite (3,5) nach außen
                d = math.hypot(px - cx, py - cy) or 1
                weit.append((px + (px - cx) / d * 4.2 * s, py + (py - cy) / d * 4.2 * s))
            flaeche = f'<path d="{_pfad(weit)}"/>'
        else:
            flaeche = _glied(P("rumpf_oben"), R["brust"] * s, P("becken"), R["becken"] * s)
        if self.kleid:
            flaeche += self._gewand()
        return flaeche

    def _armluecken(self):
        """Frontansicht, Hände am Kopf: die Lücken zwischen Arm, Kopf und Schulter füllen.

        Sonst entstehen zwei dunkle schräge Schlitze unter dem Kopf, die wie Augen wirken (verboten).
        Gefüllt in Figurfarbe: Kopf und Arme werden eine Silhouette mit seitlich abstehenden Ellbogen.
        """
        kx, ky, kr = self.kopf()
        out = ""
        for sd in ("l", "r"):
            hx, hy = self.pt(f"hand_{sd}")
            if math.hypot(hx - kx, hy - ky) < kr * 1.8:
                pts = [self.pt(f"schulter_{sd}"), self.pt(f"ellbogen_{sd}"), (hx, hy), (kx, ky), self.pt("brust")]
                out += f'<path d="{_pfad(pts)}" fill="{self.farbe}" stroke="{self.farbe}" stroke-width="{2 * self.s:.1f}" stroke-linejoin="round"/>'
        return out

    def _kanten(self, arme):
        """Feine, etwas dunklere Kante um die Arme – nur dort, wo sie vor Rumpf/Gewand liegen."""
        _ids[0] += 1
        cid = f"rumpf{_ids[0]}"
        return (f'<defs><clipPath id="{cid}">{self._rumpf_flaeche()}</clipPath></defs>'
                f'<g clip-path="url(#{cid})" fill="none" stroke="{grau(KONTUR_TON, self.hell)}" '
                f'stroke-width="{2.4 * self.s:.1f}">' + "".join(arme) + "</g>")

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
        return (f'<path d="M{" L".join(f"{x:.1f},{y:.1f}" for x, y in pts)}Z" stroke="{self.farbe}" '
                f'stroke-width="{4 * s:.1f}" stroke-linejoin="round"/>')

    def _kopf(self):
        x, y, r = self.kopf()
        out = f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.2f}"/>'
        if self.p.get("ansicht") == "front" and max(self.p.get("arm_l", (0, 0))[0], self.p.get("arm_r", (0, 0))[0]) > 100:
            # Arme hoch: Hals schließen, sonst bildet der Spalt unter dem Kopf mit den Armen
            # einen dunklen Bogen, der wie ein Mund wirkt
            bx, by = self.pt("brust")
            out = (f'<path d="M{bx - r * .42:.1f},{by:.1f} L{x - r * .42:.1f},{y:.1f} L{x + r * .42:.1f},{y:.1f} '
                   f'L{bx + r * .42:.1f},{by:.1f}Z"/>' + out)
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
            teile.append(f'<g fill="{grau(HINTEN_TON, self.hell)}">{self._bein("h")}{self._arm("h")}</g>')
            teile.append(self._bein("v") + self._rumpf() + (self._gewand() if self.kleid else ""))
            arme = [self._arm("v")]
        else:
            teile.append(self._bein("l") + self._bein("r") + self._rumpf() + (self._gewand() if self.kleid else ""))
            teile.append(self._armluecken())
            arme = [self._arm("l"), self._arm("r")]
        if self.kontur:
            teile.append(self._kanten(arme))
        teile.append("".join(arme) + self._kopf())
        return f'<g fill="{self.farbe}" stroke="none" opacity="{self.o}">' + "".join(teile) + "</g>"


# ====================================================================== Gegenstände
# Alle weiß bzw. in hellen Grautönen (Deckkraft) – nie dunkle Linien.

def _pfad(pts, schliessen=True):
    return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + ("Z" if schliessen else "")


def fels(x, y, r=40, o=1.0, rund=False, drehung=0, hell=1.0):
    """Kantiger Felsbrocken (Low-Poly): Oberseite hell, Seiten in deckenden Grautönen – wirkt wie ein Stein.

    (x, y) = Mitte der Unterkante (liegt auf dem Boden); rund=True: rundum kantig
    (zum Tragen/Fliegen), dann ist (x, y) der Mittelpunkt. o = Deckkraft (zum Ausblenden),
    hell < 1 = insgesamt dunkler (z. B. im Hintergrund).
    """
    if rund:
        P = {0: (-1.05, .12), 1: (-.92, -.5), 2: (-.38, -.95), 3: (.32, -.92), 4: (.98, -.42), 5: (1.06, .18),
             6: (.62, .72), 7: (-.18, .82), 8: (-.8, .56), "a": (-.3, -.32), "b": (.36, .04)}
        flaechen = [([1, 2, 3, 4, "b", "a"], .97), ([0, 1, "a", 8], .8), ([8, "a", "b", 6, 7], .66), (["b", 4, 5, 6], .54)]
        umriss = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    else:
        P = {0: (-1.02, 0), 1: (-1.14, -.44), 2: (-.8, -.86), 3: (-.18, -1.06), 4: (.46, -.98), 5: (.96, -.6),
             6: (1.1, -.14), 7: (.92, 0), "a": (-.36, -.56), "b": (.34, -.4)}
        flaechen = [([2, 3, 4, "b", "a"], .97), ([0, 1, 2, "a"], .8), ([0, "a", "b", 7], .66), (["b", 4, 5, 6, 7], .54)]
        umriss = [0, 1, 2, 3, 4, 5, 6, 7]
    a = math.radians(drehung)
    rot = {k: (x + (u * math.cos(a) - v * math.sin(a)) * r, y + (u * math.sin(a) + v * math.cos(a)) * r) for k, (u, v) in P.items()}
    teile = "".join(f'<path d="{_pfad([rot[i] for i in f])}" fill="{grau(t, hell)}" stroke="{grau(t, hell)}" '
                    f'stroke-width="1" stroke-linejoin="round"/>' for f, t in flaechen)
    return (f'<g opacity="{o}">{teile}<path d="{_pfad([rot[i] for i in umriss])}" fill="none" stroke="{grau(1, hell)}" '
            f'stroke-width="{max(2.5, r * .07):.1f}" stroke-linejoin="round"/></g>')

def sack(x, y, s=1.0, o=1.0, hell=1.0):
    """Prall gefüllter, zugebundener Sack. (x, y) = Mitte der Unterkante.

    Etwas dunkler als Weiß, mit Schattenseite und dunklerem Band – hebt sich so von der Figur ab.
    """
    P = lambda a, b: f"{x + a * s:.1f},{y + b * s:.1f}"
    return (f'<g opacity="{o}" stroke="none">'
            f'<path d="M{P(-6, -48)} C{P(-30, -46)} {P(-38, -10)} {P(-28, -2)} C{P(-18, 4)} {P(18, 4)} {P(28, -2)} '
            f'C{P(38, -10)} {P(30, -46)} {P(6, -48)}Z" fill="{grau(.88, hell)}"/>'
            f'<path d="M{P(6, -48)} C{P(30, -46)} {P(38, -10)} {P(28, -2)} C{P(22, 2)} {P(12, 4)} {P(4, 4)} '
            f'C{P(18, -6)} {P(22, -32)} {P(6, -48)}Z" fill="{grau(.72, hell)}"/>'
            f'<path d="M{P(-8, -48)} L{P(-14, -62)} L{P(-2, -56)} L{P(0, -64)} L{P(4, -56)} L{P(14, -62)} L{P(8, -48)}Z" '
            f'fill="{grau(.88, hell)}"/>'
            f'<path d="M{P(-10, -49)} L{P(10, -49)}" stroke="{grau(.56, hell)}" stroke-width="{4.5 * s:.1f}" stroke-linecap="round"/></g>')

def blatt(x0, y0, x1, y1, bauch=0.25, biegung=0.0, farbe="#fff"):
    """Gefülltes Blatt von (x0,y0) nach (x1,y1); biegung > 0 lässt die Spitze hängen."""
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy)
    nx, ny = -dy / L, dx / L
    mx, my = x0 + dx * .5 + nx * biegung * L, y0 + dy * .5 + ny * biegung * L
    w = bauch * L * (1 if biegung >= 0 else -1)   # die dicke Seite folgt dem Bogen
    return (f'<path d="M{x0:.1f},{y0:.1f} Q{mx + nx * w:.1f},{my + ny * w:.1f} {x1:.1f},{y1:.1f} '
            f'Q{mx - nx * w * .35:.1f},{my - ny * w * .35:.1f} {x0:.1f},{y0:.1f}Z" fill="{farbe}"/>')

def palme(x, y, h=180, neigung=12, o=1.0, hell=1.0):
    """Kokos-/Dattelpalme: gebogener Stamm mit Ringen, bogenförmig überhängende Wedel. (x, y) = Fuß des Stammes.

    Stamm etwas dunkler als die Wedel, hintere Wedel dunkler als vordere, Nüsse dunkel – so bleibt die
    Palme auch neben weißen Figuren gut lesbar.
    """
    tx, ty = x + math.sin(math.radians(neigung)) * h * .78, y - h * .8
    cx, cy = x + (tx - x) * .1, y - h * .45
    links, rechts, mitte = [], [], []
    for i in range(13):
        t = i / 12
        px = (1 - t) ** 2 * x + 2 * (1 - t) * t * cx + t * t * tx
        py = (1 - t) ** 2 * y + 2 * (1 - t) * t * cy + t * t * ty
        w = h * (0.05 - 0.024 * t)
        links.append((px - w, py))
        rechts.append((px + w, py))
        mitte.append((px, py, w))
    stamm = f'<path d="{_pfad(links + rechts[::-1])}" fill="{grau(.8, hell)}"/>'
    ringe = "".join(f'<path d="M{px - w * .92:.1f},{py:.1f} Q{px:.1f},{py + w * .7:.1f} {px + w * .92:.1f},{py:.1f}" fill="none" '
                    f'stroke="{grau(.64, hell)}" stroke-width="{h * .011:.1f}" stroke-linecap="round"/>'
                    for px, py, w in mitte[1:11:2])
    hinten = vorne = ""
    # (Richtung der Sehne in Grad, 0 = rechts, 90 = oben; Länge; Bogen nach oben; Ton)
    for ang, lang, bogen, ton in [(132, .4, .16, .82), (48, .4, .16, .82), (94, .3, .06, .82), (208, .5, .3, .97),
                                  (172, .52, .26, .97), (-28, .5, .3, .97), (8, .52, .26, .97)]:
        a = math.radians(ang)
        ex, ey = tx + math.cos(a) * h * lang, ty - math.sin(a) * h * lang
        # Bogen immer nach oben: Normalenrichtung von blatt() zeigt bei Wedeln nach links nach oben
        b = blatt(tx, ty, ex, ey, .2, bogen if math.cos(a) < 0 else -bogen, grau(ton, hell))
        if ton < .9:
            hinten += b
        else:
            vorne += b
    nuesse = "".join(f'<circle cx="{tx + dx * h / 180:.1f}" cy="{ty + dy * h / 180:.1f}" r="{h * .028:.1f}" fill="{grau(.6, hell)}"/>'
                     for dx, dy in [(-8, 10), (6, 11), (-1, 17)])
    return f'<g opacity="{o}" stroke="none">{hinten}{stamm}{ringe}{vorne}{nuesse}</g>'

def haengematte(x1, x2, y_aufh, durchhang=40, hell=1.0):
    """Hängematte zwischen zwei Aufhängepunkten (x1|y_aufh) und (x2|y_aufh). Gibt (svg, tiefster Punkt) zurück.

    Stoff in dunklerem Grau, damit die (weiße) Figur darin klar hervortritt.
    """
    a1, a2 = x1 + (x2 - x1) * .14, x2 - (x2 - x1) * .14
    yb = y_aufh + durchhang * .45
    tief = y_aufh + durchhang
    mx = (a1 + a2) / 2
    svg = (f'<path d="M{x1},{y_aufh} L{a1:.1f},{yb:.1f} M{x2},{y_aufh} L{a2:.1f},{yb:.1f}" stroke="{grau(.66, hell)}" stroke-width="3"/>'
           f'<path d="M{a1:.1f},{yb:.1f} Q{mx:.1f},{tief + durchhang * .55:.1f} {a2:.1f},{yb:.1f} '
           f'Q{mx:.1f},{tief + durchhang * .2:.1f} {a1:.1f},{yb:.1f}Z" fill="{grau(.62, hell)}" stroke="{grau(.84, hell)}" '
           f'stroke-width="3" stroke-linejoin="round"/>')
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


def richterhammer(x, y, s=1.0, winkel=-30, hell=1.0):
    """Richterhammer im Moment des Aufschlags auf dem Schallblock. (x, y) = Mitte der Unterkante des Blocks.

    Wie ein echter Hammer: Der Kopf ist ein Zylinder QUER zum Stiel, der Stiel steckt in seiner Mitte;
    eine Stirnseite des Kopfes trifft den Block. Kopf hell mit weißen Ringen, Stiel und Block dunkler.
    winkel = Neigung des Stiels (negativ = Stiel zeigt nach rechts oben).
    """
    block = (f'<rect x="{x - 56 * s:.1f}" y="{y - 16 * s:.1f}" width="{112 * s:.1f}" height="{16 * s:.1f}" rx="{5 * s:.1f}" fill="{grau(.62, hell)}"/>'
             f'<rect x="{x - 42 * s:.1f}" y="{y - 27 * s:.1f}" width="{84 * s:.1f}" height="{13 * s:.1f}" rx="{4 * s:.1f}" fill="{grau(.86, hell)}"/>')
    # Kopfmitte so wählen, dass die tiefste Ecke der unteren Stirnseite (nach der Drehung) genau auf
    # der Blockmitte aufsetzt – der Moment des Aufschlags
    a = math.radians(winkel)
    ecken = [(dx * math.cos(a) - 40 * math.sin(a), dx * math.sin(a) + 40 * math.cos(a)) for dx in (-24, 24)]
    ex, ey = max(ecken, key=lambda e: e[1])
    hx, hy = x - ex * s, y - 24 * s - ey * s         # 3 Einheiten tiefer: die Ecke setzt sichtbar auf
    stiel = (f'<rect x="{hx + 20 * s:.1f}" y="{hy - 5.5 * s:.1f}" width="{100 * s:.1f}" height="{11 * s:.1f}" rx="{5.5 * s:.1f}" fill="{grau(.74, hell)}"/>'
             f'<circle cx="{hx + 122 * s:.1f}" cy="{hy:.1f}" r="{8 * s:.1f}" fill="{grau(.74, hell)}"/>')
    kopf = (f'<rect x="{hx - 21 * s:.1f}" y="{hy - 34 * s:.1f}" width="{42 * s:.1f}" height="{68 * s:.1f}" rx="{8 * s:.1f}" fill="{grau(.9, hell)}"/>'
            f'<rect x="{hx - 24 * s:.1f}" y="{hy - 40 * s:.1f}" width="{48 * s:.1f}" height="{11 * s:.1f}" rx="{4 * s:.1f}" fill="{grau(1, hell)}"/>'
            f'<rect x="{hx - 24 * s:.1f}" y="{hy + 29 * s:.1f}" width="{48 * s:.1f}" height="{11 * s:.1f}" rx="{4 * s:.1f}" fill="{grau(1, hell)}"/>'
            f'<rect x="{hx - 23 * s:.1f}" y="{hy - 5 * s:.1f}" width="{46 * s:.1f}" height="{10 * s:.1f}" rx="{3 * s:.1f}" fill="{grau(.8, hell)}"/>')
    hammer = f'<g transform="rotate({winkel} {hx:.1f} {hy:.1f})">{stiel}{kopf}</g>'
    ix, iy = x, y - 27 * s                           # Aufschlagpunkt: Strahlen links und rechts davon
    schlag = "".join(f'<path d="M{ix + math.cos(math.radians(w)) * 66 * s:.1f},{iy - math.sin(math.radians(w)) * 30 * s:.1f} '
                     f'l{math.cos(math.radians(w)) * 18 * s:.1f},{-math.sin(math.radians(w)) * 18 * s:.1f}" '
                     f'stroke="{grau(1, hell)}" stroke-width="{4.5 * s:.1f}" stroke-linecap="round"/>'
                     for w in (150, 172, 194, 30, 8, -14))
    return f'<g stroke="none">{block}{hammer}</g>' + schlag
def sanduhr(x, y, h=200, oben=.35, hell=1.0):
    """Sanduhr, (x, y) = Mitte der Unterkante. oben = Anteil Sand noch oben (0..1).

    Gestell etwas dunkler, Glas weiß umrandet, Sand weiß – der Sand ist das, worauf es ankommt.
    """
    s = h / 200
    P = lambda a, b: (x + a * s, y + b * s)
    platte = lambda yy: (f'<rect x="{x - 62 * s:.1f}" y="{y + yy * s:.1f}" width="{124 * s:.1f}" height="{14 * s:.1f}" '
                         f'rx="{5 * s:.1f}" fill="{grau(.8, hell)}" stroke="none"/>')
    pfosten = "".join(f'<rect x="{x + dx * s:.1f}" y="{y - 186 * s:.1f}" width="{7 * s:.1f}" height="{172 * s:.1f}" rx="{3 * s:.1f}" '
                      f'fill="{grau(.72, hell)}" stroke="none"/>' for dx in (-56, 49))
    glas = [P(-38, -186), P(38, -186), P(38, -170), P(6, -104), P(6, -96), P(38, -30), P(38, -14), P(-38, -14), P(-38, -30),
            P(-6, -96), P(-6, -104), P(-38, -170)]
    so = 66 * oben
    sand_o = _pfad([P(-6 - 30 * oben, -104 - so), P(6 + 30 * oben, -104 - so), P(6, -104), P(-6, -104)])
    su = 20 + 46 * (1 - oben)
    sand_u = f"M{P(-36, -16)[0]:.1f},{P(-36, -16)[1]:.1f} Q{P(0, -16 - su * 1.6)[0]:.1f},{P(0, -16 - su * 1.6)[1]:.1f} {P(36, -16)[0]:.1f},{P(36, -16)[1]:.1f}Z"
    return (pfosten
            + f'<path d="{_pfad(glas)}" fill="#fff" fill-opacity="0.12" stroke="{grau(1, hell)}" stroke-width="{4 * s:.1f}" stroke-linejoin="round"/>'
            f'<path d="{sand_o}" fill="{grau(1, hell)}" stroke="none"/><path d="{sand_u}" fill="{grau(1, hell)}" stroke="none"/>'
            f'<path d="M{x:.1f},{y - 100 * s:.1f} L{x:.1f},{y - 30 * s:.1f}" stroke="{grau(1, hell)}" stroke-width="{3 * s:.1f}" '
            f'stroke-dasharray="{4 * s:.1f} {5 * s:.1f}"/>'
            + platte(-200) + platte(-14))

def baum(x, y, h=120, o=1.0, hell=1.0):
    """Laubbaum als Silhouette, (x, y) = Stammfuß. Krone zweitönig (unten dunkler) für Volumen, Stamm dunkler."""
    s = h / 120
    stamm = _pfad([(x - 7 * s, y), (x - 4 * s, y - 50 * s), (x + 4 * s, y - 50 * s), (x + 7 * s, y)])
    kreise = lambda liste, ton: "".join(f'<circle cx="{x + dx * s:.1f}" cy="{y + dy * s:.1f}" r="{r * s:.1f}" fill="{grau(ton, hell)}"/>'
                                         for dx, dy, r in liste)
    hinten = kreise([(-26, -70, 24), (26, -70, 24), (-12, -58, 20), (12, -58, 20)], .74)
    vorne = kreise([(0, -94, 29), (-22, -82, 21), (22, -82, 21), (0, -72, 22)], .92)
    return f'<g opacity="{o}" stroke="none"><path d="{stamm}" fill="{grau(.66, hell)}"/>{hinten}{vorne}</g>'

def gebetsteppich(x, y, breite=150, hell=1.0):
    """Gebetsteppich in Seitenansicht, (x, y) = linke Unterkante. Dunkler als die Figur, mit hellem Musterband und Fransen."""
    fr = "".join(f'<path d="M{x + dx:.1f},{y - 5:.1f} l{-7 if dx < breite / 2 else 7},0" stroke="{grau(.8, hell)}" stroke-width="2.5"/>'
                 for dx in (0, breite))
    return (f'<rect x="{x}" y="{y - 10}" width="{breite}" height="10" rx="2" fill="{grau(.6, hell)}" stroke="none"/>'
            f'<rect x="{x + 4}" y="{y - 10}" width="{breite - 8}" height="3.2" rx="1.5" fill="{grau(.88, hell)}" stroke="none"/>' + fr)

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


def koran_rahl(x, y, s=1.0, hell=1.0):
    """Aufgeschlagener Koran auf dem Lesepult (Rahl, X-förmig gekreuzte Bretter). (x, y) = Bodenmitte.

    Seiten hell mit Textzeilen (Verse) in Grau, Einband und Pult dunkler.
    """
    P = lambda a, b: f"{x + a * s:.1f},{y + b * s:.1f}"
    pult = "".join(f'<path d="M{P(a0, b0)} L{P(a1, b1)}" stroke="{grau(.68, hell)}" stroke-width="{10 * s:.1f}" stroke-linecap="round"/>'
                   for a0, b0, a1, b1 in [(-44, -4, 36, -74), (44, -4, -36, -74)])
    gelenk = f'<circle cx="{x:.1f}" cy="{y - 39 * s:.1f}" r="{5 * s:.1f}" fill="{grau(.52, hell)}"/>'

    def seite(m, d=0.0):
        k = lambda a, b: P(m * (a + (d if a else 0)), b + (d if b < -90 else -d))
        return (f'M{k(0, -64)} C{k(-18, -78)} {k(-42, -80)} {k(-62, -74)} L{k(-62, -120)} '
                f'C{k(-42, -126)} {k(-18, -124)} {k(0, -110)}Z')
    einband = "".join(f'<path d="{seite(m, 6)}" fill="{grau(.58, hell)}"/>' for m in (-1, 1))
    seiten = "".join(f'<path d="{seite(m)}" fill="{grau(.97, hell)}"/>' for m in (-1, 1))
    zeilen = ""
    for m in (-1, 1):
        for t in (.2, .36, .52, .68, .84):
            y0, y1 = -64 + (-110 + 64) * t, -74 + (-120 + 74) * t      # Spine bzw. Außenkante
            zeilen += (f'<path d="M{P(m * 8, y0 - 6 * (1 - t) - 3)} Q{P(m * 30, y0 - 12)} {P(m * 54, y1 + 1)}" fill="none" '
                       f'stroke="{grau(.6, hell)}" stroke-width="{2.4 * s:.1f}" stroke-linecap="round"/>')
    return f'<g stroke="none">{pult}{gelenk}{einband}{seiten}{zeilen}</g>'


def waage(x, y, h=150, neigung=0.0, hell=1.0):
    """Balkenwaage. (x, y) = Mitte der Standfläche, h = Höhe des Drehpunkts, neigung > 0: linke Schale tiefer.

    Gibt (svg, schale_links, schale_rechts) zurück – die Punkte liegen mitten auf der Schalenoberkante,
    dort setzt man Gegenstände (Sack, Gewicht …) oder Hände auf.
    """
    a = math.radians(neigung)
    L = h * .64
    py = y - h
    enden = [(x - L * math.cos(a), py + L * math.sin(a)), (x + L * math.cos(a), py - L * math.sin(a))]
    fuss = (f'<path d="{_pfad([(x - 36, y), (x + 36, y), (x + 22, y - 12), (x - 22, y - 12)])}" fill="{grau(.6, hell)}"/>'
            f'<rect x="{x - 4.5:.1f}" y="{py:.1f}" width="9" height="{h - 12:.1f}" rx="3" fill="{grau(.8, hell)}"/>')
    balken = (f'<path d="M{enden[0][0]:.1f},{enden[0][1]:.1f} L{enden[1][0]:.1f},{enden[1][1]:.1f}" stroke="{grau(.92, hell)}" '
              f'stroke-width="8" stroke-linecap="round"/>'
              f'<circle cx="{x:.1f}" cy="{py:.1f}" r="8" fill="{grau(1, hell)}"/>'
              f'<circle cx="{x:.1f}" cy="{py - 14:.1f}" r="6" fill="{grau(.9, hell)}"/>')
    schalen, punkte = "", []
    for ex, ey in enden:
        rand = ey + h * .36
        schalen += (f'<path d="M{ex:.1f},{ey:.1f} L{ex - 27:.1f},{rand:.1f} M{ex:.1f},{ey:.1f} L{ex + 27:.1f},{rand:.1f}" '
                    f'stroke="{grau(.7, hell)}" stroke-width="2.5" fill="none"/>'
                    f'<path d="M{ex - 36:.1f},{rand:.1f} L{ex + 36:.1f},{rand:.1f} Q{ex + 28:.1f},{rand + 22:.1f} {ex:.1f},{rand + 22:.1f} '
                    f'Q{ex - 28:.1f},{rand + 22:.1f} {ex - 36:.1f},{rand:.1f}Z" fill="{grau(.86, hell)}"/>'
                    f'<circle cx="{ex:.1f}" cy="{ey:.1f}" r="4" fill="{grau(1, hell)}"/>')
        punkte.append((ex, rand))
    return f'<g stroke="none">{fuss}{schalen}{balken}</g>', punkte[0], punkte[1]


def herz_flecken(x, y, s=1.0, hell=1.0):
    """Herz mit dunklen Flecken – das bekannte Bild für ein krankes Herz (Zweifel, Heuchelei, Sünden)."""
    _ids[0] += 1
    cid = f"herz{_ids[0]}"
    P = lambda a, b: f"{x + a * s:.1f},{y + b * s:.1f}"
    form = (f'M{P(0, 26)} C{P(-30, 6)} {P(-34, -22)} {P(-16, -26)} C{P(-6, -28)} {P(0, -20)} {P(0, -14)} '
            f'C{P(0, -20)} {P(6, -28)} {P(16, -26)} C{P(34, -22)} {P(30, 6)} {P(0, 26)}Z')
    flecken = "".join(f'<circle cx="{x + a * s:.1f}" cy="{y + b * s:.1f}" r="{r * s:.1f}" fill="{grau(t, hell)}"/>'
                      for a, b, r, t in [(-14, -11, 6, .42), (11, -2, 7.5, .38), (-4, 10, 4.5, .46), (17, -16, 3.6, .5),
                                         (-19, 2, 3.2, .5), (4, -17, 2.6, .55), (-9, -1, 2.4, .55)])
    return (f'<defs><clipPath id="{cid}"><path d="{form}"/></clipPath></defs>'
            f'<path d="{form}" fill="{grau(.92, hell)}" stroke="none"/><g clip-path="url(#{cid})" stroke="none">{flecken}</g>')


def lichtstrahlen(x, y_oben, y_unten, breite=160, n=5, o=0.22):
    """Lichtstrahlen, die von oben herabfallen (z. B. auf das, was herabgesandt wird)."""
    out = ""
    for i in range(n):
        t = (i - (n - 1) / 2) / max(1, (n - 1) / 2)
        bx = x + t * breite / 2
        w = breite / n * .55
        out += (f'<path d="M{x + t * breite * .12 - 3:.1f},{y_oben:.1f} L{x + t * breite * .12 + 3:.1f},{y_oben:.1f} '
                f'L{bx + w / 2:.1f},{y_unten:.1f} L{bx - w / 2:.1f},{y_unten:.1f}Z" fill="#fff" fill-opacity="{o * (1 - abs(t) * .4):.2f}" stroke="none"/>')
    return out


def gerader_weg(x, y_unten, y_horizont, b_unten=240, b_oben=8, hell=1.0):
    """Gerader Weg in Perspektive bis zum Horizont: Belag dunkelgrau, Ränder hell, Mittelstreifen nach hinten kleiner."""
    flaeche = _pfad([(x - b_unten / 2, y_unten), (x + b_unten / 2, y_unten), (x + b_oben / 2, y_horizont), (x - b_oben / 2, y_horizont)])
    raender = (f'<path d="M{x - b_unten / 2:.1f},{y_unten:.1f} L{x - b_oben / 2:.1f},{y_horizont:.1f} M{x + b_unten / 2:.1f},{y_unten:.1f} '
               f'L{x + b_oben / 2:.1f},{y_horizont:.1f}" stroke="{grau(.9, hell)}" stroke-width="4" fill="none" stroke-linecap="round"/>')
    striche = ""
    for t0, t1 in [(0, .16), (.27, .4), (.5, .59), (.67, .73), (.79, .83), (.87, .9)]:
        ya, yb = y_unten + (y_horizont - y_unten) * t0, y_unten + (y_horizont - y_unten) * t1
        wa, wb = 7 * (1 - t0) + 1, 7 * (1 - t1) + 1
        striche += f'<path d="{_pfad([(x - wa / 2, ya), (x + wa / 2, ya), (x + wb / 2, yb), (x - wb / 2, yb)])}" fill="{grau(.9, hell)}"/>'
    return f'<path d="{flaeche}" fill="{grau(.3, hell)}" stroke="none"/>' + raender + f'<g stroke="none">{striche}</g>'
