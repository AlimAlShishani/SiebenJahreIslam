-- ═══════════════════════════════════════════════════════════════════════════
-- 11_seed_alphabet2.sql – Stufe 2: Dāl, Dhāl, Rā, Zāy, Sīn, Shīn, Ṣād, Ḍād
-- 20 Fragen: je 2× Dāl, Dhāl, Rā, Zāy (nur 2 Formen: Allein/Anfang & Mitte/Ende);
--            je 3× Sīn, Shīn, Ṣād, Ḍād (Allein, Anfang, Ende)
-- Schreibweisen mit Tatweel (ـ = U+0640) wie Wikipedia Arabic alphabet
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE learning_levels
SET description = 'Zweite 8 Buchstaben: Dāl, Dhāl, Rā, Zāy (je 2 Formen), Sīn, Shīn, Ṣād, Ḍād (Anfangs-, Mittel-, End- und Einzelform).'
WHERE level_number = 2;

DELETE FROM learning_items WHERE level_id = 2;

INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 2, v.c, v.tr, v.ord, v.opts::jsonb
FROM (VALUES
  -- Dāl (2): د , ـد
  (1, E'\u062F', 'Dāl (Allein & Anfang)', '[{"id":"1","text":"Dāl (Allein & Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Dāl (Mitte & Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Dhāl (Allein & Anfang)","is_correct":false,"audio_url":null}]'),
  (2, E'\u0640\u062F', 'Dāl (Mitte & Ende)', '[{"id":"1","text":"Dāl (Mitte & Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Dāl (Allein & Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Dhāl (Mitte & Ende)","is_correct":false,"audio_url":null}]'),
  -- Dhāl (2): ذ , ـذ
  (3, E'\u0630', 'Dhāl (Allein & Anfang)', '[{"id":"1","text":"Dhāl (Allein & Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Dhāl (Mitte & Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Rā (Allein & Anfang)","is_correct":false,"audio_url":null}]'),
  (4, E'\u0640\u0630', 'Dhāl (Mitte & Ende)', '[{"id":"1","text":"Dhāl (Mitte & Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Dhāl (Allein & Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Zāy (Mitte & Ende)","is_correct":false,"audio_url":null}]'),
  -- Rā (2): ر , ـر
  (5, E'\u0631', 'Rā (Allein & Anfang)', '[{"id":"1","text":"Rā (Allein & Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Rā (Mitte & Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Zāy (Allein & Anfang)","is_correct":false,"audio_url":null}]'),
  (6, E'\u0640\u0631', 'Rā (Mitte & Ende)', '[{"id":"1","text":"Rā (Mitte & Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Rā (Allein & Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Dāl (Mitte & Ende)","is_correct":false,"audio_url":null}]'),
  -- Zāy (2): ز , ـز
  (7, E'\u0632', 'Zāy (Allein & Anfang)', '[{"id":"1","text":"Zāy (Allein & Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Zāy (Mitte & Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Sīn (Allein)","is_correct":false,"audio_url":null}]'),
  (8, E'\u0640\u0632', 'Zāy (Mitte & Ende)', '[{"id":"1","text":"Zāy (Mitte & Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Zāy (Allein & Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Rā (Mitte & Ende)","is_correct":false,"audio_url":null}]'),
  -- Sīn (3): س , سـ , ـس
  (9, E'\u0633', 'Sīn (Allein)', '[{"id":"1","text":"Sīn (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Shīn (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Ṣād (Allein)","is_correct":false,"audio_url":null}]'),
  (10, E'\u0633\u0640', 'Sīn (Anfang)', '[{"id":"1","text":"Sīn (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Sīn (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Shīn (Anfang)","is_correct":false,"audio_url":null}]'),
  (11, E'\u0640\u0633', 'Sīn (Ende)', '[{"id":"1","text":"Sīn (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Sīn (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Shīn (Ende)","is_correct":false,"audio_url":null}]'),
  -- Shīn (3): ش , شـ , ـش
  (12, E'\u0634', 'Shīn (Allein)', '[{"id":"1","text":"Shīn (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Sīn (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Ṣād (Allein)","is_correct":false,"audio_url":null}]'),
  (13, E'\u0634\u0640', 'Shīn (Anfang)', '[{"id":"1","text":"Shīn (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Shīn (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Ṣād (Anfang)","is_correct":false,"audio_url":null}]'),
  (14, E'\u0640\u0634', 'Shīn (Ende)', '[{"id":"1","text":"Shīn (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Shīn (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Ḍād (Ende)","is_correct":false,"audio_url":null}]'),
  -- Ṣād (3): ص , صـ , ـص
  (15, E'\u0635', 'Ṣād (Allein)', '[{"id":"1","text":"Ṣād (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Shīn (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Ḍād (Allein)","is_correct":false,"audio_url":null}]'),
  (16, E'\u0635\u0640', 'Ṣād (Anfang)', '[{"id":"1","text":"Ṣād (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Ṣād (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Ḍād (Anfang)","is_correct":false,"audio_url":null}]'),
  (17, E'\u0640\u0635', 'Ṣād (Ende)', '[{"id":"1","text":"Ṣād (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Ṣād (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Ḍād (Ende)","is_correct":false,"audio_url":null}]'),
  -- Ḍād (3): ض , ضـ , ـض
  (18, E'\u0636', 'Ḍād (Allein)', '[{"id":"1","text":"Ḍād (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Ṣād (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Sīn (Allein)","is_correct":false,"audio_url":null}]'),
  (19, E'\u0636\u0640', 'Ḍād (Anfang)', '[{"id":"1","text":"Ḍād (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Ḍād (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Ṣād (Anfang)","is_correct":false,"audio_url":null}]'),
  (20, E'\u0640\u0636', 'Ḍād (Ende)', '[{"id":"1","text":"Ḍād (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Ḍād (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Ṣād (Ende)","is_correct":false,"audio_url":null}]')
) AS v(ord, c, tr, opts);
