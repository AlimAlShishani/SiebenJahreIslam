-- ═══════════════════════════════════════════════════════════════════════════
-- 17_seed_vokale_sukoon.sql – Stufe 5: Vokale (Fathah/Dammah/Kasrah) & Sukoon
-- 10 Fragen: Einzelbuchstabe + Tashkeel → Antwort: Transliteration + (Tashkeel)
-- 20 Fragen: Kurze Wörter (2–3 Buchstaben), vorkommend im Koran, OHNE Madd, OHNE Schaddah
-- Sukoon = ۡ U+06E1 (nicht ْ)
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE learning_levels
SET description = '10× Einzelbuchstaben mit Tashkeel, 20× kurze Wörter (Fathah/Dammah/Kasrah/Sukoon ۡ) – ohne Madd, ohne Schaddah.'
WHERE level_number = 5;

DELETE FROM learning_items WHERE level_id = 5;

INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 5, v.c, v.tr, v.ord, v.opts::jsonb
FROM (VALUES
  -- ═══ 1–10: Einzelbuchstaben ═══
  (1,  E'\u0628\u064E', 'ba (Fathah)', '[{"id":"1","text":"ba (Fathah)","is_correct":true,"audio_url":null},{"id":"2","text":"bi (Kasrah)","is_correct":false,"audio_url":null},{"id":"3","text":"bu (Dammah)","is_correct":false,"audio_url":null}]'),
  (2,  E'\u062A\u064E', 'ta (Fathah)', '[{"id":"1","text":"ta (Fathah)","is_correct":true,"audio_url":null},{"id":"2","text":"ti (Kasrah)","is_correct":false,"audio_url":null},{"id":"3","text":"t (Sukoon)","is_correct":false,"audio_url":null}]'),
  (3,  E'\u0628\u064F', 'bu (Dammah)', '[{"id":"1","text":"bu (Dammah)","is_correct":true,"audio_url":null},{"id":"2","text":"ba (Fathah)","is_correct":false,"audio_url":null},{"id":"3","text":"bi (Kasrah)","is_correct":false,"audio_url":null}]'),
  (4,  E'\u0644\u064F', 'lu (Dammah)', '[{"id":"1","text":"lu (Dammah)","is_correct":true,"audio_url":null},{"id":"2","text":"la (Fathah)","is_correct":false,"audio_url":null},{"id":"3","text":"li (Kasrah)","is_correct":false,"audio_url":null}]'),
  (5,  E'\u0628\u0650', 'bi (Kasrah)', '[{"id":"1","text":"bi (Kasrah)","is_correct":true,"audio_url":null},{"id":"2","text":"ba (Fathah)","is_correct":false,"audio_url":null},{"id":"3","text":"bu (Dammah)","is_correct":false,"audio_url":null}]'),
  (6,  E'\u0645\u0650', 'mi (Kasrah)', '[{"id":"1","text":"mi (Kasrah)","is_correct":true,"audio_url":null},{"id":"2","text":"ma (Fathah)","is_correct":false,"audio_url":null},{"id":"3","text":"m (Sukoon)","is_correct":false,"audio_url":null}]'),
  (7,  E'\u0628\u06E1', 'b (Sukoon)', '[{"id":"1","text":"b (Sukoon)","is_correct":true,"audio_url":null},{"id":"2","text":"ba (Fathah)","is_correct":false,"audio_url":null},{"id":"3","text":"bi (Kasrah)","is_correct":false,"audio_url":null}]'),
  (8,  E'\u0646\u06E1', 'n (Sukoon)', '[{"id":"1","text":"n (Sukoon)","is_correct":true,"audio_url":null},{"id":"2","text":"na (Fathah)","is_correct":false,"audio_url":null},{"id":"3","text":"nu (Dammah)","is_correct":false,"audio_url":null}]'),
  (9,  E'\u062D\u064E', 'ḥa (Fathah)', '[{"id":"1","text":"ḥa (Fathah)","is_correct":true,"audio_url":null},{"id":"2","text":"ḥi (Kasrah)","is_correct":false,"audio_url":null},{"id":"3","text":"ḥ (Sukoon)","is_correct":false,"audio_url":null}]'),
  (10, E'\u0643\u064E', 'ka (Fathah)', '[{"id":"1","text":"ka (Fathah)","is_correct":true,"audio_url":null},{"id":"2","text":"ki (Kasrah)","is_correct":false,"audio_url":null},{"id":"3","text":"k (Sukoon)","is_correct":false,"audio_url":null}]'),
  -- ═══ 11–30: Kurze Wörter (2–3 Buchstaben, Koran, kein Madd, kein Schaddah) ═══
  (11, E'\u0645\u0650\u0646\u06E1', 'min', '[{"id":"1","text":"min","is_correct":true,"audio_url":null},{"id":"2","text":"man","is_correct":false,"audio_url":null},{"id":"3","text":"ma''","is_correct":false,"audio_url":null}]'),
  (12, E'\u0645\u064E\u0646\u06E1', 'man', '[{"id":"1","text":"man","is_correct":true,"audio_url":null},{"id":"2","text":"min","is_correct":false,"audio_url":null},{"id":"3","text":"lam","is_correct":false,"audio_url":null}]'),
  (13, E'\u0642\u064F\u0644\u06E1', 'qul', '[{"id":"1","text":"qul","is_correct":true,"audio_url":null},{"id":"2","text":"kun","is_correct":false,"audio_url":null},{"id":"3","text":"min","is_correct":false,"audio_url":null}]'),
  (14, E'\u0643\u064F\u0646\u06E1', 'kun', '[{"id":"1","text":"kun","is_correct":true,"audio_url":null},{"id":"2","text":"qul","is_correct":false,"audio_url":null},{"id":"3","text":"lan","is_correct":false,"audio_url":null}]'),
  (15, E'\u0644\u064E\u0645\u06E1', 'lam', '[{"id":"1","text":"lam","is_correct":true,"audio_url":null},{"id":"2","text":"lan","is_correct":false,"audio_url":null},{"id":"3","text":"man","is_correct":false,"audio_url":null}]'),
  (16, E'\u0644\u064E\u0646\u06E1', 'lan', '[{"id":"1","text":"lan","is_correct":true,"audio_url":null},{"id":"2","text":"lam","is_correct":false,"audio_url":null},{"id":"3","text":"qul","is_correct":false,"audio_url":null}]'),
  (17, E'\u0623\u064E\u0646\u06E1', 'an', '[{"id":"1","text":"an","is_correct":true,"audio_url":null},{"id":"2","text":"am","is_correct":false,"audio_url":null},{"id":"3","text":"min","is_correct":false,"audio_url":null}]'),
  (18, E'\u0623\u064E\u0645\u06E1', 'am', '[{"id":"1","text":"am","is_correct":true,"audio_url":null},{"id":"2","text":"an","is_correct":false,"audio_url":null},{"id":"3","text":"lam","is_correct":false,"audio_url":null}]'),
  (19, E'\u0639\u064E\u0646\u06E1', 'ʿan', '[{"id":"1","text":"ʿan","is_correct":true,"audio_url":null},{"id":"2","text":"min","is_correct":false,"audio_url":null},{"id":"3","text":"maʿ","is_correct":false,"audio_url":null}]'),
  (20, E'\u0645\u064E\u0639\u06E1', 'maʿ', '[{"id":"1","text":"maʿ","is_correct":true,"audio_url":null},{"id":"2","text":"min","is_correct":false,"audio_url":null},{"id":"3","text":"man","is_correct":false,"audio_url":null}]'),
  (21, E'\u0643\u064E\u062A\u064E\u0628\u064E', 'kataba', '[{"id":"1","text":"kataba","is_correct":true,"audio_url":null},{"id":"2","text":"naṣara","is_correct":false,"audio_url":null},{"id":"3","text":"fataḥa","is_correct":false,"audio_url":null}]'),
  (22, E'\u0646\u064E\u0635\u064E\u0631\u064E', 'naṣara', '[{"id":"1","text":"naṣara","is_correct":true,"audio_url":null},{"id":"2","text":"kataba","is_correct":false,"audio_url":null},{"id":"3","text":"dakhala","is_correct":false,"audio_url":null}]'),
  (23, E'\u0628\u064E\u0639\u064E\u062F\u064E', 'baʿada', '[{"id":"1","text":"baʿada","is_correct":true,"audio_url":null},{"id":"2","text":"kataba","is_correct":false,"audio_url":null},{"id":"3","text":"dhahaba","is_correct":false,"audio_url":null}]'),
  (24, E'\u0631\u064E\u062D\u0650\u0645\u064E', 'raḥima', '[{"id":"1","text":"raḥima","is_correct":true,"audio_url":null},{"id":"2","text":"naṣara","is_correct":false,"audio_url":null},{"id":"3","text":"ḥasiba","is_correct":false,"audio_url":null}]'),
  (25, E'\u0641\u064E\u062A\u064E\u062D\u064E', 'fataḥa', '[{"id":"1","text":"fataḥa","is_correct":true,"audio_url":null},{"id":"2","text":"kataba","is_correct":false,"audio_url":null},{"id":"3","text":"kharaja","is_correct":false,"audio_url":null}]'),
  (26, E'\u0630\u064E\u0647\u064E\u0628\u064E', 'dhahaba', '[{"id":"1","text":"dhahaba","is_correct":true,"audio_url":null},{"id":"2","text":"fataḥa","is_correct":false,"audio_url":null},{"id":"3","text":"samiʿa","is_correct":false,"audio_url":null}]'),
  (27, E'\u0633\u064E\u0645\u0650\u0639\u064E', 'samiʿa', '[{"id":"1","text":"samiʿa","is_correct":true,"audio_url":null},{"id":"2","text":"raḥima","is_correct":false,"audio_url":null},{"id":"3","text":"dakhala","is_correct":false,"audio_url":null}]'),
  (28, E'\u062D\u064E\u0633\u0650\u0628\u064E', 'ḥasiba', '[{"id":"1","text":"ḥasiba","is_correct":true,"audio_url":null},{"id":"2","text":"raḥima","is_correct":false,"audio_url":null},{"id":"3","text":"kataba","is_correct":false,"audio_url":null}]'),
  (29, E'\u062F\u064E\u062E\u064E\u0644\u064E', 'dakhala', '[{"id":"1","text":"dakhala","is_correct":true,"audio_url":null},{"id":"2","text":"kharaja","is_correct":false,"audio_url":null},{"id":"3","text":"nasara","is_correct":false,"audio_url":null}]'),
  (30, E'\u062E\u064E\u0631\u064E\u062C\u064E', 'kharaja', '[{"id":"1","text":"kharaja","is_correct":true,"audio_url":null},{"id":"2","text":"dakhala","is_correct":false,"audio_url":null},{"id":"3","text":"fataha","is_correct":false,"audio_url":null}]')
) AS v(ord, c, tr, opts);
