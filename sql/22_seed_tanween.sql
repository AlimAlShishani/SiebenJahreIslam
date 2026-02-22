-- ═══════════════════════════════════════════════════════════════════════════
-- 22_seed_tanween.sql – Stufe 7: Tanween (an/un/in)
-- KEIN MADD.
-- Aufgabenformat: Frage = Transliteration (angezeigt); Antwortmöglichkeiten = nur Arabisch (options[].text).
-- Regel: Tanween mit Fatḥah (ـً = „an“) → am Ende Alif hinzufügen (ـاً).
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE learning_levels
SET description = 'Transliteration gegeben → richtiges Wort auf Arabisch wählen. Tanween fatḥah (an) mit Alif am Ende schreiben.'
WHERE level_number = 7;

DELETE FROM learning_items WHERE level_id = 7;

INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 7, v.c, v.tr, v.ord, v.opts::jsonb
FROM (VALUES
  -- Tanween Ḍammah (ـٌ = un), kein Alif
  (1,  E'\u0643\u0650\u062A\u064E\u0627\u0628\u064C', 'kitābun', '[{"id":"1","text":"\u0643\u0650\u062A\u064E\u0627\u0628\u064C","is_correct":true,"audio_url":null},{"id":"2","text":"\u0643\u0650\u062A\u064E\u0627\u0628\u064D","is_correct":false,"audio_url":null},{"id":"3","text":"\u0643\u0650\u062A\u064E\u0627\u0628\u064B\u0627","is_correct":false,"audio_url":null}]'),
  (2,  E'\u0628\u064E\u064A\u0652\u062A\u064C', 'baytun', '[{"id":"1","text":"\u0628\u064E\u064A\u0652\u062A\u064C","is_correct":true,"audio_url":null},{"id":"2","text":"\u0628\u064E\u064A\u0652\u062A\u064D","is_correct":false,"audio_url":null},{"id":"3","text":"\u0628\u064E\u064A\u0652\u062A\u064B\u0627","is_correct":false,"audio_url":null}]'),
  (3,  E'\u0642\u064E\u0644\u064E\u0645\u064C', 'qalamun', '[{"id":"1","text":"\u0642\u064E\u0644\u064E\u0645\u064C","is_correct":true,"audio_url":null},{"id":"2","text":"\u0642\u064E\u0644\u064E\u0645\u064D","is_correct":false,"audio_url":null},{"id":"3","text":"\u0642\u064E\u0644\u064E\u0645\u064B\u0627","is_correct":false,"audio_url":null}]'),
  -- Tanween Kasrah (ـٍ = in), kein Alif
  (4,  E'\u0643\u0650\u062A\u064E\u0627\u0628\u064D', 'kitābin', '[{"id":"1","text":"\u0643\u0650\u062A\u064E\u0627\u0628\u064D","is_correct":true,"audio_url":null},{"id":"2","text":"\u0643\u0650\u062A\u064E\u0627\u0628\u064C","is_correct":false,"audio_url":null},{"id":"3","text":"\u0643\u0650\u062A\u064E\u0627\u0628\u064B\u0627","is_correct":false,"audio_url":null}]'),
  (5,  E'\u0628\u064E\u064A\u0652\u062A\u064D', 'baytin', '[{"id":"1","text":"\u0628\u064E\u064A\u0652\u062A\u064D","is_correct":true,"audio_url":null},{"id":"2","text":"\u0628\u064E\u064A\u0652\u062A\u064C","is_correct":false,"audio_url":null},{"id":"3","text":"\u0628\u064E\u064A\u0652\u062A\u064B\u0627","is_correct":false,"audio_url":null}]'),
  (6,  E'\u0642\u064E\u0644\u064E\u0645\u064D', 'qalamin', '[{"id":"1","text":"\u0642\u064E\u0644\u064E\u0645\u064D","is_correct":true,"audio_url":null},{"id":"2","text":"\u0642\u064E\u0644\u064E\u0645\u064C","is_correct":false,"audio_url":null},{"id":"3","text":"\u0642\u064E\u0644\u064E\u0645\u064B\u0627","is_correct":false,"audio_url":null}]'),
  -- Tanween Fatḥah (ـً = an) MIT Alif am Ende (ـاً)
  (7,  E'\u0643\u0650\u062A\u064E\u0627\u0628\u064B\u0627', 'kitāban', '[{"id":"1","text":"\u0643\u0650\u062A\u064E\u0627\u0628\u064B\u0627","is_correct":true,"audio_url":null},{"id":"2","text":"\u0643\u0650\u062A\u064E\u0627\u0628\u064B","is_correct":false,"audio_url":null},{"id":"3","text":"\u0643\u0650\u062A\u064E\u0627\u0628\u064C","is_correct":false,"audio_url":null}]'),
  (8,  E'\u0628\u064E\u064A\u0652\u062A\u064B\u0627', 'baytan', '[{"id":"1","text":"\u0628\u064E\u064A\u0652\u062A\u064B\u0627","is_correct":true,"audio_url":null},{"id":"2","text":"\u0628\u064E\u064A\u0652\u062A\u064B","is_correct":false,"audio_url":null},{"id":"3","text":"\u0628\u064E\u064A\u0652\u062A\u064C","is_correct":false,"audio_url":null}]'),
  (9,  E'\u0642\u064E\u0644\u064E\u0645\u064B\u0627', 'qalaman', '[{"id":"1","text":"\u0642\u064E\u0644\u064E\u0645\u064B\u0627","is_correct":true,"audio_url":null},{"id":"2","text":"\u0642\u064E\u0644\u064E\u0645\u064B","is_correct":false,"audio_url":null},{"id":"3","text":"\u0642\u064E\u0644\u064E\u0645\u064C","is_correct":false,"audio_url":null}]'),
  (10, E'\u0639\u0650\u0644\u0652\u0645\u064B\u0627', 'ʿilman', '[{"id":"1","text":"\u0639\u0650\u0644\u0652\u0645\u064B\u0627","is_correct":true,"audio_url":null},{"id":"2","text":"\u0639\u0650\u0644\u0652\u0645\u064B","is_correct":false,"audio_url":null},{"id":"3","text":"\u0639\u0650\u0644\u0652\u0645\u064C","is_correct":false,"audio_url":null}]')
) AS v(ord, c, tr, opts);
