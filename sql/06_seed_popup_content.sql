-- ═══════════════════════════════════════════════════════════════════════════
-- 06_seed_popup_content.sql – Popup-Texte (modal_content) für alle 13 Stufen
-- Einmal ausführen. Wichtig: Stufe 4 erklärt Tanwīn (-un/-an/-in) und ة (Tāʾ marbūṭa).
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du:</p>
<ul>
  <li>Wo jeder Buchstabe ausgesprochen wird (Hals, Zunge, Lippen)</li>
  <li>Unterschiede zwischen ähnlichen Buchstaben (z.B. س / ص, ت / ط)</li>
  <li>Welche Buchstaben „weich“ und welche „stark“ klingen</li>
</ul>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du kannst jeden Buchstaben klar und korrekt aussprechen.</p>
</div>
' WHERE level_number = 1;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du:</p>
<ul>
  <li><strong>Fatha</strong> (َ) – kurzes „a“, Strich über dem Buchstaben</li>
  <li><strong>Kasra</strong> (ِ) – kurzes „i“, Strich unter dem Buchstaben</li>
  <li><strong>Damma</strong> (ُ) – kurzes „u“, Kringel über dem Buchstaben</li>
  <li>Wie man Buchstaben flüssig mit diesen Vokalen verbindet</li>
</ul>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du kannst kurze Vokale sicher und flüssig lesen.</p>
</div>
' WHERE level_number = 2;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du:</p>
<ul>
  <li>Dass <strong>Sukūn</strong> (ْ) – der kleine Kreis über dem Buchstaben – bedeutet: dieser Buchstabe hat keinen Vokal und bleibt „stumm“</li>
  <li>Wie man Buchstaben mit Sukūn korrekt liest, ohne ein extra „a“, „i“ oder „u“ hinzuzufügen</li>
  <li>Typische Fehler vermeiden (z.B. „min“ nicht als „mina“ lesen)</li>
</ul>
<p>In der nächsten Stufe lernst du außerdem den Buchstaben <strong>ة</strong> (Tāʾ marbūṭa) und die Endungen -un/-an/-in kennen.</p>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du liest stille Buchstaben sauber und korrekt.</p>
</div>
' WHERE level_number = 3;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du:</p>
<ul>
  <li><strong>Shaddah</strong> (ّ) – das w-förmige Zeichen bedeutet: der Buchstabe wird verdoppelt und kräftig ausgesprochen (z.B. رَبَّ rabba).</li>
  <li>Wie man Shaddah beim Lesen erkennt und flüssig liest.</li>
</ul>
<p><strong>Tanwīn</strong> (ـٌ ـٍ ـً) – die „Doppelvokal“-Zeichen am Wortende:</p>
<ul>
  <li>ـٌ wird als <strong>-un</strong> gelesen (z.B. مُحَمَّدٌ muḥammadun, جَنَّةٌ jannatun)</li>
  <li>ـٍ wird als <strong>-in</strong> gelesen (z.B. مِنْ سُوءٍ min sūʾin)</li>
  <li>ـً wird als <strong>-an</strong> gelesen (z.B. صَفًّا ṣaffan)</li>
</ul>
<p>Diese Endungen kommen im Qurʾan sehr oft vor. Hier reicht es, sie zu erkennen und richtig auszusprechen.</p>
<p><strong>ة (Tāʾ marbūṭa)</strong> – der „gebundene T-Buchstabe“ am Wortende:</p>
<ul>
  <li>Wenn du <strong>am Wort stoppst</strong> (Pause, Satzende), sprichst du ة als <strong>„h“</strong> aus (z.B. جَنَّة → jannah).</li>
  <li>Wenn du <strong>weiterliest</strong> (nächstes Wort folgt), sprichst du ة als <strong>„t“</strong> aus (z.B. جَنَّةٌ → jannatun).</li>
</ul>
<p>Im Quiz kannst du bei Bedarf die „Hilfe“-Audio abspielen (falls vom Admin hinterlegt).</p>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du liest Shaddah, Tanwīn und ة klar und wie im Qurʾan.</p>
</div>
' WHERE level_number = 4;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du:</p>
<ul>
  <li>Wann ein Laut <strong>länger gezogen</strong> wird: wenn nach einem Vokal ein <strong>Alif</strong>, <strong>Waw</strong> oder <strong>Ya</strong> ohne eigenes Vokalzeichen folgt</li>
  <li>Beispiele: بَا bā, تِي tī, نُو nū, قَالَ qāla, نُور nūr</li>
  <li>Grund-Dehnung: meist etwa <strong>2 Zählzeiten</strong></li>
  <li>Häufige Fehler vermeiden: weder zu kurz noch übertrieben lang lesen</li>
</ul>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du liest Dehnungen stabil und richtig.</p>
</div>
' WHERE level_number = 5;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du die Regeln für <strong>Nūn Sakinah</strong> (نْ) und <strong>Tanwīn</strong> (ـٌ ـٍ ـً):</p>
<ul>
  <li><strong>Izhar</strong>: N vor Halsbuchstaben (ء ه ع ح غ خ) wird klar als „n“ ausgesprochen, z.B. مِنْ هَادٍ → min hādin.</li>
  <li><strong>Idgham</strong>: N verschmilzt mit dem nächsten Buchstaben (ي ن م و ل ر), z.B. مِنْ لَّدُنْهُ → mil ladunhu, مَنْ يَقُولُ → may yaqūlu.</li>
  <li><strong>Iqlab</strong>: N vor ب wird als „m“ gesprochen, z.B. مِنْ بَعْدِ → mim baʿdi.</li>
  <li><strong>Ikhfa</strong>: N vor anderen Buchstaben wird nasal/gedämpft ausgesprochen.</li>
</ul>
<p>Bei jeder Frage kannst du optional ein Regel-Audio abspielen (falls vom Admin hinterlegt).</p>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du erkennst die N-Regeln und liest sie korrekt.</p>
</div>
' WHERE level_number = 6;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du die Regeln für <strong>Mīm Sakinah</strong> (مْ):</p>
<ul>
  <li>M wird vor den meisten Buchstaben klar als „m“ ausgesprochen</li>
  <li>Vor ب wird M mit Lippenverschluss (Idgham) gesprochen</li>
  <li>Vor den übrigen Lippenbuchstaben (م و) wird M nasal (Ikhfa) angedeutet</li>
</ul>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du sprichst مْ sauber und kontrolliert aus.</p>
</div>
' WHERE level_number = 7;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du, wann das <strong>Lām in „Allah“</strong> (ٱللّٰهُ) dick bzw. dünn klingt:</p>
<ul>
  <li>Nach <strong>Fatha</strong> oder <strong>Damma</strong> (vorheriger Buchstabe): das L klingt <strong>dick/schwer</strong> (tafkhīm)</li>
  <li>Nach <strong>Kasra</strong>: das L klingt <strong>dünn/leicht</strong> (tarqīq)</li>
</ul>
<p>So sprichst du „Allah“ tajwīd-gerecht aus.</p>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du sagst „Allah“ korrekt aus.</p>
</div>
' WHERE level_number = 8;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du <strong>Qalqalah</strong> – den kurzen „Echo“-Laut bei den Buchstaben <strong>ق ط ب ج د</strong> (Kutb Jadd):</p>
<ul>
  <li>Wenn einer dieser Buchstaben mit Sukūn vorkommt und du stoppst oder eine Pause machst, klingt ein leichter Echo-Nachhall</li>
  <li>Das Echo ist am stärksten, wenn das Wort am Ende gestoppt wird</li>
</ul>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du liest beim Stoppen klar und deutlich.</p>
</div>
' WHERE level_number = 9;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du die <strong>Hamza</strong>-Regeln:</p>
<ul>
  <li><strong>Hamzat al-Qaṭʿ</strong>: wird immer gelesen</li>
  <li><strong>Hamzat al-Waṣl</strong>: wird nur beim <strong>Start</strong> des Wortes gelesen (z.B. am Satzanfang); beim Verbinden mit dem vorherigen Wort fällt das „A“ weg (z.B. بِسْمِ ٱللّٰهِ → bismillāh)</li>
</ul>
<p>So liest du flüssig, ohne falsche Pausen.</p>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du liest Hamza sauber und verbindest Wörter richtig.</p>
</div>
' WHERE level_number = 10;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du <strong>längere Dehnungen</strong> (4–6 Zählzeiten):</p>
<ul>
  <li>Wann Madd Lāzim, Madd Wājib usw. angewendet werden</li>
  <li>Typische Situationen: Hamza nach Dehnung, Stopp am Wortende</li>
  <li>Gleichmäßiges Zählen ohne Übertreibung</li>
</ul>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du liest lange Dehnungen rhythmisch und korrekt.</p>
</div>
' WHERE level_number = 11;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du die <strong>R-Regeln</strong> (ر):</p>
<ul>
  <li>ر wird <strong>dick</strong> (tafkhīm) ausgesprochen bei Fatha, Damma, Sukūn oder Shaddah auf dem Ra</li>
  <li>ر wird <strong>dünn</strong> (tarqīq) ausgesprochen bei Kasra (vor oder nach dem Ra)</li>
</ul>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du liest ر natürlich und korrekt.</p>
</div>
' WHERE level_number = 12;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du <strong>Waqf</strong> – Stoppen und Pausen:</p>
<ul>
  <li>Am Wortende: Endvokale werden beim Stopp zu Sukūn (z.B. -un wird -u dann Stopp)</li>
  <li>Wann man nicht stoppen darf, damit der Sinn erhalten bleibt</li>
  <li>Typische Stoppsymbole im Mushaf</li>
</ul>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du stoppst richtig und liest flüssig.</p>
</div>
' WHERE level_number = 13;
