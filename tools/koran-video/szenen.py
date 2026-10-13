"""Szenen: was wann auf dem Bildschirm steht.

Ohne Plan ist jeder Vers eine Szene (ganzer Vers + ganze Übersetzung).
Mit Plan (JSON, von Claude pro Video geschrieben) können Verse an den Atempausen
in Teile geteilt werden – jeder Teil mit eigener Übersetzung, Farbe und Grafiken:

{
  "67:15": {
    "teile": [
      {"bis_wort": 6, "uebersetzung": "Er ist es, der euch die Erde fügsam gemacht hat;",
       "grafiken": [{"motiv": "erde_wege"}]},
      {"bis_wort": 12, "uebersetzung": "so geht auf ihren Flanken umher und esst von Seiner Versorgung.",
       "grafiken": [{"motiv": "mensch_gehend"}, {"motiv": "weizen", "ab_wort": 10}]},
      {"uebersetzung": "Und zu Ihm wird die Auferstehung sein.", "farbe": "gelb"}
    ]
  },
  "67:19": {"grafiken": [{"motiv": "voegel", "ab_wort": 5}]},
  "67:6": {"farbe": "rot"}
}

- "bis_wort": letztes Wort des Teils (Wörter zählen ab 1 über den ganzen Vers;
  der letzte Teil geht immer bis zum Versende und zeigt die Versnummer).
- "ab_wort" bei Grafiken: ab welchem Wort des Verses die Grafik erscheint.
- "farbe": weiss, gruen, rot, gelb, blau, rosa, gold oder #RRGGBB – färbt Text,
  Grafik und ein leichtes Leuchten im Hintergrund (Stimmung des Abschnitts).
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

from quran_data import Segment, Word
from grafiken import library, resolve

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
    motiv: str
    source: Path
    start: float
    end: float


@dataclass
class Screen:
    seg: Segment                 # der Vers, zu dem die Szene gehört
    view: Segment                # was angezeigt wird (ggf. nur ein Teil der Wörter + Teil-Übersetzung)
    part: int                    # 1-basiert
    parts: int
    start: float
    end: float
    color: str | None = None     # None = Standardfarbe
    graphics: list[Graphic] = field(default_factory=list)
    words_range: tuple[int, int] = (1, 0)               # Wortnummern (im Vers) dieses Teils
    spec: list = field(default_factory=list)            # Grafik-Angaben aus dem Plan

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


def plan_has_graphics(plan: dict) -> bool:
    for v in plan.values():
        if isinstance(v, list) or (isinstance(v, dict) and (v.get("grafiken") or any(t.get("grafiken") for t in v.get("teile", [])))):
            return True
    return False


def build_screens(segs: list[Segment], plan: dict, plan_dir: Path | None = None) -> list[Screen]:
    keys = {s.key for s in segs}
    for k in plan:
        if k not in keys:
            raise SystemExit(f"Plan: {k} gehört nicht zu diesem Video (vorhanden: {', '.join(s.key for s in segs)}).")
    screens: list[Screen] = []
    for seg in segs:
        entry = plan.get(seg.key, {})
        if isinstance(entry, list):  # Kurzform: nur Grafiken
            entry = {"grafiken": entry}
        words = _content(seg)
        end_marks = [w for w in seg.words if w.is_end]
        verse_color = color_hex(entry.get("farbe"))
        teile = entry.get("teile") or [{"grafiken": entry.get("grafiken", []), "farbe": entry.get("farbe")}]
        n = len(words)
        first = 1
        for pi, teil in enumerate(teile, 1):
            last_part = pi == len(teile)
            last = n if last_part else int(teil.get("bis_wort", 0))
            if not last_part and not (first <= last < n):
                raise SystemExit(f"Plan {seg.key}, Teil {pi}: bis_wort muss zwischen {first} und {n - 1} liegen.")
            if len(teile) > 1 and not teil.get("uebersetzung") and seg.translation:
                raise SystemExit(f"Plan {seg.key}, Teil {pi}: \"uebersetzung\" für diesen Teil fehlt.")
            view_words = (words[first - 1:last] if words else []) + (end_marks if last_part else [])
            text = " ".join(w.text for w in words[first - 1:last]) if words else seg.text
            view = Segment(seg.kind, seg.key, view_words, text, teil.get("uebersetzung") or seg.translation)
            start = seg.start if first == 1 else _word_time(seg, first) - LEAD
            screens.append(Screen(seg, view, pi, len(teile), round(start, 2), seg.end,
                                  color_hex(teil.get("farbe")) or verse_color,
                                  words_range=(first, last), spec=teil.get("grafiken") or []))
            first = last + 1
    # Ende jeder Szene = Beginn der nächsten Szene desselben Verses
    for a, b in zip(screens, screens[1:]):
        if a.seg is b.seg:
            a.end = b.start
    for sc in screens:
        sc.graphics = _graphics(sc, plan_dir)
    return screens


def _graphics(sc: Screen, plan_dir: Path | None) -> list[Graphic]:
    spec = sc.spec
    if isinstance(spec, (str, dict)):
        spec = [spec]
    spec = [{"motiv": e} if isinstance(e, str) else e for e in spec]
    first, last = sc.words_range
    for e in spec:
        a = int(e.get("ab_wort", first))
        if sc.seg.kind != "vers":
            raise SystemExit(f"Plan {sc.seg.key}: keine Grafiken bei Basmala/Isti'adha.")
        if not first <= a <= max(first, last):
            raise SystemExit(f"Plan {sc.seg.key}: Grafik {e['motiv']} ab_wort {a} liegt nicht im Teil (Wörter {first}–{last}).")
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
            raise SystemExit(f"Plan {sc.seg.key}: Grafik {e['motiv']} wäre kürzer als 0,5 s.")
        out.append(Graphic(e["motiv"], resolve(e["motiv"], plan_dir), round(start, 2), round(end, 2)))
    return out


def planning_text(segs: list[Segment]) -> str:
    """Übersicht zum Planen: Übersetzung, Wörter mit Nummer + Bedeutung, Atempausen (‖), passende Motive."""
    lib = library()
    lines = [
        "PLANUNG – Grafiken nur, wo sie den Inhalt wirklich veranschaulichen (nicht bei Basmala/Isti'adha).",
        "Wörter: Nummer:Bedeutung (Englisch, Wort für Wort).  ‖ = Atempause des Rezitators nach diesem Wort.",
        "",
    ]
    for seg in segs:
        dur = seg.end - seg.start
        lines.append(f"== {seg.key}   {seg.start:.2f}s – {seg.end:.2f}s  ({dur:.1f}s)")
        if seg.translation:
            lines.append(f"   DE: {seg.translation}")
        words = _content(seg)
        pauses = set(seg.meta.get("pausen_nach_wort", []))
        if words:
            parts = []
            for i, w in enumerate(words, 1):
                parts.append(f"{i}:{w.meaning or w.text}" + ("  ‖" if i in pauses else ""))
            lines.append("   " + "  ".join(parts))
        text = f" {seg.translation.lower()} " + " ".join(w.meaning.lower() for w in words)
        hits = [name for name, m in lib.items()
                if any(re.search(rf"\b{re.escape(k.lower())}", text) for k in m["stichwoerter"])]
        if hits and seg.kind == "vers":
            lines.append(f"   Motive mit passenden Stichwörtern: {', '.join(hits)}")
        lines.append("")
    lines.append("ALLE MOTIVE:")
    lines += [f"  {n:<20} {m['beschreibung']}" for n, m in lib.items()]
    lines.append("")
    lines.append("FARBEN: " + ", ".join(sorted({k for k in COLORS if k.isascii()})) + " oder #RRGGBB")
    return "\n".join(lines)
