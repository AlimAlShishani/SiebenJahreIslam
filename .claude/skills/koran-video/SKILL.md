---
name: koran-video
description: Erstellt aus einer hochgeladenen Koran-Rezitation (Audio) ein fertiges Video mit den Versen in Glyphen-Schrift, pro Abschnitt selbst gezeichneten schlichten Grafiken, automatischer Abschnitts-Aufteilung und Farbstimmung plus CapCut-Paket. IMMER verwenden, wenn der Nutzer eine Rezitation/Aufnahme schickt und Sure/Verse nennt ("Sure 67, Vers 1 bis 10", "67:1-10", "Al-Mulk 1-5"), ein Koran-Video/Reel/Short/Clip will, Zeitstempel einer Rezitation braucht oder Zeiten eines schon erstellten Videos korrigieren will.
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
   Glitch (nie beim Verswechsel), ständiges leichtes Hitzeflimmern (Schleife) und ab und zu
   eine feine VHS-Versatzlinie, die von oben nach unten wandert (beides wie in den Referenzvideos), Übersetzung (Abu Rida) in Marcellus. „Mit englischer
   Übersetzung“ → `--uebersetzung 20` (Saheeh International, in beiden Schritten A und C);
   die Teil-Übersetzungen im Plan dann aus diesem englischen Text aufteilen. „Ohne Effekte“ →
   `--partikel 0 --glitch 0 --hitze 0 --vhs 0`.
   „Hochformat“, „Reel“, „Short“, „TikTok“ → `--format 9:16`.
   „Hintergrund soll das Video selbst sein“ (Rezitation als Video aufgenommen) → `--hintergrund` mit
   **derselben Datei** wie die Rezitation: das Tool schneidet das Video genauso zu wie den Ton (Stille
   vorn/hinten), damit Bild und Ton synchron bleiben. Bei dunklen Handyvideos `--abdunkeln 0.15`
   (Standard 0.35 macht das Video fast schwarz); vorher ein Testbild mit Text darüber ansehen.
   **Mehrere Aufnahmen** (z. B. neu angesetzt nach einem Fehler): in der genannten Reihenfolge
   lückenlos zu einer Datei zusammenfügen (`ffmpeg -i a.m4a -i b.m4a -filter_complex
   "[0:a][1:a]concat=n=2:v=0:a=1[a]" -map "[a]" koran-video-ausgabe/<…>/rezitation.m4a`), diese Datei
   in Schritt A und C verwenden und im Erkennungs-Log prüfen, dass an der Nahtstelle nichts fehlt
   oder doppelt ist (Wiederholungen fängt der Abgleich ab).
2. **Abhängigkeiten** (einmal pro Session, ffmpeg muss vorhanden sein):
   `pip install -q -r tools/koran-video/requirements.txt`
3. **Schritt A – Zeitstempel + Planungsgrundlage** (ca. 1 min pro Minute Audio):
   ```bash
   python3 tools/koran-video/koran_video.py "<audio>" --sure S --von A --bis B --nur-zeitstempel \
     [--istiadha] [--basmala nein]
   ```
   **Nur ein Teil eines Verses rezitiert** („Vers 2, nur der letzte Teil“): erst die
   Spracherkennung prüfen, mit welchem Wort die Aufnahme beginnt bzw. endet, dann
   `--ab-wort N` (erster Vers beginnt bei Wort N) bzw. `--bis-wort N` (letzter Vers endet
   bei Wort N) in Schritt A und C setzen. Die Wortnummern im Plan zählen danach ab dem
   ersten gezeigten Wort; `ab_wort` einer Grafik zählt immer im ganzen (gezeigten) Vers,
   nicht im Abschnitt. Die Übersetzung des Teilverses direkt am Vers angeben
   (`"uebersetzung"` ohne `teile`).
   Basmala und Isti'adha werden NICHT angenommen, sondern erkannt: Standard
   `auto` behält sie nur, wenn die Spracherkennung sie in der Aufnahme hört
   (Log: „Basmala: erkannt“ / „nicht gehört → weggelassen“). Sagt der Nutzer
   ausdrücklich etwas anderes, `--basmala ja/nein` bzw. `--istiadha ja/nein`.
   Einzelbuchstaben am Sure-Anfang (الم، حم، يس …) werden beim Abgleich wie
   gesprochen ausgeschrieben („Alif Lām Mīm“). Kurze Aussetzer der
   Handyaufnahme (< 0,38 s) zählen nicht als Pause; Pausen neben einem
   Waqf-Zeichen werden dem Waqf zugeordnet.
   Danach `koran-video-ausgabe/<…>/planung.txt` lesen: Übersetzung je Vers,
   Wörter mit Nummer und Bedeutung, Atempausen (‖), Waqf-Zeichen (ۚ) und die
   **automatischen Abschnitte**. Verse werden automatisch geteilt: spätestens bei
   jeder Atempause im Vers, und wenn der arabische Text nicht in eine Zeile
   (16:9) bzw. zwei Zeilen (9:16) passt, bevorzugt an Waqf-Zeichen. Ausnahme
   (Nutzerwunsch): Ein Teil aus nur einem Wort oder unter 2 s – z. B. eine Pause
   gleich nach أَفِى – wird an den folgenden Teil angehängt, wenn es in die Zeile
   passt; kein Wort soll kurz allein aufblitzen. Daneben liegt
   `plan_vorlage.json` mit diesen Teilen.
4. **Schritt B – Grafiken zeichnen und Plan schreiben.** Es gibt KEINE fertigen
   Motive: Du zeichnest bei jedem Video für jeden passenden Abschnitt eine eigene
   Grafik, die **genau diesen Inhalt** zeigt – mit Details zum Kontext wie in den
   Referenzvideos des Nutzers: Figuren mit passender Haltung und Gegenständen
   (Buch in der Hand, Stock und Bündel beim Wandern, Korb mit Früchten),
   Interaktion zwischen Figuren (geben, abwenden, helfen), Umgebung (Feld, Haus,
   Berg, Palme), Gefühls-Zeichen (Schweißtropfen, ?/!, Zitter- und
   Bewegungslinien). Keine allgemeinen Symbolbilder.
   - **Zuerst `bildsprache.md` (in diesem Skill-Ordner) lesen:** fünf Fragen, mit denen
     man aus jedem Vers ein Bild ableitet, die Grundsätze aus den Referenzvideos und ein
     Musterkatalog „Begriff → Bildidee → Baustein“. Nicht kopieren, sondern pro Vers
     neu denken.
   - **Tafsir lesen, bevor du zeichnest** (Wunsch des Nutzers: keine Deutungsfehler in den
     Piktogrammen). Ibn Kathir (gekürzt, Englisch) je Vers:
     `curl -s https://api.quran.com/api/v4/tafsirs/169/by_ayah/S:V` (Text in `tafsir.text`, HTML).
     Für jedes Bild prüfen: Wer ist gemeint (Bezug auf den Nachbarvers!), was bedeutet das
     Wort hier, sagt das Bild etwas, das der Tafsir nicht sagt? Fehler aus al-A'raf 44–51:
     „Fluch über die Ungerechten“ als Schläger gezeichnet – gemeint sind die in Vers 45
     Beschriebenen (die Leute des Feuers); „Heute vergessen Wir sie“ als Figur, die sich
     auflöst – Allah vergisst nichts, gemeint ist: Wir lassen sie ohne Barmherzigkeit im Feuer.
   - **Zeichnen:** Skript `koran-video-ausgabe/<…>/grafiken_zeichnen.py` schreiben.
     Menschen und Hauptgegenstände mit `tools/koran-video/piktogramm.py`
     (Docstring lesen): `Mensch(x, y, h, pose, spiegeln=, kleid=, kopftuch=, o=,
     arm_v=…)` – Posen über Gelenkwinkel (Seiten- und Frontansicht; eigene Winkel
     pro Szene sind ausdrücklich erwünscht), Gelenkpunkte über `hand()`, `kopf()`,
     `schulter()`, `fuss()`, damit Gegenstände wirklich in der Hand liegen. Dazu
     `fels`, `sack`, `palme`, `baum`, `haengematte`, `sprechblase`,
     `richterhammer`, `sanduhr`, `gebetsteppich`, `weltkugel`, `sonne_horizont`,
     `herz`. Kleine Zeichen, Kalligrafie und den Kontaktbogen liefert
     `baukasten.py` (`zeichen`, `haken`, `kreuz`, `schweiss`, `bewegung`,
     `sparkle`, `ground`, `schriftzug`, `flammen`, `clip_oben` …). Gefühls-Zeichen und
     Symbole aus `symbole.py`: Tränen, Schreck, Wut, Sorgenwolke, Gedankenpfeile, Schall,
     wirre Sprechblase, stummer Lautsprecher, Blindenstock, Blicklinie, Uhr (ständig /
     früher), Medaillon für Propheten, Menge, Teufel, Tür, Gitter, Schranke,
     Schriftrolle, Moschee, Mondphasen (Maß/Qadar), Sonnensystem, Mauer, Krug, Tropfen,
     Verbotsschild, Ball, Lautsprecher (Ausrufer), Zelt, Berge, Fackel, Wegweiser, Sandalen,
     Gebetskette, Stab, Schlange, Schaf, Hand (auch leuchtend), Pyramide, Pharao, Kreispfeil;
     Pose `rufen` (Hand am Mund). Fehlt ein
     Gegenstand, ihn selbst als SVG zeichnen (typische Silhouette, gefüllt, Tiefe
     über Grautöne). Muster: `tools/koran-video/beispiel_ankabut_1-7/`
     (Zeichen-Skript + Plan). SVGs nach `koran-video-ausgabe/<…>/grafiken/`
     speichern, mit `vorschau(...)` den Kontaktbogen erzeugen und **ansehen**
     (Read). `vorschau` meldet abgeschnittene Szenen („WARNUNG … abgeschnitten“,
     roter Rahmen) – die immer beheben. Dann ehrlich prüfen: Erkennt man sofort,
     worum es geht? Überlappt nichts unglücklich (Hände, die Nachbarn „berühren“,
     ein Gegenstand, der mit dem Körper zu einem Klumpen verschmilzt)? Sind die
     Regeln eingehalten? Sonst Varianten nebeneinander rendern und die klarste
     nehmen.
   - **Plan** `koran-video-ausgabe/<…>/plan.json` aus der Vorlage (Format in
     `tools/koran-video/szenen.py`): Teile übernehmen oder nach Sinn anpassen
     (nie über eine Atempause hinweg – außer der Teil davor wäre nur ein Wort bzw.
     kürzer als 2 s –, nie mehr als die erlaubten Zeilen). Jeder
     Teil bekommt seine **deutsche Teil-Übersetzung**: die Abu-Rida-Übersetzung
     sinngemäß passend aufteilen, nicht neu übersetzen (die Vorlage teilt nur grob).
   - **Grafiken überall dort, wo der Abschnitt etwas Konkretes sagt**, mehrere
     pro Abschnitt sind gut, jede ab dem passenden Wort (`ab_wort`). Bei
     Aussagen über Allah passt der Schriftzug (`schriftzug("ٱللَّهُ")`, oder der
     genannte Name wie `ٱلرَّحْمَٰنُ`). Szenen von Strafe (Mensch im Feuer) und
     Belohnung (Garten, Freude) sind erlaubt. Keine Grafik bei Basmala/Isti'adha.
   - **Farbe nach Stimmung** (`farbe`): Standard weiß; `rot` Warnung/Strafe,
     `gruen` frohe Botschaft/Gläubige/Lohn, `gelb` Schwäche/Fehler des Menschen,
     `gold` Aussagen über Allah/Erhabenes, `blau`/`tuerkis` Schöpfung und Dank,
     `lila` Freude über den Lohn, `orange` vergebliches Flehen. Sparsam.
   - **Layout** (Wunsch des Nutzers): Text und Grafik stehen zusammen mittig im
     Bild, die Grafik ist bewusst nicht riesig (16:9: 35 % der Bildhöhe, 9:16: 70 % der Breite),
     die Übersetzung gut lesbar groß (Nutzerwunsch: Piktogramme etwas kleiner, Übersetzung etwas größer).
     Abschnitte ohne Grafik zeigen den Text in der Bildmitte – nicht oben vor
     leerem Bildschirm. Das ist der Standard (`--layout auto`); `--layout oben`
     (Text oben, große Grafik) nur auf ausdrücklichen Wunsch.
5. **Schritt C – Video rendern** (erster Lauf ca. 3–5 min pro Minute Audio):
   ```bash
   python3 tools/koran-video/koran_video.py "<audio>" --sure S --von A --bis B \
     --zeitstempel koran-video-ausgabe/<…>/zeitstempel.json --plan koran-video-ausgabe/<…>/plan.json \
     [--hintergrund <datei>] [--format 9:16] [--glow 0.8] [--uebersetzung-font cormorant]
   ```
   Gerendert wird **in Abschnitten** (Grenzen = Szenenwechsel), jeder mit einem Fingerabdruck
   seines Inhalts in `koran-video-ausgabe/<…>/abschnitte/`. Ein erneuter Lauf rendert nur die
   Abschnitte neu, deren Ebenen, Zeiten oder Effekte sich geändert haben, und hängt dann alle
   ohne Neukodierung aneinander. Den Ordner also nicht löschen; nach einer Korrektur meldet
   das Log „N Abschnitte, davon K neu zu rendern“.
6. **Selbst prüfen**, bevor du lieferst:
   - `zeitstempel.txt` lesen (Verse und Szenen mit Grafiken): Sind die Längen
     plausibel (kein Vers < 1 s)? Steht im Log „nicht sicher erkannt“?
   - Pro Szene mit Grafik einen Frame aus `video.mp4` extrahieren und ansehen
     (Grafik passend, nicht zu klein, Text lesbar). Gerade in roten/grünen
     Szenen prüfen, ob die Tiefe erhalten bleibt (abgewandte Glieder und
     Felsfacetten dunkler als der Rest) und nichts zu einem Farbklumpen
     verschmilzt. Das Leuchten liegt bei Grafiken nur außen um die Form
     (`save_layer(..., grafik=True)`); früher füllte es die Grautöne auf.
   - Wiederholungen (Nutzer stoppt und liest ein paar Wörter erneut) sind normal, kein Grund
     zur Rückfrage. Aber: Geschieht das an einer Atempause, ordnet der Abgleich die Wiederholung
     oft den folgenden Wörtern zu – dann zeigt ein Teil ein Wort zu viel und der nächste beginnt
     zu spät (al-A'raf 48: „قَالُوا۟ مَآ ‖ قَالُوا۟ مَآ أَغْنَىٰ …“). Das Tool warnt mit „ACHTUNG: … s
     zwischen Wort i und i+1“ (planung.txt) bzw. „Hinweis: … Wiederholung?“ (Schritt C). Dann die
     Stelle prüfen (Lautstärkeverlauf in 0,1-s-Schritten, Whisper-Wortzeiten), in
     `zeitstempel.json` Wortzeiten und `pausen_nach_wort` korrigieren und im Plan den Teil davor beim
     letzten gesprochenen Wort enden lassen, den nächsten mit `"ab_wort"` (erstes wiederholtes Wort)
     und `"start"` (Sekunde der Wiederholung) beginnen.
   - Passt die Anzahl erkannter Verse nicht zur Aufnahme (z. B. andere Verse
     gelesen als angegeben), dem Nutzer sagen, was du hörst.
7. **Liefern:** `video.mp4` und `capcut-paket.zip` mit SendUserFile schicken,
   die Szenen-Tabelle (welche Grafik wo) in die Antwort schreiben und kurz
   sagen, dass Korrekturen einfach als Nachricht gehen.
8. **Korrekturen** („Vers 3 fängt bei 0:25 an“, „bei Vers 5 lieber Regen“,
   „Vers 7 nicht teilen“): Zeiten in `zeitstempel.json` (Vers-`start` und
   `ende` des vorherigen Verses) bzw. `plan.json` ändern und Schritt C erneut
   ausführen (keine neue Erkennung). Dank der Abschnitte geht das schnell: eine geänderte
   Grafik kostet nur ihren Abschnitt. Eigene Korrekturen nach dem Prüfen genauso.

## Lehren aus dem ersten echten Fall (al-Ankabut 1–7)

Beim ersten Versuch war der Nutzer mit den Grafiken NICHT zufrieden: „einfach
schlecht“ und „teilweise unerkennbar“. Er will trotzdem ausdrücklich, dass du
die Piktogramme **selbst zeichnest** – keine Icon-Sets (Font Awesome, Material,
Tabler o. ä.), keine fertigen Grafiken. Daraus entstand `piktogramm.py`; der
zweite Versuch (`beispiel_ankabut_1-7/`) ist der Maßstab.

- **Erkennbarkeit zuerst:** Jede Grafik muss ohne Text auf einen Blick
  verständlich sein. Für jede Szene im Kontaktbogen ehrlich beantworten: „Was
  sieht ein Fremder hier?“ Ist die Antwort nicht der Inhalt, neu zeichnen.
- **Wenige, große, klare Elemente** statt vieler kleiner: eine Hauptfigur, ein
  Gegenstand, höchstens ein Zeichen (?, ✓, ✗, Herz). Gegenstände mit typischer
  Silhouette. Felsen kantig wie ein Brocken (helle Oberseite, dunklere
  Seiten); Facetten, die von einem Mittelpunkt ausstrahlen, wirken wie ein
  Schirm oder Wasserball. Palmwedel hängen im Bogen nach unten.
- **Kontakt zeigen:** Wer schiebt, trägt, hebt oder hilft, berührt den Gegenstand
  bzw. die andere Figur sichtbar (Hände auf der Felsoberfläche, Hand in Hand).
  Position aus den Gelenkpunkten berechnen (`m.hand("v")`), nicht schätzen.
- **Gegenstände wie in echt bauen:** Beim Richterhammer sitzt der Stiel quer in
  der Mitte des Kopfes, nicht in einer Linie mit ihm. Vor dem Zeichnen kurz
  überlegen, wie das Ding wirklich aufgebaut ist.
- **Körpersprache wie in den Referenzvideos:** Haltung zeigt den Inhalt (Last
  auf dem Rücken: tief gebeugt; Last stemmen: Frontansicht, Arme hoch;
  Erleichterung: offene Arme; Freude: Arme hoch; Hilfe: einer beugt sich und
  reicht die Hand). Gewicht und Balance prüfen.
- **Weiß auf Weiß verschmilzt:** Gegenstand und Körper nicht großflächig
  überlappen lassen (ein Sack auf dem Rücken wurde zum Klumpen; in der nach
  hinten gestreckten Hand ist er sofort lesbar). Gegenstände in einem etwas
  dunkleren Weiß als die Figur zeichnen, dann bleiben beide klar getrennt.
- **Sprechblase:** Der Zipfel zeigt vom Rand, der dem Sprecher zugewandt ist,
  auf den Kopf. Bei Aussagen wie „Wir glauben“ den arabischen Wortlaut
  (ءَامَنَّا) in die Blase schreiben.
- **Bilder über einen Abschnitt hinweg konsistent halten:** z. B. Fels = Last
  bzw. Prüfung; Lasten, die aufsteigen und zu Licht werden = Sünden, die
  getilgt werden.
- Lieber einer Szene mehr Zeit geben (Varianten nebeneinander vergleichen) als
  viele schwache Szenen; im Zweifel lieber keine Grafik als eine unklare.

## Regeln für Grafiken (vom Nutzer, nicht verhandelbar)

- **Lebewesen ohne Augen.**
- **Menschen nur als Piktogramm ohne jedes Gesichtsdetail.**
- **Keine schwarzen/dunklen Trennlinien mitten durch Figuren und Gegenstände**
  (der Nutzer fand das komisch). Figur im Feuer/Wasser: `clip_oben(...)` statt
  Verdecken.
- **Weiß ruhig etwas abdunkeln, um Gegenstände und Details hervorzuheben**
  (ausdrücklicher Wunsch: „don't be scared to darken the white just a little
  bit“). Mit `grau(wert)` aus `piktogramm.py` (1 = Weiß, 0,85 = etwas dunkler
  …): Hauptfigur weiß, Gegenstände etwas dunkler (Sack, Hängematte,
  Teppich, Hammerstiel), Details in einer dritten Stufe (Palmenstamm mit Ringen,
  Nüsse, Schattenseite, Band am Sack), abgewandte Glieder und Figuren im
  Hintergrund deckend grau (`hell=`), feine hellgraue Kante, wo ein Arm vor dem
  Körper liegt (macht `Mensch` in der Seitenansicht automatisch).
- Ausdrücklich erlaubt: der Schriftzug „Allah“ (und andere Namen Allahs) als
  Grafik, Menschen im Feuer, Szenen von Strafe und Belohnung.
- Propheten und Engel nicht als Figur zeichnen (stattdessen z. B. das Buch, Licht,
  oder die Menschen, um die es geht).
- Jede Grafik vor dem Rendern im Kontaktbogen ansehen und diese Regeln prüfen.
- Stil: Piktogramm-Menschen aus `piktogramm.py` (Körper mit Rumpf und sich
  verjüngenden Gliedern, Kopf als Kreis mit sichtbarem Abstand über dem Rumpf – nicht im Körper
  versenkt, Wunsch des Nutzers; `LUECKE` in `piktogramm.py`), gefüllte Flächen in
  Weiß und hellen Grautönen. Tiefe und Details entstehen über die Abstufungen.

Die Ausgabe landet in `koran-video-ausgabe/` (gitignored), nicht committen.
