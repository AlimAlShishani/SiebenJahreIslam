"""Koran-Daten (Glyphen-Codes, Uthmani-Text, Übersetzung) und QCF-V2-Seitenfonts.

Quelle: api.quran.com (dieselben Daten/Fonts, die quran.com selbst nutzt).
Die Glyphen-Schrift (QCF) hat einen eigenen Font pro Mushaf-Seite (604 Stück);
jedes Wort ist darin ein einzelnes Zeichen. Deshalb sieht der Text exakt wie im
Madina-Mushaf aus.
  V1 = ältere Madina-Ausgabe (1405 H) – das Font-Set aus der FAQ von qurancliphelper.com
  V2 = neuere Madina-Ausgabe (1421 H) – wie auf quran.com
"""

from __future__ import annotations

import html
import json
import os
import re
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path

API = "https://api.quran.com/api/v4"
FONT_URL = "https://verses.quran.foundation/fonts/quran/hafs/{version}/ttf/p{page}.ttf"
TOTAL_PAGES = 604

CACHE_DIR = Path(os.environ.get("KORAN_VIDEO_CACHE", Path.home() / ".cache" / "koran-video"))
FONT_DIR = CACHE_DIR / "fonts"  # Unterordner qcf_v1 / qcf_v2

ISTIADHA_TEXT = "أَعُوذُ بِٱللَّهِ مِنَ ٱلشَّيْطَـٰنِ ٱلرَّجِيمِ"
ISTIADHA_UEBERSETZUNG = "Ich suche Schutz bei Allah vor dem gesteinigten Satan."


@dataclass
class Word:
    glyphs: dict  # {"v1": (zeichen, seite), "v2": (zeichen, seite)} – Glyphe im jeweiligen Seitenfont
    text: str  # Uthmani-Text des Wortes (leer beim Versende-Zeichen)
    is_end: bool  # Versende-Ornament mit Versnummer
    meaning: str = ""  # Wort-für-Wort-Bedeutung (Englisch, quran.com) – hilft beim Planen der Grafiken


@dataclass
class Segment:
    """Ein Abschnitt der Rezitation, der als eigenes Bild angezeigt wird."""

    kind: str  # "istiadha" | "basmala" | "vers"
    key: str  # "67:1", "basmala", "istiadha"
    words: list[Word]
    text: str  # Uthmani-Text
    translation: str
    start: float = 0.0
    end: float = 0.0
    meta: dict = field(default_factory=dict)

    @property
    def label(self) -> str:
        return {"istiadha": "Isti'adha", "basmala": "Basmala"}.get(self.kind, f"Vers {self.key}")


def _get(url: str, binary: bool = False, tries: int = 4):
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "koran-video/1.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
            return data if binary else json.loads(data.decode("utf-8"))
        except Exception as exc:  # Netzwerkfehler: kurz warten und erneut versuchen
            last = exc
            time.sleep(2 ** attempt)
    raise RuntimeError(f"Download fehlgeschlagen: {url} ({last})")


def _cached_json(name: str, url: str):
    path = CACHE_DIR / "api" / name
    if path.exists():
        return json.loads(path.read_text("utf-8"))
    data = _get(url)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False), "utf-8")
    return data


def clean_translation(text: str) -> str:
    text = re.sub(r"<sup[^>]*>.*?</sup>", "", text or "", flags=re.S)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def chapter_info(surah: int) -> dict:
    return _cached_json(f"chapter_{surah}.json", f"{API}/chapters/{surah}?language=de")["chapter"]


def chapter_verses(surah: int, translation_id: int | None) -> list[dict]:
    """Alle Verse einer Sure inkl. Wörter mit Glyphen-Codes (gecacht)."""
    tid = translation_id or 0
    name = f"verses2_{surah}_t{tid}.json"
    path = CACHE_DIR / "api" / name
    if path.exists():
        return json.loads(path.read_text("utf-8"))
    verses: list[dict] = []
    page = 1
    while page:
        params = {
            "words": "true",
            "word_fields": "code_v1,page_number,code_v2,v2_page,text_uthmani",
            "fields": "text_uthmani",
            "per_page": 50,
            "page": page,
        }
        if translation_id:
            params["translations"] = translation_id
        data = _get(f"{API}/verses/by_chapter/{surah}?{urllib.parse.urlencode(params)}")
        verses.extend(data["verses"])
        page = data["pagination"].get("next_page")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(verses, ensure_ascii=False), "utf-8")
    return verses


def _words(verse: dict) -> list[Word]:
    out = []
    for w in verse["words"]:
        is_end = w["char_type_name"] == "end"
        glyphs = {"v1": (w["code_v1"], int(w["page_number"])), "v2": (w["code_v2"], int(w["v2_page"]))}
        meaning = "" if is_end else ((w.get("translation") or {}).get("text") or "")
        out.append(Word(glyphs, "" if is_end else w.get("text_uthmani", ""), is_end, meaning))
    return out


def _translation(verse: dict) -> str:
    tr = verse.get("translations") or []
    return clean_translation(tr[0]["text"]) if tr else ""


def build_segments(
    surah: int,
    von: int,
    bis: int,
    basmala: bool | str,
    istiadha: bool | str,
    translation_id: int | None,
) -> list[Segment]:
    """basmala/istiadha: True, False oder "auto" (= vielleicht vorhanden; wird nur behalten,
    wenn die Spracherkennung sie in der Aufnahme hört)."""
    verses = chapter_verses(surah, translation_id)
    if not (1 <= von <= bis <= len(verses)):
        raise SystemExit(f"Sure {surah} hat {len(verses)} Verse – Bereich {von}-{bis} ist ungültig.")
    segs: list[Segment] = []
    if istiadha:
        segs.append(Segment("istiadha", "istiadha", [], ISTIADHA_TEXT, ISTIADHA_UEBERSETZUNG if translation_id else "",
                            meta={"optional": istiadha == "auto"}))
    if basmala:
        fatiha1 = chapter_verses(1, translation_id)[0]
        words = [w for w in _words(fatiha1) if not w.is_end]
        segs.append(Segment("basmala", "basmala", words, fatiha1["text_uthmani"], _translation(fatiha1),
                            meta={"optional": basmala == "auto"}))
    for v in verses[von - 1 : bis]:
        segs.append(Segment("vers", v["verse_key"], _words(v), v["text_uthmani"], _translation(v)))
    return segs


def font_path(page: int, version: str = "v2", font_dir: Path | None = None) -> Path:
    path = (font_dir or FONT_DIR / f"qcf_{version}") / f"p{page}.ttf"
    if not path.exists() or path.stat().st_size == 0:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".part")
        tmp.write_bytes(_get(FONT_URL.format(version=version, page=page), binary=True))
        tmp.replace(path)
    return path


def download_all_fonts(font_dir: Path, version: str = "v2", progress=print) -> None:
    for page in range(1, TOTAL_PAGES + 1):
        font_path(page, version, font_dir)
        if page % 50 == 0 or page == TOTAL_PAGES:
            progress(f"  Fonts: {page}/{TOTAL_PAGES}")
