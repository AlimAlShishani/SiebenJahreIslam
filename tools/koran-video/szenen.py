"""Szenen: was wann auf dem Bildschirm steht.

Verse werden automatisch in Abschnitte geteilt, damit nie zu viel arabischer Text
auf einmal steht (Platz für die Grafik):
  1. Pflicht-Grenze bei jeder Atempause des Rezitators innerhalb des Verses,
  2. zusätzlich, wenn ein Abschnitt nicht in die erlaubte Zeilenzahl passt
     (bevorzugt an Waqf-Zeichen ۖ ۗ ۚ …, sonst möglichst gleich lang).

Der Plan (JSON, von Claude pro Video geschrieben, Vorlage: plan_vorlage.json)
legt fest, was zu sehen ist:

{
  "67:15": {
    "teile": [
      {"bis_wort": 12, "uebersetzung": "Er ist es, Der euch die Erde untertan gemacht hat; …",
       "grafiken": [{"datei": "grafiken/67-15_erde.svg"},
                    {"datei": "grafiken/67-15_gehen.svg", "ab_wort": 7}]},
      {"uebersetzung": "Und zu Ihm führt die Auferstehung.", "farbe": "gold"}
    ]
  },
  "67:16": {"farbe": "rot", "grafiken": [{"datei": "grafiken/67-16_beben.svg", "ab_wort": 6}]}
}

- "teile": eigene Aufteilung (bis_wort = letztes Wort des Teils, Wörter zählen ab 1
  über den ganzen Vers). Ohne "teile" wird automatisch geteilt; "grafiken" und
  "farbe" auf Versebene werden dann den automatischen Teilen zugeordnet.
- "uebersetzung": deutsche Teil-Übersetzung. Fehlt sie, wird die Vers-Übersetzung
  grob an Satzzeichen aufgeteilt (Notlösung – im Plan besser selbst aufteilen).
- Grafiken: "datei" = eigene SVG/PNG (relativ zum Plan), "ab_wort" = ab welchem Wort.
- "farbe": weiss, gruen, rot, gelb, blau, rosa, gold oder #RRGGBB – färbt Text,
  Grafik und ein leichtes Leuchten im Hintergrund (Stimmung des Abschnitts).
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

from quran_data import Segment, Word
from grafiken import resolve
from timing import normalize

COLORS = {
    "weiss": "#FFFFFF", "weiß": "#FFFFFF",
    "gruen": "#5CFF8A", "grün": "#5CFF8A",
    "rot": "#FF3B3B",
    "gelb": "#FFE14D",
    "blau": "#4FE3FF", "cyan": "#4FE3FF",
    "rosa": "#FF5FCB", "pink": "#FF5FCB",
    "gold": "#F6D58E",
}
LEAD = 0.2         # Teil/Grafik erscheint so viel vor dem ersten Wort
CROSSFADE = 0.35   # Überlappung aufeinanderfolgender Grafiken in einer Szene
WAQF = re.compile("[ۖ-ۜ]")

# fits(wörter, mit_versnummer) -> passt der Abschnitt in die erlaubte Zeilenzahl?
Fits = Callable[[list[Word], bool], bool]


def color_hex(name: str | None) -> str | None:
    if not name:
        return None
    if name.startswith("#") and len(name) == 7:
        return name.upper()
    if name.lower() in COLORS:
        return COLORS[name.lower()]
    raise SystemExit(f"Unbekannte Farbe {name!r} – erlaubt: {', '.join(sorted(set(COLORS)))} oder #RRGGBB")


@dataclass
class Graphic:
    name: str
    source: Path
    start: float
    end: float


@dataclass
class Screen:
    seg: Segment                 # der Vers, zu dem die Szene gehört
    view: Segment                # was angezeigt wird (Teil der Wörter + Teil-Übersetzung)
    part: int                    # 1-basiert
    parts: int
    start: float
    end: float
    color: str | None = None     # None = Standardfarbe
    graphics: list[Graphic] = field(default_factory=list)
    words_range: tuple[int, int] = (1, 0)               # Wortnummern (im Vers) dieses Teils
    spec: list = field(default_factory=list)            # Grafik-Angaben aus dem Plan
    translation_auto: bool = False                      # Teil-Übersetzung nur grob aufgeteilt

    @property
    def label(self) -> str:
        return self.seg.label + (f" ({self.part}/{self.parts})" if self.parts > 1 else "")

    @property
    def key(self) -> str:
        return self.seg.key + (f"-{self.part}" if self.parts > 1 else "")


def _content(seg: Segment) -> list[Word]:
    return [w for w in seg.words if not w.is_end]


def _word_time(seg: Segment, n: int) -> float:
    t = seg.meta.get("wort_zeiten") or []
    if 1 <= n <= len(t):
        return t[n - 1]
    return seg.start


def load_plan(path: Path | None) -> dict:
    if not path:
        return {}
    plan = json.loads(path.read_text("utf-8"))
    return {k: v for k, v in plan.items() if not k.startswith("_")}


def auto_bounds(seg: Segment, fits: Fits | None) -> list[int]:
    """Letzte Wortnummer jedes Teils (der letzte Eintrag ist immer die Wortzahl)."""
    words = _content(seg)
    n = len(words)
    if seg.kind != "vers" or n == 0:
        return [n]
    letters = [max(1, len(normalize(w.text))) for w in words]
    waqf = {i for i, w in enumerate(words, 1) if WAQF.search(w.text)}
    pauses = sorted(p for p in seg.meta.get("pausen_nach_wort", []) if 1 <= p < n)

    def ok(a: int, b: int) -> bool:
        return fits is None or fits(words[a - 1:b], b == n)

    def split(a: int, b: int) -> list[int]:
        if a >= b or ok(a, b):
            return [b]
        total = sum(letters[a - 1:b])
        best, best_cost = a, 1e9
        left = 0
        for i in range(a, b):
            left += letters[i - 1]
            both_fit = ok(a, i) and ok(i + 1, b)
            cost = (0.0 if both_fit else 1.0) + abs(2 * left - total) / total - (0.5 if i in waqf else 0.0)
            if cost < best_cost:
                best, best_cost = i, cost
        return split(a, best) + split(best + 1, b)

    out: list[int] = []
    a = 1
    for b in pauses + [n]:
        out += split(a, b)
        a = b + 1
    return out


def split_translation(text: str, weights: list[float]) -> list[str]:
    """Teilt eine Übersetzung grob an Satzzeichen im Verhältnis der arabischen Teil-Längen."""
    k = len(weights)
    if k <= 1 or not text:
        return [text] * max(1, k)
    frags = [f for f in re.split(r"(?<=[,;:.!?])\s+|\s+(?=[–—]\s)", text) if f.strip()]
    if len(frags) < k:
        frags = text.split()
    sizes = [len(f) for f in frags]
    cum, acc = [], 0
    for sz in sizes:
        acc += sz
        cum.append(acc / sum(sizes))
    targets, acc = [], 0.0
    for w in weights[:-1]:
        acc += w
        targets.append(acc / sum(weights))
    cuts, prev = [], 0
    for j, t in enumerate(targets):
        lo, hi = prev + 1, len(frags) - (k - 1 - j)
        idx = min(range(lo, hi), key=lambda m: abs(cum[m - 1] - t)) if lo < hi else lo
        cuts.append(idx)
        prev = idx
    bounds = [0] + cuts + [len(frags)]
    return [" ".join(frags[bounds[i]:bounds[i + 1]]).strip() for i in range(k)]


# --------------------------------------------------------------------------- Szenen bauen


def build_screens(segs: list[Segment], plan: dict, plan_dir: Path | None = None,
                  fits: Fits | None = None, auto: bool = True) -> tuple[list[Screen], list[str]]:
    """Rückgabe: (Szenen, Hinweise)."""
    keys = {s.key for s in segs}
    for k in plan:
        if k not in keys:
            raise SystemExit(f"Plan: {k} gehört nicht zu diesem Video (vorhanden: {', '.join(s.key for s in segs)}).")
    screens: list[Screen] = []
    notes: list[str] = []
    for seg in segs:
        entry = plan.get(seg.key, {})
        if isinstance(entry, list):  # Kurzform: nur Grafiken
            entry = {"grafiken": entry}
        words = _content(seg)
        n = len(words)
        end_marks = [w for w in seg.words if w.is_end]
        verse_color = color_hex(entry.get("farbe"))
        if entry.get("teile"):
            teile = entry["teile"]
            bounds = [n if i == len(teile) - 1 else int(t.get("bis_wort", 0)) for i, t in enumerate(teile)]
            for p in seg.meta.get("pausen_nach_wort", []):
                if p not in bounds and p < n:
                    notes.append(f"{seg.key}: Atempause nach Wort {p} liegt mitten in einem geplanten Teil.")
        else:
            bounds = auto_bounds(seg, fits) if auto else [n]
            # Vers-Grafiken den Teilen zuordnen
            teile = [{"grafiken": []} for _ in bounds]
            for g in entry.get("grafiken", []):
                g = {"datei": g} if isinstance(g, str) else g
                ab = int(g.get("ab_wort", 1))
                idx = next(i for i, b in enumerate(bounds) if ab <= b)
                teile[idx]["grafiken"].append(g)
        # Übersetzungen der Teile
        weights = []
        first = 1
        for b in bounds:
            weights.append(sum(max(1, len(normalize(w.text))) for w in words[first - 1:b]) or 1)
            first = b + 1
        fallback = split_translation(seg.translation, weights)
        first = 1
        for pi, (teil, last) in enumerate(zip(teile, bounds), 1):
            last_part = pi == len(bounds)
            if not last_part and not (first <= last < n):
                raise SystemExit(f"Plan {seg.key}, Teil {pi}: bis_wort muss zwischen {first} und {n - 1} liegen.")
            own = teil.get("uebersetzung")
            translation = own or (seg.translation if len(bounds) == 1 else fallback[pi - 1])
            view_words = words[first - 1:last] + (end_marks if last_part else [])
            text = " ".join(w.text for w in words[first - 1:last]) if words else seg.text
            view = Segment(seg.kind, seg.key, view_words, text, translation)
            start = seg.start if first == 1 else _word_time(seg, first) - LEAD
            screens.append(Screen(seg, view, pi, len(bounds), round(start, 2), seg.end,
                                  color_hex(teil.get("farbe")) or verse_color,
                                  words_range=(first, last), spec=teil.get("grafiken") or [],
                                  translation_auto=not own and len(bounds) > 1))
            first = last + 1
    for a, b in zip(screens, screens[1:]):
        if a.seg is b.seg:
            a.end = b.start
    for sc in screens:
        sc.graphics = _graphics(sc, plan_dir)
    auto_tr = [sc.key for sc in screens if sc.translation_auto]
    if auto_tr:
        notes.append("Teil-Übersetzung nur grob aufgeteilt bei: " + ", ".join(auto_tr))
    return screens, notes


def _graphics(sc: Screen, plan_dir: Path | None) -> list[Graphic]:
    spec = sc.spec
    if isinstance(spec, (str, dict)):
        spec = [spec]
    spec = [{"datei": e} if isinstance(e, str) else dict(e) for e in spec]
    first, last = sc.words_range
    for e in spec:
        e["_datei"] = e.get("datei") or e.get("motiv")
        if not e["_datei"]:
            raise SystemExit(f"Plan {sc.seg.key}: Grafik ohne \"datei\".")
        a = int(e.get("ab_wort", first))
        if sc.seg.kind != "vers":
            raise SystemExit(f"Plan {sc.seg.key}: keine Grafiken bei Basmala/Isti'adha.")
        if not first <= a <= max(first, last):
            raise SystemExit(f"Plan {sc.seg.key}: Grafik {e['_datei']} ab_wort {a} liegt nicht im Teil (Wörter {first}–{last}).")
        e["_ab"] = a
    spec.sort(key=lambda e: e["_ab"])
    out = []
    for k, e in enumerate(spec):
        start = sc.start if e["_ab"] == first else max(sc.start, _word_time(sc.seg, e["_ab"]) - LEAD)
        if "bis_wort" in e:
            b = int(e["bis_wort"])
            end = _word_time(sc.seg, b + 1) if b < last else sc.end
        elif k + 1 < len(spec):
            end = max(sc.start, _word_time(sc.seg, spec[k + 1]["_ab"]) - LEAD) + CROSSFADE
        else:
            end = sc.end
        end = min(end, sc.end)
        if end - start < 0.5:
            raise SystemExit(f"Plan {sc.seg.key}: Grafik {e['_datei']} wäre kürzer als 0,5 s.")
        src = resolve(e["_datei"], plan_dir)
        out.append(Graphic(src.stem, src, round(start, 2), round(end, 2)))
    return out


# --------------------------------------------------------------------------- Planungshilfen


def planning_text(segs: list[Segment], screens: list[Screen]) -> str:
    """Übersicht zum Planen: Übersetzung, Wörter mit Nummer + Bedeutung, Pausen, automatische Teile."""
    lines = [
        "PLANUNG",
        "Wörter: Nummer:Bedeutung (Englisch, Wort für Wort).  ‖ = Atempause nach diesem Wort,  ۚ = Waqf-Zeichen.",
        "Teile = automatische Abschnitte (Pause im Vers oder zu langer Text). Vorlage: plan_vorlage.json.",
        "",
    ]
    by_seg: dict[str, list[Screen]] = {}
    for sc in screens:
        by_seg.setdefault(sc.seg.key, []).append(sc)
    for seg in segs:
        lines.append(f"== {seg.key}   {seg.start:.2f}s – {seg.end:.2f}s  ({seg.end - seg.start:.1f}s)")
        if seg.translation:
            lines.append(f"   DE: {seg.translation}")
        words = _content(seg)
        pauses = set(seg.meta.get("pausen_nach_wort", []))
        if words:
            lines.append("   " + "  ".join(
                f"{i}:{w.meaning or w.text}" + (" ۚ" if WAQF.search(w.text) else "") + ("  ‖" if i in pauses else "")
                for i, w in enumerate(words, 1)))
        for sc in by_seg.get(seg.key, []):
            a, b = sc.words_range
            if sc.parts > 1:
                lines.append(f"   Teil {sc.part}: Wörter {a}–{b}  {sc.start:.2f}–{sc.end:.2f}s  → „{sc.view.translation}“")
        lines.append("")
    lines.append("FARBEN: " + ", ".join(sorted({k for k in COLORS if k.isascii()})) + " oder #RRGGBB")
    return "\n".join(lines)


def plan_template(segs: list[Segment], screens: list[Screen]) -> dict:
    """Plan-Vorlage mit den automatischen Teilen und grob aufgeteilten Übersetzungen."""
    plan: dict = {"_hinweis": "Übersetzungen prüfen/aufteilen, Grafiken (datei, ab_wort) und Farben ergänzen."}
    by_seg: dict[str, list[Screen]] = {}
    for sc in screens:
        by_seg.setdefault(sc.seg.key, []).append(sc)
    for seg in segs:
        if seg.kind != "vers":
            continue
        parts = by_seg.get(seg.key, [])
        if len(parts) <= 1:
            plan[seg.key] = {"grafiken": []}
        else:
            plan[seg.key] = {"teile": [
                ({"bis_wort": sc.words_range[1]} if i < len(parts) - 1 else {})
                | {"uebersetzung": sc.view.translation, "grafiken": []}
                for i, sc in enumerate(parts)]}
    return plan
