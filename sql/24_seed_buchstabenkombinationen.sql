-- ═══════════════════════════════════════════════════════════════════════════
-- 24_seed_buchstabenkombinationen.sql – Stufe 10: Buchstabenkombinationen
-- Drei Kombis: آ (Alif mit Madd), لا/لأ (Lām-Alif), ىٰ (Yā maqṣūra).
-- Aufgabenformat: F = Wort/Wörter (Arabisch), A = Transliteration.
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE learning_levels
SET description = 'Wörter mit آ، لا/لأ، ىٰ erkennen und korrekt transliterieren.'
WHERE level_number = 10;

DELETE FROM learning_items WHERE level_id = 10;

INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 10, v.c, v.tr, v.ord, v.opts::jsonb
FROM (VALUES
  -- آ (Alif mit Madd-Zeichen)
  (1,  E'\u0622\u062F\u064E\u0645', 'Ādam', '[{"id":"1","text":"Ādam","is_correct":true,"audio_url":null},{"id":"2","text":"Adam","is_correct":false,"audio_url":null},{"id":"3","text":"ādam","is_correct":false,"audio_url":null}]'),
  (2,  E'\u0642\u064F\u0631\u0652\u0622\u0646', 'Qurʾān', '[{"id":"1","text":"Qurʾān","is_correct":true,"audio_url":null},{"id":"2","text":"Quran","is_correct":false,"audio_url":null},{"id":"3","text":"qurān","is_correct":false,"audio_url":null}]'),
  (3,  E'\u0622\u064A\u064E\u0629', 'āyah', '[{"id":"1","text":"āyah","is_correct":true,"audio_url":null},{"id":"2","text":"aya","is_correct":false,"audio_url":null},{"id":"3","text":"āya","is_correct":false,"audio_url":null}]'),
  (4,  E'\u0622\u0643\u064F\u0644\u064F', 'ākulu', '[{"id":"1","text":"ākulu","is_correct":true,"audio_url":null},{"id":"2","text":"akulu","is_correct":false,"audio_url":null},{"id":"3","text":"ākul","is_correct":false,"audio_url":null}]'),
  -- لا (Lām-Alif ohne Hamza)
  (5,  E'\u0644\u064E\u0627', 'lā', '[{"id":"1","text":"lā","is_correct":true,"audio_url":null},{"id":"2","text":"la","is_correct":false,"audio_url":null},{"id":"3","text":"li","is_correct":false,"audio_url":null}]'),
  (6,  E'\u0643\u064E\u0644\u0651\u064E\u0627', 'kallā', '[{"id":"1","text":"kallā","is_correct":true,"audio_url":null},{"id":"2","text":"kalla","is_correct":false,"audio_url":null},{"id":"3","text":"kalā","is_correct":false,"audio_url":null}]'),
  (7,  E'\u0644\u064E\u0627 \u0628\u064E\u0623\u0652\u0633\u0650', 'lā baʾsi', '[{"id":"1","text":"lā baʾsi","is_correct":true,"audio_url":null},{"id":"2","text":"la basi","is_correct":false,"audio_url":null},{"id":"3","text":"lā bas","is_correct":false,"audio_url":null}]'),
  -- لأ (Lām-Alif mit Hamza)
  (8,  E'\u0644\u0623\u064E\u062C\u0652\u0644\u0650', 'li-ajli', '[{"id":"1","text":"li-ajli","is_correct":true,"audio_url":null},{"id":"2","text":"la ajli","is_correct":false,"audio_url":null},{"id":"3","text":"li-ajal","is_correct":false,"audio_url":null}]'),
  (9,  E'\u0627\u064E\u0644\u0652\u0623\u064E\u0643\u0652\u0644\u064E', 'al-akl', '[{"id":"1","text":"al-akl","is_correct":true,"audio_url":null},{"id":"2","text":"al-akal","is_correct":false,"audio_url":null},{"id":"3","text":"al-akul","is_correct":false,"audio_url":null}]'),
  -- ىٰ / ى (Yā maqṣūra, „Alaa“)
  (10, E'\u0639\u064E\u0644\u064E\u0649\u0670', 'ʿalā', '[{"id":"1","text":"ʿalā","is_correct":true,"audio_url":null},{"id":"2","text":"alaa","is_correct":false,"audio_url":null},{"id":"3","text":"ala","is_correct":false,"audio_url":null}]'),
  (11, E'\u0645\u064F\u0648\u0633\u064E\u0649', 'Mūsā', '[{"id":"1","text":"Mūsā","is_correct":true,"audio_url":null},{"id":"2","text":"Musa","is_correct":false,"audio_url":null},{"id":"3","text":"Mūsa","is_correct":false,"audio_url":null}]'),
  (12, E'\u0639\u0650\u064A\u0633\u064E\u0649', 'ʿĪsā', '[{"id":"1","text":"ʿĪsā","is_correct":true,"audio_url":null},{"id":"2","text":"Isa","is_correct":false,"audio_url":null},{"id":"3","text":"Īsā","is_correct":false,"audio_url":null}]'),
  (13, E'\u062D\u064E\u062A\u0651\u064E\u0649\u0670', 'ḥattā', '[{"id":"1","text":"ḥattā","is_correct":true,"audio_url":null},{"id":"2","text":"hatta","is_correct":false,"audio_url":null},{"id":"3","text":"ḥata","is_correct":false,"audio_url":null}]')
) AS v(ord, c, tr, opts);
