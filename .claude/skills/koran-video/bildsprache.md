# Bildsprache: vom Vers zum Piktogramm

Gelernt aus den Referenzvideos des Nutzers (insgesamt 12 Clips, u. a. al-An'am 25–27,
Taha 124–126, Yusuf 23–25, al-Mu'minun 97–100, az-Zalzala, al-Hajj 39–40, al-Ma'arij 19–25,
al-Ankabut 1–5). Ziel ist **nicht**, deren Bilder nachzubauen, sondern ihre Denkweise:
für jeden beliebigen Vers selbst ein logisches, sofort verständliches Bild zu finden.
Vor Schritt B lesen.

## 1. Vorgehen pro Abschnitt: fünf Fragen

1. **Wer?** Subjekt des Abschnitts: ein Mensch, „die Menschen“, Gläubige, Leugner,
   Heuchler, Allah, ein Prophet, die Erde/Natur.
2. **Tut was?** Das Verb wird zur Pose bzw. Handlung (hört, wendet sich ab, schreibt,
   gibt, schlägt, fleht, rennt, kniet).
3. **Woran / womit?** Das Objekt wird zum Gegenstand mit typischer Silhouette
   (Koran auf dem Pult, Tür, Waage, Geldsack, Schriftrolle).
4. **Wie ist es gemeint?** Gefühl und Urteil kommen als Zeichen an die Figur (Tränen,
   Schreck, Zittern, Wut), als ✓/✗ oder großes „?“ und über die Farbe der Szene.
5. **Gibt es ein Schlüsselwort, das man wörtlich als Alltagsding zeigen kann?** Das
   ist oft der beste Einfall: Barzakh („Barriere“) → Absperrschranke; „Märchen der
   Früheren“ → alte Schriftrolle; blind → Blindenstock; taub → stummer Lautsprecher;
   „ständig im Gebet“ → Uhr mit Kreispfeil über dem Betenden.

Danach: **eine Figur + ein Gegenstand/Symbol, höchstens ein Zeichen.** Gibt der
Abschnitt nichts Konkretes her (Alif-Lam-Mim, rein abstrakte Sätze), dann keine Grafik
oder der Schriftzug des genannten Namens Allahs. Die Referenzen lassen auch Abschnitte
leer, statt etwas zu erzwingen.

## 2. Grundsätze

- **Eine Idee pro Bild**, groß und mittig unter dem Text. Figur und Gegenstand stehen
  sich gegenüber (Figur links, Gegenstand rechts), die Handlung geht zum Gegenstand hin.
- **Eine Geschichte erzählen:** Über einen zusammenhängenden Abschnitt bleiben dieselbe
  Figur und dieselben Dinge (derselbe Koran auf dem Pult, dieselbe Tür). Zustände
  wechseln über Pose und Farbe: Er schaut den Koran an → wendet sich ab (rot) → steht im
  Feuer. Bei Geschichten (z. B. Yusuf) bleibt der Schauplatz (Tür, Bett, Gefängnis).
- **Wörtlich, aber mit Alltagssymbolen**, die jeder sofort kennt (Verkehrsschild,
  Lautsprecher-Symbol, Uhr, ✓/✗, Fragezeichen).
- **Gefühle über Zeichen und Haltung, nie über Gesichter** (siehe Liste unten).
- **Fragen im Vers** („Meinen sie …?“, „Warum hast du mich blind auferweckt?“) → großes
  „?“ neben die Szene, oft in Rot.
- **Gegensätze nebeneinander:** zwei Gruppen mit ✓ und ✗ (getrennte Scharen am
  Gerichtstag), Wahrhaftige grün und Lügner rot.
- **Taten konkret:** gute Tat = jemandem helfen, geben, umarmen (+✓); schlechte Tat =
  schlagen, wegnehmen, zerstören (+✗).
- **Aufzählungen wortgenau:** Nennt der Vers mehrere Dinge nacheinander (Klöster,
  Kirchen, Synagogen, Moscheen), erscheint jedes Bild genau bei seinem Wort (`ab_wort`).
- **Schlüsselbegriff als Wort-Label**, sparsam: ein kurzes Wort in der Szenenfarbe über
  dem Bild („Zakah“, „QUR'AN“, „ALLAH“, „NEVER!“ bei كَلَّا). Das verankert die Bedeutung.
- **Lieber keine Grafik als eine erzwungene.**

## 3. Musterkatalog: Begriff → Bildidee → Baustein

Keine festen Vorlagen, sondern Startpunkte. Jede Szene wird für ihren Vers neu
komponiert. Bausteine aus `piktogramm.py` (P), `symbole.py` (S) und `baukasten.py` (B).

**Allah und Offenbarung**
- Allah, „dein Herr“, Seine Namen → Schriftzug ٱللَّه bzw. der genannte Name (B `schriftzug`), gold
- Tauhid, „Ich suche Zuflucht bei Allah“, „Allah ist der Mächtige“ → erhobener Zeigefinger + Schriftzug
- Zeichen/Hilfe/Sieg von Allah → goldenes Funkeln (B `sparkle`), Lichtstrahlen (P `lichtstrahlen`)
- Koran, Ermahnung, Verse → Koran auf dem Pult (P `koran_rahl`), herabgesandt: mit Lichtstrahlen von oben

**Propheten** (nie als Figur, siehe Regeln)
- Prophet, Gesandter → Namens-Kalligrafie im leuchtenden Kreis (S `medaillon`, z. B. „مُحَمَّد“, „مُوسَىٰ“)
- „sie streiten mit dir“, „sie halten andere vom Propheten ab“ → Figur(en) vor dem Medaillon,
  mit wirrer Sprechblase bzw. abwehrender Hand

**Menschen, Gruppen, frühere Völker**
- „die Menschen“, Scharen → Menge (S `menge`), bei Gericht zwei Gruppen mit ✓/✗
- „die vor ihnen“, frühere Generationen → Menge + Uhr mit Rückwärtspfeil (S `uhr(pfeil="zurueck")`)
- Heuchler, Lügner → Figur, die etwas behauptet (Sprechblase ءَامَنَّا), dann durchgestrichen;
  heimliches Tun (Waagschale herunterdrücken)
- Satan, Versuchung → Figur mit Hörnern und Schwanz (S `teufel`), rot; „weghalten“ = abwehrende Hand

**Glaube und Gottesdienst**
- beten → Sudschud/Gebetsteppich (P `gebetsteppich`); ständig beten → + Uhr mit Vorwärtspfeil
- Zakah, Spenden → einer gibt dem anderen einen Geldsack (P `sack`), Label „Zakah“
- Moschee, Gebetsorte → Moschee-Silhouette (S `moschee`)
- Geduld, Prüfung → Last tragen (P `fels`), aufrecht stemmen = bestanden

**Unglaube, Abwenden, Sünde**
- sich abwenden, nicht glauben → Figur dreht sich weg, Hand abwehrend erhoben, Koran gegenüber
- Herz verschlossen/krank → Herz mit dunklen Flecken (P `herz_flecken`), auf der Brust einer Figur
- böse Absicht → Herz mit Teufelshörnern; Übeltäter → Figur, die schlägt/zerstört (+✗)
- nicht hören / nicht verstehen → stummer Lautsprecher (S `lautsprecher_stumm`), Schultern
  hochgezogen + „!?“, wirre Sprechblase (S `wirrwarr_blase`)

**Gericht und Jenseits**
- Gerichtstag, Abrechnung → Waage (P `waage`), Richterhammer (P `richterhammer`)
- Aufzeichnung der Taten, „die Erde berichtet“ → jemand schreibt am Pult, Schriftrolle (S `schriftrolle`)
- Barzakh, kein Zurück → Absperrschranke (S `schranke`)
- festgehalten, Gefängnis → Gitter vor der Figur (S `gitter`)
- Strafe, Feuer → Figur in Flammen (B `flammen`, `clip_oben`), rot
- Lohn, Paradies → Garten, Bäume, Fluss, Figur mit erhobenen Armen, grün
- Gespräche zwischen Paradies, Feuer und al-A'raf → **ein fester Schauplatz** über alle Verse:
  links Garten (Bäume, Palme), Mitte Mauer mit den Männern oben (S `mauer`), rechts Feuer mit
  Menschen darin; je Abschnitt der passende Ausschnitt (wer ruft wem zu, wohin geht der Blick)
- Paradies und Feuer in einem Bild → **sichtbarer Abstand** dazwischen, sonst verschwimmt beides zu
  einem Block. Die Szene bleibt einfarbig (Szenenfarbe). Nur dort, wo beide sich wirklich
  gegenüberstehen (z. B. al-A'raf 44: die Leute des Paradieses rufen denen des Feuers zu), bekommt die
  andere Seite ihre eigene Szenenfarbe über B `faerben` (Feuer rot in der grünen Szene bzw. Garten grün
  in der roten) – schlicht, zwei Farben, nicht mehr. Nicht jedes Ding einfärben: das wirkte überladen
- „Wir vergessen sie“ (Allah vergisst nichts) → im Feuer zurückgelassen, das Tor zum Garten
  verschlossen (57:13: Mauer mit Tor, innen Barmherzigkeit, außen Strafe) – nie als Auflösen
- rufen, zurufen → Pose `rufen` (Hand am Mund) + `schall`; Gruß/Antwort → Sprechblase mit dem
  arabischen Wortlaut (سَلَٰمٌ عَلَيْكُمْ، نَعَمْ)
- Ausrufer, Verkündung (oft ein Engel) → Trichter-Lautsprecher (S `lautsprecher`), nie eine Figur
- verboten, verwehrt → Verbotsschild über den Dingen (S `verbot`); Wasser → Krug, Tropfen (S `krug`, `tropfen`)
- flehen um etwas Unerreichbares → Figur reckt die Arme zu einem Gegenstand, der zu hoch hängt
- Religion als Spiel, Zeitvertreib → Figur spielt Ball (S `ball`), Koran im Rücken; „vergaßen den Tag“ →
  dieselbe Figur, die Waage hinter sich; „wir vergessen sie“ → Figur im Feuer verblasst (`hell=`, `o=`)
- Auferstehung → Figuren steigen aus dem Boden (unterer Teil mit `clip_oben` abgeschnitten), Nacht/Mond
- Tod naht → Figur weicht zurück, Arme abwehrend, Sanduhr fast leer (P `sanduhr`); Tote, Grab → Skelett (erlaubt)

**Gefühle** (Zeichen an der Figur, S)
- Angst, Unruhe → Zitterstriche (B `zittern`), Schweißtropfen (B `schweiss`)
- Schreck, plötzliche Einsicht → `schreck`; Wut → `wut`
- Reue, Verzweiflung → kniend, Hände am Kopf (Pose `front_kopf_halten`/`knien`) + `traenen`
- Kummer, „ein elendes Leben“ → zusammengesunken + dunkle `sorgenwolke` über dem Kopf
- Ratlosigkeit, rasende Gedanken → `gedankenpfeile`; Zweifel → großes „?“

**Sinne und Reden**
- sagen, behaupten, rufen → Sprechblase mit dem arabischen Wortlaut (P `sprechblase`) oder `schall`
- streiten → wirre Sprechblase, zwei Figuren mit Zeigefinger und „!“
- sehen, anschauen → gestrichelte Blicklinie vom Kopf zum Ziel (S `blicklinie`)
- blind → Blindenstock (S `blindenstock`); taub → stummer Lautsprecher

**Zeit und Natur**
- immer, ständig → Uhr mit Vorwärtspfeil; früher, Vergangenheit → Uhr mit Rückwärtspfeil
- Frist, Termin → Sanduhr
- Erde, Erdbeben → Weltkugel (P `weltkugel`) mit Zitterstrichen; Menschen mit Händen am Kopf daneben
- Himmel, Schöpfung → Sonne/Mond/Sterne, blau oder türkis
- Maß, Bestimmung, Qadar („für alles ein Maß“) → Mondphasen im Bogen vom Neumond zum Vollmond
  (S `mondphasen`): jede Phase zu ihrer Zeit, derselbe Wortstamm wie قَدَّرْنَٰهُ مَنَازِلَ (36:39).
  Eine Messlatte mit Pflanze/Mensch/Baum war zu um die Ecke gedacht.
- Ordnung der Schöpfung, „alles läuft auf seiner Bahn“ → Sonne mit Planetenbahnen (S `sonnensystem`)

## 4. Was wir bewusst anders machen als die Referenzen

- **Keine Gesichter, keine Augen** (die Referenzen zeichnen Gesichter). Wir erzählen
  Gefühle nur über Haltung und Zeichen. Auch Lücken zwischen Armen und Kopf dürfen nicht
  wie Augen wirken (deshalb füllt `Mensch` sie bei Händen am Kopf).
- **Propheten nie als Figur** (die Referenz zeigt Yusuf als Figur). Stattdessen Medaillon
  mit Namen, oder nur die anderen Personen und Dinge der Geschichte.
- **Skelett ist erlaubt** (ausdrücklich vom Nutzer freigegeben), z. B. für Tod, Grab,
  „Lass mich zurückkehren!“ (kniendes Skelett).
- **Alles selbst gezeichnet**, keine Fotos/3D-Bilder (die Referenzen mischen echte Bilder
  von Koran, Herz, Erde ein).

## 5. Farben (aus den Referenzen bestätigt)

Die ganze Szene, Text und Grafik, nimmt die Stimmungsfarbe an. Der Wechsel innerhalb
eines Verses ist normal.
- `rot`: Strafe, Feuer, Satan, Lügner, Übeltäter, Warnung
- `gruen`: Erlaubnis, die Wahrhaftigen, gute Taten, Lohn
- `gelb`/`gold`: Allahs Macht und Hilfe, Seine Zeichen, Hoffnung; `gelb` auch für das Nahen des Todes
- `tuerkis`/`blau`: Dank, Schöpfung und Natur-Ereignisse
- `lila`: Freude über den Lohn, gutes Ende
- `orange`: vergebliches Flehen, Ausreden
