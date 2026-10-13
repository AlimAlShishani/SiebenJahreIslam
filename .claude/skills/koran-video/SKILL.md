---
name: koran-video
description: Erstellt aus einer hochgeladenen Koran-Rezitation (Audio) ein fertiges Video mit den Versen in Glyphen-Schrift plus CapCut-Paket. IMMER verwenden, wenn der Nutzer eine Rezitation/Aufnahme schickt und Sure/Verse nennt ("Sure 67, Vers 1 bis 10", "67:1-10", "Al-Mulk 1-5"), ein Koran-Video/Reel/Short/Clip will, Zeitstempel einer Rezitation braucht oder Zeiten eines schon erstellten Videos korrigieren will.
---

# Koran-Video aus Rezitation

**Grundsatz:** Der Nutzer schickt nur die Rezitation und die Versangaben. Alles
andere erledigst du selbst, ohne Rückfragen, die sich mit Standardwerten
beantworten lassen: ausführen, prüfen, Dateien zurückschicken. Antworte auf
Deutsch.

Tool: `tools/koran-video/koran_video.py` (Doku: `tools/koran-video/README.md`).

## Ablauf

1. **Eingaben.** Nötig sind Audiodatei, Sure, erster und letzter Vers (Sure auch
   als Name, z. B. „al-Mulk“ = 67). Die Audiodatei ist die zuletzt hochgeladene
   Datei: Anhänge der Nachricht, sonst die neueste Audio-/Videodatei im
   Arbeitsverzeichnis bzw. in Upload-Ordnern (`find / -newer … -iname "*.m4a"`
   o. ä.). Videos gehen auch, dann wird die Tonspur benutzt. Nur nachfragen, wenn
   Sure oder Verse fehlen. Erwähnt der Nutzer Isti'adha, Hintergrund oder Format,
   die passenden Optionen setzen; sonst Standard: **16:9 Querformat**, dunkler
   Verlauf, V1-Glyphen, dezenter Glow, schwebende Partikel, sehr leichter seltener
   Glitch (nie beim Verswechsel), Übersetzung (Abu Rida) in Marcellus. „Ohne Effekte“ →
   `--partikel 0 --glitch 0`.
   „Hochformat“, „Reel“, „Short“, „TikTok“ → `--format 9:16`.
2. **Abhängigkeiten** (einmal pro Session, ffmpeg muss vorhanden sein):
   `pip install -q -r tools/koran-video/requirements.txt`
3. **Ausführen** (ca. 1–2 min pro Minute Audio, beim ersten Mal plus Downloads):
   ```bash
   python3 tools/koran-video/koran_video.py "<audio>" --sure S --von A --bis B \
     [--istiadha] [--basmala nein] [--hintergrund <datei>] [--format 9:16] \
     [--glow 0.8] [--glow-farbe "#F6D58E"] [--uebersetzung-font cormorant]
   ```
   Die Basmala wird automatisch erwartet, wenn ab Vers 1 gelesen wird (außer
   Sure 1 und 9). Liest der Nutzer sie nicht, `--basmala nein` setzen.
4. **Selbst prüfen**, bevor du lieferst:
   - `zeitstempel.txt` lesen: Sind die Längen plausibel (kein Vers < 1 s, lange
     Verse länger als kurze)? Steht im Log „nicht sicher erkannt“?
   - Bei Zweifeln 1–2 Frames an verdächtigen Stellen aus `video.mp4` extrahieren
     und ansehen, notfalls mit `--modell medium` neu laufen lassen.
   - Wiederholungen (Nutzer stoppt und liest ein paar Wörter erneut) sind normal
     und werden vom Abgleich abgefangen; kein Grund zur Rückfrage.
   - Passt die Anzahl erkannter Verse nicht zur Aufnahme (z. B. andere Verse
     gelesen als angegeben), dem Nutzer sagen, was du hörst.
5. **Liefern:** `video.mp4` und `capcut-paket.zip` mit SendUserFile schicken
   und die Zeitstempel-Tabelle in die Antwort schreiben. Kurz sagen, dass
   Korrekturen einfach als Nachricht gehen.
6. **Korrekturen** („Vers 3 fängt bei 0:25 an“, „Basmala raus“, „heller
   Hintergrund“): Bei Zeiten in `koran-video-ausgabe/…/zeitstempel.json` die
   `start`-Zeit des Verses und die `ende`-Zeit des vorherigen Verses ändern, dann
   mit `--zeitstempel <json>` neu rendern (keine neue Erkennung). Bei
   Optik-Wünschen mit geänderten Optionen und `--zeitstempel` neu rendern. Dann
   wieder liefern.

Die Ausgabe landet in `koran-video-ausgabe/` (gitignored), nicht committen.
