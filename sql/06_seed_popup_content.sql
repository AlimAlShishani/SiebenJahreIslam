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
  <li>Was <strong>Harakāt</strong> sind: kleine „Zählschritte“ für die Länge – <strong>1 Haraka</strong> entspricht ungefähr der normalen Länge eines kurzen Vokals.</li>
  <li>Wann ein Laut <strong>länger gezogen</strong> wird: wenn nach einem Vokal ein <strong>Alif</strong>, <strong>Waw</strong> oder <strong>Ya</strong> ohne eigenes Vokalzeichen folgt</li>
  <li>Beispiele: بَا bā, تِي tī, نُو nū, قَالَ qāla, نُور nūr</li>
  <li>Grund-Dehnung: meist etwa <strong>2 Harakāt</strong> (2 Zählzeiten)</li>
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
<p>In diesem Kapitel lernst du die Regeln für <strong>Mīm Sākinah (مْ)</strong>:</p>
<ul>
  <li><strong>Vor allen Buchstaben außer ب und م</strong> wird das Mīm <strong>klar</strong> als „m“ ausgesprochen – das nennt man <strong>Iẓhār Shafawī</strong> (normale Länge, ca. 1 Haraka).</li>
  <li><strong>Vor م</strong> wird das Mīm <strong>verschmolzen</strong> ausgesprochen, also wie ein langes „mm“ mit <strong>Ghunnah</strong> (Nasalton) für ca. <strong>2 Harakāt</strong> – das nennt man <strong>Idghām Shafawī / Idghām Mithlayn</strong>. Beispiel: <strong>لَهُمْ مَّغْفِرَةٌ</strong>.</li>
  <li><strong>Vor ب</strong> wird das Mīm <strong>verdeckt</strong> ausgesprochen, ebenfalls mit <strong>Ghunnah</strong> für ca. <strong>2 Harakāt</strong>, während die Lippen schon für das ب vorbereitet bleiben – das nennt man <strong>Ikhfāʾ Shafawī</strong>. Beispiel: <strong>هُمْ بِهِ</strong>.</li>
</ul>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du erkennst Mīm-Sākinah-Stellen sicher und liest sie mit der passenden Regel.</p>
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
  <li>Qalqalah entsteht nur, wenn einer dieser Buchstaben ein <strong>Sukūn</strong> hat – entweder geschrieben (z.B. <strong>يَخْرُجْ</strong>) oder weil du am Wortende stoppst und die Haraka wegfällt.</li>
  <li>Solange der Buchstabe noch <strong>Fatha, Kasra oder Damma</strong> hat und du <strong>nicht stoppst</strong>, gibt es <strong>keine</strong> Qalqalah.</li>
  <li>Das Echo ist am stärksten, wenn das Wort am Ende einer Āya gestoppt wird.</li>
</ul>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du erkennst, wann Qalqalah eingesetzt wird und liest beim Stoppen klar und deutlich.</p>
</div>
' WHERE level_number = 9;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du die <strong>Hamza</strong>-Regeln:</p>
<ul>
  <li><strong>Hamzat al-Qaṭʿ</strong>: wird <strong>immer</strong> gelesen – egal ob du startest oder verbindest (z.B. <strong>أَنْعَمْتَ</strong>, <strong>يَسْأَلُونَ</strong>).</li>
  <li><strong>Hamzat al-Waṣl</strong>: wird nur beim <strong>Start</strong> des Wortes gelesen. Beim Verbinden mit dem vorherigen Wort fällt dieser Laut weg (z.B. بِسْمِ ٱللّٰهِ → <strong>bismillāh</strong>, ohne extra „a“ am Anfang).</li>
  <li>Beim Start hängt der Vokal von <strong>Hamzat al-Waṣl</strong> vom Wort ab:
    <ul>
      <li>Beim bestimmten Artikel <strong>ٱلـ</strong> wird es immer als <strong>„a“</strong> gelesen: <strong>ٱلْكِتَابُ</strong> → <strong>al-kitābu</strong>.</li>
      <li>Bei vielen Verben gilt: ist der dritte Buchstabe des Verbs mit <strong>Kasra</strong> vokalisiert, startest du mit <strong>„i“</strong> (z.B. <strong>ٱهْدِنَا</strong> → <strong>ihdinā</strong>); bei <strong>Damma</strong> startest du mit <strong>„u“</strong> (z.B. <strong>ٱدْخُلُوا</strong> → <strong>udkhulū</strong>), sonst meist mit <strong>„a“</strong>.</li>
    </ul>
  </li>
</ul>
<p>So liest du flüssig, ohne falsche Starts und Unterbrechungen.</p>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du liest Hamza sauber, kennst Hamzat al-Qaṭʿ und Hamzat al-Waṣl und setzt die richtigen Startvokale (a / i / u).</p>
</div>
' WHERE level_number = 10;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du die Regeln für <strong>Madd Lāzim (مدّ لازم)</strong> und <strong>Madd Wājib (مدّ واجب)</strong>:</p>
<p><strong>Erinnerung:</strong> <em>Harakāt</em> sind kleine „Zählschritte“ – 1 Haraka entspricht ungefähr der Länge eines kurzen Vokals.</p>
<ul>
  <li><strong>Madd Lāzim</strong> bedeutet: Ein <strong>Madd-Buchstabe</strong> (ا، و، ي) wird verlängert, weil danach eine <strong>Shaddah (ّ)</strong> kommt (in der Shaddah steckt ein festes Sukūn).<br/>
    ➝ Man verlängert <strong>immer 6 Harakāt</strong>.<br/>
    <strong>Beispiel:</strong> <strong>الضَّآلِّينَ</strong>.
  </li>
  <li><strong>Madd Wājib (Madd Wājib Muttasil)</strong> bedeutet: Ein <strong>Madd-Buchstabe</strong> kommt und direkt danach folgt ein <strong>Hamzah (ء)</strong> im <strong>gleichen Wort</strong>.<br/>
    ➝ Man verlängert <strong>4–5 Harakāt</strong>.<br/>
    <strong>Beispiel:</strong> <strong>جَاءٓ</strong>.
  </li>
</ul>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du erkennst Madd Lāzim und Madd Wājib sicher und kannst sie mit der passenden Länge (2 / 4–5 / 6 Harakāt) lesen.</p>
</div>
' WHERE level_number = 11;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du die Regeln für <strong>Rā (ر)</strong>:</p>
<ul>
  <li><strong>Rā mit Kasra</strong> wird <strong>leicht/dünn</strong> ausgesprochen (<strong>Tarqīq</strong>).<br/>
    <strong>Beispiel:</strong> <strong>رِيحًا</strong>.
  </li>
  <li><strong>Rā sākin (رْ) nach einem Buchstaben mit Kasra</strong> wird <strong>dünn</strong> ausgesprochen.<br/>
    <strong>Beispiel:</strong> <strong>فِرْعَوْنَ</strong>.
  </li>
  <li><strong>Rā sākin (رْ), wenn zwei Buchstaben davor eine Kasra haben</strong>, wird ebenfalls <strong>dünn</strong> ausgesprochen.<br/>
    <strong>Beispiel:</strong> <strong>حِجْرٌ</strong>.
  </li>
  <li><strong>Rā sākin (رْ) nach einem Yā, das die vorherige Kasra verlängert</strong>, wird auch <strong>dünn</strong> ausgesprochen.<br/>
    <strong>Beispiel:</strong> <strong>قَدِيرٌ</strong>.
  </li>
  <li><strong>Alle anderen Fälle</strong>, z. B. Rā mit <strong>Fatha</strong> oder <strong>Damma</strong>, oder Rā sākin nach Fatha/Damma → Rā wird <strong>dick</strong> ausgesprochen (<strong>Tafkhīm</strong>).<br/>
    <strong>Beispiele:</strong> <strong>رَبّ – بَرْق – الْعَصْر</strong>.
  </li>
</ul>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du erkennst, wann ر dünn oder dick gelesen wird, und kannst besondere Fälle mit Madd-Ya sicher zuordnen.</p>
</div>
' WHERE level_number = 12;

UPDATE learning_levels SET modal_content = '
<p>In diesem Kapitel lernst du die <strong>Waqf-Regeln</strong> – richtiges Stoppen und Pausieren im Qurʾān:</p>
<p>Waqf regelt, wo du anhalten darfst und wie sich die Aussprache am Wortende verändert, damit der Sinn erhalten bleibt.</p>
<ul>
  <li><strong>Grundprinzip beim Stoppen</strong>:
    <ul>
      <li><strong>Iskān</strong>: Der letzte Buchstabe wird beim Stopp <strong>vokallos</strong> (Sukūn), auch wenn er vorher eine Haraka hatte.</li>
      <li><strong>Ibdāl</strong>: Tanwīn mit Fatha (<strong>ـً</strong>) wird beim Stopp zu einem langen <strong>Alif</strong>, z.B. <strong>هُدًى</strong> → <strong>هُدَا</strong> (hudā).</li>
      <li><strong>Tāʾ marbūṭa (ة)</strong>: wird beim Stopp als <strong>h</strong> ausgesprochen, z.B. <strong>رَحْمَةٌ</strong> → <strong>رَحْمَهْ</strong> (raḥmah).</li>
    </ul>
  </li>
  <li><strong>Wichtige Waqf-Arten</strong>:
    <ul>
      <li><strong>Waqf Tam</strong>: Vollständiger Halt am Ende eines Sinnabschnitts (oft auch Versende).</li>
      <li><strong>Waqf Kāfī</strong>: Sinn ist im Großen und Ganzen vollständig, aber grammatisch gibt es noch Verbindung.</li>
      <li><strong>Waqf Ḥasan</strong>: Halt ist gut, Weiterlesen ist aber besser.</li>
      <li><strong>Waqf Qabīḥ</strong>: Schlechter Halt, der den Sinn verfälscht – sollte vermieden werden.</li>
    </ul>
  </li>
  <li><strong>Wichtige Stoppzeichen im Muṣḥaf</strong>:
    <ul>
      <li><strong>مـ</strong> (Waqf Lāzim): hier <strong>muss</strong> gestoppt werden.</li>
      <li><strong>ط</strong> (Waqf Muṭlaq): starker Stopp wird empfohlen.</li>
      <li><strong>ج</strong> (Waqf Jaʾiz): Stopp ist erlaubt, Weiterlesen auch gut.</li>
      <li><strong>لا</strong> (Lā Waqf): hier <strong>solltest du nicht stoppen</strong>, weil der Satz weitergeht.</li>
      <li><strong>س / سكتة</strong>: sehr kurze Pause ohne Atmen.</li>
    </ul>
  </li>
</ul>
<div style="background:#ecfdf5;padding:1rem;border-radius:0.5rem;margin-top:1rem;">
  <p style="font-weight:bold;color:#065f46;">Ziel:</p>
  <p>Du kennst die wichtigsten Waqf-Zeichen, stoppst an sinnvollen Stellen und sprichst die Wortenden beim Stopp korrekt aus.</p>
</div>
' WHERE level_number = 13;
