-- Reset Levels and Items
DELETE FROM learning_items;
DELETE FROM learning_levels;

-- Insert 13 Tajweed Levels
INSERT INTO learning_levels (level_number, title, description, unlock_requirement) VALUES
(1, 'Buchstaben richtig aussprechen', 'Lerne die Aussprache-Grundlagen (Makharij)', NULL),
(2, 'Harakāt – kurze Vokale', 'Fatha (a), Kasra (i), Damma (u)', 'Schließe Stufe 1 ab'),
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
(13, 'Stoppen & Pausen', 'Waqf-Regeln', 'Schließe Stufe 12 ab');

-- Insert Sample Items for Level 1 (Alphabet)
INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
(1, 'ا', 'Alif', 1, '[{"id": "1", "text": "Alif", "is_correct": true}, {"id": "2", "text": "Ba", "is_correct": false}, {"id": "3", "text": "Ta", "is_correct": false}]'),
(1, 'ب', 'Ba', 2, '[{"id": "1", "text": "Ba", "is_correct": true}, {"id": "2", "text": "Ta", "is_correct": false}, {"id": "3", "text": "Sa", "is_correct": false}]'),
(1, 'ت', 'Ta', 3, '[{"id": "1", "text": "Ta", "is_correct": true}, {"id": "2", "text": "Ba", "is_correct": false}, {"id": "3", "text": "Tha", "is_correct": false}]');

-- Insert Sample Items for Level 2 (Harakat)
INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
(2, 'بَ', 'Ba (Fatha) - a', 1, '[{"id": "1", "text": "Ba (a)", "is_correct": true}, {"id": "2", "text": "Bi (i)", "is_correct": false}, {"id": "3", "text": "Bu (u)", "is_correct": false}]'),
(2, 'بِ', 'Bi (Kasra) - i', 2, '[{"id": "1", "text": "Bi (i)", "is_correct": true}, {"id": "2", "text": "Ba (a)", "is_correct": false}, {"id": "3", "text": "Bu (u)", "is_correct": false}]'),
(2, 'بُ', 'Bu (Damma) - u', 3, '[{"id": "1", "text": "Bu (u)", "is_correct": true}, {"id": "2", "text": "Ba (a)", "is_correct": false}, {"id": "3", "text": "Bi (i)", "is_correct": false}]');

-- Insert Sample Items for Level 3 (Sukun)
INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
(3, 'أَبْ', 'Ab (Alif Fatha, Ba Sukun)', 1, '[{"id": "1", "text": "Ab", "is_correct": true}, {"id": "2", "text": "Aba", "is_correct": false}, {"id": "3", "text": "Abu", "is_correct": false}]'),
(3, 'قُلْ', 'Qul (Qaf Damma, Lam Sukun)', 2, '[{"id": "1", "text": "Qul", "is_correct": true}, {"id": "2", "text": "Qula", "is_correct": false}, {"id": "3", "text": "Qulu", "is_correct": false}]');

-- Insert Sample Items for Level 4 (Shaddah)
INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
(4, 'رَبُّ', 'Rabbu (Ba mit Shaddah)', 1, '[{"id": "1", "text": "Rabbu", "is_correct": true}, {"id": "2", "text": "Rabu", "is_correct": false}, {"id": "3", "text": "Rab", "is_correct": false}]'),
(4, 'إِنَّ', 'Inna (Nun mit Shaddah)', 2, '[{"id": "1", "text": "Inna", "is_correct": true}, {"id": "2", "text": "Ina", "is_correct": false}, {"id": "3", "text": "In", "is_correct": false}]');

-- Insert Sample Items for Level 5 (Dehnung)
INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
(5, 'قَالَ', 'Qaala (Qaf Fatha + Alif)', 1, '[{"id": "1", "text": "Qaala (lang)", "is_correct": true}, {"id": "2", "text": "Qala (kurz)", "is_correct": false}, {"id": "3", "text": "Qila", "is_correct": false}]'),
(5, 'قِيلَ', 'Qiila (Qaf Kasra + Ya)', 2, '[{"id": "1", "text": "Qiila (lang)", "is_correct": true}, {"id": "2", "text": "Qila (kurz)", "is_correct": false}, {"id": "3", "text": "Qula", "is_correct": false}]');

-- Insert Sample Items for Level 6 (Nun Rules)
INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
(6, 'مَنْ آمَنَ', 'Man Amana (Izhar - klar)', 1, '[{"id": "1", "text": "Man Amana (Klar)", "is_correct": true}, {"id": "2", "text": "May Amana (Verschmolzen)", "is_correct": false}, {"id": "3", "text": "Ma Amana", "is_correct": false}]'),
(6, 'مَنْ يَقُولُ', 'May Yaqulu (Idgham - verschmolzen)', 2, '[{"id": "1", "text": "May Yaqulu (Verschmolzen)", "is_correct": true}, {"id": "2", "text": "Man Yaqulu (Klar)", "is_correct": false}, {"id": "3", "text": "Ma Yaqulu", "is_correct": false}]');

-- Insert Sample Items for Level 7 (Mim Rules)
INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
(7, 'لَهُمْ فِيهَا', 'Lahum Fiha (Izhar - klar)', 1, '[{"id": "1", "text": "Lahum Fiha (Klar)", "is_correct": true}, {"id": "2", "text": "Lahun Fiha", "is_correct": false}, {"id": "3", "text": "Lahu Fiha", "is_correct": false}]');

-- Insert Sample Items for Level 8 (Allah Lam)
INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
(8, 'ٱللّٰهُ', 'Allahu (Fatha davor -> Dick)', 1, '[{"id": "1", "text": "Dick (Allahu)", "is_correct": true}, {"id": "2", "text": "Dünn (Llahu)", "is_correct": false}, {"id": "3", "text": "Normal", "is_correct": false}]'),
(8, 'بِسْمِ ٱللّٰهِ', 'Bismillahi (Kasra davor -> Dünn)', 2, '[{"id": "1", "text": "Dünn (Lillahi)", "is_correct": true}, {"id": "2", "text": "Dick (Allahi)", "is_correct": false}, {"id": "3", "text": "Normal", "is_correct": false}]');

-- Insert Sample Items for Level 9 (Qalqalah)
INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
(9, 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', 'Al-Falaq (Qaf am Ende -> Echo)', 1, '[{"id": "1", "text": "Falaq (mit Echo)", "is_correct": true}, {"id": "2", "text": "Falaq (ohne Echo)", "is_correct": false}, {"id": "3", "text": "Falaqi", "is_correct": false}]');

-- Insert Sample Items for Level 10 (Hamza)
INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
(10, 'ٱلْحَمْدُ', 'Al-Hamdu (Start -> A)', 1, '[{"id": "1", "text": "Al-Hamdu (A gesprochen)", "is_correct": true}, {"id": "2", "text": "L-Hamdu (A stumm)", "is_correct": false}, {"id": "3", "text": "Il-Hamdu", "is_correct": false}]');

-- Insert Sample Items for Level 11 (Long Madd)
INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
(11, 'وَٱلضَّآلِّينَ', 'Wal-Daalleen (6 Zählzeiten)', 1, '[{"id": "1", "text": "Extrem lang (6)", "is_correct": true}, {"id": "2", "text": "Normal lang (2)", "is_correct": false}, {"id": "3", "text": "Kurz (1)", "is_correct": false}]');

-- Insert Sample Items for Level 12 (Ra Rules)
INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
(12, 'رَبُّنَا', 'Rabbuna (Fatha -> Dick)', 1, '[{"id": "1", "text": "Ra (Dick)", "is_correct": true}, {"id": "2", "text": "Ra (Dünn)", "is_correct": false}, {"id": "3", "text": "Ru", "is_correct": false}]'),
(12, 'رِزْقاً', 'Rizqan (Kasra -> Dünn)', 2, '[{"id": "1", "text": "Ri (Dünn)", "is_correct": true}, {"id": "2", "text": "Ri (Dick)", "is_correct": false}, {"id": "3", "text": "Ru", "is_correct": false}]');

-- Insert Sample Items for Level 13 (Waqf)
INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
(13, 'ٱلرَّحِيمِ', 'Ar-Raheem (Stop -> M Sukun)', 1, '[{"id": "1", "text": "Ar-Raheem (Sukun)", "is_correct": true}, {"id": "2", "text": "Ar-Raheemi (Vokal)", "is_correct": false}, {"id": "3", "text": "Ar-Raheema", "is_correct": false}]');
