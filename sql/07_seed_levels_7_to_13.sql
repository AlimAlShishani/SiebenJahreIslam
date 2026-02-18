-- ═══════════════════════════════════════════════════════════════════════════
-- 07_seed_levels_7_to_13.sql – Lerninhalte (Quiz-Items) für Stufen 7–13
-- level_id = learning_levels.level_number. Einmal ausführen nach 02_levels_and_items.
-- ═══════════════════════════════════════════════════════════════════════════

DELETE FROM learning_items WHERE level_id BETWEEN 7 AND 13;

INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 7, v.content, v.transliteration, v.order_index, v.options
FROM (VALUES
  -- Iẓhār Shafawī: Mīm Sākinah vor allen Buchstaben außer ب und م
  ('هُمْ فِيهَا','hum fīhā – welche Mim-Regel greift hier?',1,'[
    {"id":"1","text":"Ikhfāʾ Shafawī (2 Harakāt, verdeckt)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Idghām Shafawī (2 Harakāt, verschmolzen)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Iẓhār Shafawī (klar, 1 Haraka/normal)","is_correct":true,"audio_url":null}
  ]'::jsonb),
  ('عَلَيْهِمْ دَرَكَةٌ','ʿalayhim darakatan – Mim vor د (Iẓhār)',2,'[
    {"id":"1","text":"Ikhfāʾ Shafawī (2 Harakāt, verdeckt)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Idghām Shafawī (2 Harakāt, verschmolzen)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Iẓhār Shafawī (klar, 1 Haraka/normal)","is_correct":true,"audio_url":null}
  ]'::jsonb),
  ('أَنْعَمْتَ','anʿamta – Mim vor ت (Iẓhār)',3,'[
    {"id":"1","text":"Ikhfāʾ Shafawī (2 Harakāt, verdeckt)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Idghām Shafawī (2 Harakāt, verschmolzen)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Iẓhār Shafawī (klar, 1 Haraka/normal)","is_correct":true,"audio_url":null}
  ]'::jsonb),
  ('تَمْسَحُونَ','tamsaḥūna – Mim vor س (Iẓhār)',4,'[
    {"id":"1","text":"Ikhfāʾ Shafawī (2 Harakāt, verdeckt)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Idghām Shafawī (2 Harakāt, verschmolzen)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Iẓhār Shafawī (klar, 1 Haraka/normal)","is_correct":true,"audio_url":null}
  ]'::jsonb),

  -- Idghām Shafawī: Mim Sākinah vor م (verschmolzen, 2 Harakāt Ghunnah)
  ('لَهُمْ مَّغْفِرَةٌ','lahum mَّaghfiratun – Mim vor م (Idghām)',5,'[
    {"id":"1","text":"Ikhfāʾ Shafawī (2 Harakāt, verdeckt)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Idghām Shafawī (2 Harakāt, verschmolzen)","is_correct":true,"audio_url":null},
    {"id":"3","text":"Iẓhār Shafawī (klar, 1 Haraka/normal)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('هُمْ مَّسْجِدٌ','hum m-masjidun – Mim vor م (Idghām)',6,'[
    {"id":"1","text":"Ikhfāʾ Shafawī (2 Harakāt, verdeckt)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Idghām Shafawī (2 Harakāt, verschmolzen)","is_correct":true,"audio_url":null},
    {"id":"3","text":"Iẓhār Shafawī (klar, 1 Haraka/normal)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('عَمَّ يَتَسَاءَلُونَ','ʿammā yatasaāalūna – verschmolzenes مْم (Idghām)',7,'[
    {"id":"1","text":"Ikhfāʾ Shafawī (2 Harakāt, verdeckt)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Idghām Shafawī (2 Harakāt, verschmolzen)","is_correct":true,"audio_url":null},
    {"id":"3","text":"Iẓhār Shafawī (klar, 1 Haraka/normal)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('كُنتُمْ مَّا تَعْمَلُونَ','kuntum mā taʿmalūna – Mim vor م (Idghām)',8,'[
    {"id":"1","text":"Ikhfāʾ Shafawī (2 Harakāt, verdeckt)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Idghām Shafawī (2 Harakāt, verschmolzen)","is_correct":true,"audio_url":null},
    {"id":"3","text":"Iẓhār Shafawī (klar, 1 Haraka/normal)","is_correct":false,"audio_url":null}
  ]'::jsonb),

  -- Ikhfāʾ Shafawī: Mim Sākinah vor ب (verdeckt, 2 Harakāt Ghunnah)
  ('هُمْ بِهِ','hum bihi – Mim vor ب (Ikhfāʾ)',9,'[
    {"id":"1","text":"Ikhfāʾ Shafawī (2 Harakāt, verdeckt)","is_correct":true,"audio_url":null},
    {"id":"2","text":"Idghām Shafawī (2 Harakāt, verschmolzen)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Iẓhār Shafawī (klar, 1 Haraka/normal)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('لَهُمْ بِئْسَ','lahum biʾsa – Mim vor ب (Ikhfāʾ)',10,'[
    {"id":"1","text":"Ikhfāʾ Shafawī (2 Harakāt, verdeckt)","is_correct":true,"audio_url":null},
    {"id":"2","text":"Idghām Shafawī (2 Harakāt, verschmolzen)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Iẓhār Shafawī (klar, 1 Haraka/normal)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('عَلَيْهِمْ بِرِزْقٍ','ʿalayhim birizqin – Mim vor ب (Ikhfāʾ)',11,'[
    {"id":"1","text":"Ikhfāʾ Shafawī (2 Harakāt, verdeckt)","is_correct":true,"audio_url":null},
    {"id":"2","text":"Idghām Shafawī (2 Harakāt, verschmolzen)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Iẓhār Shafawī (klar, 1 Haraka/normal)","is_correct":false,"audio_url":null}
  ]'::jsonb),

  -- Wiederholung eines Iẓhār-Beispiels zur Festigung
  ('عَلَيْهِمْ صِرَاطٌ','ʿalayhim ṣirāṭun – Mim vor ص (Iẓhār)',12,'[
    {"id":"1","text":"Ikhfāʾ Shafawī (2 Harakāt, verdeckt)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Idghām Shafawī (2 Harakāt, verschmolzen)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Iẓhār Shafawī (klar, 1 Haraka/normal)","is_correct":true,"audio_url":null}
  ]'::jsonb)
) AS v(content, transliteration, order_index, options);

-- ========== STUFE 8: L in Allah (10 Fragen) ==========
INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 8, v.content, v.transliteration, v.order_index, v.options
FROM (VALUES
  ('ٱللّٰهُ','Allāhu (Fatha davor → L dick)',1,'[{"id":"1","text":"Allāhu (L dick)","is_correct":true,"audio_url":null},{"id":"2","text":"Allāhu (L dünn)","is_correct":false,"audio_url":null},{"id":"3","text":"Illāhu","is_correct":false,"audio_url":null}]'::jsonb),
  ('بِسْمِ ٱللّٰهِ','bismi Llāhi (Kasra davor → L dünn)',2,'[{"id":"1","text":"bismi Llāhi (L dünn)","is_correct":true,"audio_url":null},{"id":"2","text":"bismi Allāhi (L dick)","is_correct":false,"audio_url":null},{"id":"3","text":"bism Allāhi","is_correct":false,"audio_url":null}]'::jsonb),
  ('رَحْمَةِ ٱللّٰهِ','raḥmati Llāhi (Kasra → L dünn)',3,'[{"id":"1","text":"raḥmati Llāhi (dünn)","is_correct":true,"audio_url":null},{"id":"2","text":"raḥmati Allāhi (dick)","is_correct":false,"audio_url":null},{"id":"3","text":"raḥmata Llāhi","is_correct":false,"audio_url":null}]'::jsonb),
  ('وَٱللّٰهُ','wa Llāhu (Damma davor → L dick)',4,'[{"id":"1","text":"wa Llāhu (L dick)","is_correct":true,"audio_url":null},{"id":"2","text":"wa Llāhu (L dünn)","is_correct":false,"audio_url":null},{"id":"3","text":"wa Allāhu","is_correct":false,"audio_url":null}]'::jsonb),
  ('فِي ٱللّٰهِ','fī Llāhi (Kasra → L dünn)',5,'[{"id":"1","text":"fī Llāhi (dünn)","is_correct":true,"audio_url":null},{"id":"2","text":"fī Allāhi (dick)","is_correct":false,"audio_url":null},{"id":"3","text":"fi Llāhi","is_correct":false,"audio_url":null}]'::jsonb),
  ('لِٱللّٰهِ','li Llāhi (Kasra → L dünn)',6,'[{"id":"1","text":"li Llāhi (dünn)","is_correct":true,"audio_url":null},{"id":"2","text":"li Allāhi (dick)","is_correct":false,"audio_url":null},{"id":"3","text":"la Llāhi","is_correct":false,"audio_url":null}]'::jsonb),
  ('عِبَادِ ٱللّٰهِ','ʿibādi Llāhi (Kasra → L dünn)',7,'[{"id":"1","text":"ʿibādi Llāhi (dünn)","is_correct":true,"audio_url":null},{"id":"2","text":"ʿibāda Llāhi","is_correct":false,"audio_url":null},{"id":"3","text":"ʿibādi Allāhi (dick)","is_correct":false,"audio_url":null}]'::jsonb),
  ('قُلِ ٱللّٰهُ','quli Llāhu (Kasra → L dünn)',8,'[{"id":"1","text":"quli Llāhu (dünn)","is_correct":true,"audio_url":null},{"id":"2","text":"qula Llāhu (dick)","is_correct":false,"audio_url":null},{"id":"3","text":"qul Allāhu","is_correct":false,"audio_url":null}]'::jsonb),
  ('تَوَكَّلْتُ عَلَى ٱللّٰهِ','tawakkaltu ʿalā Llāhi (Fatha → L dick)',9,'[{"id":"1","text":"ʿalā Llāhi (L dick)","is_correct":true,"audio_url":null},{"id":"2","text":"ʿalā Llāhi (L dünn)","is_correct":false,"audio_url":null},{"id":"3","text":"ʿalā Allāhi","is_correct":false,"audio_url":null}]'::jsonb),
  ('شَهْرُ ٱللّٰهِ','shahru Llāhi (Damma → L dick)',10,'[{"id":"1","text":"shahru Llāhi (L dick)","is_correct":true,"audio_url":null},{"id":"2","text":"shahri Llāhi (dünn)","is_correct":false,"audio_url":null},{"id":"3","text":"shahr Allāhi","is_correct":false,"audio_url":null}]'::jsonb)
) AS v(content, transliteration, order_index, options);

-- ========== STUFE 9: Qalqalah (10 Fragen) ==========
INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 9, v.content, v.transliteration, v.order_index, v.options
FROM (VALUES
  ('يَخْرُجْ','yakhruj – du stoppst auf جْ. Was passiert?',1,'[
    {"id":"1","text":"Qalqalah (Echo), weil ج Sukūn hat","is_correct":true,"audio_url":null},
    {"id":"2","text":"Kein Qalqalah, weil ج eine Haraka hat","is_correct":false,"audio_url":null},
    {"id":"3","text":"Qalqalah immer, auch mit Haraka","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('قَدْ','qad – du stoppst auf دْ.',2,'[
    {"id":"1","text":"Qalqalah (Echo), weil د Sukūn hat","is_correct":true,"audio_url":null},
    {"id":"2","text":"Kein Qalqalah, weil د eine Haraka hat","is_correct":false,"audio_url":null},
    {"id":"3","text":"Qalqalah immer, auch mit Haraka","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('حَقّ','ḥaqq – ق mit Shaddah beim Stopp',3,'[
    {"id":"1","text":"Qalqalah (Echo), weil im شَدّة ein Sukūn steckt","is_correct":true,"audio_url":null},
    {"id":"2","text":"Kein Qalqalah, weil ق keine Sukūn-Stelle hat","is_correct":false,"audio_url":null},
    {"id":"3","text":"Qalqalah immer, auch mit Haraka","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('رَبْ','rab – du stoppst auf بْ.',4,'[
    {"id":"1","text":"Qalqalah (Echo), weil ب Sukūn hat","is_correct":true,"audio_url":null},
    {"id":"2","text":"Kein Qalqalah, weil ب eine Haraka hat","is_correct":false,"audio_url":null},
    {"id":"3","text":"Qalqalah immer, auch mit Haraka","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('حِجَابٌ','ḥijābun – du stoppst am Wortende.',5,'[
    {"id":"1","text":"Qalqalah beim Stopp, weil ب dann Sukūn bekommt","is_correct":true,"audio_url":null},
    {"id":"2","text":"Kein Qalqalah, auch wenn du stoppst","is_correct":false,"audio_url":null},
    {"id":"3","text":"Qalqalah auch ohne Stopp, mit Tanwīn","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('ٱلْفَلَقِ','al-falaqi – du liest im Fluss weiter.',6,'[
    {"id":"1","text":"Qalqalah, obwohl ق noch Kasra hat","is_correct":false,"audio_url":null},
    {"id":"2","text":"Kein Qalqalah, weil ق noch eine Haraka hat","is_correct":true,"audio_url":null},
    {"id":"3","text":"Qalqalah nur bei ق und ط, egal ob Haraka","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('يَتْلُو','yatlū – ط hat einen Vokal danach.',7,'[
    {"id":"1","text":"Qalqalah, weil ط ein Qalqalah-Buchstabe ist","is_correct":false,"audio_url":null},
    {"id":"2","text":"Kein Qalqalah, weil ط keine Sukūn-Stelle hat","is_correct":true,"audio_url":null},
    {"id":"3","text":"Qalqalah nur am Satzanfang","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('مُبِينٌ','mubīnun – letzter Buchstabe ist نٌ.',8,'[
    {"id":"1","text":"Kein Qalqalah, weil ن kein Qalqalah-Buchstabe ist","is_correct":true,"audio_url":null},
    {"id":"2","text":"Qalqalah beim Stopp auf ن","is_correct":false,"audio_url":null},
    {"id":"3","text":"Qalqalah immer bei Tanwīn","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('وَٱلْفَجْرِ','wal-fajri – du stoppst nicht.',9,'[
    {"id":"1","text":"Qalqalah, weil ج ein Qalqalah-Buchstabe ist","is_correct":false,"audio_url":null},
    {"id":"2","text":"Kein Qalqalah, weil du hier nicht stoppst","is_correct":true,"audio_url":null},
    {"id":"3","text":"Qalqalah immer, wenn ج vorkommt","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('ٱلْفَجْرْ','al-fajr – du stoppst am Ende auf رْ.',10,'[
    {"id":"1","text":"Kein Qalqalah, weil ر kein Qalqalah-Buchstabe ist","is_correct":true,"audio_url":null},
    {"id":"2","text":"Qalqalah, weil am Wortende immer Echo ist","is_correct":false,"audio_url":null},
    {"id":"3","text":"Qalqalah nur bei ر mit Shaddah","is_correct":false,"audio_url":null}
  ]'::jsonb)
) AS v(content, transliteration, order_index, options);

-- ========== STUFE 10: Hamza (10 Fragen) ==========
INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 10, v.content, v.transliteration, v.order_index, v.options
FROM (VALUES
  ('ٱلْحَمْدُ','Wie startest du dieses Wort?',1,'[
    {"id":"1","text":"mit \"a\": al-ḥamdu (Hamzat al-Waṣl im Artikel)","is_correct":true,"audio_url":null},
    {"id":"2","text":"mit \"i\": il-ḥamdu","is_correct":false,"audio_url":null},
    {"id":"3","text":"ohne Hamza: l-ḥamdu","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('ٱلرَّحْمَٰنِ','Wie startest du dieses Wort?',2,'[
    {"id":"1","text":"mit \"a\": ar-raḥmāni","is_correct":true,"audio_url":null},
    {"id":"2","text":"mit \"i\": ir-raḥmāni","is_correct":false,"audio_url":null},
    {"id":"3","text":"ohne Hamza: r-raḥmāni","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('ٱلْعَلِيمُ','Wie startest du dieses Wort?',3,'[
    {"id":"1","text":"mit \"a\": al-ʿalīmu","is_correct":true,"audio_url":null},
    {"id":"2","text":"mit \"i\": il-ʿalīmu","is_correct":false,"audio_url":null},
    {"id":"3","text":"ohne Hamza: l-ʿalīmu","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('ٱهْدِنَا','Wie startest du dieses Wort?',4,'[
    {"id":"1","text":"mit \"i\": ihdinā (3. Buchstabe mit Kasra)","is_correct":true,"audio_url":null},
    {"id":"2","text":"mit \"a\": ahdinā","is_correct":false,"audio_url":null},
    {"id":"3","text":"mit \"u\": uhdinā","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('ٱسْتَعِينُوا','Wie startest du dieses Verb?',5,'[
    {"id":"1","text":"mit \"i\": istaʿīnū","is_correct":true,"audio_url":null},
    {"id":"2","text":"mit \"a\": astaʿīnū","is_correct":false,"audio_url":null},
    {"id":"3","text":"mit \"u\": ustaʿīnū","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('ٱدْخُلُوا','Wie startest du dieses Verb?',6,'[
    {"id":"1","text":"mit \"u\": udkhulū (3. Buchstabe mit Damma)","is_correct":true,"audio_url":null},
    {"id":"2","text":"mit \"a\": adkhulū","is_correct":false,"audio_url":null},
    {"id":"3","text":"mit \"i\": idkhulū","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('ٱقْرَأْ','iqraʾ – welche Hamza-Art ist das?',7,'[
    {"id":"1","text":"Hamzat al-Qaṭʿ (immer gelesen)","is_correct":true,"audio_url":null},
    {"id":"2","text":"Hamzat al-Waṣl (nur beim Start)","is_correct":false,"audio_url":null},
    {"id":"3","text":"keine Hamza, nur Alif","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('فَٱعْلَمْ','fa-iʿlam – wie liest du im Fluss?',8,'[
    {"id":"1","text":"faʿlam (Hamzat al-Waṣl fällt weg)","is_correct":true,"audio_url":null},
    {"id":"2","text":"fa-aʿlam (A bleibt)","is_correct":false,"audio_url":null},
    {"id":"3","text":"f-ʿlam (ohne Vokal auf ف)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('وَٱلصَّافَّاتِ','waṣ-ṣāffāt – wie liest du im Fluss?',9,'[
    {"id":"1","text":"waṣ-ṣāffāt (ohne zusätzliches \"a\" am Anfang)","is_correct":true,"audio_url":null},
    {"id":"2","text":"wa aṣ-ṣāffāt","is_correct":false,"audio_url":null},
    {"id":"3","text":"wṣ-ṣāffāt","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('بِسْمِ ٱللّٰهِ','bismi Llāh – was passiert mit Hamzat al-Waṣl in „ٱللّٰهِ“?',10,'[
    {"id":"1","text":"Sie fällt nach \"bismi\" weg: bismillāh","is_correct":true,"audio_url":null},
    {"id":"2","text":"Sie bleibt: bismi allāh","is_correct":false,"audio_url":null},
    {"id":"3","text":"Sie wird zu Hamzat al-Qaṭʿ","is_correct":false,"audio_url":null}
  ]'::jsonb)
) AS v(content, transliteration, order_index, options);

-- ========== STUFE 11: Fortgeschrittene Dehnung (10 Fragen) ==========
INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 11, v.content, v.transliteration, v.order_index, v.options
FROM (VALUES
  ('الضَّآلِّينَ','Welche Madd-Regel ist das?',1,'[
    {"id":"1","text":"Madd Lāzim (6H)","is_correct":true,"audio_url":null},
    {"id":"2","text":"Madd Wājib (4/5H)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Madd mit 2H (normal)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('الصَّآخَّةُ','Welche Madd-Regel ist das?',2,'[
    {"id":"1","text":"Madd Lāzim (6H)","is_correct":true,"audio_url":null},
    {"id":"2","text":"Madd Wājib (4/5H)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Madd mit 2H (normal)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('جَاءٓ','Welche Madd-Regel ist das?',3,'[
    {"id":"1","text":"Madd Lāzim (6H)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Madd Wājib (4/5H)","is_correct":true,"audio_url":null},
    {"id":"3","text":"Madd mit 2H (normal)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('السَّمَآءِ','Welche Madd-Regel ist das?',4,'[
    {"id":"1","text":"Madd Lāzim (6H)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Madd Wājib (4/5H)","is_correct":true,"audio_url":null},
    {"id":"3","text":"Madd mit 2H (normal)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('شَاءٓ','Welche Madd-Regel ist das?',5,'[
    {"id":"1","text":"Madd Lāzim (6H)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Madd Wājib (4/5H)","is_correct":true,"audio_url":null},
    {"id":"3","text":"Madd mit 2H (normal)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('قَالَ','Welche Madd-Regel ist das?',6,'[
    {"id":"1","text":"Madd Lāzim (6H)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Madd Wājib (4/5H)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Madd mit 2H (normal)","is_correct":true,"audio_url":null}
  ]'::jsonb),
  ('قِيلَ','Welche Madd-Regel ist das?',7,'[
    {"id":"1","text":"Madd Lāzim (6H)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Madd Wājib (4/5H)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Madd mit 2H (normal)","is_correct":true,"audio_url":null}
  ]'::jsonb),
  ('نُورٌ','Welche Madd-Regel ist das?',8,'[
    {"id":"1","text":"Madd Lāzim (6H)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Madd Wājib (4/5H)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Madd mit 2H (normal)","is_correct":true,"audio_url":null}
  ]'::jsonb),
  ('الْقُرْآنُ','Welche Madd-Regel ist das?',9,'[
    {"id":"1","text":"Madd Lāzim (6H)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Madd Wājib (4/5H)","is_correct":true,"audio_url":null},
    {"id":"3","text":"Madd mit 2H (normal)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('ءَانَ','Welche Madd-Regel ist das?',10,'[
    {"id":"1","text":"Madd Lāzim (6H)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Madd Wājib (4/5H)","is_correct":true,"audio_url":null},
    {"id":"3","text":"Madd mit 2H (normal)","is_correct":false,"audio_url":null}
  ]'::jsonb)
) AS v(content, transliteration, order_index, options);

-- ========== STUFE 12: R-Regeln (10 Fragen) ==========
INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 12, v.content, v.transliteration, v.order_index, v.options
FROM (VALUES
  ('رَبُّ','rabb – wie wird ر gelesen?',1,'[
    {"id":"1","text":"Tafkhīm (dick)","is_correct":true,"audio_url":null},
    {"id":"2","text":"Tarqīq (dünn)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Madd Ya (dünn)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('رِزْقٍ','rizqin – wie wird ر gelesen?',2,'[
    {"id":"1","text":"Tafkhīm (dick)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Tarqīq (dünn)","is_correct":true,"audio_url":null},
    {"id":"3","text":"Madd Ya (dünn)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('فِرْعَوْنَ','firʿawn – wie wird ر gelesen?',3,'[
    {"id":"1","text":"Tafkhīm (dick)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Tarqīq (dünn)","is_correct":true,"audio_url":null},
    {"id":"3","text":"Madd Ya (dünn)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('حِجْرٌ','ḥijrun – wie wird ر gelesen?',4,'[
    {"id":"1","text":"Tafkhīm (dick)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Tarqīq (dünn)","is_correct":true,"audio_url":null},
    {"id":"3","text":"Madd Ya (dünn)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('قَدِيرٌ','qadīrun – wie wird ر gelesen?',5,'[
    {"id":"1","text":"Tafkhīm (dick)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Tarqīq (dünn)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Madd Ya (dünn)","is_correct":true,"audio_url":null}
  ]'::jsonb),
  ('رِيحًا','rīḥan – wie wird ر gelesen?',6,'[
    {"id":"1","text":"Tafkhīm (dick)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Tarqīq (dünn)","is_correct":true,"audio_url":null},
    {"id":"3","text":"Madd Ya (dünn)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('رُحَمَاءُ','ruḥamāʾu – wie wird ر gelesen?',7,'[
    {"id":"1","text":"Tafkhīm (dick)","is_correct":true,"audio_url":null},
    {"id":"2","text":"Tarqīq (dünn)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Madd Ya (dünn)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('الْعَصْرِ','al-ʿaṣri – wie wird ر gelesen?',8,'[
    {"id":"1","text":"Tafkhīm (dick)","is_correct":true,"audio_url":null},
    {"id":"2","text":"Tarqīq (dünn)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Madd Ya (dünn)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('بَرْقٌ','barqun – wie wird ر gelesen?',9,'[
    {"id":"1","text":"Tafkhīm (dick)","is_correct":true,"audio_url":null},
    {"id":"2","text":"Tarqīq (dünn)","is_correct":false,"audio_url":null},
    {"id":"3","text":"Madd Ya (dünn)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('غَفُورٌ رَّحِيمٌ','ghafūrun raḥīmun – wie wird ر in رَّحِيمٌ gelesen?',10,'[
    {"id":"1","text":"Tafkhīm (dick)","is_correct":false,"audio_url":null},
    {"id":"2","text":"Tarqīq (dünn)","is_correct":true,"audio_url":null},
    {"id":"3","text":"Madd Ya (dünn)","is_correct":false,"audio_url":null}
  ]'::jsonb)
) AS v(content, transliteration, order_index, options);

-- ========== STUFE 13: Waqf / Stoppen & Pausen (10 Fragen) ==========
INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 13, v.content, v.transliteration, v.order_index, v.options
FROM (VALUES
  ('ٱلرَّحِيمِ','Wie sprichst du beim Stopp?',1,'[
    {"id":"1","text":"ar-raḥīm (Mīm mit Sukūn, Kasra fällt weg)","is_correct":true,"audio_url":null},
    {"id":"2","text":"ar-raḥīmi (Kasra bleibt)","is_correct":false,"audio_url":null},
    {"id":"3","text":"ar-raḥīma","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('ٱلْعَلِيمُ','Wie sprichst du beim Stopp?',2,'[
    {"id":"1","text":"al-ʿalīm (Mīm mit Sukūn)","is_correct":true,"audio_url":null},
    {"id":"2","text":"al-ʿalīmu (mit Damma)","is_correct":false,"audio_url":null},
    {"id":"3","text":"al-ʿalīma","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('ٱلْحَكِيمُ','Wie sprichst du beim Stopp?',3,'[
    {"id":"1","text":"al-ḥakīm (Mīm mit Sukūn)","is_correct":true,"audio_url":null},
    {"id":"2","text":"al-ḥakīmu","is_correct":false,"audio_url":null},
    {"id":"3","text":"al-ḥakīmi","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('رَبَّنَا','Wie sprichst du beim Stopp auf diesem Wort?',4,'[
    {"id":"1","text":"rabbanā (Ende bleibt, nur leichte Iskān)","is_correct":true,"audio_url":null},
    {"id":"2","text":"rabban (Ende abgeschnitten)","is_correct":false,"audio_url":null},
    {"id":"3","text":"rabbana (ohne Verlängerung)","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('مَلِكِ','Wie sprichst du beim Stopp?',5,'[
    {"id":"1","text":"malik (Kaf mit Sukūn)","is_correct":true,"audio_url":null},
    {"id":"2","text":"maliki (Kasra bleibt)","is_correct":false,"audio_url":null},
    {"id":"3","text":"maliku","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('رَحْمَةٌ','Wie sprichst du beim Stopp?',6,'[
    {"id":"1","text":"raḥmah (ة wird zu h, Tanwīn fällt weg)","is_correct":true,"audio_url":null},
    {"id":"2","text":"raḥmatun (Tanwīn bleibt)","is_correct":false,"audio_url":null},
    {"id":"3","text":"raḥmatan","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('هُدًى','Wie sprichst du beim Stopp?',7,'[
    {"id":"1","text":"hudā (Tanwīn Fatha → langes ā)","is_correct":true,"audio_url":null},
    {"id":"2","text":"hudan","is_correct":false,"audio_url":null},
    {"id":"3","text":"huda","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('نَعِيمٌ','Wie sprichst du beim Stopp?',8,'[
    {"id":"1","text":"naʿīm (Mīm mit Sukūn, Tanwīn fällt weg)","is_correct":true,"audio_url":null},
    {"id":"2","text":"naʿīmun (mit Tanwīn)","is_correct":false,"audio_url":null},
    {"id":"3","text":"naʿīmin","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('ٱلصِّرَاطَ','Wie sprichst du beim Stopp?',9,'[
    {"id":"1","text":"aṣ-ṣirāṭ (Ṭāʾ mit Sukūn)","is_correct":true,"audio_url":null},
    {"id":"2","text":"aṣ-ṣirāṭa (mit Fatha)","is_correct":false,"audio_url":null},
    {"id":"3","text":"aṣ-ṣirāṭi","is_correct":false,"audio_url":null}
  ]'::jsonb),
  ('ٱلْمُسْتَقِيمَ','Wie sprichst du beim Stopp?',10,'[
    {"id":"1","text":"al-mustaqīm (Mīm mit Sukūn)","is_correct":true,"audio_url":null},
    {"id":"2","text":"al-mustaqīma (mit Fatha)","is_correct":false,"audio_url":null},
    {"id":"3","text":"al-mustaqīmu","is_correct":false,"audio_url":null}
  ]'::jsonb)
) AS v(content, transliteration, order_index, options);
