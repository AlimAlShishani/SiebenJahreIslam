#!/usr/bin/env python3
"""Koran-Video aus einer eigenen Rezitation erstellen.

Beispiel:
    python koran_video.py rezitation.m4a --sure 67 --von 1 --bis 10
    # mit Grafiken/Abschnitten: erst --nur-zeitstempel, dann plan.json schreiben, dann
    python koran_video.py rezitation.m4a --sure 67 --von 1 --bis 10 \
        --zeitstempel …/zeitstempel.json --plan …/plan.json

Ergebnis (Ordner koran-video-ausgabe/067_001-010/):
    video.mp4               fertiges Video (Hintergrund + Verse + Audio)
    capcut/                 Paket zum Weiterbearbeiten in CapCut
        audio.m4a           (am Anfang/Ende von Stille befreit)
        hintergrund.png
        arabisch/01_0m00.00s_67-1.png   …   (transparente Vollbild-PNGs)
        uebersetzung/01_0m00.00s_67-1.png …
        arabisch.srt, uebersetzung.srt  (Zeitstempel als Untertitel)
    zeitstempel.txt / zeitstempel.json
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dataclasses import dataclass, replace  # noqa: E402

from quran_data import FONT_DIR, Segment, build_segments, chapter_info, download_all_fonts  # noqa: E402
import effects  # noqa: E402
from grafiken import render_graphic, render_tint  # noqa: E402
from render import FORMATS, Renderer, Style, graphic_box, graphic_size, make_background  # noqa: E402
from szenen import Screen, build_screens, load_plan, plan_template, planning_text  # noqa: E402
from timing import SR, compute_timestamps, detect_silences, finalize_word_times, load_audio, voice_span  # noqa: E402

IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


def log(*a):
    print(*a, flush=True)


def fmt_srt(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def fmt_short(t: float) -> str:
    m, s = divmod(t, 60)
    return f"{int(m)}:{s:05.2f}"


def file_stub(i: int, start: float, key: str) -> str:
    m, s = divmod(start, 60)
    return f"{i:02d}_{int(m)}m{s:05.2f}s_{key.replace(':', '-')}"


@dataclass
class Layer:
    """Eine transparente Vollbild-Ebene, die von start bis end eingeblendet wird."""
    png: Path
    start: float
    end: float
    fade: float
    motion: bool = False  # sanftes Schweben (Grafiken)


# --------------------------------------------------------------------------- Zeitstempel-Dateien


def write_timestamps(segs: list[Segment], out: Path, info: dict) -> None:
    lines = [f"Methode: {info['methode']}   Länge: {fmt_short(info['dauer'])}", ""]
    for i, s in enumerate(segs, 1):
        lines.append(f"{i:2d}. {s.label:<12} {fmt_short(s.start):>9} – {fmt_short(s.end):>9}")
    (out / "zeitstempel.txt").write_text("\n".join(lines) + "\n", "utf-8")
    data = {
        "info": info,
        "segmente": [
            {"key": s.key, "art": s.kind, "start": s.start, "ende": s.end, "wort_zeiten": s.meta.get("wort_zeiten", []),
             "pausen_nach_wort": s.meta.get("pausen_nach_wort", [])}
            for s in segs
        ],
    }
    (out / "zeitstempel.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), "utf-8")


def read_timestamps(path: Path, segs: list[Segment]) -> None:
    data = json.loads(path.read_text("utf-8"))
    entries = data["segmente"]
    keys = {e["key"] for e in entries}
    # nicht gehörte Basmala/Isti'adha (auto) stehen nicht in der Datei
    segs[:] = [s for s in segs if not (s.meta.get("optional") and s.key not in keys)]
    if [e["key"] for e in entries] != [s.key for s in segs]:
        raise SystemExit("zeitstempel.json passt nicht zu Sure/Versen/Basmala/Isti'adha dieses Aufrufs.")
    for s, e in zip(segs, entries):
        s.start, s.end = float(e["start"]), float(e["ende"])
        wt = e.get("wort_zeiten") or []
        # Wortzeiten nur übernehmen, wenn sie noch in den (evtl. korrigierten) Vers passen
        if wt and wt[0] >= s.start - 0.05 and wt[-1] < s.end:
            s.meta["wort_zeiten"] = wt
        else:
            finalize_word_times(s)
        s.meta["pausen_nach_wort"] = e.get("pausen_nach_wort", [])


def write_srt(screens: list[Screen], path: Path, attr: str) -> None:
    blocks = []
    for i, sc in enumerate(screens, 1):
        text = getattr(sc.view, attr)
        if text:
            blocks.append(f"{i}\n{fmt_srt(sc.start)} --> {fmt_srt(sc.end)}\n{text}\n")
    path.write_text("\n".join(blocks), "utf-8")


def write_screen_list(screens: list[Screen], out: Path) -> None:
    lines = ["", "Szenen:"]
    for i, sc in enumerate(screens, 1):
        extra = f"  [{sc.color}]" if sc.color else ""
        lines.append(f"{i:2d}. {sc.label:<16} {fmt_short(sc.start):>9} – {fmt_short(sc.end):>9}{extra}")
        for g in sc.graphics:
            lines.append(f"      Grafik {g.name:<22} {fmt_short(g.start):>9} – {fmt_short(g.end):>9}")
    with (out / "zeitstempel.txt").open("a", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")


# --------------------------------------------------------------------------- Video


def build_video(
    layers: list[Layer],
    avoid: list[float],
    audio: Path,
    background: Path,
    size: tuple[int, int],
    duration: float,
    out: Path,
    darken: float,
    work: Path,
    particles: Path | None = None,
    glitch: float = 0.0,
    hitze: float = 0.0,
    vhs: float = 0.0,
) -> None:
    W, H = size
    bg_is_image = background.suffix.lower() in IMAGE_EXT
    inputs: list[str] = []
    if bg_is_image:
        inputs += ["-loop", "1", "-framerate", "30", "-t", f"{duration:.3f}", "-i", str(background)]
    else:
        inputs += ["-stream_loop", "-1", "-t", f"{duration:.3f}", "-i", str(background)]
    inputs += ["-i", str(audio)]

    filters = [
        f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,fps=30,"
        f"format=rgba,drawbox=c=black@{darken:.2f}:t=fill[base0]"
    ]
    cur = "base0"
    n_in = 2
    if particles:
        # Partikel per „Screen“-Mischung: Schwarz bleibt unsichtbar, Lichtpunkte hellen auf
        inputs += ["-stream_loop", "-1", "-t", f"{duration:.3f}", "-i", str(particles)]
        filters.append(f"[{cur}]format=gbrp[bgp]")
        filters.append(f"[{n_in}:v]scale={W}:{H},fps=30,format=gbrp[pt]")
        filters.append("[bgp][pt]blend=all_mode=screen:shortest=1,format=rgba[base1]")
        cur = "base1"
        n_in += 1

    micro = effects.glitch_times(duration, glitch, avoid) if glitch > 0 else []
    float_amp = max(2, round(H * 0.006))
    for i, ly in enumerate(layers):
        d = max(0.05, ly.end - ly.start)
        f = min(ly.fade, d / 3)
        inputs += ["-loop", "1", "-framerate", "30", "-t", f"{d:.3f}", "-i", str(ly.png)]
        chain = f"[{n_in}:v]format=rgba"
        if f > 0:
            chain += f",fade=t=in:st=0:d={f:.2f}:alpha=1,fade=t=out:st={d - f:.3f}:d={f:.2f}:alpha=1"
        chain += f",setpts=PTS-STARTPTS+{ly.start:.3f}/TB[o{i}]"
        filters.append(chain)
        y = f"'{float_amp}*sin(2*PI*t/4.5)'" if ly.motion else "0"
        filters.append(f"[{cur}][o{i}]overlay=x=0:y={y}:eval={'frame' if ly.motion else 'init'}:eof_action=pass[b{i}]")
        cur = f"b{i}"
        n_in += 1
    durchlaeufe = effects.vhs_durchlaeufe(duration, vhs)
    ex = effects.verschiebung_x(H, hitze, vhs, durchlaeufe)
    ey = effects.verschiebung_y(W, H, hitze)
    if ex or ey:
        # Hitzeflimmern (ständig) + VHS-Linie (wandert ab und zu von oben nach unten) über ffmpeg „displace“.
        # Die x-Verschiebung hängt nur von Zeile und Zeit ab, die y-Verschiebung nur von Spalte und Zeit:
        # beide Karten schmal berechnen und strecken (schnell).
        ex, ey = ex or "128", ey or "128"
        filters.append(f"nullsrc=s=2x{H}:r=30:d={duration:.3f},format=gbrp,geq=r='{ex}':g='{ex}':b='{ex}',"
                       f"scale={W}:{H}:flags=neighbor[xmap]")
        filters.append(f"nullsrc=s={W}x2:r=30:d={duration:.3f},format=gbrp,geq=r='{ey}':g='{ey}':b='{ey}',"
                       f"scale={W}:{H}:flags=neighbor[ymap]")
        filters.append(f"[{cur}]format=gbrp[dsrc]")
        filters.append("[dsrc][xmap][ymap]displace=edge=smear,format=rgba[dsp]")
        cur = "dsp"
    if micro:
        # nur ein Hauch: 1–3 px Farbversatz für wenige Frames
        sh = max(1, round(W * 0.002 * glitch))
        enable = "+".join(f"between(t,{a:.3f},{b:.3f})" for a, b in micro)
        filters.append(f"[{cur}]rgbashift=rh={sh}:bh=-{sh}:enable='{enable}'[gl]")
        cur = "gl"
    filters.append(f"[{cur}]format=yuv420p[vout]")
    script = work / "filter.txt"
    script.write_text(";\n".join(filters), "utf-8")
    cmd = (
        ["ffmpeg", "-nostdin", "-y", "-loglevel", "error"]
        + inputs
        + ["-filter_complex_script", str(script), "-map", "[vout]", "-map", "1:a"]
        + ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-r", "30"]
        + ["-c:a", "aac", "-b:a", "192k", "-t", f"{duration:.3f}", "-movflags", "+faststart", str(out)]
    )
    subprocess.run(cmd, check=True)


# --------------------------------------------------------------------------- Hauptprogramm


def parse_args(argv=None):
    p = argparse.ArgumentParser(
        description="Koran-Video aus eigener Rezitation: Zeitstempel erkennen, Verse in Glyphen-Schrift rendern, Video + CapCut-Paket erstellen.",
    )
    p.add_argument("audio", nargs="?", help="Aufnahme (mp3, m4a, wav, … oder auch ein Video)")
    p.add_argument("--sure", type=int, help="Nummer der Sure (1–114)")
    p.add_argument("--von", type=int, help="erster Vers")
    p.add_argument("--bis", type=int, help="letzter Vers (Standard: = --von)")
    p.add_argument("--basmala", choices=["auto", "ja", "nein"], default="auto",
                   help="Basmala am Anfang? auto = ja, wenn ab Vers 1 gelesen wird (außer Sure 1 und 9)")
    p.add_argument("--istiadha", nargs="?", const="ja", choices=["auto", "ja", "nein"], default="auto",
                   help="Isti'adha (A'udhu billahi …) am Anfang? auto = wird erkannt, falls gesprochen")
    p.add_argument("--methode", choices=["auto", "whisper", "stille"], default="auto",
                   help="Zeitstempel per Spracherkennung (genau) oder nur per Pausen (grob)")
    p.add_argument("--modell", default="small", help="Whisper-Modell: tiny, base, small, medium, large-v3 (Standard: small)")
    p.add_argument("--zeitstempel", type=Path, help="eigene/korrigierte zeitstempel.json verwenden statt neu zu erkennen")
    p.add_argument("--nur-zeitstempel", action="store_true",
                   help="nur Zeitstempel + planung.txt erstellen (Grundlage für den Plan), keine Bilder/Video")
    p.add_argument("--plan", type=Path,
                   help="Plan (JSON): Verse in Teile teilen, Teil-Übersetzungen, Farben, Grafiken – siehe szenen.py")
    p.add_argument("--max-zeilen", type=int, default=0,
                   help="höchstens so viele Zeilen arabischer Text pro Abschnitt (Standard: 1 bei Querformat, 2 bei Hochformat)")
    p.add_argument("--nicht-teilen", action="store_true", help="Verse nicht automatisch in Abschnitte teilen")
    p.add_argument("--layout", choices=["auto", "mitte", "oben"], default="auto",
                   help="auto/mitte (Standard): Text mittig, bei Abschnitten mit Grafik bilden Text und Grafik "
                        "zusammen einen mittigen Block; oben: Text oben, große Grafik darunter")
    p.add_argument("--uebersetzung", default="208",
                   help="quran.com-Übersetzungs-ID: 208 = Abu Rida (Standard), 27 = Bubenheim, 20 = Saheeh International "
                        "(Englisch), 85 = Abdel Haleem (Englisch), 'keine' = ohne")
    p.add_argument("--glyphen", choices=["v1", "v2"], default="v1",
                   help="Glyphen-Schrift: v1 = King-Fahd-Font-Set aus der FAQ von qurancliphelper.com (Standard), "
                        "v2 = neuere Madina-Ausgabe wie auf quran.com")
    p.add_argument("--format", choices=list(FORMATS), default="16:9",
                   help="16:9 = Querformat (Standard), 9:16 = Hochformat für Reels/Shorts/TikTok, 1:1, 4:5")
    p.add_argument("--glow", type=float, default=0.45, help="Leuchten um den arabischen Text: 0 = aus, 0.45 = dezent (Standard), 0.8 = kräftig")
    p.add_argument("--glow-farbe", default="#FFFFFF", help="Farbe des Leuchtens, z. B. #F6D58E für warmes Gold")
    p.add_argument("--partikel", type=float, default=0.5, help="schwebende Lichtpartikel: 0 = aus, 0.5 = dezent (Standard), 1 = viele/hell")
    p.add_argument("--partikel-farbe", default="#FFE9B8", help="Farbe der Partikel (Standard warmes Weiß)")
    p.add_argument("--hitze", type=float, default=0.5,
                   help="Hitzeflimmern: ständiges sanftes Wabern des Bildes (Schleife): 0 = aus, 0.5 = Standard, 1 = stark")
    p.add_argument("--vhs", type=float, default=0.5,
                   help="VHS-Linie: ab und zu wandert eine feine Versatz-Linie von oben nach unten: 0 = aus, 0.5 = Standard, 1 = stärker")
    p.add_argument("--glitch", type=float, default=0.5, help="ganz leichter, seltener Farbversatz (Glitch): 0 = aus, 0.5 = dezent (Standard), 1 = etwas deutlicher")
    p.add_argument("--uebersetzung-font", default="marcellus",
                   help="Schrift der Übersetzung: marcellus (Standard), cormorant, ebgaramond, lora (kursiv), system oder Pfad zu .ttf")
    p.add_argument("--hintergrund", type=Path, help="Hintergrundbild oder -video (Standard: dunkler Verlauf)")
    p.add_argument("--abdunkeln", type=float, default=0.35, help="Hintergrund abdunkeln, 0–1 (Standard 0.35)")
    p.add_argument("--farbe", default="#FFFFFF", help="Textfarbe (Standard weiß)")
    p.add_argument("--schriftgroesse", type=int, default=0, help="arabische Schriftgröße in px (Standard automatisch)")
    p.add_argument("--blende", type=float, default=0.3, help="Ein-/Ausblenden der Verse in Sekunden (0 = harter Schnitt)")
    p.add_argument("--kein-trim", action="store_true", help="Stille am Anfang/Ende NICHT abschneiden")
    p.add_argument("--kein-video", action="store_true", help="nur Zeitstempel + Bilder, kein video.mp4")
    p.add_argument("--ausgabe", type=Path, help="Ausgabeordner (Standard: koran-video-ausgabe/<sure>_<von>-<bis>)")
    p.add_argument("--alle-fonts", type=Path, metavar="ORDNER",
                   help="nur alle 604 Glyphen-Fonts (Version laut --glyphen) in ORDNER herunterladen, z. B. zum Installieren für CapCut")
    args = p.parse_args(argv)
    if args.alle_fonts:
        return args
    if not (args.audio and args.sure and args.von):
        p.error("Audio, --sure und --von sind nötig (oder --alle-fonts ORDNER)")
    args.bis = args.bis or args.von
    return args


def main(argv=None) -> None:
    args = parse_args(argv)
    if args.alle_fonts:
        log(f"Lade alle 604 Glyphen-Fonts (QCF {args.glyphen.upper()}) nach {args.alle_fonts} …")
        download_all_fonts(args.alle_fonts, args.glyphen, log)
        log("Fertig. Installieren: alle .ttf markieren → Rechtsklick → „Installieren“.")
        return
    if not shutil.which("ffmpeg"):
        raise SystemExit("ffmpeg wird benötigt (https://ffmpeg.org).")

    t_start = time.time()
    audio_in = Path(args.audio)
    if not audio_in.exists():
        raise SystemExit(f"Datei nicht gefunden: {audio_in}")
    tid = None if str(args.uebersetzung).lower() in ("keine", "0", "none") else int(args.uebersetzung)
    info_ch = chapter_info(args.sure)
    # auto: Basmala/Isti'adha werden nur übernommen, wenn sie in der Aufnahme zu hören sind
    if args.basmala == "auto":
        basmala = "auto" if args.sure != 9 and not (args.sure == 1 and args.von == 1) else False
    else:
        basmala = args.basmala == "ja"
    istiadha = {"auto": "auto", "ja": True, "nein": False}[args.istiadha]

    out = args.ausgabe or Path("koran-video-ausgabe") / f"{args.sure:03d}_{args.von:03d}-{args.bis:03d}"
    capcut = out / "capcut"
    work = out / ".arbeit"
    for d in (out, capcut, work):
        d.mkdir(parents=True, exist_ok=True)

    log(f"Sure {args.sure} ({info_ch.get('name_simple')}), Verse {args.von}–{args.bis}"
        f"{', mit Basmala' if basmala is True else ''}{', mit Isti`adha' if istiadha is True else ''}")

    # 1) Korandaten
    log("1/4 Lade Korantext, Glyphen-Codes und Übersetzung …")
    segs = build_segments(args.sure, args.von, args.bis, basmala, istiadha, tid)

    # 2) Audio vorbereiten (Stille am Anfang/Ende abschneiden)
    log("2/4 Zeitstempel bestimmen …")
    full = load_audio(str(audio_in))
    cut_start, cut_end = 0.0, len(full) / SR
    if not args.kein_trim:
        sil, _ = detect_silences(full)
        on, off = voice_span(full, sil)
        cut_start, cut_end = max(0.0, on - 0.4), min(len(full) / SR, off + 1.0)
    audio = full[int(cut_start * SR) : int(cut_end * SR)]
    audio_out = capcut / "audio.m4a"
    subprocess.run(
        ["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-ss", f"{cut_start:.3f}", "-to", f"{cut_end:.3f}",
         "-i", str(audio_in), "-vn", "-c:a", "aac", "-b:a", "192k", str(audio_out)],
        check=True,
    )
    duration = len(audio) / SR

    if args.zeitstempel:
        read_timestamps(args.zeitstempel, segs)
        info = {"methode": "manuell", "dauer": duration}
    else:
        info = compute_timestamps(audio, segs, args.methode, args.modell, log)
    info.update({"trim_start": round(cut_start, 2), "trim_ende": round(cut_end, 2), "quelle": audio_in.name})
    write_timestamps(segs, out, info)

    # 3) Szenen: automatische Abschnitte + Plan
    size = FORMATS[args.format]
    base_style = Style(width=size[0], height=size[1], color=args.farbe, arabic_size=args.schriftgroesse,
                       glyphs=args.glyphen, glow=args.glow, glow_color=args.glow_farbe,
                       translation_font=args.uebersetzung_font)
    renderers: dict = {}

    def renderer_for(color: str | None) -> Renderer:
        if color not in renderers:
            st = base_style if not color else replace(base_style, color=color, glow_color=color)
            renderers[color] = Renderer(st)
        return renderers[color]

    max_lines = args.max_zeilen or (1 if size[0] >= size[1] else 2)

    def fits(words, with_number: bool) -> bool:
        return renderer_for(None).line_count(words) <= max_lines

    auto_screens, _ = build_screens(segs, {}, None, fits, auto=not args.nicht_teilen)
    (out / "planung.txt").write_text(planning_text(segs, auto_screens), "utf-8")
    (out / "plan_vorlage.json").write_text(
        json.dumps(plan_template(segs, auto_screens), ensure_ascii=False, indent=2), "utf-8")
    log("")
    log((out / "zeitstempel.txt").read_text("utf-8"))
    if args.nur_zeitstempel:
        log(f"Planungsgrundlage: {out / 'planung.txt'}, Vorlage: {out / 'plan_vorlage.json'}")
        return

    plan = load_plan(args.plan)
    if args.plan and args.plan.resolve() != (out / "plan.json").resolve():
        shutil.copyfile(args.plan, out / "plan.json")
    screens, notes = build_screens(segs, plan, args.plan.parent if args.plan else None, fits,
                                   auto=not args.nicht_teilen)
    for note in notes:
        log(f"  Hinweis: {note}")
    layout = "oben" if args.layout == "oben" else "mitte"
    write_screen_list(screens, out)
    write_srt(screens, capcut / "arabisch.srt", "text")
    if tid:
        write_srt(screens, capcut / "uebersetzung.srt", "translation")

    log(f"3/4 Rendere {len(screens)} Szenen (Glyphen-Schrift QCF {args.glyphen.upper()}, "
        f"{'Text oben, große Grafik darunter' if layout == 'oben' else 'Text mittig, Grafik darunter'}) …")
    for sub in ("arabisch", "uebersetzung", "grafiken", "farbe"):
        if (capcut / sub).exists():
            shutil.rmtree(capcut / sub)
    layers: list[Layer] = []
    tints: dict = {}
    # gleiche Grafik (gleiche Datei, Position, Farbe) im direkt folgenden Abschnitt: stehen lassen statt aus-/einblenden
    letzte_grafik: dict = {}
    for i, sc in enumerate(screens, 1):
        r = renderer_for(sc.color)
        stub = file_stub(i, sc.start, sc.key)
        ar = capcut / "arabisch" / f"{stub}.png"
        tr = capcut / "uebersetzung" / f"{stub}.png" if tid else None
        gh = graphic_size(r.style)[1] if (sc.graphics and layout == "mitte") else 0
        bottom = r.render(sc.view, ar, tr, layout, with_graphic=bool(sc.graphics), graphic_h=gh)
        layers.append(Layer(ar, sc.start, sc.end, args.blende))
        if tr and tr.exists():
            layers.append(Layer(tr, sc.start, sc.end, args.blende))
        if sc.color and sc.color != "#FFFFFF":
            if sc.color not in tints:
                (capcut / "farbe").mkdir(parents=True, exist_ok=True)
                tints[sc.color] = render_tint(capcut / "farbe" / f"leuchten_{sc.color.lstrip('#')}.png", base_style, sc.color)
            layers.insert(0, Layer(tints[sc.color], sc.start, sc.end, 0.5))
        box = graphic_box(r.style, bottom, gross=(layout == "oben"))
        for k, g in enumerate(sc.graphics, 1):
            schluessel = (str(g.source.resolve()), box, sc.color)
            vorher = letzte_grafik.get(schluessel)
            if vorher is not None and abs(vorher.end - g.start) < 0.05:
                vorher.end = g.end
                continue
            gpng = capcut / "grafiken" / f"{file_stub(i, g.start, sc.key)}_{k}_{g.name}.png"
            gpng.parent.mkdir(parents=True, exist_ok=True)
            render_graphic(g.source, gpng, r.style, box)
            layers.append(Layer(gpng, g.start, g.end, 0.4, motion=True))
            letzte_grafik[schluessel] = layers[-1]
    if args.hintergrund:
        bg = capcut / f"hintergrund{args.hintergrund.suffix.lower()}"
        shutil.copyfile(args.hintergrund, bg)
    else:
        bg = capcut / "hintergrund.png"
        make_background(size, bg)

    # 4) Partikel + Video
    particles = None
    if args.partikel > 0:
        log("    Rendere Partikel-Ebene (nahtloser Loop) …")
        particles = effects.render_particles(capcut / "partikel.mp4", size, args.partikel, args.partikel_farbe)
    if not args.kein_video:
        log("4/4 Erstelle video.mp4 …")
        build_video(layers, [sc.start for sc in screens], audio_out, bg, size, duration, out / "video.mp4",
                    args.abdunkeln if args.hintergrund else 0.0, work, particles, args.glitch, args.hitze, args.vhs)
    shutil.rmtree(work, ignore_errors=True)
    shutil.make_archive(str(out / "capcut-paket"), "zip", capcut)
    log(f"\nFertig in {time.time() - t_start:.0f}s → {out}/")
    log(f"  Glyphen-Fonts liegen in {FONT_DIR / ('qcf_' + args.glyphen)}")


if __name__ == "__main__":
    main()
