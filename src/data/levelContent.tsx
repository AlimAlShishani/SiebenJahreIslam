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
          <li>Wann ein Laut länger gezogen wird (Alif, Waw, Ya ohne Vokal)</li>
          <li>Grund-Dehnung (meist 2 Zählzeiten)</li>
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
        <p>In diesem Kapitel lernst du:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>M-Laut klar aussprechen</li>
          <li>M mit Nasenton aussprechen</li>
          <li>M verschmelzen lassen, wenn nötig</li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du sprichst مْ sauber und kontrolliert aus.</p>
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
          <li>Welche Buchstaben beim Stoppen einen kurzen „Echo-Sound“ bekommen</li>
          <li>Wie dieser Echo-Laut klingt</li>
          <li>Dass das Echo stärker wird, wenn das Wort am Ende gestoppt wird</li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du liest beim Stoppen klar und deutlich.</p>
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
          <li>Wann Hamza immer gelesen wird (Hamzatul Qat')</li>
          <li>Wann Hamza nur beim Start gelesen wird (Hamzatul Wasl)</li>
          <li>Wie man Wörter flüssig verbindet, ohne falsche Starts</li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du liest Hamza sauber, flüssig und ohne Unterbrechungen.</p>
        </div>
      </div>
    )
  },
  11: {
    title: "Fortgeschrittene Dehnung",
    description: "Längere Madd-Regeln (4-6 Zählzeiten)",
    modalContent: (
      <div className="space-y-4">
        <p>In diesem Kapitel lernst du:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Wann man 4 oder 6 Zählzeiten dehnt (Madd Lazim, Madd Wajib, etc.)</li>
          <li>Typische Situationen: Hamza nach Dehnung, Stopp am Wortende</li>
          <li>Gleichmäßiges Zählen ohne Übertreiben</li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du kannst lange Dehnungen rhythmisch und korrekt lesen.</p>
        </div>
      </div>
    )
  },
  12: {
    title: "R-Regeln",
    description: "Wann Ra dick oder dünn ist",
    modalContent: (
      <div className="space-y-4">
        <p>In diesem Kapitel lernst du:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Wann ر schwer/dick ausgesprochen wird (meist bei Fatha/Damma)</li>
          <li>Wann ر leicht/dünn ausgesprochen wird (meist bei Kasra)</li>
          <li>Häufige Fehler vermeiden</li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du liest ر korrekt und arabisch „natürlich“.</p>
        </div>
      </div>
    )
  },
  13: {
    title: "Stoppen & Pausen",
    description: "Waqf-Regeln",
    modalContent: (
      <div className="space-y-4">
        <p>In diesem Kapitel lernst du:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Wie man korrekt am Wortende stoppt (Vokale werden zu Sukun etc.)</li>
          <li>Wie Endungen sich beim Stoppen verändern</li>
          <li>Wann man nicht stoppen darf, damit der Sinn korrekt bleibt</li>
          <li>Typische Stoppsymbole im Mushaf</li>
        </ul>
        <div className="bg-emerald-50 p-4 rounded-lg mt-4">
          <p className="font-bold text-emerald-800">Ziel:</p>
          <p>Du stoppst richtig, liest flüssig und verständlich.</p>
        </div>
      </div>
    )
  }
};
