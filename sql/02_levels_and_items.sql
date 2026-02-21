-- ═══════════════════════════════════════════════════════════════════════════
-- 02_levels_and_items.sql – 13 Tajwīd-Stufen + Lerninhalte Stufe 1–6
-- level_id in learning_items = learning_levels.level_number (1–13).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) 13 Stufen einfügen/aktualisieren
INSERT INTO learning_levels (level_number, title, description, unlock_requirement) VALUES
(1, 'Alphabet', 'Lerne die arabischen Buchstaben', NULL),
(2, 'Vokale', 'Buchstaben mit Fatha, Kasra, Damma', NULL),
(3, 'Sukūn – Buchstaben ohne Vokal', 'Lerne stille Buchstaben zu lesen', 'Schließe Stufe 2 ab'),
(4, 'Shaddah – Doppelbuchstaben', 'Verdopplung und Stärkung von Buchstaben', 'Schließe Stufe 3 ab'),
(5, 'Dehnung (Grundregel)', 'Wann Laute länger gezogen werden', 'Schließe Stufe 4 ab'),
(6, 'Regeln beim N-Laut', 'Nun Sakinah und Tanwin', 'Schließe Stufe 5 ab'),
(7, 'Regeln beim M-Laut', 'Mim Sakinah Regeln', 'Schließe Stufe 6 ab'),
(8, 'Das harte „L“ in Allah', 'Wann Allah dick oder dünn ausgesprochen wird', 'Schließe Stufe 7 ab'),
(9, 'Echo-Buchstaben (Qalqalah)', 'Kutb Jadd (q, t, b, j, d)', 'Schließe Stufe 8 ab'),
(10, 'Hamza-Regeln', 'Starten & Verbinden (Hamzatul Wasl)', 'Schließe Stufe 9 ab'),
(11, 'Fortgeschrittene Dehnung', 'Längere Madd-Regeln (4-6 Zählzeiten)', 'Schließe Stufe 10 ab'),
(12, 'R-Regeln', 'Wann Ra dick oder dünn ist', 'Schließe Stufe 11 ab'),
(13, 'Stoppen & Pausen', 'Waqf-Regeln', 'Schließe Stufe 12 ab')
ON CONFLICT (level_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  unlock_requirement = EXCLUDED.unlock_requirement;

-- 2) Alte Items Stufe 1–6 entfernen, dann neue einfügen
DELETE FROM learning_items WHERE level_id BETWEEN 1 AND 6;

-- ========== STUFE 1: Buchstaben (29 Fragen) ==========
INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 1, v.content, v.transliteration, v.order_index, v.options
FROM (VALUES
  ('أ','Alif',1,'[{"id":"1","text":"Alif","is_correct":true,"audio_url":null},{"id":"2","text":"ʿAyn","is_correct":false,"audio_url":null},{"id":"3","text":"Hamza","is_correct":false,"audio_url":null}]'::jsonb),
  ('ب','Ba',2,'[{"id":"1","text":"Ta","is_correct":false,"audio_url":null},{"id":"2","text":"Ba","is_correct":true,"audio_url":null},{"id":"3","text":"Tha","is_correct":false,"audio_url":null}]'::jsonb),
  ('ت','Ta',3,'[{"id":"1","text":"Ta","is_correct":true,"audio_url":null},{"id":"2","text":"Ba","is_correct":false,"audio_url":null},{"id":"3","text":"Nun","is_correct":false,"audio_url":null}]'::jsonb),
  ('ث','Tha',4,'[{"id":"1","text":"Sin","is_correct":false,"audio_url":null},{"id":"2","text":"Tha","is_correct":true,"audio_url":null},{"id":"3","text":"Shin","is_correct":false,"audio_url":null}]'::jsonb),
  ('ج','Jim',5,'[{"id":"1","text":"Jim","is_correct":true,"audio_url":null},{"id":"2","text":"Ha","is_correct":false,"audio_url":null},{"id":"3","text":"Kha","is_correct":false,"audio_url":null}]'::jsonb),
  ('ح','Ḥa',6,'[{"id":"1","text":"Ha","is_correct":false,"audio_url":null},{"id":"2","text":"Ḥa","is_correct":true,"audio_url":null},{"id":"3","text":"Kaf","is_correct":false,"audio_url":null}]'::jsonb),
  ('خ','Kha',7,'[{"id":"1","text":"Kha","is_correct":true,"audio_url":null},{"id":"2","text":"Ḥa","is_correct":false,"audio_url":null},{"id":"3","text":"Ha","is_correct":false,"audio_url":null}]'::jsonb),
  ('د','Dal',8,'[{"id":"1","text":"Dal","is_correct":true,"audio_url":null},{"id":"2","text":"Dhad","is_correct":false,"audio_url":null},{"id":"3","text":"Dhal","is_correct":false,"audio_url":null}]'::jsonb),
  ('ذ','Dhal',9,'[{"id":"1","text":"Dal","is_correct":false,"audio_url":null},{"id":"2","text":"Dhal","is_correct":true,"audio_url":null},{"id":"3","text":"Zay","is_correct":false,"audio_url":null}]'::jsonb),
  ('ر','Ra',10,'[{"id":"1","text":"Zay","is_correct":false,"audio_url":null},{"id":"2","text":"Ra","is_correct":true,"audio_url":null},{"id":"3","text":"Lam","is_correct":false,"audio_url":null}]'::jsonb),
  ('ز','Zay',11,'[{"id":"1","text":"Zay","is_correct":true,"audio_url":null},{"id":"2","text":"Ra","is_correct":false,"audio_url":null},{"id":"3","text":"Sin","is_correct":false,"audio_url":null}]'::jsonb),
  ('س','Sin',12,'[{"id":"1","text":"Sad","is_correct":false,"audio_url":null},{"id":"2","text":"Sin","is_correct":true,"audio_url":null},{"id":"3","text":"Shin","is_correct":false,"audio_url":null}]'::jsonb),
  ('ش','Shin',13,'[{"id":"1","text":"Sin","is_correct":false,"audio_url":null},{"id":"2","text":"Shin","is_correct":true,"audio_url":null},{"id":"3","text":"Tha","is_correct":false,"audio_url":null}]'::jsonb),
  ('ص','Sad',14,'[{"id":"1","text":"Sin","is_correct":false,"audio_url":null},{"id":"2","text":"Sad","is_correct":true,"audio_url":null},{"id":"3","text":"Dhad","is_correct":false,"audio_url":null}]'::jsonb),
  ('ض','Dhad',15,'[{"id":"1","text":"Dhad","is_correct":true,"audio_url":null},{"id":"2","text":"Dal","is_correct":false,"audio_url":null},{"id":"3","text":"Dhal","is_correct":false,"audio_url":null}]'::jsonb),
  ('ط','Ṭa',16,'[{"id":"1","text":"Ta","is_correct":false,"audio_url":null},{"id":"2","text":"Ṭa","is_correct":true,"audio_url":null},{"id":"3","text":"Sad","is_correct":false,"audio_url":null}]'::jsonb),
  ('ظ','Ẓa',17,'[{"id":"1","text":"Dhal","is_correct":false,"audio_url":null},{"id":"2","text":"Ẓa","is_correct":true,"audio_url":null},{"id":"3","text":"Zay","is_correct":false,"audio_url":null}]'::jsonb),
  ('ع','ʿAyn',18,'[{"id":"1","text":"Ghain","is_correct":false,"audio_url":null},{"id":"2","text":"Hamza","is_correct":false,"audio_url":null},{"id":"3","text":"ʿAyn","is_correct":true,"audio_url":null}]'::jsonb),
  ('غ','Ghain',19,'[{"id":"1","text":"ʿAyn","is_correct":false,"audio_url":null},{"id":"2","text":"Ghain","is_correct":true,"audio_url":null},{"id":"3","text":"Fa","is_correct":false,"audio_url":null}]'::jsonb),
  ('ف','Fa',20,'[{"id":"1","text":"Qaf","is_correct":false,"audio_url":null},{"id":"2","text":"Fa","is_correct":true,"audio_url":null},{"id":"3","text":"Kaf","is_correct":false,"audio_url":null}]'::jsonb),
  ('ق','Qaf',21,'[{"id":"1","text":"Qaf","is_correct":true,"audio_url":null},{"id":"2","text":"Kaf","is_correct":false,"audio_url":null},{"id":"3","text":"Fa","is_correct":false,"audio_url":null}]'::jsonb),
  ('ك','Kaf',22,'[{"id":"1","text":"Lam","is_correct":false,"audio_url":null},{"id":"2","text":"Kaf","is_correct":true,"audio_url":null},{"id":"3","text":"Qaf","is_correct":false,"audio_url":null}]'::jsonb),
  ('ل','Lam',23,'[{"id":"1","text":"Lam","is_correct":true,"audio_url":null},{"id":"2","text":"Mim","is_correct":false,"audio_url":null},{"id":"3","text":"Nun","is_correct":false,"audio_url":null}]'::jsonb),
  ('م','Mim',24,'[{"id":"1","text":"Nun","is_correct":false,"audio_url":null},{"id":"2","text":"Mim","is_correct":true,"audio_url":null},{"id":"3","text":"Waw","is_correct":false,"audio_url":null}]'::jsonb),
  ('ن','Nun',25,'[{"id":"1","text":"Nun","is_correct":true,"audio_url":null},{"id":"2","text":"Mim","is_correct":false,"audio_url":null},{"id":"3","text":"Ya","is_correct":false,"audio_url":null}]'::jsonb),
  ('ه','Ha',26,'[{"id":"1","text":"Ha","is_correct":true,"audio_url":null},{"id":"2","text":"Ḥa","is_correct":false,"audio_url":null},{"id":"3","text":"Kha","is_correct":false,"audio_url":null}]'::jsonb),
  ('و','Waw',27,'[{"id":"1","text":"Ya","is_correct":false,"audio_url":null},{"id":"2","text":"Waw","is_correct":true,"audio_url":null},{"id":"3","text":"Nun","is_correct":false,"audio_url":null}]'::jsonb),
  ('ي','Ya',28,'[{"id":"1","text":"Ya","is_correct":true,"audio_url":null},{"id":"2","text":"Waw","is_correct":false,"audio_url":null},{"id":"3","text":"Fa","is_correct":false,"audio_url":null}]'::jsonb),
  ('ء','Hamza',29,'[{"id":"1","text":"Alif","is_correct":false,"audio_url":null},{"id":"2","text":"Hamza","is_correct":true,"audio_url":null},{"id":"3","text":"ʿAyn","is_correct":false,"audio_url":null}]'::jsonb)
) AS v(content, transliteration, order_index, options);

-- ========== STUFE 2: Harakāt (28 Fragen) ==========
INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 2, v.content, v.transliteration, v.order_index, v.options
FROM (VALUES
  ('بَ','ba',1,'[{"id":"1","text":"bu","is_correct":false,"audio_url":null},{"id":"2","text":"ba","is_correct":true,"audio_url":null},{"id":"3","text":"bi","is_correct":false,"audio_url":null}]'::jsonb),
  ('بُ','bu',2,'[{"id":"1","text":"ba","is_correct":false,"audio_url":null},{"id":"2","text":"bi","is_correct":false,"audio_url":null},{"id":"3","text":"bu","is_correct":true,"audio_url":null}]'::jsonb),
  ('تِ','ti',3,'[{"id":"1","text":"ti","is_correct":true,"audio_url":null},{"id":"2","text":"ta","is_correct":false,"audio_url":null},{"id":"3","text":"tu","is_correct":false,"audio_url":null}]'::jsonb),
  ('ثَ','tha',4,'[{"id":"1","text":"tha","is_correct":true,"audio_url":null},{"id":"2","text":"thī","is_correct":false,"audio_url":null},{"id":"3","text":"thu","is_correct":false,"audio_url":null}]'::jsonb),
  ('جُ','ju',5,'[{"id":"1","text":"ju","is_correct":true,"audio_url":null},{"id":"2","text":"ji","is_correct":false,"audio_url":null},{"id":"3","text":"ja","is_correct":false,"audio_url":null}]'::jsonb),
  ('حِ','ḥi',6,'[{"id":"1","text":"hi","is_correct":false,"audio_url":null},{"id":"2","text":"ḥi","is_correct":true,"audio_url":null},{"id":"3","text":"khī","is_correct":false,"audio_url":null}]'::jsonb),
  ('خَ','kha',7,'[{"id":"1","text":"kha","is_correct":true,"audio_url":null},{"id":"2","text":"ḥa","is_correct":false,"audio_url":null},{"id":"3","text":"ha","is_correct":false,"audio_url":null}]'::jsonb),
  ('دُ','du',8,'[{"id":"1","text":"du","is_correct":true,"audio_url":null},{"id":"2","text":"dhū","is_correct":false,"audio_url":null},{"id":"3","text":"ḍu","is_correct":false,"audio_url":null}]'::jsonb),
  ('ذِ','dhi',9,'[{"id":"1","text":"dhi","is_correct":true,"audio_url":null},{"id":"2","text":"zi","is_correct":false,"audio_url":null},{"id":"3","text":"di","is_correct":false,"audio_url":null}]'::jsonb),
  ('رَ','ra',10,'[{"id":"1","text":"ra","is_correct":true,"audio_url":null},{"id":"2","text":"za","is_correct":false,"audio_url":null},{"id":"3","text":"ṭa","is_correct":false,"audio_url":null}]'::jsonb),
  ('زُ','zu',11,'[{"id":"1","text":"zu","is_correct":true,"audio_url":null},{"id":"2","text":"su","is_correct":false,"audio_url":null},{"id":"3","text":"ṣu","is_correct":false,"audio_url":null}]'::jsonb),
  ('سِ','si',12,'[{"id":"1","text":"si","is_correct":true,"audio_url":null},{"id":"2","text":"shi","is_correct":false,"audio_url":null},{"id":"3","text":"ṣī","is_correct":false,"audio_url":null}]'::jsonb),
  ('شَ','sha',13,'[{"id":"1","text":"sha","is_correct":true,"audio_url":null},{"id":"2","text":"sa","is_correct":false,"audio_url":null},{"id":"3","text":"ṣa","is_correct":false,"audio_url":null}]'::jsonb),
  ('صُ','ṣu',14,'[{"id":"1","text":"su","is_correct":false,"audio_url":null},{"id":"2","text":"ṣu","is_correct":true,"audio_url":null},{"id":"3","text":"ṣa","is_correct":false,"audio_url":null}]'::jsonb),
  ('ضَ','ḍa',15,'[{"id":"1","text":"ḍa","is_correct":true,"audio_url":null},{"id":"2","text":"da","is_correct":false,"audio_url":null},{"id":"3","text":"dha","is_correct":false,"audio_url":null}]'::jsonb),
  ('طِ','ṭi',16,'[{"id":"1","text":"ti","is_correct":false,"audio_url":null},{"id":"2","text":"ṭi","is_correct":true,"audio_url":null},{"id":"3","text":"ṭu","is_correct":false,"audio_url":null}]'::jsonb),
  ('ظُ','ẓu',17,'[{"id":"1","text":"ẓu","is_correct":true,"audio_url":null},{"id":"2","text":"zu","is_correct":false,"audio_url":null},{"id":"3","text":"dhū","is_correct":false,"audio_url":null}]'::jsonb),
  ('عَ','ʿa',18,'[{"id":"1","text":"gha","is_correct":false,"audio_url":null},{"id":"2","text":"ʿa","is_correct":true,"audio_url":null},{"id":"3","text":"qa","is_correct":false,"audio_url":null}]'::jsonb),
  ('غِ','ghi',19,'[{"id":"1","text":"ghi","is_correct":true,"audio_url":null},{"id":"2","text":"ʿi","is_correct":false,"audio_url":null},{"id":"3","text":"khi","is_correct":false,"audio_url":null}]'::jsonb),
  ('فَ','fa',20,'[{"id":"1","text":"fa","is_correct":true,"audio_url":null},{"id":"2","text":"qa","is_correct":false,"audio_url":null},{"id":"3","text":"wa","is_correct":false,"audio_url":null}]'::jsonb),
  ('قُ','qu',21,'[{"id":"1","text":"qu","is_correct":true,"audio_url":null},{"id":"2","text":"ku","is_correct":false,"audio_url":null},{"id":"3","text":"gu","is_correct":false,"audio_url":null}]'::jsonb),
  ('كَ','ka',22,'[{"id":"1","text":"ka","is_correct":true,"audio_url":null},{"id":"2","text":"qa","is_correct":false,"audio_url":null},{"id":"3","text":"kha","is_correct":false,"audio_url":null}]'::jsonb),
  ('لِ','li',23,'[{"id":"1","text":"li","is_correct":true,"audio_url":null},{"id":"2","text":"ni","is_correct":false,"audio_url":null},{"id":"3","text":"ri","is_correct":false,"audio_url":null}]'::jsonb),
  ('مُ','mu',24,'[{"id":"1","text":"mu","is_correct":true,"audio_url":null},{"id":"2","text":"nu","is_correct":false,"audio_url":null},{"id":"3","text":"wu","is_correct":false,"audio_url":null}]'::jsonb),
  ('نَ','na',25,'[{"id":"1","text":"na","is_correct":true,"audio_url":null},{"id":"2","text":"ma","is_correct":false,"audio_url":null},{"id":"3","text":"ha","is_correct":false,"audio_url":null}]'::jsonb),
  ('هُ','hu',26,'[{"id":"1","text":"hu","is_correct":true,"audio_url":null},{"id":"2","text":"ḥu","is_correct":false,"audio_url":null},{"id":"3","text":"ʿu","is_correct":false,"audio_url":null}]'::jsonb),
  ('وَ','wa',27,'[{"id":"1","text":"wa","is_correct":true,"audio_url":null},{"id":"2","text":"wu","is_correct":false,"audio_url":null},{"id":"3","text":"wi","is_correct":false,"audio_url":null}]'::jsonb),
  ('يِ','yi',28,'[{"id":"1","text":"yi","is_correct":true,"audio_url":null},{"id":"2","text":"yu","is_correct":false,"audio_url":null},{"id":"3","text":"ya","is_correct":false,"audio_url":null}]'::jsonb)
) AS v(content, transliteration, order_index, options);

-- ========== STUFE 3: Sukūn (25 Fragen) ==========
INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 3, v.content, v.transliteration, v.order_index, v.options
FROM (VALUES
  ('اَسْ','as',1,'[{"id":"1","text":"as","is_correct":true,"audio_url":null},{"id":"2","text":"asa","is_correct":false,"audio_url":null},{"id":"3","text":"is","is_correct":false,"audio_url":null}]'::jsonb),
  ('بَسْ','bas',2,'[{"id":"1","text":"bas","is_correct":true,"audio_url":null},{"id":"2","text":"bisa","is_correct":false,"audio_url":null},{"id":"3","text":"bus","is_correct":false,"audio_url":null}]'::jsonb),
  ('مِنْ','min',3,'[{"id":"1","text":"min","is_correct":true,"audio_url":null},{"id":"2","text":"man","is_correct":false,"audio_url":null},{"id":"3","text":"mun","is_correct":false,"audio_url":null}]'::jsonb),
  ('لِرْ','lir',4,'[{"id":"1","text":"lar","is_correct":false,"audio_url":null},{"id":"2","text":"lir","is_correct":true,"audio_url":null},{"id":"3","text":"lur","is_correct":false,"audio_url":null}]'::jsonb),
  ('فُقْ','fuq',5,'[{"id":"1","text":"faq","is_correct":false,"audio_url":null},{"id":"2","text":"fiq","is_correct":false,"audio_url":null},{"id":"3","text":"fuq","is_correct":true,"audio_url":null}]'::jsonb),
  ('قُلْ','qul',6,'[{"id":"1","text":"qul","is_correct":true,"audio_url":null},{"id":"2","text":"qal","is_correct":false,"audio_url":null},{"id":"3","text":"qil","is_correct":false,"audio_url":null}]'::jsonb),
  ('يَسْ','yas',7,'[{"id":"1","text":"yas","is_correct":true,"audio_url":null},{"id":"2","text":"yis","is_correct":false,"audio_url":null},{"id":"3","text":"yus","is_correct":false,"audio_url":null}]'::jsonb),
  ('كُنْ','kun',8,'[{"id":"1","text":"kun","is_correct":true,"audio_url":null},{"id":"2","text":"kan","is_correct":false,"audio_url":null},{"id":"3","text":"kin","is_correct":false,"audio_url":null}]'::jsonb),
  ('عَبْ','ʿab',9,'[{"id":"1","text":"ʿab","is_correct":true,"audio_url":null},{"id":"2","text":"ʿib","is_correct":false,"audio_url":null},{"id":"3","text":"ʿub","is_correct":false,"audio_url":null}]'::jsonb),
  ('حِبْ','ḥib',10,'[{"id":"1","text":"ḥab","is_correct":false,"audio_url":null},{"id":"2","text":"ḥib","is_correct":true,"audio_url":null},{"id":"3","text":"ḥub","is_correct":false,"audio_url":null}]'::jsonb),
  ('خُذْ','khudh',11,'[{"id":"1","text":"khadh","is_correct":false,"audio_url":null},{"id":"2","text":"khudh","is_correct":true,"audio_url":null},{"id":"3","text":"khid","is_correct":false,"audio_url":null}]'::jsonb),
  ('اِذْ','idh',12,'[{"id":"1","text":"idh","is_correct":true,"audio_url":null},{"id":"2","text":"adh","is_correct":false,"audio_url":null},{"id":"3","text":"udh","is_correct":false,"audio_url":null}]'::jsonb),
  ('اَفْ','af',13,'[{"id":"1","text":"af","is_correct":true,"audio_url":null},{"id":"2","text":"if","is_correct":false,"audio_url":null},{"id":"3","text":"uf","is_correct":false,"audio_url":null}]'::jsonb),
  ('يُفْ','yuf',14,'[{"id":"1","text":"yuf","is_correct":true,"audio_url":null},{"id":"2","text":"yaf","is_correct":false,"audio_url":null},{"id":"3","text":"yif","is_correct":false,"audio_url":null}]'::jsonb),
  ('تَرْ','tar',15,'[{"id":"1","text":"tar","is_correct":true,"audio_url":null},{"id":"2","text":"tir","is_correct":false,"audio_url":null},{"id":"3","text":"tur","is_correct":false,"audio_url":null}]'::jsonb),
  ('نُصْ','nuṣ',16,'[{"id":"1","text":"nus","is_correct":false,"audio_url":null},{"id":"2","text":"naṣ","is_correct":false,"audio_url":null},{"id":"3","text":"nuṣ","is_correct":true,"audio_url":null}]'::jsonb),
  ('صَبْ','ṣab',17,'[{"id":"1","text":"ṣab","is_correct":true,"audio_url":null},{"id":"2","text":"sab","is_correct":false,"audio_url":null},{"id":"3","text":"ṣib","is_correct":false,"audio_url":null}]'::jsonb),
  ('ضِدْ','ḍid',18,'[{"id":"1","text":"did","is_correct":false,"audio_url":null},{"id":"2","text":"ḍid","is_correct":true,"audio_url":null},{"id":"3","text":"ḍud","is_correct":false,"audio_url":null}]'::jsonb),
  ('طِبْ','ṭib',19,'[{"id":"1","text":"ṭab","is_correct":false,"audio_url":null},{"id":"2","text":"ṭib","is_correct":true,"audio_url":null},{"id":"3","text":"tib","is_correct":false,"audio_url":null}]'::jsonb),
  ('ظُلْ','ẓul',20,'[{"id":"1","text":"ẓul","is_correct":true,"audio_url":null},{"id":"2","text":"zul","is_correct":false,"audio_url":null},{"id":"3","text":"ẓal","is_correct":false,"audio_url":null}]'::jsonb),
  ('غَفْ','ghaf',21,'[{"id":"1","text":"ghif","is_correct":false,"audio_url":null},{"id":"2","text":"ghaf","is_correct":true,"audio_url":null},{"id":"3","text":"ghuf","is_correct":false,"audio_url":null}]'::jsonb),
  ('عِلْمْ','ʿilm',22,'[{"id":"1","text":"ʿilm","is_correct":true,"audio_url":null},{"id":"2","text":"ʿalam","is_correct":false,"audio_url":null},{"id":"3","text":"ʿulm","is_correct":false,"audio_url":null}]'::jsonb),
  ('مَسْ','mas',23,'[{"id":"1","text":"mas","is_correct":true,"audio_url":null},{"id":"2","text":"mis","is_correct":false,"audio_url":null},{"id":"3","text":"mus","is_correct":false,"audio_url":null}]'::jsonb),
  ('هُمْ','hum',24,'[{"id":"1","text":"ham","is_correct":false,"audio_url":null},{"id":"2","text":"hum","is_correct":true,"audio_url":null},{"id":"3","text":"him","is_correct":false,"audio_url":null}]'::jsonb),
  ('اَنْتْ','ant',25,'[{"id":"1","text":"ant","is_correct":true,"audio_url":null},{"id":"2","text":"int","is_correct":false,"audio_url":null},{"id":"3","text":"unt","is_correct":false,"audio_url":null}]'::jsonb)
) AS v(content, transliteration, order_index, options);

-- ========== STUFE 4: Shaddah (25 Fragen) ==========
INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 4, v.content, v.transliteration, v.order_index, v.options
FROM (VALUES
  ('رَبَّ','rabba',1,'[{"id":"1","text":"raba","is_correct":false,"audio_url":null},{"id":"2","text":"rabba","is_correct":true,"audio_url":null},{"id":"3","text":"rāba","is_correct":false,"audio_url":null}]'::jsonb),
  ('حَقٌّ','ḥaqq',2,'[{"id":"1","text":"ḥaqq","is_correct":true,"audio_url":null},{"id":"2","text":"ḥaq","is_correct":false,"audio_url":null},{"id":"3","text":"ḥāq","is_correct":false,"audio_url":null}]'::jsonb),
  ('مَدَّ','madda',3,'[{"id":"1","text":"mada","is_correct":false,"audio_url":null},{"id":"2","text":"māda","is_correct":false,"audio_url":null},{"id":"3","text":"madda","is_correct":true,"audio_url":null}]'::jsonb),
  ('شَدَّ','shadda',4,'[{"id":"1","text":"shada","is_correct":false,"audio_url":null},{"id":"2","text":"shadda","is_correct":true,"audio_url":null},{"id":"3","text":"shāda","is_correct":false,"audio_url":null}]'::jsonb),
  ('سُبَّ','subba',5,'[{"id":"1","text":"subba","is_correct":true,"audio_url":null},{"id":"2","text":"suba","is_correct":false,"audio_url":null},{"id":"3","text":"sūba","is_correct":false,"audio_url":null}]'::jsonb),
  ('مُحَمَّدٌ','muḥammadun',6,'[{"id":"1","text":"muḥamadun","is_correct":false,"audio_url":null},{"id":"2","text":"muḥammadan","is_correct":false,"audio_url":null},{"id":"3","text":"muḥammadun","is_correct":true,"audio_url":null}]'::jsonb),
  ('إِنَّا','innā',7,'[{"id":"1","text":"inā","is_correct":false,"audio_url":null},{"id":"2","text":"innā","is_correct":true,"audio_url":null},{"id":"3","text":"inna","is_correct":false,"audio_url":null}]'::jsonb),
  ('إِلَّا','illā',8,'[{"id":"1","text":"ilā","is_correct":false,"audio_url":null},{"id":"2","text":"illā","is_correct":true,"audio_url":null},{"id":"3","text":"illa","is_correct":false,"audio_url":null}]'::jsonb),
  ('ثُمَّ','thumma',9,'[{"id":"1","text":"thumma","is_correct":true,"audio_url":null},{"id":"2","text":"thuma","is_correct":false,"audio_url":null},{"id":"3","text":"thūma","is_correct":false,"audio_url":null}]'::jsonb),
  ('عَمَّ','ʿamma',10,'[{"id":"1","text":"ʿama","is_correct":false,"audio_url":null},{"id":"2","text":"ʿammā","is_correct":false,"audio_url":null},{"id":"3","text":"ʿamma","is_correct":true,"audio_url":null}]'::jsonb),
  ('بَنَّ','banna',11,'[{"id":"1","text":"banna","is_correct":true,"audio_url":null},{"id":"2","text":"bana","is_correct":false,"audio_url":null},{"id":"3","text":"banā","is_correct":false,"audio_url":null}]'::jsonb),
  ('مَرَّ','marra',12,'[{"id":"1","text":"marra","is_correct":true,"audio_url":null},{"id":"2","text":"mara","is_correct":false,"audio_url":null},{"id":"3","text":"marā","is_correct":false,"audio_url":null}]'::jsonb),
  ('كَرَّ','karra',13,'[{"id":"1","text":"karra","is_correct":true,"audio_url":null},{"id":"2","text":"kara","is_correct":false,"audio_url":null},{"id":"3","text":"karā","is_correct":false,"audio_url":null}]'::jsonb),
  ('رَكَّ','rakka',14,'[{"id":"1","text":"rakka","is_correct":true,"audio_url":null},{"id":"2","text":"raka","is_correct":false,"audio_url":null},{"id":"3","text":"rakā","is_correct":false,"audio_url":null}]'::jsonb),
  ('جَنَّةٌ','jannatun',15,'[{"id":"1","text":"jannatun","is_correct":true,"audio_url":null},{"id":"2","text":"janatun","is_correct":false,"audio_url":null},{"id":"3","text":"jānatan","is_correct":false,"audio_url":null}]'::jsonb),
  ('صَفًّا','ṣaffan',16,'[{"id":"1","text":"ṣafān","is_correct":false,"audio_url":null},{"id":"2","text":"ṣaffan","is_correct":true,"audio_url":null},{"id":"3","text":"ṣafan","is_correct":false,"audio_url":null}]'::jsonb),
  ('تَبَّتْ','tabbat',17,'[{"id":"1","text":"tabbat","is_correct":true,"audio_url":null},{"id":"2","text":"tabat","is_correct":false,"audio_url":null},{"id":"3","text":"tābbat","is_correct":false,"audio_url":null}]'::jsonb),
  ('وَتَبَّ','wa-tabba',18,'[{"id":"1","text":"wa-tabba","is_correct":true,"audio_url":null},{"id":"2","text":"wa-taba","is_correct":false,"audio_url":null},{"id":"3","text":"wa-tāba","is_correct":false,"audio_url":null}]'::jsonb),
  ('عَدُوٌّ','ʿaduwwun',19,'[{"id":"1","text":"ʿaduwun","is_correct":false,"audio_url":null},{"id":"2","text":"ʿaduwwun","is_correct":true,"audio_url":null},{"id":"3","text":"ʿadūn","is_correct":false,"audio_url":null}]'::jsonb),
  ('غَفَّ','ghaffa',20,'[{"id":"1","text":"ghaffa","is_correct":true,"audio_url":null},{"id":"2","text":"ghafa","is_correct":false,"audio_url":null},{"id":"3","text":"ghafā","is_correct":false,"audio_url":null}]'::jsonb),
  ('قَوَّامٌ','qawwāmun',21,'[{"id":"1","text":"qawwāmun","is_correct":true,"audio_url":null},{"id":"2","text":"qawāmun","is_correct":false,"audio_url":null},{"id":"3","text":"qūwāmun","is_correct":false,"audio_url":null}]'::jsonb),
  ('شِدَّةٌ','shiddatun',22,'[{"id":"1","text":"shidatun","is_correct":false,"audio_url":null},{"id":"2","text":"shiddatun","is_correct":true,"audio_url":null},{"id":"3","text":"shīdatan","is_correct":false,"audio_url":null}]'::jsonb),
  ('فَجَّ','fajja',23,'[{"id":"1","text":"fajja","is_correct":true,"audio_url":null},{"id":"2","text":"faja","is_correct":false,"audio_url":null},{"id":"3","text":"fajā","is_correct":false,"audio_url":null}]'::jsonb),
  ('قَدَّرَ','qaddara',24,'[{"id":"1","text":"qadara","is_correct":false,"audio_url":null},{"id":"2","text":"qaddara","is_correct":true,"audio_url":null},{"id":"3","text":"qādara","is_correct":false,"audio_url":null}]'::jsonb),
  ('يُحِبُّ','yuḥibbu',25,'[{"id":"1","text":"yuḥibbu","is_correct":true,"audio_url":null},{"id":"2","text":"yuḥibu","is_correct":false,"audio_url":null},{"id":"3","text":"yuḥibb","is_correct":false,"audio_url":null}]'::jsonb)
) AS v(content, transliteration, order_index, options);

-- ========== STUFE 5: Dehnung (15 Fragen) ==========
INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 5, v.content, v.transliteration, v.order_index, v.options
FROM (VALUES
  ('بَا','bā',1,'[{"id":"1","text":"ba","is_correct":false,"audio_url":null},{"id":"2","text":"bā","is_correct":true,"audio_url":null},{"id":"3","text":"bba","is_correct":false,"audio_url":null}]'::jsonb),
  ('تِي','tī',2,'[{"id":"1","text":"tī","is_correct":true,"audio_url":null},{"id":"2","text":"ti","is_correct":false,"audio_url":null},{"id":"3","text":"tti","is_correct":false,"audio_url":null}]'::jsonb),
  ('نُو','nū',3,'[{"id":"1","text":"nu","is_correct":false,"audio_url":null},{"id":"2","text":"nū","is_correct":true,"audio_url":null},{"id":"3","text":"nnū","is_correct":false,"audio_url":null}]'::jsonb),
  ('قَالَ','qāla',4,'[{"id":"1","text":"qala","is_correct":false,"audio_url":null},{"id":"2","text":"qāla","is_correct":true,"audio_url":null},{"id":"3","text":"qalla","is_correct":false,"audio_url":null}]'::jsonb),
  ('كِيلَ','kīla',5,'[{"id":"1","text":"kila","is_correct":false,"audio_url":null},{"id":"2","text":"kīla","is_correct":true,"audio_url":null},{"id":"3","text":"kalla","is_correct":false,"audio_url":null}]'::jsonb),
  ('يَقُولُ','yaqūlu',6,'[{"id":"1","text":"yaqūlu","is_correct":true,"audio_url":null},{"id":"2","text":"yaqulu","is_correct":false,"audio_url":null},{"id":"3","text":"yaqqūlu","is_correct":false,"audio_url":null}]'::jsonb),
  ('سُورَة','sūra',7,'[{"id":"1","text":"sura","is_correct":false,"audio_url":null},{"id":"2","text":"sūra","is_correct":true,"audio_url":null},{"id":"3","text":"ssūra","is_correct":false,"audio_url":null}]'::jsonb),
  ('نَار','nār',8,'[{"id":"1","text":"nar","is_correct":false,"audio_url":null},{"id":"2","text":"nār","is_correct":true,"audio_url":null},{"id":"3","text":"nirr","is_correct":false,"audio_url":null}]'::jsonb),
  ('فِيل','fīl',9,'[{"id":"1","text":"fil","is_correct":false,"audio_url":null},{"id":"2","text":"fīl","is_correct":true,"audio_url":null},{"id":"3","text":"fill","is_correct":false,"audio_url":null}]'::jsonb),
  ('نُور','nūr',10,'[{"id":"1","text":"nur","is_correct":false,"audio_url":null},{"id":"2","text":"nūr","is_correct":true,"audio_url":null},{"id":"3","text":"nurr","is_correct":false,"audio_url":null}]'::jsonb),
  ('هَادِي','hādī',11,'[{"id":"1","text":"hadi","is_correct":false,"audio_url":null},{"id":"2","text":"hādī","is_correct":true,"audio_url":null},{"id":"3","text":"haddi","is_correct":false,"audio_url":null}]'::jsonb),
  ('وُجُود','wujūd',12,'[{"id":"1","text":"wujūd","is_correct":true,"audio_url":null},{"id":"2","text":"wujud","is_correct":false,"audio_url":null},{"id":"3","text":"wūjūd","is_correct":false,"audio_url":null}]'::jsonb),
  ('مَالِك','mālik',13,'[{"id":"1","text":"malik","is_correct":false,"audio_url":null},{"id":"2","text":"mālik","is_correct":true,"audio_url":null},{"id":"3","text":"mallik","is_correct":false,"audio_url":null}]'::jsonb),
  ('رَحِيم','raḥīm',14,'[{"id":"1","text":"raḥim","is_correct":false,"audio_url":null},{"id":"2","text":"raḥīm","is_correct":true,"audio_url":null},{"id":"3","text":"raḥḥīm","is_correct":false,"audio_url":null}]'::jsonb),
  ('شُكُور','shukūr',15,'[{"id":"1","text":"shukūr","is_correct":true,"audio_url":null},{"id":"2","text":"shukur","is_correct":false,"audio_url":null},{"id":"3","text":"shūkur","is_correct":false,"audio_url":null}]'::jsonb)
) AS v(content, transliteration, order_index, options);

-- ========== STUFE 6: Regeln beim N-Laut (15 Fragen) ==========
INSERT INTO learning_items (level_id, content, transliteration, order_index, options)
SELECT 6, v.content, v.transliteration, v.order_index, v.options
FROM (VALUES
  ('مِنْ هَادٍ','min hādin',1,'[{"id":"1","text":"min hādin","is_correct":true,"audio_url":null},{"id":"2","text":"mi hādin","is_correct":false,"audio_url":null},{"id":"3","text":"mim hādin","is_correct":false,"audio_url":null}]'::jsonb),
  ('مِنْ عِلْمٍ','min ʿilmin',2,'[{"id":"1","text":"min ʿilmin","is_correct":true,"audio_url":null},{"id":"2","text":"mi ʿilmin","is_correct":false,"audio_url":null},{"id":"3","text":"ming ʿilmin","is_correct":false,"audio_url":null}]'::jsonb),
  ('مِنْ حَكِيمٍ','min ḥakīmin',3,'[{"id":"1","text":"min ḥakīmin","is_correct":true,"audio_url":null},{"id":"2","text":"mi ḥakīmin","is_correct":false,"audio_url":null},{"id":"3","text":"mim ḥakīmin","is_correct":false,"audio_url":null}]'::jsonb),
  ('مِنْ رَبِّهِمْ','mir rabbihim',4,'[{"id":"1","text":"min rabbihim","is_correct":false,"audio_url":null},{"id":"2","text":"mir rabbihim","is_correct":true,"audio_url":null},{"id":"3","text":"mim rabbihim","is_correct":false,"audio_url":null}]'::jsonb),
  ('مِنْ لَّدُنْهُ','mil ladunhu',5,'[{"id":"1","text":"mil ladunhu","is_correct":true,"audio_url":null},{"id":"2","text":"min ladunhu","is_correct":false,"audio_url":null},{"id":"3","text":"mim ladunhu","is_correct":false,"audio_url":null}]'::jsonb),
  ('مَنْ يَقُولُ','may yaqūlu',6,'[{"id":"1","text":"man yaqūlu","is_correct":false,"audio_url":null},{"id":"2","text":"may yaqūlu","is_correct":true,"audio_url":null},{"id":"3","text":"mam yaqūlu","is_correct":false,"audio_url":null}]'::jsonb),
  ('مِنْ بَعْدِ','mim baʿdi',7,'[{"id":"1","text":"min baʿdi","is_correct":false,"audio_url":null},{"id":"2","text":"mim baʿdi","is_correct":true,"audio_url":null},{"id":"3","text":"mib baʿdi","is_correct":false,"audio_url":null}]'::jsonb),
  ('سَمِيعٌ بَصِيرٌ','samīʿum baṣīrun',8,'[{"id":"1","text":"samīʿun baṣīrun","is_correct":false,"audio_url":null},{"id":"2","text":"samīʿum baṣīrun","is_correct":true,"audio_url":null},{"id":"3","text":"samīʿub baṣīrun","is_correct":false,"audio_url":null}]'::jsonb),
  ('مِنْ قَبْلِ','min qabli',9,'[{"id":"1","text":"miq qabli","is_correct":false,"audio_url":null},{"id":"2","text":"min qabli","is_correct":true,"audio_url":null},{"id":"3","text":"ming qabli","is_correct":false,"audio_url":null}]'::jsonb),
  ('مِنْ سُوءٍ','min sūʾin',10,'[{"id":"1","text":"min sūʾin","is_correct":true,"audio_url":null},{"id":"2","text":"mis sūʾin","is_correct":false,"audio_url":null},{"id":"3","text":"mi sūʾin","is_correct":false,"audio_url":null}]'::jsonb),
  ('عَلِيمٌ شَاكِرٌ','ʿalīmun shākirun',11,'[{"id":"1","text":"ʿalīmun shākirun","is_correct":true,"audio_url":null},{"id":"2","text":"ʿalīmush shākirun","is_correct":false,"audio_url":null},{"id":"3","text":"ʿalīmi shākirun","is_correct":false,"audio_url":null}]'::jsonb),
  ('مِنْ تَحْتِهَا','min taḥtihā',12,'[{"id":"1","text":"mit taḥtihā","is_correct":false,"audio_url":null},{"id":"2","text":"min taḥtihā","is_correct":true,"audio_url":null},{"id":"3","text":"mim taḥtihā","is_correct":false,"audio_url":null}]'::jsonb),
  ('مِنْ دُونِهِ','min dūnihi',13,'[{"id":"1","text":"min dūnihi","is_correct":true,"audio_url":null},{"id":"2","text":"mid dūnihi","is_correct":false,"audio_url":null},{"id":"3","text":"mi dūnihi","is_correct":false,"audio_url":null}]'::jsonb),
  ('غَفُورٌ رَّحِيمٌ','ghafūrun raḥīmun',14,'[{"id":"1","text":"ghafūrun raḥīmun","is_correct":true,"audio_url":null},{"id":"2","text":"ghafūrr raḥīmun","is_correct":false,"audio_url":null},{"id":"3","text":"ghafūrur raḥīmun","is_correct":false,"audio_url":null}]'::jsonb),
  ('مِنْ جَنَّةٍ','min jannatin',15,'[{"id":"1","text":"min jannatin","is_correct":true,"audio_url":null},{"id":"2","text":"mij jannatin","is_correct":false,"audio_url":null},{"id":"3","text":"mim jannatin","is_correct":false,"audio_url":null}]'::jsonb)
) AS v(content, transliteration, order_index, options);
