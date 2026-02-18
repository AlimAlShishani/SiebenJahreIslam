import React from 'react';

export interface LevelContent {
  title: string;
  description: string;
  modalContent: React.ReactNode;
}

export const levelContents: Record<number, LevelContent> = {
  1: {
    title: "Buchstaben richtig aussprechen",
    description: "Lerne die Aussprache-Grundlagen",
    modalContent: (
      <div className="space-y-4">
        <p>In diesem Kapitel lernst du:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Wo jeder Buchstabe ausgesprochen wird (Hals, Zunge, Lippen)</li>
          <li>Unterschiede zwischen ähnlichen Buchstaben (z.B. س / ص, ت / ط)</li>
          <li>Welche Buchstaben „weich“ und welche „stark“ klingen</li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du kannst jeden Buchstaben klar und korrekt aussprechen.</p>
        </div>
      </div>
    )
  },
  2: {
    title: "Harakāt – kurze Vokale",
    description: "Fatha (a), Kasra (i), Damma (u)",
    modalContent: (
      <div className="space-y-4">
        <p>In diesem Kapitel lernst du:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Fatha (a) - Strich oben</li>
          <li>Kasra (i) - Strich unten</li>
          <li>Damma (u) - Kringel oben</li>
          <li>Wie man Buchstaben flüssig mit Vokalen verbindet</li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du kannst kurze Vokale sicher und flüssig lesen.</p>
        </div>
      </div>
    )
  },
  3: {
    title: "Sukūn – Buchstaben ohne Vokal",
    description: "Lerne stille Buchstaben zu lesen",
    modalContent: (
      <div className="space-y-4">
        <p>In diesem Kapitel lernst du:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Dass Sukūn (kleiner Kreis) bedeutet, dass ein Buchstabe still bleibt</li>
          <li>Wie man Buchstaben mit Sukūn korrekt liest, ohne extra Laut</li>
          <li>Typische Fehler vermeiden (z.B. fälschlich ein „a/i/u“ hinzufügen)</li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du liest stille Buchstaben sauber und korrekt.</p>
        </div>
      </div>
    )
  },
  4: {
    title: "Shaddah – Doppelbuchstaben",
    description: "Verdopplung und Stärkung von Buchstaben",
    modalContent: (
      <div className="space-y-4">
        <p>In diesem Kapitel lernst du:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Dass Shaddah (w-förmiges Zeichen) bedeutet, ein Buchstabe wird verdoppelt/gestärkt</li>
          <li>Wie man Shaddah hört und richtig ausspricht</li>
          <li>Wie man Shaddah beim Lesen erkennt und flüssig liest</li>
          <li><strong>Tanwin</strong> (ـٌ ـٍ ـً): Die Doppelvokal-Zeichen am Wortende werden als „-un“, „-in“ oder „-an“ gelesen (z. B. جَنَّةٌ → jannatun, مُحَمَّدٌ → muḥammadun). Sie werden erst in späteren Stufen vertieft – hier reicht es, sie als Endung zu erkennen.</li>
          <li><strong>ة (Tāʾ marbūṭa)</strong>: Wird am Wortende als „h“ ausgesprochen, wenn man stoppt; beim Weiterlesen als „t“. Beim ersten Vorkommen kannst du im Quiz die „Hilfe“-Audio (falls vom Admin hinterlegt) abspielen.</li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du liest Wörter mit Shaddah klar und kraftvoll, wie im Qur’an.</p>
        </div>
      </div>
    )
  },
  5: {
    title: "Dehnung (Grundregel)",
    description: "Wann Laute länger gezogen werden",
    modalContent: (
      <div className="space-y-4">
        <p>In diesem Kapitel lernst du:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            Was <strong>Harakāt</strong> sind: kleine „Zählschritte“ für die Länge –{" "}
            <strong>1 Haraka</strong> entspricht ungefähr der normalen Länge eines kurzen Vokals.
          </li>
          <li>Wann ein Laut länger gezogen wird (Alif, Waw, Ya ohne Vokal)</li>
          <li>Grund-Dehnung (meist 2 Harakāt / Zählzeiten)</li>
          <li>Häufige Fehler vermeiden: zu kurz oder zu lang lesen</li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du liest Dehnungen stabil und richtig.</p>
        </div>
      </div>
    )
  },
  6: {
    title: "Regeln beim N-Laut",
    description: "Nun Sakinah und Tanwin",
    modalContent: (
      <div className="space-y-4">
        <p>In diesem Kapitel lernst du:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li><strong>Izhar</strong>: N (نْ oder Tanwin) vor „Halsbuchstaben“ (ء ه ع ح غ خ) wird klar als „n“ ausgesprochen, z. B. مِنْ هَادٍ → min hādin.</li>
          <li><strong>Idgham</strong>: N verschmilzt mit dem nächsten Buchstaben (ي ن م و ل ر), z. B. مِنْ لَدُنْهُ → mil ladunhu (n wird zu l), مَنْ يَقُولُ → may yaqūlu (n wird zu y).</li>
          <li><strong>Iqlab</strong>: N vor ب wird als „m“ gesprochen, z. B. مِنْ بَعْدِ → mim baʿdi.</li>
          <li><strong>Ikhfa</strong>: N vor anderen Buchstaben wird nasal/gedämpft gesprochen (z. B. vor ت، د، ق).</li>
        </ul>
        <p className="text-sm text-gray-600">Bei jeder Frage kannst du optional ein Audio zur jeweiligen Regel abspielen (falls vom Admin hinterlegt).</p>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du kannst N-Regeln automatisch erkennen und korrekt lesen.</p>
        </div>
      </div>
    )
  },
  7: {
    title: "Regeln beim M-Laut",
    description: "Mim Sakinah Regeln",
    modalContent: (
      <div className="space-y-4">
        <p>
          In diesem Kapitel lernst du die Regeln für <strong>Mīm Sākinah (مْ)</strong>:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>Vor allen Buchstaben außer ب und م</strong> wird das Mīm <strong>klar</strong>{" "}
            als „m“ ausgesprochen – das nennt man <strong>Iẓhār Shafawī</strong> (normale Länge, ca.
            1 Haraka).
          </li>
          <li>
            <strong>Vor م</strong> wird das Mīm <strong>verschmolzen</strong> ausgesprochen, also
            wie ein langes „mm“ mit <strong>Ghunnah</strong> (Nasalton) für ca.{" "}
            <strong>2 Harakāt</strong> – das nennt man{" "}
            <strong>Idghām Shafawī / Idghām Mithlayn</strong>. Beispiel:{" "}
            <strong>لَهُمْ مَّغْفِرَةٌ</strong>.
          </li>
          <li>
            <strong>Vor ب</strong> wird das Mīm <strong>verdeckt</strong> ausgesprochen, ebenfalls
            mit <strong>Ghunnah</strong> für ca. <strong>2 Harakāt</strong>, während die Lippen
            schon für das ب vorbereitet bleiben – das nennt man <strong>Ikhfāʾ Shafawī</strong>.
            Beispiel: <strong>هُمْ بِهِ</strong>.
          </li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du erkennst Mim-Sākinah-Stellen sicher und liest sie mit der passenden Regel.</p>
        </div>
      </div>
    )
  },
  8: {
    title: "Das harte „L“ in Allah",
    description: "Wann Allah dick oder dünn ausgesprochen wird",
    modalContent: (
      <div className="space-y-4">
        <p>In diesem Kapitel lernst du:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Wann das ل in „Allah“ dick/schwer klingt (nach Fatha/Damma)</li>
          <li>Wann es dünn/leicht klingt (nach Kasra)</li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du sagst „Allah“ tajwīd-korrekt.</p>
        </div>
      </div>
    )
  },
  9: {
    title: "Echo-Buchstaben (Qalqalah)",
    description: "Kutb Jadd (q, t, b, j, d)",
    modalContent: (
      <div className="space-y-4">
        <p>In diesem Kapitel lernst du:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            Was <strong>Qalqalah</strong> ist – der kurze „Echo“-Laut bei den Buchstaben{" "}
            <strong>ق ط ب ج د</strong> (Kutb Jadd).
          </li>
          <li>
            Dass Qalqalah nur entsteht, wenn einer dieser Buchstaben ein <strong>Sukūn</strong> hat
            – entweder geschrieben (z.B. <strong>يَخْرُجْ</strong>) oder weil du am Wortende
            stoppst und die Haraka wegfällt.
          </li>
          <li>
            Solange der Buchstabe noch <strong>Fatha, Kasra oder Damma</strong> hat und du{" "}
            <strong>nicht stoppst</strong>, gibt es <strong>keine</strong> Qalqalah.
          </li>
          <li>Dass das Echo stärker wird, wenn das Wort am Ende gestoppt wird.</li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du erkennst, wann Qalqalah entsteht, und liest beim Stoppen klar und deutlich.</p>
        </div>
      </div>
    )
  },
  10: {
    title: "Hamza-Regeln",
    description: "Starten & Verbinden (Hamzatul Wasl)",
    modalContent: (
      <div className="space-y-4">
        <p>In diesem Kapitel lernst du:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            Wann Hamza immer gelesen wird (<strong>Hamzat al-Qaṭʿ</strong>).
          </li>
          <li>
            Wann Hamza nur beim Start gelesen wird (<strong>Hamzat al-Waṣl</strong>) und beim
            Verbinden wegfällt.
          </li>
          <li>
            Wie du beim Start den richtigen Vokal für Hamzat al-Waṣl wählst: <strong>a / i / u</strong>{" "}
            (z.B. <strong>ٱلْكِتَابُ</strong> → <strong>al-kitābu</strong>, <strong>ٱهْدِنَا</strong>{" "}
            → <strong>ihdinā</strong>, <strong>ٱدْخُلُوا</strong> → <strong>udkhulū</strong>).
          </li>
          <li>Wie man Wörter flüssig verbindet, ohne falsche Starts.</li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du liest Hamza sauber, setzt Hamzat al-Waṣl mit a / i / u richtig und verbindest Wörter flüssig.</p>
        </div>
      </div>
    )
  },
  11: {
    title: "Fortgeschrittene Dehnung",
    description: "Längere Madd-Regeln (4-6 Zählzeiten)",
    modalContent: (
      <div className="space-y-4">
        <p>
          In diesem Kapitel lernst du die Regeln für <strong>Madd Lāzim (مدّ لازم)</strong> und{" "}
          <strong>Madd Wājib (مدّ واجب)</strong>:
        </p>
        <p className="text-sm text-gray-700">
          <strong>Erinnerung:</strong> <em>Harakāt</em> sind kleine „Zählschritte“ – 1 Haraka
          entspricht ungefähr der Länge eines kurzen Vokals.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>Madd Lāzim</strong>: Ein <strong>Madd-Buchstabe</strong> (ا، و، ي) wird
            verlängert, weil danach eine <strong>Shaddah (ّ)</strong> kommt (in der Shaddah steckt
            ein festes Sukūn).
            <br />
            ➝ Man dehnt <strong>immer 6 Harakāt</strong>.
            <br />
            <strong>Beispiel:</strong> <strong>الضَّآلِّينَ</strong>.
          </li>
          <li>
            <strong>Madd Wājib (Madd Wājib Muttasil)</strong>: Ein <strong>Madd-Buchstabe</strong>{" "}
            kommt und direkt danach folgt ein <strong>Hamzah (ء)</strong> im{" "}
            <strong>gleichen Wort</strong>.
            <br />
            ➝ Man dehnt <strong>4–5 Harakāt</strong>.
            <br />
            <strong>Beispiel:</strong> <strong>جَاءٓ</strong>.
          </li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du erkennst Madd Lāzim und Madd Wājib sicher und kannst sie mit der passenden Länge lesen.</p>
        </div>
      </div>
    )
  },
  12: {
    title: "R-Regeln",
    description: "Wann Ra dick oder dünn ist",
    modalContent: (
      <div className="space-y-4">
        <p>
          In diesem Kapitel lernst du die Regeln für <strong>Rā (ر)</strong>:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>Rā mit Kasra</strong> wird <strong>leicht/dünn</strong> ausgesprochen (
            <strong>Tarqīq</strong>). Beispiel: <strong>رِيحًا</strong>.
          </li>
          <li>
            <strong>Rā sākin (رْ) nach einem Buchstaben mit Kasra</strong> wird{" "}
            <strong>dünn</strong> ausgesprochen. Beispiel: <strong>فِرْعَوْنَ</strong>.
          </li>
          <li>
            <strong>Rā sākin (رْ), wenn zwei Buchstaben davor eine Kasra haben</strong>, wird
            ebenfalls <strong>dünn</strong> ausgesprochen. Beispiel: <strong>حِجْرٌ</strong>.
          </li>
          <li>
            <strong>Rā sākin (رْ) nach einem Yā, das die vorherige Kasra verlängert</strong>, wird
            auch <strong>dünn</strong> ausgesprochen. Beispiel: <strong>قَدِيرٌ</strong>.
          </li>
          <li>
            <strong>Alle anderen Fälle</strong>, z. B. Rā mit Fatha oder Damma oder Rā sākin nach
            Fatha/Damma → Rā wird <strong>dick</strong> ausgesprochen (
            <strong>Tafkhīm</strong>). Beispiele: <strong>رَبّ – بَرْق – الْعَصْر</strong>.
          </li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du erkennst, wann ر dünn oder dick gelesen wird – inklusive der Spezialfälle mit Madd-Ya.</p>
        </div>
      </div>
    )
  },
  13: {
    title: "Stoppen & Pausen",
    description: "Waqf-Regeln",
    modalContent: (
      <div className="space-y-4">
        <p>
          In diesem Kapitel lernst du die <strong>Waqf-Regeln</strong> – also richtiges Stoppen und
          Pausieren im Qurʾān:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>Grundprinzip beim Stoppen:</strong> Am Wortende wird der letzte Buchstabe meist{" "}
            <strong>vokallos (Sukūn)</strong>.
          </li>
          <li>
            <strong>Ibdāl:</strong> Tanwīn mit Fatha (ـً) wird beim Stopp zu einem langen{" "}
            <strong>Alif</strong>, z.B. <strong>هُدًى</strong> → <strong>هُدَا</strong> (hudā).
          </li>
          <li>
            <strong>Tāʾ marbūṭa (ة):</strong> wird beim Stoppen zu einem <strong>h</strong>{" "}
            ausgesprochen, z.B. <strong>رَحْمَةٌ</strong> → <strong>رَحْمَهْ</strong> (raḥmah).
          </li>
          <li>
            Wichtige Waqf-Arten (Tam, Kāfī, Ḥasan, Qabīḥ) zeigen dir, ob ein Halt sinnvoll ist oder
            den Sinn stört.
          </li>
          <li>
            Wichtige Stoppzeichen im Muṣḥaf: <strong>مـ</strong> (Pflichtstopp),{" "}
            <strong>ط</strong> (starker Stopp empfohlen), <strong>ج</strong> (Stopp erlaubt oder
            Weiterlesen), <strong>لا</strong> (hier nicht stoppen), <strong>س/سكتة</strong> (sehr
            kurze Pause ohne Atmen).
          </li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du kennst die wichtigsten Waqf-Zeichen und sprichst Wortenden beim Stopp korrekt aus.</p>
        </div>
      </div>
    )
  }
};
