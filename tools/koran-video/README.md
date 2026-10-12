# Koran-Video-Workflow

Du lädst deine Rezitation hoch und sagst **Sure, von Vers, bis Vers**. Den Rest
erledigt das Tool:

1. **Zeitstempel erkennen:** Whisper transkribiert die Aufnahme, der Text wird
   Buchstabe für Buchstabe mit dem Koran abgeglichen und jede Versgrenze auf die
   Atempause davor eingerastet.
2. **Verse rendern:** jeder Vers als transparentes Vollbild-PNG in der
   **Glyphen-Schrift (QCF V2)**. Das ist ein eigener Font pro Mushaf-Seite (604
   Stück), derselbe wie auf quran.com, also exakt wie im Madina-Mushaf und mit
   Versnummer-Ornament. Optional kommt die deutsche Übersetzung als eigene Ebene
   dazu.
3. **Video bauen:** Hintergrund, Verse (mit sanfter Blende) und Audio werden zu
   `video.mp4` zusammengesetzt.
4. **CapCut-Paket:** alle Einzelteile, damit du in CapCut alles anpassen kannst.

## Benutzung

```bash
pip install -r tools/koran-video/requirements.txt   # einmalig; ffmpeg muss installiert sein

python tools/koran-video/koran_video.py rezitation.m4a --sure 67 --von 1 --bis 10
```

Nützliche Optionen:

| Option | Bedeutung |
|---|---|
| `--format 9:16` | `9:16` (Reels/TikTok/Shorts, Standard), `16:9`, `1:1`, `4:5` |
| `--hintergrund bild.jpg` / `clip.mp4` | eigener Hintergrund (Video wird geloopt, `--abdunkeln 0.35`) |
| `--basmala auto/ja/nein` | `auto` = Basmala erwartet, wenn ab Vers 1 gelesen wird (nicht bei Sure 1 und 9) |
| `--istiadha` | Aufnahme beginnt mit „A'udhu billahi minasch-schaitanir-radschim“ |
| `--uebersetzung 208` | 208 = Abu Rida (Standard, wie in der App), 27 = Bubenheim, `keine` |
| `--zeitstempel datei.json` | korrigierte `zeitstempel.json` verwenden (siehe unten) |
| `--modell medium` | genaueres, aber langsameres Whisper-Modell (Standard `small`) |
| `--methode stille` | ohne Whisper, nur Pausen; deutlich ungenauer, nur als Notlösung |
| `--farbe "#F5E6C8"`, `--schriftgroesse 90`, `--blende 0` | Optik |
| `--kein-video`, `--kein-trim` | nur Bilder/Zeitstempel bzw. Stille am Anfang/Ende behalten |
| `--alle-fonts ORDNER` | alle 604 Glyphen-Fonts herunterladen (z. B. zum Installieren am PC) |

## Ausgabe

```
koran-video-ausgabe/067_001-010/
├── video.mp4                 fertiges Video
├── zeitstempel.txt / .json   Start/Ende jedes Verses
├── capcut-paket.zip          Inhalt von capcut/ als ZIP
└── capcut/
    ├── audio.m4a             Rezitation (Stille vorne/hinten abgeschnitten)
    ├── hintergrund.png
    ├── arabisch/01_0m00.00s_67-1.png       ← Startzeit steht im Dateinamen
    ├── uebersetzung/01_0m00.00s_67-1.png
    ├── arabisch.srt          Verse als Untertitel (Uthmani-Text)
    └── uebersetzung.srt
```

### In CapCut weiterbearbeiten

1. `audio.m4a` und `hintergrund.png` (oder dein eigenes Video) auf die Timeline legen.
2. Die PNGs aus `arabisch/` (und `uebersetzung/`) als Overlay-Ebene einfügen. Sie
   sind schon im Vollbild positioniert. Laut Dateiname an die jeweilige Startzeit
   ziehen und bis zum nächsten Vers verlängern.
3. Alternativ die `.srt`-Dateien über CapCuts Untertitel-Import (Captions →
   Importieren) laden, oder einfach `video.mp4` als Basis nehmen.

### Zeitstempel korrigieren

Die Erkennung liegt in Tests meist innerhalb von ±0,3 s (vier Rezitatoren, u. a.
Afasy, Sudais, Shatri, Abdul Basit Mujawwad). Wenn doch einmal etwas danebenliegt,
`zeitstempel.json` anpassen und neu rendern, ohne erneute Erkennung:

```bash
python tools/koran-video/koran_video.py rezitation.m4a --sure 67 --von 1 --bis 10 \
  --zeitstempel koran-video-ausgabe/067_001-010/zeitstempel.json
```

Die Zeiten beziehen sich auf `capcut/audio.m4a` (also nach dem Abschneiden der
Stille).

## CapCut direkt per MCP?

Es gibt inoffizielle MCP-Server, die CapCut-Projekte („Drafts“) erzeugen, alle
auf Basis von [VectCutAPI](https://github.com/sun-guannan/VectCutAPI), z. B.
[capcut-mcp-server](https://github.com/Atx-Guy/capcut-mcp-server). Die laufen
aber **lokal auf dem PC, auf dem CapCut installiert ist**, nicht in einer
Cloud-Session. Wenn du so einen Server bei dir einrichtest, lassen sich die
Dateien aus `capcut/` und die Zeiten aus `zeitstempel.json` direkt in einen
Draft übernehmen.

## Quellen

- Text, Glyphen-Codes, Übersetzungen: `api.quran.com/api/v4`
- Glyphen-Fonts: `verses.quran.foundation/fonts/quran/hafs/v2/ttf/p{seite}.ttf`
  (Cache: `~/.cache/koran-video/`, änderbar mit `KORAN_VIDEO_CACHE`)
- Isti'adha-Text: `UthmanicHafs.otf` aus dem Repo (dafür gibt es keine Glyphen-Codes)
