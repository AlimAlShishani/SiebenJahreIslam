-- ═══════════════════════════════════════════════════════════════════════════
-- 12_seed_alphabet3.sql – Stufe 3: Ṭā, Ẓā, ʿAyn, Ghayn, Fā, Qāf, Kāf
-- 28 Aufgaben: je 4 Formen pro Buchstabe (Allein, Anfang, Mitte, Ende)
-- Schreibweisen mit Tatweel (ـ = U+0640) wie Wikipedia Arabic alphabet
-- Unicode: ط 0637, ظ 0638, ع 0639, غ 063A, ف 0641, ق 0642, ك 0643
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE learning_levels
SET description = 'Dritte 7 Buchstaben: Ṭā, Ẓā, ʿAyn, Ghayn, Fā, Qāf, Kāf – je 4 Formen (Allein, Anfang, Mitte, Ende).'
WHERE level_number = 3;

DELETE FROM learning_items WHERE level_id = 3;

INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 3, v.c, v.tr, v.ord, v.opts::jsonb
FROM (VALUES
  -- Ṭā (4): ط , طـ , ـطـ , ـط
  (1, E'\u0637', 'Ṭā (Allein)', '[{"id":"1","text":"Ṭā (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Ẓā (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"ʿAyn (Allein)","is_correct":false,"audio_url":null}]'),
  (2, E'\u0637\u0640', 'Ṭā (Anfang)', '[{"id":"1","text":"Ṭā (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Ṭā (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Ẓā (Anfang)","is_correct":false,"audio_url":null}]'),
  (3, E'\u0640\u0637\u0640', 'Ṭā (Mitte)', '[{"id":"1","text":"Ṭā (Mitte)","is_correct":true,"audio_url":null},{"id":"2","text":"Ṭā (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Ẓā (Mitte)","is_correct":false,"audio_url":null}]'),
  (4, E'\u0640\u0637', 'Ṭā (Ende)', '[{"id":"1","text":"Ṭā (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Ṭā (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Ẓā (Ende)","is_correct":false,"audio_url":null}]'),
  -- Ẓā (4): ظ , ظـ , ـظـ , ـظ
  (5, E'\u0638', 'Ẓā (Allein)', '[{"id":"1","text":"Ẓā (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Ṭā (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"ʿAyn (Allein)","is_correct":false,"audio_url":null}]'),
  (6, E'\u0638\u0640', 'Ẓā (Anfang)', '[{"id":"1","text":"Ẓā (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Ẓā (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Ṭā (Anfang)","is_correct":false,"audio_url":null}]'),
  (7, E'\u0640\u0638\u0640', 'Ẓā (Mitte)', '[{"id":"1","text":"Ẓā (Mitte)","is_correct":true,"audio_url":null},{"id":"2","text":"Ẓā (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"ʿAyn (Mitte)","is_correct":false,"audio_url":null}]'),
  (8, E'\u0640\u0638', 'Ẓā (Ende)', '[{"id":"1","text":"Ẓā (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Ẓā (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Ṭā (Ende)","is_correct":false,"audio_url":null}]'),
  -- ʿAyn (4): ع , عـ , ـعـ , ـع
  (9, E'\u0639', 'ʿAyn (Allein)', '[{"id":"1","text":"ʿAyn (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Ghayn (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Ẓā (Allein)","is_correct":false,"audio_url":null}]'),
  (10, E'\u0639\u0640', 'ʿAyn (Anfang)', '[{"id":"1","text":"ʿAyn (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"ʿAyn (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Ghayn (Anfang)","is_correct":false,"audio_url":null}]'),
  (11, E'\u0640\u0639\u0640', 'ʿAyn (Mitte)', '[{"id":"1","text":"ʿAyn (Mitte)","is_correct":true,"audio_url":null},{"id":"2","text":"ʿAyn (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Ghayn (Mitte)","is_correct":false,"audio_url":null}]'),
  (12, E'\u0640\u0639', 'ʿAyn (Ende)', '[{"id":"1","text":"ʿAyn (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"ʿAyn (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Ghayn (Ende)","is_correct":false,"audio_url":null}]'),
  -- Ghayn (4): غ , غـ , ـغـ , ـغ
  (13, E'\u063A', 'Ghayn (Allein)', '[{"id":"1","text":"Ghayn (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"ʿAyn (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Fā (Allein)","is_correct":false,"audio_url":null}]'),
  (14, E'\u063A\u0640', 'Ghayn (Anfang)', '[{"id":"1","text":"Ghayn (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Ghayn (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"ʿAyn (Anfang)","is_correct":false,"audio_url":null}]'),
  (15, E'\u0640\u063A\u0640', 'Ghayn (Mitte)', '[{"id":"1","text":"Ghayn (Mitte)","is_correct":true,"audio_url":null},{"id":"2","text":"Ghayn (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Fā (Mitte)","is_correct":false,"audio_url":null}]'),
  (16, E'\u0640\u063A', 'Ghayn (Ende)', '[{"id":"1","text":"Ghayn (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Ghayn (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"ʿAyn (Ende)","is_correct":false,"audio_url":null}]'),
  -- Fā (4): ف , فـ , ـفـ , ـف
  (17, E'\u0641', 'Fā (Allein)', '[{"id":"1","text":"Fā (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Qāf (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Ghayn (Allein)","is_correct":false,"audio_url":null}]'),
  (18, E'\u0641\u0640', 'Fā (Anfang)', '[{"id":"1","text":"Fā (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Fā (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Qāf (Anfang)","is_correct":false,"audio_url":null}]'),
  (19, E'\u0640\u0641\u0640', 'Fā (Mitte)', '[{"id":"1","text":"Fā (Mitte)","is_correct":true,"audio_url":null},{"id":"2","text":"Fā (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Qāf (Mitte)","is_correct":false,"audio_url":null}]'),
  (20, E'\u0640\u0641', 'Fā (Ende)', '[{"id":"1","text":"Fā (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Fā (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Qāf (Ende)","is_correct":false,"audio_url":null}]'),
  -- Qāf (4): ق , قـ , ـقـ , ـق
  (21, E'\u0642', 'Qāf (Allein)', '[{"id":"1","text":"Qāf (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Fā (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Kāf (Allein)","is_correct":false,"audio_url":null}]'),
  (22, E'\u0642\u0640', 'Qāf (Anfang)', '[{"id":"1","text":"Qāf (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Qāf (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Kāf (Anfang)","is_correct":false,"audio_url":null}]'),
  (23, E'\u0640\u0642\u0640', 'Qāf (Mitte)', '[{"id":"1","text":"Qāf (Mitte)","is_correct":true,"audio_url":null},{"id":"2","text":"Qāf (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Kāf (Mitte)","is_correct":false,"audio_url":null}]'),
  (24, E'\u0640\u0642', 'Qāf (Ende)', '[{"id":"1","text":"Qāf (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Qāf (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Fā (Ende)","is_correct":false,"audio_url":null}]'),
  -- Kāf (4): ك , كـ , ـكـ , ـك
  (25, E'\u0643', 'Kāf (Allein)', '[{"id":"1","text":"Kāf (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Qāf (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Fā (Allein)","is_correct":false,"audio_url":null}]'),
  (26, E'\u0643\u0640', 'Kāf (Anfang)', '[{"id":"1","text":"Kāf (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Kāf (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Qāf (Anfang)","is_correct":false,"audio_url":null}]'),
  (27, E'\u0640\u0643\u0640', 'Kāf (Mitte)', '[{"id":"1","text":"Kāf (Mitte)","is_correct":true,"audio_url":null},{"id":"2","text":"Kāf (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Qāf (Mitte)","is_correct":false,"audio_url":null}]'),
  (28, E'\u0640\u0643', 'Kāf (Ende)', '[{"id":"1","text":"Kāf (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Kāf (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Qāf (Ende)","is_correct":false,"audio_url":null}]')
) AS v(ord, c, tr, opts);
