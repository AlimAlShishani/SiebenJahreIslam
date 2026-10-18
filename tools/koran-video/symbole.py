"""Zeichen und Symbole für die Bildsprache der Piktogramme (gelernt aus den Referenzvideos des Nutzers).

Die Referenzen erzählen Gefühle und abstrakte Begriffe nicht mit Gesichtern, sondern mit einer kleinen
„Comic-Grammatik“ aus Zeichen um die Figur herum und mit Alltags-Symbolen für Begriffe. Hier die
Bausteine dafür – alle ohne Augen/Gesichter, in Weiß und abgestuftem Grau (grau()).

Gefühle an der Figur (Kopfposition aus Mensch.kopf()):
    traenen(kx, ky, kr)          weinen, Reue, Verzweiflung
    schreck(kx, ky, kr)          Schreck, plötzliche Erkenntnis (Striche über dem Kopf)
    wut(x, y)                    Ärger, Zorn (Wut-Zeichen)
    sorgenwolke(x, y)            Kummer, „ein elendes Leben“ (dunkle Kritzel-Wolke über dem Kopf)
    gedankenpfeile(kx, ky, kr)   rasende Gedanken, Ratlosigkeit, Reue
Reden, Hören, Sehen:
    schall(x, y, richtung)       sprechen, rufen, behaupten
    wirrwarr_blase(x, y, r, spitze)   Streit, Verwirrung, leeres Gerede (verknäulte Sprechblase)
    lautsprecher_stumm(x, y)     Taubheit, nicht hören wollen
    blindenstock(hand, boden_y)  Blindheit
    blicklinie(von, nach)        sehen, anschauen (ohne Augen: gestrichelter Pfeil vom Kopf)
Zeit:
    uhr(x, y, r, pfeil="vor")    „ständig, immer“ (Pfeil im Uhrzeigersinn); pfeil="zurueck": „früher, die vor ihnen“
Personen und Orte:
    medaillon(x, y, r, name)     Propheten nur als Namens-Kalligrafie im leuchtenden Kreis (nie als Figur)
    menge(x, y, breite)          „die Menschen“, Gruppen, frühere Völker (Reihen kleiner Figuren)
    teufel(x, y, h, pose)        Satan/Versuchung: Figur mit Hörnern und Schwanz, ohne Gesicht
    tuer(x, y, h, offen)         Haus, hinaus-/hineingehen, verschlossen
    gitter(x, y, b, h)           Gefängnis, festgehalten werden
    schranke(x, y, b)            Barriere/Barzakh, „es gibt kein Zurück“
    schriftrolle(x, y)           alte Schriften, „Märchen der Früheren“, Aufzeichnung der Taten
    moschee(x, y)                Moschee, Gebetsort
"""

from __future__ import annotations

import math

from piktogramm import Mensch, _ids, _pfad, grau


# ---------------------------------------------------------------- Gefühle an der Figur
def traenen(kx, ky, kr, s=1.0, seiten=(-1, 1)):
    """Tränen, die seitlich NEBEN dem Kopf herabfallen (nie auf dem Kopf – sonst wirken sie wie Augen)."""
    out = ""
    for m in seiten:
        for i, (dx, dy, g) in enumerate([(1.9, .35, 1.0), (2.2, 1.55, .78), (2.35, 2.6, .6)]):
            x, y, r = kx + m * kr * dx, ky + kr * dy, kr * .3 * g * s
            out += (f'<path d="M{x:.1f},{y - r * 2.3:.1f} Q{x + r * 1.15:.1f},{y:.1f} {x:.1f},{y + r:.1f} '
                    f'Q{x - r * 1.15:.1f},{y:.1f} {x:.1f},{y - r * 2.3:.1f}Z" fill="#fff" fill-opacity="{1 - .25 * i:.2f}" stroke="none"/>')
    return out


def schreck(kx, ky, kr, s=1.0):
    """Schreck-Striche über dem Kopf (strahlenförmig)."""
    out = ""
    for w in (-125, -100, -78, -55):
        a = math.radians(w)
        r0, r1 = kr * 1.45, kr * (2.2 if w in (-100, -78) else 2.0)
        out += (f'<path d="M{kx + math.cos(a) * r0:.1f},{ky + math.sin(a) * r0:.1f} L{kx + math.cos(a) * r1:.1f},'
                f'{ky + math.sin(a) * r1:.1f}" stroke="#fff" stroke-width="{3.5 * s:.1f}" stroke-linecap="round"/>')
    return out


def wut(x, y, s=1.0):
    """Wut-Zeichen (vier gebogene Ecken, wie im Comic)."""
    d = ""
    for mx, my in ((1, 1), (-1, 1), (1, -1), (-1, -1)):
        d += (f"M{x + mx * 3 * s:.1f},{y + my * 11 * s:.1f} Q{x + mx * 3 * s:.1f},{y + my * 3 * s:.1f} "
              f"{x + mx * 11 * s:.1f},{y + my * 3 * s:.1f} ")
    return f'<path d="{d}" fill="none" stroke="#fff" stroke-width="{3.6 * s:.1f}" stroke-linecap="round"/>'


def sorgenwolke(x, y, s=1.0):
    """Dunkle Wolke mit verknäultem Kritzel (Kummer, Elend) – mittig über (x, y)."""
    P = lambda a, b: f"{x + a * s:.1f},{y + b * s:.1f}"
    wolke = (f'<path d="M{P(-30, 8)} Q{P(-38, -6)} {P(-24, -12)} Q{P(-22, -28)} {P(-4, -24)} Q{P(8, -36)} {P(22, -22)} '
             f'Q{P(38, -20)} {P(32, -2)} Q{P(40, 10)} {P(24, 12)} L{P(-24, 12)} Q{P(-34, 14)} {P(-30, 8)}Z" '
             f'fill="{grau(.42)}" stroke="none"/>')
    pts = []
    for i in range(40):                               # Spirale aus Schlaufen
        t = i / 39 * math.pi * 6.5
        pts.append((x + (-20 + i * 1.05 + 7 * math.cos(t)) * s, y + (-6 + 7 * math.sin(t)) * s))
    d = "M" + " L".join(f"{px:.1f},{py:.1f}" for px, py in pts)
    return wolke + f'<path d="{d}" fill="none" stroke="{grau(.8)}" stroke-width="{2.4 * s:.1f}" stroke-linejoin="round" stroke-linecap="round"/>'


def gedankenpfeile(kx, ky, kr, n=7, s=1.0):
    """Pfeile, die vom Kopf in alle Richtungen schießen (rasende Gedanken, Ratlosigkeit)."""
    out = ""
    for i in range(n):
        a = math.radians(-170 + i * 160 / (n - 1))
        x0, y0 = kx + math.cos(a) * kr * 1.4, ky + math.sin(a) * kr * 1.4
        x1, y1 = kx + math.cos(a) * kr * 2.9, ky + math.sin(a) * kr * 2.9
        sp = [(x1 + math.cos(a + d) * kr * .45, y1 + math.sin(a + d) * kr * .45) for d in (math.radians(150), math.radians(-150))]
        out += (f'<path d="M{x0:.1f},{y0:.1f} L{x1:.1f},{y1:.1f} M{sp[0][0]:.1f},{sp[0][1]:.1f} L{x1:.1f},{y1:.1f} '
                f'L{sp[1][0]:.1f},{sp[1][1]:.1f}" fill="none" stroke="#fff" stroke-width="{2.6 * s:.1f}" stroke-linecap="round"/>')
    return out


# ---------------------------------------------------------------- Reden, Hören, Sehen
def schall(x, y, richtung=1, s=1.0, n=3):
    """Schallwellen (Bögen) – sprechen, rufen, behaupten. (x, y) = Mund/Quelle."""
    out = ""
    for i in range(n):
        r = (9 + i * 8) * s
        a0, a1 = math.radians(-40), math.radians(40)
        p0 = (x + richtung * math.cos(a0) * r, y + math.sin(a0) * r)
        p1 = (x + richtung * math.cos(a1) * r, y + math.sin(a1) * r)
        out += (f'<path d="M{p0[0]:.1f},{p0[1]:.1f} A{r:.1f},{r:.1f} 0 0 {1 if richtung > 0 else 0} {p1[0]:.1f},{p1[1]:.1f}" '
                f'fill="none" stroke="#fff" stroke-opacity="{1 - i * .22:.2f}" stroke-width="{3.4 * s:.1f}" stroke-linecap="round"/>')
    return out


def wirrwarr_blase(x, y, r=34, spitze=None, s=1.0):
    """Runde Sprechblase mit verknäultem Gekritzel – Streit, Verwirrung, leeres Gerede."""
    out = ""
    if spitze:
        tx, ty = spitze
        a = math.atan2(ty - y, tx - x)
        b1 = (x + math.cos(a + .35) * r, y + math.sin(a + .35) * r)
        b2 = (x + math.cos(a - .35) * r, y + math.sin(a - .35) * r)
        out += f'<path d="{_pfad([b1, (tx, ty), b2])}" fill="{grau(.2)}" stroke="#fff" stroke-width="{3.5 * s:.1f}" stroke-linejoin="round"/>'
    out += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{grau(.2)}" stroke="#fff" stroke-width="{3.5 * s:.1f}"/>'
    pts = []
    for i in range(46):
        t = i / 45 * math.pi * 7.3
        rr = r * (.28 + .32 * abs(math.sin(t * .61 + 1.3)))
        pts.append((x + math.cos(t * 1.13) * rr, y + math.sin(t * .97 + .6) * rr * .9))
    d = "M" + " ".join(f"{px:.1f},{py:.1f}" for px, py in pts[:1]) + " " + " ".join(
        f"Q{pts[i][0]:.1f},{pts[i][1]:.1f} {(pts[i][0] + pts[i + 1][0]) / 2:.1f},{(pts[i][1] + pts[i + 1][1]) / 2:.1f}"
        for i in range(1, len(pts) - 1))
    return out + f'<path d="{d}" fill="none" stroke="#fff" stroke-width="{2.2 * s:.1f}" stroke-linecap="round"/>'


def lautsprecher_stumm(x, y, s=1.0):
    """Stummer Lautsprecher (Lautsprecher + X) – Taubheit, nicht hören (wollen). (x, y) = Mitte."""
    P = lambda a, b: (x + a * s, y + b * s)
    box = _pfad([P(-26, -9), P(-14, -9), P(2, -24), P(2, 24), P(-14, 9), P(-26, 9)])
    return (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{38 * s:.1f}" fill="{grau(.15)}" stroke="#fff" stroke-width="{4 * s:.1f}"/>'
            f'<path d="{box}" fill="{grau(.92)}" stroke="none"/>'
            f'<path d="M{P(10, -11)[0]:.1f},{P(10, -11)[1]:.1f} L{P(27, 11)[0]:.1f},{P(27, 11)[1]:.1f} '
            f'M{P(27, -11)[0]:.1f},{P(27, -11)[1]:.1f} L{P(10, 11)[0]:.1f},{P(10, 11)[1]:.1f}" stroke="#fff" '
            f'stroke-width="{4.5 * s:.1f}" stroke-linecap="round"/>')


def blindenstock(hand, boden_y, dx=34, s=1.0):
    """Blindenstock von der Hand schräg zum Boden (Spitze dunkler)."""
    hx, hy = hand
    ex, ey = hx + dx, boden_y
    tx, ty = hx + dx * .82, hy + (boden_y - hy) * .82
    return (f'<path d="M{hx:.1f},{hy:.1f} L{tx:.1f},{ty:.1f}" stroke="{grau(.95)}" stroke-width="{5 * s:.1f}" stroke-linecap="round"/>'
            f'<path d="M{tx:.1f},{ty:.1f} L{ex:.1f},{ey:.1f}" stroke="{grau(.55)}" stroke-width="{5 * s:.1f}" stroke-linecap="round"/>')


def blicklinie(von, nach, s=1.0):
    """Gestrichelter Pfeil vom Kopf zum Ziel – sehen, anschauen (ohne Augen zu zeichnen)."""
    (x0, y0), (x1, y1) = von, nach
    a = math.atan2(y1 - y0, x1 - x0)
    sp = [(x1 + math.cos(a + d) * 11 * s, y1 + math.sin(a + d) * 11 * s) for d in (math.radians(150), math.radians(-150))]
    return (f'<path d="M{x0:.1f},{y0:.1f} L{x1:.1f},{y1:.1f}" stroke="#fff" stroke-width="{3 * s:.1f}" '
            f'stroke-dasharray="{8 * s:.1f} {6 * s:.1f}" stroke-linecap="round"/>'
            f'<path d="M{sp[0][0]:.1f},{sp[0][1]:.1f} L{x1:.1f},{y1:.1f} L{sp[1][0]:.1f},{sp[1][1]:.1f}" fill="none" '
            f'stroke="#fff" stroke-width="{3 * s:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')


# ---------------------------------------------------------------- Zeit
def uhr(x, y, r=40, pfeil="vor"):
    """Uhr mit Kreispfeil: pfeil="vor" (im Uhrzeigersinn) = ständig, immer wieder;
    pfeil="zurueck" (gegen den Uhrzeigersinn) = früher, Vergangenheit; None = Zeit, Frist."""
    striche = "".join(f'<path d="M{x + math.cos(math.radians(w)) * r * .78:.1f},{y + math.sin(math.radians(w)) * r * .78:.1f} '
                      f'L{x + math.cos(math.radians(w)) * r * .9:.1f},{y + math.sin(math.radians(w)) * r * .9:.1f}" '
                      f'stroke="{grau(.75)}" stroke-width="{r * .06:.1f}" stroke-linecap="round"/>' for w in range(0, 360, 30))
    out = (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{grau(.18)}" stroke="#fff" stroke-width="{r * .1:.1f}"/>' + striche
           + f'<path d="M{x:.1f},{y - r * .6:.1f} L{x:.1f},{y:.1f} L{x + r * .42:.1f},{y:.1f}" fill="none" stroke="#fff" '
             f'stroke-width="{r * .1:.1f}" stroke-linecap="round" stroke-linejoin="round"/>'
           + f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r * .08:.1f}" fill="#fff"/>')
    if pfeil:
        R = r * 1.32
        a0, a1 = (math.radians(-60), math.radians(200)) if pfeil == "vor" else (math.radians(240), math.radians(-20))
        p0 = (x + math.cos(a0) * R, y + math.sin(a0) * R)
        p1 = (x + math.cos(a1) * R, y + math.sin(a1) * R)
        sweep = 1 if pfeil == "vor" else 0
        out += (f'<path d="M{p0[0]:.1f},{p0[1]:.1f} A{R:.1f},{R:.1f} 0 1 {sweep} {p1[0]:.1f},{p1[1]:.1f}" fill="none" '
                f'stroke="#fff" stroke-width="{r * .1:.1f}" stroke-linecap="round"/>')
        # Pfeilspitze in Laufrichtung am Ende
        t = a1 + (math.pi / 2 if pfeil == "vor" else -math.pi / 2)
        tip = (p1[0] + math.cos(t) * r * .28, p1[1] + math.sin(t) * r * .28)
        nrm = (math.cos(a1), math.sin(a1))
        b1 = (p1[0] + nrm[0] * r * .2, p1[1] + nrm[1] * r * .2)
        b2 = (p1[0] - nrm[0] * r * .2, p1[1] - nrm[1] * r * .2)
        out += f'<path d="{_pfad([b1, tip, b2])}" fill="#fff" stroke="none"/>'
    return out


# ---------------------------------------------------------------- Personen und Orte
def medaillon(x, y, r=56, name="مُحَمَّد", groesse=None):
    """Leuchtender Kreis mit Namens-Kalligrafie – so erscheinen Propheten (nie als Figur)."""
    g = groesse or r * .78
    return (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{grau(.16)}" stroke="#fff" stroke-width="{r * .07:.1f}"/>'
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r * .86:.1f}" fill="none" stroke="{grau(.7)}" stroke-width="{r * .025:.1f}"/>'
            f'<text x="{x:.1f}" y="{y + g * .3:.1f}" text-anchor="middle" font-family="KFGQPC HAFS Uthmanic Script" '
            f'font-size="{g:.1f}" fill="#fff" stroke="none">{name}</text>')


def menge(x, y, breite=170, reihen=3, h=58, hell_vorn=1.0):
    """Menschenmenge: Reihen kleiner Figuren (Frontansicht), hintere Reihen kleiner und dunkler. (x, y) = Mitte vorn unten."""
    out = []
    for rr in range(reihen - 1, -1, -1):
        f = 1 - rr * .16
        hh, yy = h * f, y - rr * h * .3
        n = max(3, int(breite / (hh * .42)))
        for i in range(n):
            xx = x - breite * f / 2 + (i + .5 + (rr % 2) * .5) * breite * f / (n + .5)
            out.append(Mensch(xx, yy, hh, "front_stehen", hell=hell_vorn * (1 - rr * .2), kontur=False).svg)
    return "".join(out)


def teufel(x, y, h=170, pose="stehen", spiegeln=False, **aenderungen):
    """Satan/Versuchung als Figur mit Hörnern und Pfeilschwanz – ohne Gesicht."""
    m = Mensch(x, y, h, pose, spiegeln=spiegeln, **aenderungen)
    kx, ky, kr = m.kopf()
    hoerner = ""
    for side in (-1, 1):                               # schlanke, nach außen und oben gebogene Hörner
        bx = kx + side * kr * .5
        p0, p1 = (bx - side * kr * .28, ky - kr * .8), (bx + side * kr * .3, ky - kr * .62)
        tip = (bx + side * kr * 1.15, ky - kr * 2.05)
        hoerner += (f'<path d="M{p0[0]:.1f},{p0[1]:.1f} Q{bx + side * kr * .15:.1f},{ky - kr * 1.7:.1f} {tip[0]:.1f},{tip[1]:.1f} '
                    f'Q{bx + side * kr * .7:.1f},{ky - kr * 1.15:.1f} {p1[0]:.1f},{p1[1]:.1f}Z" fill="#fff" stroke="none"/>')
    bx, by = m.becken()
    rueck = 1 if spiegeln else -1                       # Schwanz auf der Rückseite der Figur
    s = h / 170
    ende = (bx + rueck * 46 * s, by + 34 * s)
    schwanz = (f'<path d="M{bx:.1f},{by:.1f} C{bx + rueck * 40 * s:.1f},{by - 4 * s:.1f} {bx + rueck * 20 * s:.1f},'
               f'{by + 40 * s:.1f} {ende[0]:.1f},{ende[1]:.1f}" fill="none" stroke="#fff" stroke-width="{4.5 * s:.1f}" stroke-linecap="round"/>'
               f'<path d="{_pfad([(ende[0] - 7 * s, ende[1] + 3 * s), (ende[0] + rueck * 10 * s, ende[1] - 6 * s), (ende[0] + 5 * s, ende[1] + 10 * s)])}" '
               f'fill="#fff" stroke="none"/>')
    return schwanz + m.svg + hoerner


def tuer(x, y, h=150, offen=0.0):
    """Tür mit Rahmen. (x, y) = Mitte unten. offen 0 = zu, 1 = weit offen (Türblatt schwenkt nach links)."""
    b = h * .48
    x0, x1, y0 = x - b / 2, x + b / 2, y - h
    rahmen = (f'<path d="M{x0 - 7:.1f},{y:.1f} L{x0 - 7:.1f},{y0 - 7:.1f} L{x1 + 7:.1f},{y0 - 7:.1f} L{x1 + 7:.1f},{y:.1f}" '
              f'fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>')
    innen = f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{b:.1f}" height="{h:.1f}" fill="{grau(.12)}" stroke="none"/>'
    k = b * (1 - offen * .78)                           # sichtbare Breite des Türblatts
    schraeg = h * .08 * offen
    blatt = _pfad([(x0, y0), (x0 + k, y0 + schraeg), (x0 + k, y - schraeg), (x0, y)])
    knauf = (x0 + k * .82, y - h * .47)
    return (rahmen + innen + f'<path d="{blatt}" fill="{grau(.82)}" stroke="none"/>'
            + f'<path d="{_pfad([(x0 + k * .14, y0 + h * .08 + schraeg * .5), (x0 + k * .86, y0 + h * .08 + schraeg * .5), (x0 + k * .86, y0 + h * .42), (x0 + k * .14, y0 + h * .42)])}" '
              f'fill="{grau(.7)}" stroke="none"/>'
            + f'<circle cx="{knauf[0]:.1f}" cy="{knauf[1]:.1f}" r="{h * .025:.1f}" fill="{grau(.45)}"/>')


def gitter(x, y, b=150, h=170, staebe=7):
    """Gefängnisgitter (über eine Figur legen). (x, y) = Mitte unten."""
    x0, y0 = x - b / 2, y - h
    out = (f'<rect x="{x0 - 6:.1f}" y="{y0 - 10:.1f}" width="{b + 12:.1f}" height="12" rx="3" fill="{grau(.8)}" stroke="none"/>'
           f'<rect x="{x0 - 6:.1f}" y="{y - 2:.1f}" width="{b + 12:.1f}" height="12" rx="3" fill="{grau(.8)}" stroke="none"/>'
           f'<rect x="{x0 - 6:.1f}" y="{y0 + h * .45:.1f}" width="{b + 12:.1f}" height="7" rx="3" fill="{grau(.7)}" stroke="none"/>')
    for i in range(staebe):
        xx = x0 + i * b / (staebe - 1)
        out += f'<rect x="{xx - 3.5:.1f}" y="{y0:.1f}" width="7" height="{h:.1f}" rx="3" fill="#fff" stroke="none"/>'
    return out


def schranke(x, y, b=190):
    """Absperrschranke mit Warnstreifen und Lampen – Barriere (Barzakh), kein Weiterkommen. (x, y) = Mitte unten."""
    _ids[0] += 1
    cid = f"schranke{_ids[0]}"
    h = b * .52
    by0, by1 = y - h * .82, y - h * .52
    beine = "".join(f'<rect x="{x + d * b * .36 - 5:.1f}" y="{y - h:.1f}" width="10" height="{h:.1f}" rx="3" fill="{grau(.7)}" stroke="none"/>'
                    for d in (-1, 1))
    brett = f'<rect x="{x - b / 2:.1f}" y="{by0:.1f}" width="{b:.1f}" height="{by1 - by0:.1f}" rx="5"/>'
    streifen = "".join(f'<path d="{_pfad([(x - b / 2 + i * 26, by1), (x - b / 2 + i * 26 + 13, by1), (x - b / 2 + i * 26 + 13 + (by1 - by0), by0), (x - b / 2 + i * 26 + (by1 - by0), by0)])}" '
                       f'fill="{grau(.38)}" stroke="none"/>' for i in range(-2, int(b / 26) + 2))
    lampen = ""
    for d in (-1, 1):
        lx, ly = x + d * b * .36, y - h - 9
        lampen += (f'<circle cx="{lx:.1f}" cy="{ly:.1f}" r="9" fill="{grau(1)}" stroke="none"/>'
                   + "".join(f'<path d="M{lx + math.cos(math.radians(w)) * 14:.1f},{ly + math.sin(math.radians(w)) * 14:.1f} '
                             f'L{lx + math.cos(math.radians(w)) * 21:.1f},{ly + math.sin(math.radians(w)) * 21:.1f}" stroke="#fff" '
                             f'stroke-width="3" stroke-linecap="round"/>' for w in (-150, -90, -30)))
    return (beine + f'<defs><clipPath id="{cid}">{brett}</clipPath></defs>'
            + brett.replace("/>", f' fill="{grau(.95)}" stroke="none"/>')
            + f'<g clip-path="url(#{cid})">{streifen}</g>' + lampen)


def schriftrolle(x, y, s=1.0):
    """Alte Schriftrolle, beschrieben mit Schnörkel-Zeilen (keine lesbaren Buchstaben). (x, y) = Mitte."""
    P = lambda a, b: (x + a * s, y + b * s)
    blatt = _pfad([P(-46, -58), P(46, -58), P(46, 58), P(-46, 58)])
    out = f'<path d="{blatt}" fill="{grau(.86)}" stroke="none"/>'
    for yy in (-62, 62):
        out += (f'<rect x="{P(-56, 0)[0]:.1f}" y="{P(0, yy - 8)[1]:.1f}" width="{112 * s:.1f}" height="{16 * s:.1f}" rx="{8 * s:.1f}" '
                f'fill="{grau(.68)}" stroke="none"/>')
        for d in (-1, 1):
            out += f'<circle cx="{P(d * 60, 0)[0]:.1f}" cy="{P(0, yy)[1]:.1f}" r="{6 * s:.1f}" fill="{grau(.55)}" stroke="none"/>'
    zeilen = ""
    for zi, yy in enumerate((-36, -16, 4, 24, 42)):
        ende = 34 - (zi * 13) % 30                       # unterschiedlich lange Zeilen
        pts = [P(-34 + i * 3, yy + 4.2 * math.sin(i * 1.3 + zi) + 2.2 * math.sin(i * 2.9 + zi * 2)) for i in range(int((ende + 34) / 3))]
        zeilen += "M" + " L".join(f"{px:.1f},{py:.1f}" for px, py in pts) + " "
    return out + f'<path d="{zeilen}" fill="none" stroke="{grau(.45)}" stroke-width="{2.6 * s:.1f}" stroke-linecap="round" stroke-linejoin="round"/>'


def moschee(x, y, s=1.0):
    """Moschee: Kuppel mit Halbmond, Minarett, Tor. (x, y) = Mitte unten."""
    P = lambda a, b: f"{x + a * s:.1f},{y + b * s:.1f}"
    bau = f'<rect x="{x - 62 * s:.1f}" y="{y - 64 * s:.1f}" width="{124 * s:.1f}" height="{64 * s:.1f}" fill="{grau(.9)}" stroke="none"/>'
    kuppel = (f'<path d="M{P(-44, -64)} C{P(-44, -112)} {P(-8, -124)} {P(0, -136)} C{P(8, -124)} {P(44, -112)} {P(44, -64)}Z" '
              f'fill="{grau(1)}" stroke="none"/>')
    mond = (f'<path d="M{P(-3, -160)} A{12 * s:.1f},{12 * s:.1f} 0 1 0 {P(9, -146)} A{9 * s:.1f},{9 * s:.1f} 0 1 1 {P(-3, -160)}Z" '
            f'fill="{grau(1)}" stroke="none"/><rect x="{x - 1.5 * s:.1f}" y="{y - 146 * s:.1f}" width="{3 * s:.1f}" height="{12 * s:.1f}" fill="{grau(.85)}"/>')
    minarett = (f'<rect x="{x + 70 * s:.1f}" y="{y - 150 * s:.1f}" width="{16 * s:.1f}" height="{150 * s:.1f}" fill="{grau(.82)}" stroke="none"/>'
                f'<rect x="{x + 66 * s:.1f}" y="{y - 116 * s:.1f}" width="{24 * s:.1f}" height="{7 * s:.1f}" fill="{grau(.95)}" stroke="none"/>'
                f'<path d="M{P(68, -150)} L{P(78, -172)} L{P(88, -150)}Z" fill="{grau(.95)}" stroke="none"/>')
    tor = f'<path d="M{P(-14, 0)} L{P(-14, -30)} Q{P(-14, -46)} {P(0, -50)} Q{P(14, -46)} {P(14, -30)} L{P(14, 0)}Z" fill="{grau(.45)}" stroke="none"/>'
    fenster = "".join(f'<path d="M{P(d - 6, -22)} L{P(d - 6, -36)} Q{P(d, -44)} {P(d + 6, -36)} L{P(d + 6, -22)}Z" fill="{grau(.55)}" stroke="none"/>'
                      for d in (-40, 40))
    return minarett + bau + kuppel + mond + tor + fenster


# ---------------------------------------------------------------- Versorgung, Ziel, Maß
def obstkorb(x, y, s=1.0):
    """Korb voller Früchte (Versorgung, Rizq). (x, y) = Mitte unten."""
    P = lambda a, b: (x + a * s, y + b * s)
    fruechte = ""
    for a, b, r, t in [(-24, -46, 13, .95), (0, -52, 14, 1.0), (24, -46, 12, .9), (-11, -60, 11, .85), (13, -62, 11, .92)]:
        fruechte += f'<circle cx="{P(a, 0)[0]:.1f}" cy="{P(0, b)[1]:.1f}" r="{r * s:.1f}" fill="{grau(t)}" stroke="none"/>'
    traube = "".join(f'<circle cx="{P(a, 0)[0]:.1f}" cy="{P(0, b)[1]:.1f}" r="{4.2 * s:.1f}" fill="{grau(.7)}" stroke="none"/>'
                     for a, b in [(30, -60), (36, -54), (30, -50), (36, -46), (33, -40)])
    koerper = _pfad([P(-44, -40), P(44, -40), P(34, 0), P(-34, 0)])
    out = (fruechte + traube + f'<path d="{koerper}" fill="{grau(.72)}" stroke="none"/>'
           + f'<rect x="{P(-48, 0)[0]:.1f}" y="{P(0, -46)[1]:.1f}" width="{96 * s:.1f}" height="{9 * s:.1f}" rx="{4 * s:.1f}" fill="{grau(.85)}" stroke="none"/>')
    for i in range(1, 4):                                  # Flechtmuster in einem dunkleren Ton
        yy = -40 + i * 10
        w = 44 - i * 2.5
        out += f'<path d="M{P(-w + 2, yy)[0]:.1f},{P(0, yy)[1]:.1f} L{P(w - 2, yy)[0]:.1f},{P(0, yy)[1]:.1f}" stroke="{grau(.56)}" stroke-width="{2.4 * s:.1f}"/>'
    return out


def zielscheibe(x, y, r=60, pfeil=True):
    """Zielscheibe, auf Wunsch mit Pfeil genau in der Mitte („erreicht sein Ziel“). (x, y) = Mitte."""
    out = ""
    for i, t in enumerate((1.0, .55, 1.0, .55, 1.0)):
        out += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r * (1 - i * .2):.1f}" fill="{grau(t)}" stroke="none"/>'
    if pfeil:
        a = math.radians(-35)                              # Pfeil kommt von rechts oben
        L = r * 1.5
        ex, ey = x + math.cos(a) * L, y + math.sin(a) * L
        out += (f'<path d="M{x:.1f},{y:.1f} L{ex:.1f},{ey:.1f}" stroke="{grau(.9)}" stroke-width="{r * .07:.1f}" stroke-linecap="round"/>'
                + "".join(f'<path d="{_pfad([(ex - math.cos(a) * r * .05, ey - math.sin(a) * r * .05), (ex + math.cos(a + d) * r * .28, ey + math.sin(a + d) * r * .28), (ex + math.cos(a + d * .4) * r * .32, ey + math.sin(a + d * .4) * r * .32)])}" '
                          f'fill="{grau(.8)}" stroke="none"/>' for d in (.55, -.55)))
        out += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r * .06:.1f}" fill="{grau(.4)}" stroke="none"/>'
    return out


def messlatte(x, y, h=200, teile=10):
    """Senkrechte Messlatte mit Strichen (Maß, Bestimmung). (x, y) = Fuß."""
    out = f'<rect x="{x - 9:.1f}" y="{y - h:.1f}" width="18" height="{h:.1f}" rx="3" fill="{grau(.85)}" stroke="none"/>'
    for i in range(1, teile * 2):
        yy = y - i * h / (teile * 2)
        w = 12 if i % 2 == 0 else 7
        out += f'<path d="M{x - 9:.1f},{yy:.1f} l{w},0" stroke="{grau(.4)}" stroke-width="2.4"/>'
    return out
