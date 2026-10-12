---
name: koran-video
description: Erstellt aus einer hochgeladenen Koran-Rezitation (Audio) ein Video mit den Versen in Glyphen-Schrift (QCF V2) plus CapCut-Paket. Verwenden, wenn der Nutzer eine Rezitation hochlädt bzw. nennt und Sure/Verse angibt ("Sure 67, Vers 1 bis 10"), ein Koran-Video/Reel/Clip will oder Zeitstempel einer Rezitation braucht.
---

# Koran-Video aus Rezitation

Tool: `tools/koran-video/koran_video.py` (Doku: `tools/koran-video/README.md`).

## Ablauf

1. **Eingaben klären.** Nötig sind die Audiodatei sowie Sure, erster und letzter
   Vers. Fehlt etwas, kurz nachfragen. Die Audiodatei ist meist die zuletzt
   hochgeladene Datei (im Arbeitsverzeichnis oder in den Anhängen nachsehen;
   auch Videos gehen, die Tonspur wird benutzt). Optional nachfragen, wenn
   unklar: Isti'adha gelesen? Hintergrund? Format (Standard 9:16)?
2. **Abhängigkeiten** (einmal pro Session):
   `pip install -q -r tools/koran-video/requirements.txt` (ffmpeg muss vorhanden sein).
3. **Ausführen** (dauert ca. 1–2 min pro Minute Audio, beim ersten Mal plus Modell-Download):
   ```bash
   python3 tools/koran-video/koran_video.py "<audio>" --sure S --von A --bis B [--istiadha] [--hintergrund <datei>] [--format 9:16]
   ```
   Die Basmala wird automatisch erwartet, wenn ab Vers 1 gelesen wird (außer
   Sure 1 und 9). Liest der Nutzer sie nicht, `--basmala nein` setzen.
4. **Prüfen.** `zeitstempel.txt` lesen. Steht im Log „nicht sicher erkannt“
   oder wirken Längen unplausibel (z. B. ein Vers < 1 s), dann 1–2 Frames an
   den betroffenen Stellen aus `video.mp4` extrahieren und ansehen; falls nötig
   mit `--modell medium` neu laufen lassen.
5. **Liefern.** `video.mp4` und `capcut-paket.zip` mit SendUserFile schicken
   und die Zeitstempel-Tabelle in der Antwort zeigen.
6. **Korrekturen** („Vers 3 fängt bei 0:25 an“): in
   `koran-video-ausgabe/…/zeitstempel.json` die `start`-Zeit des Verses und die
   `ende`-Zeit des vorherigen Verses ändern, dann mit
   `--zeitstempel <json>` neu rendern (keine neue Erkennung nötig).

Die Ausgabe landet in `koran-video-ausgabe/` (gitignored), nicht committen.
