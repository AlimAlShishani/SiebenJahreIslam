-- ═══════════════════════════════════════════════════════════════════════════
-- 23_seed_madd.sql – Stufe 8: Lange Vokale / Natürliches Madd
-- Nur Abschnitte OHNE Madd Muttassil/Mufassil, OHNE das Wort „الله“.
-- Verschiedene Verse (auch weniger bekannte). correct_madd_indices im Admin anpassbar.
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE learning_levels
SET description = 'Quran-Abschnitt lesen und natürliches Madd markieren. Nur natürliches Madd; keine Verse mit „الله“.'
WHERE level_number = 8;

DELETE FROM learning_items WHERE level_id = 8;

INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
VALUES
  -- 1. تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ (67:1)
  (8, E'\u062A\u064E\u0628\u064E\u0627\u0631\u064E\u0643\u064E \u0627\u064E\u0644\u0651\u064E\u0630\u0650\u064A \u0628\u0650\u064A\u064E\u062F\u0650\u0647\u0650 \u0627\u064E\u0644\u0652\u0645\u064F\u0644\u0652\u0643\u064F', 'tabāraka lladhī bi-yadihi l-mulk', 1, '{"task_type":"madd_click","correct_madd_indices":[2,5,8,10,13]}'),
  -- 2. وَالسَّمَاءِ وَالطَّارِقِ (86:1)
  (8, E'\u0648\u064E\u0627\u064E\u0644\u0652\u0633\u0651\u064E\u0645\u064E\u0627\u0621\u0650 \u0648\u064E\u0627\u064E\u0644\u0652\u0637\u0651\u064E\u0627\u0631\u0650\u0642\u0650', 'wa-s-samāʾi wa-ṭ-ṭāriq', 2, '{"task_type":"madd_click","correct_madd_indices":[1,5,8,11]}'),
  -- 3. الرَّحْمَانِ الرَّحِيمِ مَالِكِ يَوْمِ الدِّينِ
  (8, E'\u0627\u064E\u0644\u0652\u0631\u064E\u0651\u062D\u0652\u0645\u064E\u0627\u0646\u0650 \u0627\u064E\u0644\u0652\u0631\u064E\u0651\u062D\u0650\u064A\u0652\u0645\u0650 \u0645\u064E\u0627\u0644\u0650\u0643\u0650 \u064A\u064E\u0648\u0652\u0645\u0650 \u0627\u064E\u0644\u0652\u062F\u0651\u0650\u064A\u0652\u0646\u0650', 'ar-raḥmāni r-raḥīm māliki yawmi d-dīn', 3, '{"task_type":"madd_click","correct_madd_indices":[5,12,18,21,26]}'),
  -- 4. إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ
  (8, E'\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E \u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064F \u0648\u064E\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E \u0646\u064E\u0633\u0652\u062A\u064E\u0639\u0650\u064A\u0652\u0646\u064F', 'iyyāka naʿbudu wa-iyyāka nastaʿīn', 4, '{"task_type":"madd_click","correct_madd_indices":[1,4,11,14,22]}'),
  -- 5. اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ
  (8, E'\u0627\u064E\u0647\u0652\u062F\u0650\u0646\u064E\u0627 \u0627\u064E\u0644\u0652\u0635\u0651\u0650\u0631\u064E\u0627\u0637\u064E \u0627\u064E\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0642\u0650\u064A\u0652\u0645\u064E', 'ihdinā ṣ-ṣirāṭa l-mustaqīm', 5, '{"task_type":"madd_click","correct_madd_indices":[4,10,11,22]}'),
  -- 6. صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ
  (8, E'\u0635\u0650\u0631\u064E\u0627\u0637\u064E \u0627\u064E\u0644\u0651\u064E\u0630\u0650\u064A\u0652\u0646\u064E \u0623\u064E\u0646\u0652\u0639\u064E\u0645\u0652\u062A\u064E \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652', 'ṣirāṭa lladhīna anʿamta ʿalayhim', 6, '{"task_type":"madd_click","correct_madd_indices":[3,10,18,21]}'),
  -- 7. غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ
  (8, E'\u063A\u064E\u064A\u0652\u0631\u0650 \u0627\u064E\u0644\u0652\u0645\u064E\u063A\u0652\u0636\u064F\u0648\u0628\u0650 \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652 \u0648\u064E\u0644\u064E\u0627 \u0627\u064E\u0644\u0652\u0636\u0651\u064E\u0627\u0644\u0651\u0650\u064A\u0652\u0646\u064E', 'ghayri l-maghḍūbi ʿalayhim wa-lā ḍ-ḍāllīn', 7, '{"task_type":"madd_click","correct_madd_indices":[1,14,21,26,30]}'),
  -- 8. إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ (97:1)
  (8, E'\u0625\u0650\u0646\u0651\u064E\u0627 \u0623\u064E\u0646\u0652\u0632\u064E\u0644\u0652\u0646\u064E\u0627\u0647\u064F \u0641\u0650\u064A \u0644\u064E\u064A\u0652\u0644\u064E\u0629\u0650 \u0627\u064E\u0644\u0652\u0642\u064E\u062F\u0652\u0631\u0650', 'innā anzalnāhu fī laylati l-qadr', 8, '{"task_type":"madd_click","correct_madd_indices":[2,8,11,13,16]}'),
  -- 9. سَلَامٌ هِيَ حَتَّى مَطْلَعِ الْفَجْرِ (97:5)
  (8, E'\u0633\u064E\u0644\u064E\u0627\u0645\u064C \u0647\u0650\u064A\u064E \u062D\u064E\u062A\u0651\u064E\u0649 \u0645\u064E\u0637\u0652\u0644\u064E\u0639\u0650 \u0627\u064E\u0644\u0652\u0641\u064E\u062C\u0652\u0631\u0650', 'salāmun hiya ḥattā maṭlaʿi l-fajr', 9, '{"task_type":"madd_click","correct_madd_indices":[2,5,13]}'),
  -- 10. لَمْ يَلِدْ وَلَمْ يُولَدْ
  (8, E'\u0644\u064E\u0645\u0652 \u064A\u064E\u0644\u0650\u062F\u0652 \u0648\u064E\u0644\u064E\u0645\u0652 \u064A\u064F\u0648\u0652\u0644\u064E\u062F\u0652', 'lam yalid wa-lam yūlad', 10, '{"task_type":"madd_click","correct_madd_indices":[4,11]}'),
  -- 11. وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ
  (8, E'\u0648\u064E\u0644\u064E\u0645\u0652 \u064A\u064E\u0643\u064F\u0646\u0652 \u0644\u0651\u064E\u0647\u064F \u0643\u064F\u0641\u064F\u0648\u064E\u0627 \u0623\u064E\u062D\u064E\u062F\u064C', 'wa-lam yakun lahu kufuwan aḥad', 11, '{"task_type":"madd_click","correct_madd_indices":[12,17]}'),
  -- 12. وَالشَّمْسِ وَضُحَاهَا وَالْقَمَرِ إِذَا تَلَاهَا (91:1–2)
  (8, E'\u0648\u064E\u0627\u064E\u0644\u0652\u0634\u0651\u064E\u0645\u0652\u0633\u0650 \u0648\u064E\u0636\u064F\u062D\u064E\u0627\u0647\u064E\u0627 \u0648\u064E\u0627\u064E\u0644\u0652\u0642\u064E\u0645\u064E\u0631\u0650 \u0625\u0650\u0630\u064E\u0627 \u062A\u064E\u0644\u064E\u0627\u0647\u064E\u0627', 'wa-sh-shamsi wa-ḍuḥāhā wa-l-qamari idhā talāhā', 12, '{"task_type":"madd_click","correct_madd_indices":[1,6,11,16,21]}');
