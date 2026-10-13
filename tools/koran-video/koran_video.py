#!/usr/bin/env python3
"""Koran-Video aus einer eigenen Rezitation erstellen.

Beispiel:
    python koran_video.py rezitation.m4a --sure 67 --von 1 --bis 10

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

from quran_data import FONT_DIR, Segment, build_segments, chapter_info, download_all_fonts  # noqa: E402
import effects  # noqa: E402
from render import FORMATS, Renderer, Style, make_background  # noqa: E402
from timing import SR, compute_timestamps, detect_silences, load_audio, voice_span  # noqa: E402

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


def file_stub(i: int, seg: Segment) -> str:
    m, s = divmod(seg.start, 60)
    return f"{i:02d}_{int(m)}m{s:05.2f}s_{seg.key.replace(':', '-')}"


# --------------------------------------------------------------------------- Zeitstempel-Dateien


def write_timestamps(segs: list[Segment], out: Path, info: dict) -> None:
    lines = [f"Methode: {info['methode']}   Länge: {fmt_short(info['dauer'])}", ""]
    for i, s in enumerate(segs, 1):
        lines.append(f"{i:2d}. {s.label:<12} {fmt_short(s.start):>9} – {fmt_short(s.end):>9}")
    (out / "zeitstempel.txt").write_text("\n".join(lines) + "\n", "utf-8")
    data = {
        "info": info,
        "segmente": [{"key": s.key, "art": s.kind, "start": s.start, "ende": s.end} for s in segs],
    }
    (out / "zeitstempel.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), "utf-8")


def read_timestamps(path: Path, segs: list[Segment]) -> None:
    data = json.loads(path.read_text("utf-8"))
    entries = data["segmente"]
    if [e["key"] for e in entries] != [s.key for s in segs]:
        raise SystemExit("zeitstempel.json passt nicht zu Sure/Versen/Basmala/Isti'adha dieses Aufrufs.")
    for s, e in zip(segs, entries):
        s.start, s.end = float(e["start"]), float(e["ende"])


def write_srt(segs: list[Segment], path: Path, attr: str) -> None:
    blocks = []
    for i, s in enumerate(segs, 1):
        text = getattr(s, attr)
        if text:
            blocks.append(f"{i}\n{fmt_srt(s.start)} --> {fmt_srt(s.end)}\n{text}\n")
    path.write_text("\n".join(blocks), "utf-8")


# --------------------------------------------------------------------------- Video


def build_video(
    segs: list[Segment],
    images: list[list[Path]],
    audio: Path,
    background: Path,
    size: tuple[int, int],
    duration: float,
    out: Path,
    darken: float,
    fade: float,
    work: Path,
    particles: Path | None = None,
    glitch: float = 0.0,
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

    micro = effects.glitch_times(duration, glitch, [s.start for s in segs]) if glitch > 0 else []
    for i, (seg, pngs) in enumerate(zip(segs, images)):
        d = max(0.05, seg.end - seg.start)
        f = min(fade, d / 3)
        for k, png in enumerate(pngs):
            inputs += ["-loop", "1", "-framerate", "30", "-t", f"{d:.3f}", "-i", str(png)]
            lbl = f"o{i}_{k}"
            chain = f"[{n_in}:v]format=rgba"
            if f > 0:
                chain += f",fade=t=in:st=0:d={f:.2f}:alpha=1,fade=t=out:st={d - f:.3f}:d={f:.2f}:alpha=1"
            chain += f",setpts=PTS-STARTPTS+{seg.start:.3f}/TB[{lbl}]"
            filters.append(chain)
            nxt = f"b{i}_{k}"
            filters.append(f"[{cur}][{lbl}]overlay=0:0:eof_action=pass[{nxt}]")
            cur = nxt
            n_in += 1
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
    p.add_argument("--istiadha", action="store_true", help="Aufnahme beginnt mit „A'udhu billahi …“")
    p.add_argument("--methode", choices=["auto", "whisper", "stille"], default="auto",
                   help="Zeitstempel per Spracherkennung (genau) oder nur per Pausen (grob)")
    p.add_argument("--modell", default="small", help="Whisper-Modell: tiny, base, small, medium, large-v3 (Standard: small)")
    p.add_argument("--zeitstempel", type=Path, help="eigene/korrigierte zeitstempel.json verwenden statt neu zu erkennen")
    p.add_argument("--uebersetzung", default="208",
                   help="quran.com-Übersetzungs-ID: 208 = Abu Rida (Standard), 27 = Bubenheim, 'keine' = ohne")
    p.add_argument("--glyphen", choices=["v1", "v2"], default="v1",
                   help="Glyphen-Schrift: v1 = King-Fahd-Font-Set aus der FAQ von qurancliphelper.com (Standard), "
                        "v2 = neuere Madina-Ausgabe wie auf quran.com")
    p.add_argument("--format", choices=list(FORMATS), default="16:9",
                   help="16:9 = Querformat (Standard), 9:16 = Hochformat für Reels/Shorts/TikTok, 1:1, 4:5")
    p.add_argument("--glow", type=float, default=0.45, help="Leuchten um den arabischen Text: 0 = aus, 0.45 = dezent (Standard), 0.8 = kräftig")
    p.add_argument("--glow-farbe", default="#FFFFFF", help="Farbe des Leuchtens, z. B. #F6D58E für warmes Gold")
    p.add_argument("--partikel", type=float, default=0.5, help="schwebende Lichtpartikel: 0 = aus, 0.5 = dezent (Standard), 1 = viele/hell")
    p.add_argument("--partikel-farbe", default="#FFE9B8", help="Farbe der Partikel (Standard warmes Weiß)")
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
    if args.basmala == "auto":
        basmala = args.von == 1 and bool(info_ch.get("bismillah_pre")) and args.sure not in (1, 9)
    else:
        basmala = args.basmala == "ja"

    out = args.ausgabe or Path("koran-video-ausgabe") / f"{args.sure:03d}_{args.von:03d}-{args.bis:03d}"
    capcut = out / "capcut"
    work = out / ".arbeit"
    for d in (out, capcut, work):
        d.mkdir(parents=True, exist_ok=True)

    log(f"Sure {args.sure} ({info_ch.get('name_simple')}), Verse {args.von}–{args.bis}"
        f"{', mit Basmala' if basmala else ''}{', mit Isti`adha' if args.istiadha else ''}")

    # 1) Korandaten
    log("1/4 Lade Korantext, Glyphen-Codes und Übersetzung …")
    segs = build_segments(args.sure, args.von, args.bis, basmala, args.istiadha, tid)

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
    write_srt(segs, capcut / "arabisch.srt", "text")
    if tid:
        write_srt(segs, capcut / "uebersetzung.srt", "translation")
    log("")
    log((out / "zeitstempel.txt").read_text("utf-8"))

    # 3) Bilder
    log(f"3/4 Rendere Vers-Bilder (Glyphen-Schrift QCF {args.glyphen.upper()}) …")
    size = FORMATS[args.format]
    renderer = Renderer(Style(width=size[0], height=size[1], color=args.farbe,
                                arabic_size=args.schriftgroesse, glyphs=args.glyphen, glow=args.glow,
                                glow_color=args.glow_farbe, translation_font=args.uebersetzung_font))
    for sub in ("arabisch", "uebersetzung"):
        if (capcut / sub).exists():
            shutil.rmtree(capcut / sub)
    images = []
    for i, seg in enumerate(segs, 1):
        stub = file_stub(i, seg)
        ar = capcut / "arabisch" / f"{stub}.png"
        tr = capcut / "uebersetzung" / f"{stub}.png" if tid else None
        renderer.render(seg, ar, tr)
        images.append([ar] + ([tr] if tr and tr.exists() else []))
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
        build_video(segs, images, audio_out, bg, size, duration, out / "video.mp4",
                    args.abdunkeln if args.hintergrund else 0.0, args.blende, work, particles, args.glitch)
    shutil.rmtree(work, ignore_errors=True)
    shutil.make_archive(str(out / "capcut-paket"), "zip", capcut)
    log(f"\nFertig in {time.time() - t_start:.0f}s → {out}/")
    log(f"  Glyphen-Fonts liegen in {FONT_DIR / ('qcf_' + args.glyphen)}")


if __name__ == "__main__":
    main()
