---
name: koran-video
description: Erstellt aus einer hochgeladenen Koran-Rezitation (Audio) ein fertiges Video mit den Versen in Glyphen-Schrift, passenden schlichten Grafiken, Abschnitts-Aufteilung und Farbstimmung plus CapCut-Paket. IMMER verwenden, wenn der Nutzer eine Rezitation/Aufnahme schickt und Sure/Verse nennt ("Sure 67, Vers 1 bis 10", "67:1-10", "Al-Mulk 1-5"), ein Koran-Video/Reel/Short/Clip will, Zeitstempel einer Rezitation braucht oder Zeiten eines schon erstellten Videos korrigieren will.
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
3. **Schritt A – Zeitstempel + Planungsgrundlage** (ca. 1 min pro Minute Audio):
   ```bash
   python3 tools/koran-video/koran_video.py "<audio>" --sure S --von A --bis B --nur-zeitstempel \
     [--istiadha] [--basmala nein]
   ```
   Die Basmala wird automatisch erwartet, wenn ab Vers 1 gelesen wird (außer
   Sure 1 und 9). Liest der Nutzer sie nicht, `--basmala nein` setzen.
   Danach `koran-video-ausgabe/<…>/planung.txt` lesen: Übersetzung je Vers,
   Wörter mit Nummer und Bedeutung, Atempausen (‖), Motiv-Vorschläge, alle Motive.
4. **Schritt B – Plan schreiben** (`koran-video-ausgabe/<…>/plan.json`, Format
   in `tools/koran-video/szenen.py`). Wie in den Referenzvideos des Nutzers:
   - **Lange Verse in Abschnitte teilen** an den Atempausen (‖) bzw. an
     Sinneinheiten (`teile` mit `bis_wort`). Jeder Teil bekommt seine eigene
     **deutsche Teil-Übersetzung**: die Abu-Rida-Übersetzung aus planung.txt
     passend aufteilen, nicht neu übersetzen. Kurze Verse bleiben ganz.
   - **Grafiken nur, wo sie den Inhalt wirklich zeigen**: Natur, Dinge, Tiere,
     Menschen, Handlungen (Erde/Wege, Regen, Vögel, Schiff, Gärten, Feuer,
     Waage …) und rhetorische Fragen (`fragezeichen`), Warnungen
     (`ausrufezeichen`), richtig/falsch (`haken`/`kreuz`). Mehrere Grafiken pro
     Vers sind gut, jede ab dem passenden Wort (`ab_wort`).
   - **Keine Grafik** bei Basmala, Isti'adha, Aussagen über Allah und Seine
     Eigenschaften, über das Verborgene (Engel, Thron, Auferstehung …), bei
     reinen Lobpreisungen und wenn nichts Konkretes passt. Lieber weniger.
   - **Farbe nach Stimmung** (`farbe`): Standard weiß; `rot` Warnung/Strafe,
     `gruen` frohe Botschaft/Gläubige/Lohn, `gelb` Schwäche/Fehler des Menschen,
     `gold` Aussagen über Allah/Erhabenes, `blau`/`rosa` Schöpfung. Sparsam.
5. **Schritt C – Video rendern** (ca. 3 min pro Minute Audio):
   ```bash
   python3 tools/koran-video/koran_video.py "<audio>" --sure S --von A --bis B \
     --zeitstempel koran-video-ausgabe/<…>/zeitstempel.json --plan koran-video-ausgabe/<…>/plan.json \
     [--hintergrund <datei>] [--format 9:16] [--glow 0.8] [--uebersetzung-font cormorant]
   ```
6. **Selbst prüfen**, bevor du lieferst:
   - `zeitstempel.txt` lesen (Verse und Szenen mit Grafiken): Sind die Längen
     plausibel (kein Vers < 1 s)? Steht im Log „nicht sicher erkannt“?
   - Pro Szene mit Grafik einen Frame aus `video.mp4` extrahieren und ansehen
     (Grafik passend, nicht zu klein, Text lesbar).
   - Wiederholungen (Nutzer stoppt und liest ein paar Wörter erneut) sind normal
     und werden vom Abgleich abgefangen; kein Grund zur Rückfrage.
   - Passt die Anzahl erkannter Verse nicht zur Aufnahme (z. B. andere Verse
     gelesen als angegeben), dem Nutzer sagen, was du hörst.
7. **Liefern:** `video.mp4` und `capcut-paket.zip` mit SendUserFile schicken,
   die Szenen-Tabelle (welche Grafik wo) in die Antwort schreiben und kurz
   sagen, dass Korrekturen einfach als Nachricht gehen.
8. **Korrekturen** („Vers 3 fängt bei 0:25 an“, „bei Vers 5 lieber Regen“,
   „Vers 7 nicht teilen“): Zeiten in `zeitstempel.json` (Vers-`start` und
   `ende` des vorherigen Verses) bzw. `plan.json` ändern und Schritt C erneut
   ausführen (keine neue Erkennung).

## Regeln für Grafiken (vom Nutzer, nicht verhandelbar)

- **Lebewesen ohne Augen.**
- **Menschen nur als Piktogramm/Strichmännchen ohne jedes Gesichtsdetail.**
- Niemals Allah, Propheten, Engel, Dschinn/Satan oder Szenen des Verborgenen
  bildlich darstellen.
- Neue Motive: im gleichen Stil in `tools/koran-video/grafiken/_erzeugen.py`
  ergänzen (`python3 tools/koran-video/grafiken/_erzeugen.py tools/koran-video/grafiken`),
  das Ergebnis als Bild ansehen und die Regeln prüfen, bevor es verwendet wird.

Die Ausgabe landet in `koran-video-ausgabe/` (gitignored), nicht committen.
