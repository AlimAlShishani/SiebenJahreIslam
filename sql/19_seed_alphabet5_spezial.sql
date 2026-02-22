-- ═══════════════════════════════════════════════════════════════════════════
-- 19_seed_alphabet5_spezial.sql – Stufe 9: Alphabet 5 Spezial Buchstaben (nach Shaddah, Tanween, Madd)
-- Hamza (einzeln, auf Alif, auf Yā, auf Wāw) + Tāʾ marbūṭa (ة).
-- OHNE Tanween, OHNE Madd. Transliteration mit ʿ, ḥ, ṣ etc.
-- Hamza: 1 Wort → Antwort Transliteration. Tā marbūṭa: 1–2 Wörter, Ende = h, Weiterlesen = t.
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE learning_levels
SET description = 'Hamza (ء، أ، إ، ئ، ؤ) und Tāʾ marbūṭa (ة): Erkennen und Transliteration. Ohne Tanween, ohne Madd.'
WHERE level_number = 9;

DELETE FROM learning_items WHERE level_id = 9;

INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 9, v.c, v.tr, v.ord, v.opts::jsonb
FROM (VALUES
  -- ═══ Hamza: 1 Wort, Antwort = Transliteration ═══
  (1,  E'\u0623\u064E\u0628', 'ab', '[{"id":"1","text":"ab","is_correct":true,"audio_url":null},{"id":"2","text":"akh","is_correct":false,"audio_url":null},{"id":"3","text":"in","is_correct":false,"audio_url":null}]'),
  (2,  E'\u0623\u064E\u062E', 'akh', '[{"id":"1","text":"ab","is_correct":false,"audio_url":null},{"id":"2","text":"akh","is_correct":true,"audio_url":null},{"id":"3","text":"aḥad","is_correct":false,"audio_url":null}]'),
  (3,  E'\u0623\u064E\u062D\u064E\u062F', 'aḥad', '[{"id":"1","text":"aḥad","is_correct":true,"audio_url":null},{"id":"2","text":"ab","is_correct":false,"audio_url":null},{"id":"3","text":"in","is_correct":false,"audio_url":null}]'),
  (4,  E'\u0625\u0650\u0646\u0652', 'in', '[{"id":"1","text":"in","is_correct":true,"audio_url":null},{"id":"2","text":"an","is_correct":false,"audio_url":null},{"id":"3","text":"mu''min","is_correct":false,"audio_url":null}]'),
  (5,  E'\u0645\u064F\u0624\u0652\u0645\u0650\u0646', 'mu''min', '[{"id":"1","text":"mu''min","is_correct":true,"audio_url":null},{"id":"2","text":"shay''","is_correct":false,"audio_url":null},{"id":"3","text":"fi''ah","is_correct":false,"audio_url":null}]'),
  (6,  E'\u0641\u0650\u0626\u064E\u0629', 'fi''ah', '[{"id":"1","text":"fi''ah","is_correct":true,"audio_url":null},{"id":"2","text":"mu''min","is_correct":false,"audio_url":null},{"id":"3","text":"shay''","is_correct":false,"audio_url":null}]'),
  (7,  E'\u0634\u064E\u064A\u0652\u0621', 'shay''', '[{"id":"1","text":"shay''","is_correct":true,"audio_url":null},{"id":"2","text":"bad''","is_correct":false,"audio_url":null},{"id":"3","text":"mas''alah","is_correct":false,"audio_url":null}]'),
  (8,  E'\u0628\u064E\u062F\u0652\u0621', 'bad''', '[{"id":"1","text":"bad''","is_correct":true,"audio_url":null},{"id":"2","text":"shay''","is_correct":false,"audio_url":null},{"id":"3","text":"ab","is_correct":false,"audio_url":null}]'),
  (9,  E'\u0645\u064E\u0633\u0652\u0623\u064E\u0644\u064E\u0629', 'mas''alah', '[{"id":"1","text":"mas''alah","is_correct":true,"audio_url":null},{"id":"2","text":"madrasah","is_correct":false,"audio_url":null},{"id":"3","text":"fi''ah","is_correct":false,"audio_url":null}]'),
  -- ═══ Tā marbūṭa: Ende = h (nichts danach), Weiterlesen = t (+ ٱلْ) ═══
  (10, E'\u0645\u064E\u062F\u0652\u0631\u064E\u0633\u064E\u0629', 'madrasah', '[{"id":"1","text":"madrasah","is_correct":true,"audio_url":null},{"id":"2","text":"lughah","is_correct":false,"audio_url":null},{"id":"3","text":"raḥmah","is_correct":false,"audio_url":null}]'),
  (11, E'\u0644\u064F\u063A\u064E\u0629', 'lughah', '[{"id":"1","text":"lughah","is_correct":true,"audio_url":null},{"id":"2","text":"madrasah","is_correct":false,"audio_url":null},{"id":"3","text":"raḥmah","is_correct":false,"audio_url":null}]'),
  (12, E'\u0631\u064E\u062D\u0652\u0645\u064E\u0629', 'raḥmah', '[{"id":"1","text":"raḥmah","is_correct":true,"audio_url":null},{"id":"2","text":"madrasah","is_correct":false,"audio_url":null},{"id":"3","text":"lughah","is_correct":false,"audio_url":null}]'),
  (13, E'\u0645\u064E\u062F\u0652\u0631\u064E\u0633\u064E\u0629 \u0671\u0644\u0652\u0628\u064E\u064A\u0652\u062A', 'madrasat al-bayt', '[{"id":"1","text":"madrasat al-bayt","is_correct":true,"audio_url":null},{"id":"2","text":"madrasah al-bayt","is_correct":false,"audio_url":null},{"id":"3","text":"madrasah bayt","is_correct":false,"audio_url":null}]')
) AS v(ord, c, tr, opts);
