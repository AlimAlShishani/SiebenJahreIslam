-- ═══════════════════════════════════════════════════════════════════════════
-- 21_seed_shaddah.sql – Stufe 6: Shaddah (Doppelbuchstabe)
-- F: 1 Wort oder 2 Wörter mit mindestens einer Shaddah. A: Transliteration.
-- OHNE Madd, OHNE Tāʾ marbūṭa (ة). Transliteration: ḥ, ṣ, ʿ etc.
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE learning_levels
SET description = 'Wörter mit Shaddah (ّ) erkennen und korrekt transliterieren. Ohne Madd.'
WHERE level_number = 6;

DELETE FROM learning_items WHERE level_id = 6;

INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 6, v.c, v.tr, v.ord, v.opts::jsonb
FROM (VALUES
  -- Kurz, Shaddah mit Fatḥah
  (1,  E'\u0631\u064E\u0628\u0651\u064E', 'rabba', '[{"id":"1","text":"rabba","is_correct":true,"audio_url":null},{"id":"2","text":"raba","is_correct":false,"audio_url":null},{"id":"3","text":"ḥaqq","is_correct":false,"audio_url":null}]'),
  (2,  E'\u062D\u064E\u0642\u0651', 'ḥaqq', '[{"id":"1","text":"ḥaqq","is_correct":true,"audio_url":null},{"id":"2","text":"ḥaq","is_correct":false,"audio_url":null},{"id":"3","text":"rabba","is_correct":false,"audio_url":null}]'),
  (3,  E'\u062D\u064E\u0628\u0651\u064E', 'ḥabba', '[{"id":"1","text":"ḥabba","is_correct":true,"audio_url":null},{"id":"2","text":"ḥaba","is_correct":false,"audio_url":null},{"id":"3","text":"ṣadda","is_correct":false,"audio_url":null}]'),
  (4,  E'\u0635\u064E\u062F\u0651\u064E', 'ṣadda', '[{"id":"1","text":"ṣadda","is_correct":true,"audio_url":null},{"id":"2","text":"ṣada","is_correct":false,"audio_url":null},{"id":"3","text":"wadda","is_correct":false,"audio_url":null}]'),
  -- Kurz, Shaddah mit Ḍammah
  (5,  E'\u0623\u064F\u0645\u0651', 'umm', '[{"id":"1","text":"umm","is_correct":true,"audio_url":null},{"id":"2","text":"umma","is_correct":false,"audio_url":null},{"id":"3","text":"yuḥibbu","is_correct":false,"audio_url":null}]'),
  (6,  E'\u064A\u0650\u062D\u0650\u0628\u0651\u064F', 'yuḥibbu', '[{"id":"1","text":"yuḥibbu","is_correct":true,"audio_url":null},{"id":"2","text":"yuḥibu","is_correct":false,"audio_url":null},{"id":"3","text":"yaruddu","is_correct":false,"audio_url":null}]'),
  (7,  E'\u064A\u064E\u0631\u064F\u062F\u0651\u064F', 'yaruddu', '[{"id":"1","text":"yaruddu","is_correct":true,"audio_url":null},{"id":"2","text":"yarudu","is_correct":false,"audio_url":null},{"id":"3","text":"yuḥibbu","is_correct":false,"audio_url":null}]'),
  -- Kurz, Shaddah mit Kasrah
  (8,  E'\u0625\u0650\u0646\u0651\u064E', 'inna', '[{"id":"1","text":"inna","is_correct":true,"audio_url":null},{"id":"2","text":"anna","is_correct":false,"audio_url":null},{"id":"3","text":"mina","is_correct":false,"audio_url":null}]'),
  (9,  E'\u0623\u064E\u0646\u0651\u064E', 'anna', '[{"id":"1","text":"anna","is_correct":true,"audio_url":null},{"id":"2","text":"inna","is_correct":false,"audio_url":null},{"id":"3","text":"minna","is_correct":false,"audio_url":null}]'),
  -- Länger, Shaddah mit Fatḥah
  (10, E'\u0635\u064E\u062F\u0651\u064E\u0642\u064E', 'ṣaddaqa', '[{"id":"1","text":"ṣaddaqa","is_correct":true,"audio_url":null},{"id":"2","text":"ṣadaqa","is_correct":false,"audio_url":null},{"id":"3","text":"ḥaddatha","is_correct":false,"audio_url":null}]'),
  (11, E'\u062D\u064E\u062F\u0651\u064E\u062B\u064E', 'ḥaddatha', '[{"id":"1","text":"ḥaddatha","is_correct":true,"audio_url":null},{"id":"2","text":"ḥadatha","is_correct":false,"audio_url":null},{"id":"3","text":"tawakkala","is_correct":false,"audio_url":null}]'),
  (12, E'\u062A\u064E\u0648\u064E\u0643\u0651\u064E\u0644\u064E', 'tawakkala', '[{"id":"1","text":"tawakkala","is_correct":true,"audio_url":null},{"id":"2","text":"tawakala","is_correct":false,"audio_url":null},{"id":"3","text":"ṣaddaqa","is_correct":false,"audio_url":null}]'),
  (13, E'\u0627\u0650\u062A\u0651\u064E\u062E\u064E\u0630\u064E', 'ittakhadha', '[{"id":"1","text":"ittakhadha","is_correct":true,"audio_url":null},{"id":"2","text":"itakhadha","is_correct":false,"audio_url":null},{"id":"3","text":"tawakkala","is_correct":false,"audio_url":null}]'),
  -- Länger, Shaddah mit Kasrah
  (14, E'\u064A\u064F\u0635\u064E\u062F\u0651\u0650\u0642\u064F', 'yuṣaddiqu', '[{"id":"1","text":"yuṣaddiqu","is_correct":true,"audio_url":null},{"id":"2","text":"yuṣadiqu","is_correct":false,"audio_url":null},{"id":"3","text":"muṣaddiq","is_correct":false,"audio_url":null}]'),
  (15, E'\u0645\u064F\u0635\u064E\u062F\u0651\u0650\u0642', 'muṣaddiq', '[{"id":"1","text":"muṣaddiq","is_correct":true,"audio_url":null},{"id":"2","text":"muṣadiq","is_correct":false,"audio_url":null},{"id":"3","text":"yuṣaddiqu","is_correct":false,"audio_url":null}]'),
  -- Weitere kurze (Mischung)
  (16, E'\u0645\u064E\u0631\u0651\u064E', 'marra', '[{"id":"1","text":"marra","is_correct":true,"audio_url":null},{"id":"2","text":"mara","is_correct":false,"audio_url":null},{"id":"3","text":"janna","is_correct":false,"audio_url":null}]'),
  (17, E'\u0634\u064E\u0643\u0651\u064E', 'shakka', '[{"id":"1","text":"shakka","is_correct":true,"audio_url":null},{"id":"2","text":"shaka","is_correct":false,"audio_url":null},{"id":"3","text":"ṣaffa","is_correct":false,"audio_url":null}]'),
  -- Phrasen
  (18, E'\u0625\u0650\u0646\u0651\u064E \u062D\u064E\u0642\u0651', 'inna ḥaqq', '[{"id":"1","text":"inna ḥaqq","is_correct":true,"audio_url":null},{"id":"2","text":"inna ḥaq","is_correct":false,"audio_url":null},{"id":"3","text":"anna ḥaqq","is_correct":false,"audio_url":null}]'),
  (19, E'\u0623\u064E\u0646\u0651\u064E \u062D\u064E\u0628\u0651\u064E', 'anna ḥabba', '[{"id":"1","text":"anna ḥabba","is_correct":true,"audio_url":null},{"id":"2","text":"inna ḥabba","is_correct":false,"audio_url":null},{"id":"3","text":"anna ḥaba","is_correct":false,"audio_url":null}]')
) AS v(ord, c, tr, opts);
