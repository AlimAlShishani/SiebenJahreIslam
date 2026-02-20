-- ═══════════════════════════════════════════════════════════════════════════
-- 13_seed_alphabet4.sql – Stufe 4: Lām, Mīm, Nūn, Hā, Wāw, Yā
-- 22 Aufgaben: Lām, Mīm, Nūn, Hā, Yā je 4 Formen; Wāw nur 2 Formen (wie د/ر/ز)
-- Schreibweisen mit Tatweel (ـ = U+0640) wie Wikipedia Arabic alphabet
-- Unicode: ل 0644, م 0645, ن 0646, ه 0647, و 0648, ي 064A
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE learning_levels
SET description = 'Vierte 6 Buchstaben: Lām, Mīm, Nūn, Hā (je 4 Formen), Wāw (2 Formen), Yā (4 Formen).'
WHERE level_number = 4;

DELETE FROM learning_items WHERE level_id = 4;

INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 4, v.c, v.tr, v.ord, v.opts::jsonb
FROM (VALUES
  -- Lām (4): ل , لـ , ـلـ , ـل
  (1, E'\u0644', 'Lām (Allein)', '[{"id":"1","text":"Lām (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Mīm (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Nūn (Allein)","is_correct":false,"audio_url":null}]'),
  (2, E'\u0644\u0640', 'Lām (Anfang)', '[{"id":"1","text":"Lām (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Lām (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Mīm (Anfang)","is_correct":false,"audio_url":null}]'),
  (3, E'\u0640\u0644\u0640', 'Lām (Mitte)', '[{"id":"1","text":"Lām (Mitte)","is_correct":true,"audio_url":null},{"id":"2","text":"Lām (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Nūn (Mitte)","is_correct":false,"audio_url":null}]'),
  (4, E'\u0640\u0644', 'Lām (Ende)', '[{"id":"1","text":"Lām (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Lām (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Yā (Ende)","is_correct":false,"audio_url":null}]'),
  -- Mīm (4): م , مـ , ـمـ , ـم
  (5, E'\u0645', 'Mīm (Allein)', '[{"id":"1","text":"Mīm (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Lām (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Nūn (Allein)","is_correct":false,"audio_url":null}]'),
  (6, E'\u0645\u0640', 'Mīm (Anfang)', '[{"id":"1","text":"Mīm (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Mīm (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Nūn (Anfang)","is_correct":false,"audio_url":null}]'),
  (7, E'\u0640\u0645\u0640', 'Mīm (Mitte)', '[{"id":"1","text":"Mīm (Mitte)","is_correct":true,"audio_url":null},{"id":"2","text":"Mīm (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Hā (Mitte)","is_correct":false,"audio_url":null}]'),
  (8, E'\u0640\u0645', 'Mīm (Ende)', '[{"id":"1","text":"Mīm (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Mīm (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Nūn (Ende)","is_correct":false,"audio_url":null}]'),
  -- Nūn (4): ن , نـ , ـنـ , ـن
  (9, E'\u0646', 'Nūn (Allein)', '[{"id":"1","text":"Nūn (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Mīm (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Hā (Allein)","is_correct":false,"audio_url":null}]'),
  (10, E'\u0646\u0640', 'Nūn (Anfang)', '[{"id":"1","text":"Nūn (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Nūn (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Hā (Anfang)","is_correct":false,"audio_url":null}]'),
  (11, E'\u0640\u0646\u0640', 'Nūn (Mitte)', '[{"id":"1","text":"Nūn (Mitte)","is_correct":true,"audio_url":null},{"id":"2","text":"Nūn (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Yā (Mitte)","is_correct":false,"audio_url":null}]'),
  (12, E'\u0640\u0646', 'Nūn (Ende)', '[{"id":"1","text":"Nūn (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Nūn (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Mīm (Ende)","is_correct":false,"audio_url":null}]'),
  -- Hā (4): ه , هـ , ـهـ , ـه
  (13, E'\u0647', 'Hā (Allein)', '[{"id":"1","text":"Hā (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Nūn (Allein)","is_correct":false,"audio_url":null},{"id":"3","text":"Wāw (Allein & Anfang)","is_correct":false,"audio_url":null}]'),
  (14, E'\u0647\u0640', 'Hā (Anfang)', '[{"id":"1","text":"Hā (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Hā (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Yā (Anfang)","is_correct":false,"audio_url":null}]'),
  (15, E'\u0640\u0647\u0640', 'Hā (Mitte)', '[{"id":"1","text":"Hā (Mitte)","is_correct":true,"audio_url":null},{"id":"2","text":"Hā (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Nūn (Mitte)","is_correct":false,"audio_url":null}]'),
  (16, E'\u0640\u0647', 'Hā (Ende)', '[{"id":"1","text":"Hā (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Hā (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Yā (Ende)","is_correct":false,"audio_url":null}]'),
  -- Wāw (2): و , ـو
  (17, E'\u0648', 'Wāw (Allein & Anfang)', '[{"id":"1","text":"Wāw (Allein & Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Wāw (Mitte & Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Yā (Allein)","is_correct":false,"audio_url":null}]'),
  (18, E'\u0640\u0648', 'Wāw (Mitte & Ende)', '[{"id":"1","text":"Wāw (Mitte & Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Wāw (Allein & Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Hā (Ende)","is_correct":false,"audio_url":null}]'),
  -- Yā (4): ي , يـ , ـيـ , ـي
  (19, E'\u064A', 'Yā (Allein)', '[{"id":"1","text":"Yā (Allein)","is_correct":true,"audio_url":null},{"id":"2","text":"Wāw (Allein & Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Hā (Allein)","is_correct":false,"audio_url":null}]'),
  (20, E'\u064A\u0640', 'Yā (Anfang)', '[{"id":"1","text":"Yā (Anfang)","is_correct":true,"audio_url":null},{"id":"2","text":"Yā (Ende)","is_correct":false,"audio_url":null},{"id":"3","text":"Lām (Anfang)","is_correct":false,"audio_url":null}]'),
  (21, E'\u0640\u064A\u0640', 'Yā (Mitte)', '[{"id":"1","text":"Yā (Mitte)","is_correct":true,"audio_url":null},{"id":"2","text":"Yā (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Nūn (Mitte)","is_correct":false,"audio_url":null}]'),
  (22, E'\u0640\u064A', 'Yā (Ende)', '[{"id":"1","text":"Yā (Ende)","is_correct":true,"audio_url":null},{"id":"2","text":"Yā (Anfang)","is_correct":false,"audio_url":null},{"id":"3","text":"Lām (Ende)","is_correct":false,"audio_url":null}]')
) AS v(ord, c, tr, opts);
