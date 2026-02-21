-- ═══════════════════════════════════════════════════════════════════════════
-- 10_seed_alphabet1.sql – Stufe 1: Erste 7 Buchstaben (Alif–Khā)
-- 20 Fragen: 2× Alif, 3× je Bā, Tā, Thā, Dschīm, Ḥā, Khā
-- Schreibweisen GENAU wie Nutzer: manche aus 2 Zeichen (بـ = ب + ـ), Mitte aus 3 (ـبـ = ـ + ب + ـ)
-- Unicode: ـ = U+0640 (Tatweel), Buchstaben = U+0623 (أ), U+0628 (ب), U+062A (ت), U+062B (ث), U+062C (ج), U+062D (ح), U+062E (خ)
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE learning_levels
SET description = 'Erste 7 Buchstaben des arabischen Alphabets (Alif, Bā, Tā, Thā, Dschīm, Ḥā, Khā) in allen 4 Schreibweisen (Anfangs-, Mittel-, End- und Einzelschreibweisen).'
WHERE level_number = 1;

DELETE FROM learning_items WHERE level_id = 1;

INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 1, v.c, v.tr, v.ord, v.opts::jsonb
FROM (VALUES
  -- Alif (2): أ , ـأ
  (1, E'\u0623', 'Alif (Anfang & Allein)', '[{"id":"1","text":"Alif (Anfang & Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Alif (Mitte & Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Bā (Allein)","is_correct":false,"audio_url":null}]'),
  (2, E'\u0640\u0623', 'Alif (Mitte & Ende)', '[{"id":"1","text":"Alif (Mitte & Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Alif (Anfang & Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Bā (Ende)","is_correct":false,"audio_url":null}]'),
  -- Bā (3): ب , بـ , ـب
  (3, E'\u0628', 'Bā (Allein)', '[{"id":"1","text":"Bā (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Tā (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Alif (Mitte & Ende)","is_correct":false,"audio_url":null}]'),
  (4, E'\u0628\u0640', 'Bā (Anfang)', '[{"id":"1","text":"Bā (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Bā (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Tā (Anfang)","is_correct":false,"audio_url":null}]'),
  (5, E'\u0640\u0628', 'Bā (Ende)', '[{"id":"1","text":"Bā (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Bā (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Tā (Ende)","is_correct":false,"audio_url":null}]'),
  -- Tā (3): ت , تـ , ـت
  (6, E'\u062A', 'Tā (Allein)', '[{"id":"1","text":"Tā (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Bā (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Thā (Allein)","is_correct":false,"audio_url":null}]'),
  (7, E'\u062A\u0640', 'Tā (Anfang)', '[{"id":"1","text":"Tā (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Tā (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Thā (Anfang)","is_correct":false,"audio_url":null}]'),
  (8, E'\u0640\u062A', 'Tā (Ende)', '[{"id":"1","text":"Tā (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Tā (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Thā (Ende)","is_correct":false,"audio_url":null}]'),
  -- Thā (3): ث , ثـ , ـث
  (9, E'\u062B', 'Thā (Allein)', '[{"id":"1","text":"Thā (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Tā (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Dschīm (Allein)","is_correct":false,"audio_url":null}]'),
  (10, E'\u062B\u0640', 'Thā (Anfang)', '[{"id":"1","text":"Thā (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Thā (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Dschīm (Anfang)","is_correct":false,"audio_url":null}]'),
  (11, E'\u0640\u062B', 'Thā (Ende)', '[{"id":"1","text":"Thā (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Thā (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Dschīm (Ende)","is_correct":false,"audio_url":null}]'),
  -- Dschīm (3): ج , جـ , ـج
  (12, E'\u062C', 'Dschīm (Allein)', '[{"id":"1","text":"Dschīm (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Thā (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Ḥā (Allein)","is_correct":false,"audio_url":null}]'),
  (13, E'\u062C\u0640', 'Dschīm (Anfang)', '[{"id":"1","text":"Dschīm (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Dschīm (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Ḥā (Anfang)","is_correct":false,"audio_url":null}]'),
  (14, E'\u0640\u062C', 'Dschīm (Ende)', '[{"id":"1","text":"Dschīm (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Dschīm (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Khā (Ende)","is_correct":false,"audio_url":null}]'),
  -- Ḥā (3): ح , حـ , ـح
  (15, E'\u062D', 'Ḥā (Allein)', '[{"id":"1","text":"Ḥā (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Dschīm (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Khā (Allein)","is_correct":false,"audio_url":null}]'),
  (16, E'\u062D\u0640', 'Ḥā (Anfang)', '[{"id":"1","text":"Ḥā (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Ḥā (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Khā (Anfang)","is_correct":false,"audio_url":null}]'),
  (17, E'\u0640\u062D', 'Ḥā (Ende)', '[{"id":"1","text":"Ḥā (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Ḥā (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Khā (Ende)","is_correct":false,"audio_url":null}]'),
  -- Khā (3): خ , خـ , ـخ
  (18, E'\u062E', 'Khā (Allein)', '[{"id":"1","text":"Khā (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Ḥā (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Bā (Allein)","is_correct":false,"audio_url":null}]'),
  (19, E'\u062E\u0640', 'Khā (Anfang)', '[{"id":"1","text":"Khā (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Khā (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Bā (Anfang)","is_correct":false,"audio_url":null}]'),
  (20, E'\u0640\u062E', 'Khā (Ende)', '[{"id":"1","text":"Khā (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Khā (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Ḥā (Ende)","is_correct":false,"audio_url":null}]')
) AS v(ord, c, tr, opts);
