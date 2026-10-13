# Koran-Video-Workflow

**So funktioniert es:** Du schickst Claude deine Rezitation und schreibst dazu
Sure und Verse, z. B. „Sure 67, Vers 1–10“. Claude führt alles aus und schickt
dir `video.mp4` und das CapCut-Paket zurück. Korrekturen („Vers 3 beginnt bei
0:25“) schreibst du einfach in den Chat. Den Ablauf für Claude beschreibt
`.claude/skills/koran-video/SKILL.md`.

Was dabei passiert:

1. **Zeitstempel erkennen:** Whisper transkribiert die Aufnahme, der Text wird
   Buchstabe für Buchstabe mit dem Koran abgeglichen und jede Versgrenze auf die
   Atempause davor eingerastet.
2. **Verse rendern:** jeder Vers als transparentes Vollbild-PNG in der
   **Glyphen-Schrift** des King-Fahd-Komplexes. Das ist ein eigener Font pro
   Mushaf-Seite (604 Stück), also exakt wie im Madina-Mushaf und mit
   Versnummer-Ornament. Standard ist **V1**, die Generation des Font-Sets, das die FAQ
   von [qurancliphelper.com](https://qurancliphelper.com) verlinkt. Mit
   `--glyphen v2` gibt es die neuere Ausgabe wie auf quran.com. Optional kommt
   die deutsche Übersetzung als eigene Ebene dazu.
3. **Abschnitte:** Verse werden automatisch geteilt, damit nie zu viel
   arabischer Text auf einmal steht: spätestens bei jeder Atempause im Vers und
   wenn der Text nicht in eine Zeile (16:9) bzw. zwei Zeilen (9:16) passt,
   bevorzugt an Waqf-Zeichen. Jeder Abschnitt zeigt seine Teil-Übersetzung, die
   Versnummer steht am letzten Abschnitt.
4. **Grafiken & Plan:** Claude zeichnet bei jedem Video für passende Abschnitte
   eigene schlichte Grafiken (Piktogramm-Stil, `piktogramm.py`) und legt in
   `plan.json` fest, welche Grafik ab welchem Wort erscheint, wie die
   Übersetzung aufgeteilt wird und welche Farbstimmung ein Abschnitt hat. Text
   steht dann oben, die Grafik groß darunter, wie in deinen Referenzvideos.
5. **Video bauen:** Hintergrund, Partikel, Szenen (mit sanfter Blende, Grafiken
   schweben leicht) und Audio werden zu `video.mp4` zusammengesetzt.
6. **CapCut-Paket:** alle Einzelteile, damit du in CapCut alles anpassen kannst.

## Benutzung

```bash
pip install -r tools/koran-video/requirements.txt   # einmalig; ffmpeg muss installiert sein

python tools/koran-video/koran_video.py rezitation.m4a --sure 67 --von 1 --bis 10
```

Nützliche Optionen:

| Option | Bedeutung |
|---|---|
| `--nur-zeitstempel` | nur Zeitstempel + `planung.txt` (Grundlage für den Plan) |
| `--plan plan.json` | Abschnitte, Teil-Übersetzungen, Farben und Grafiken (Format in `szenen.py`) |
| `--max-zeilen 1` | höchstens so viele Zeilen arabischer Text pro Abschnitt (Standard 1 bei 16:9, 2 bei 9:16) |
| `--nicht-teilen` | Verse nicht automatisch teilen |
| `--layout auto/oben/mitte` | Text oben (Grafik darunter) oder mittig; `auto` = oben, sobald der Plan Grafiken hat |
| `--glyphen v1` / `v2` | V1 = wie das Font-Set der qurancliphelper-FAQ (Standard), V2 = wie quran.com |
| `--format 16:9` | `16:9` Querformat (Standard), `9:16` (Reels/TikTok/Shorts), `1:1`, `4:5` |
| `--glow 0.45` | Leuchten um den arabischen Text: `0` aus, `0.45` dezent (Standard), `0.8` kräftig |
| `--glow-farbe "#F6D58E"` | Farbe des Leuchtens (Standard weiß; `#F6D58E` = warmes Gold) |
| `--partikel 0.5` | schwebende Lichtpartikel: `0` aus, `0.5` dezent (Standard), `1` viele/hell; `--partikel-farbe` |
| `--glitch 0.5` | ganz leichter Farbversatz (2 px, 1–2 Frames) etwa alle 14 s, nie beim Verswechsel: `0` aus, `0.5` dezent (Standard) |
| `--uebersetzung-font marcellus` | `marcellus` (Standard), `cormorant`, `ebgaramond`, `lora` (kursiv), `system` oder Pfad zu einer .ttf |
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
├── zeitstempel.txt / .json   Start/Ende jedes Verses (+ Wortzeiten, Pausen) und jeder Szene
├── planung.txt               Übersicht für den Plan (Wörter, Pausen, automatische Abschnitte)
├── plan_vorlage.json         Vorlage mit den automatischen Abschnitten
├── plan.json                 der verwendete Plan
├── grafiken_zeichnen.py      Claudes Skript, das die Grafiken dieses Videos zeichnet
├── grafiken/                 die gezeichneten SVGs + vorschau.jpg
├── capcut-paket.zip          Inhalt von capcut/ als ZIP
└── capcut/
    ├── audio.m4a             Rezitation (Stille vorne/hinten abgeschnitten)
    ├── hintergrund.png
    ├── partikel.mp4          nahtloser 24-s-Loop auf Schwarz → in CapCut Mischmodus „Bildschirm“/„Screen“
    ├── arabisch/01_0m00.00s_67-1.png       ← Startzeit steht im Dateinamen
    ├── uebersetzung/01_0m00.00s_67-1.png
    ├── grafiken/03_0m21.69s_67-16_2_erde_beben.png
    ├── farbe/leuchten_FF3B3B.png    farbiges Hintergrund-Leuchten der Szenen
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

### Wiederholungen beim Rezitieren

Wenn du kurz stoppst und ein paar Wörter zurückspringst, ist das kein Problem.
Der Abgleich behandelt die wiederholten Wörter als Einschub und erkennt den
nächsten Versanfang trotzdem. Getestet mit:
- Wiederholung mitten im Vers
- Neustart am Versanfang
- Zurückspringen ans Ende des vorherigen Verses
- zwei Wiederholungen in einer Aufnahme

Abweichung jeweils ≤ 0,2 s. Springst du in den vorherigen Vers zurück, bleibt
während der Wiederholung der vorherige Vers eingeblendet, und der neue Vers
erscheint, wenn du ihn wirklich liest.

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

## Grafiken

Es gibt keine fertigen Motive. Claude zeichnet die Grafiken bei jedem Video passend
zum Abschnitt neu:

- `piktogramm.py`: Piktogramm-Menschen (`Mensch`) mit Posen über Gelenkwinkel
  (Seiten- und Frontansicht, Gewand, Kopftuch), Gelenkpunkte für Gegenstände in
  der Hand, und Gegenstände mit klarer Silhouette (Fels, Sack, Palme, Baum,
  Hängematte, Sprechblase, Richterhammer, Sanduhr, Gebetsteppich, Weltkugel,
  Sonnenaufgang, Herz).
- `baukasten.py`: Leinwand, Kontaktbogen `vorschau(...)` (meldet abgeschnittene
  Szenen) und kleine Bausteine: Zeichen (?, ✓, ✗, Schweißtropfen,
  Bewegungslinien, Funkeln), Kalligrafie `schriftzug("ٱللَّهُ")`, Flammen, Wellen,
  Vögel u. a.

Die Grafiken sind konkret zum Abschnitt: Figuren mit passender Körpersprache und
Gegenständen, Interaktion, Umgebung, Gefühls-Zeichen, bei Aussagen über Allah der
Schriftzug ٱللَّه bzw. der genannte Name. Vollständiges Beispiel:
`beispiel_ankabut_1-7/` (Zeichen-Skript und Plan; aus dem Repo-Wurzelverzeichnis
`python3 tools/koran-video/beispiel_ankabut_1-7/grafiken_zeichnen.py` ausführen).

**Regeln:** Lebewesen ohne Augen, Menschen nur als Piktogramm ohne Gesicht, keine
dunklen Linien in den Grafiken. Erlaubt: Schriftzug „Allah“ als Grafik, Menschen
im Feuer. Propheten und Engel werden nicht als Figur gezeichnet. Keine Grafik bei
Basmala.

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
- Glyphen-Fonts: `verses.quran.foundation/fonts/quran/hafs/{v1|v2}/ttf/p{seite}.ttf`
  (Das Set `AllPartsFonts.zip` aus der FAQ von qurancliphelper.com stammt von
  2005, also aus der V1-Zeit, und ist dort nur als Windows-Installer zu haben.)
  (Cache: `~/.cache/koran-video/`, änderbar mit `KORAN_VIDEO_CACHE`)
- Isti'adha-Text: `UthmanicHafs.otf` aus dem Repo (dafür gibt es keine Glyphen-Codes)
