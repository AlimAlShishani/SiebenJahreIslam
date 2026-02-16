-- 1. Lösche Inhalte ab Stufe 3 (behalte Stufe 1 und 2)
DELETE FROM learning_items 
WHERE level_id IN (SELECT id FROM learning_levels WHERE level_number >= 3);

DELETE FROM learning_levels 
WHERE level_number >= 3;

-- 2. Füge die neuen Stufen 3-13 hinzu
INSERT INTO learning_levels (level_number, title, description, unlock_requirement) VALUES
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

-- 3. Füge Beispiel-Items für die neuen Stufen hinzu
-- Hinweis: Wir gehen davon aus, dass die IDs für Level 3-13 neu generiert werden.
-- Wir nutzen eine Funktion oder direkten Insert mit Subquery, um die korrekte level_id zu bekommen.

DO $$
DECLARE
    l_id integer;
BEGIN
    -- Level 3: Sukun
    SELECT id INTO l_id FROM learning_levels WHERE level_number = 3;
    INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
    (l_id, 'أَبْ', 'Ab (Alif Fatha, Ba Sukun)', 1, '[{"id": "1", "text": "Ab", "is_correct": true}, {"id": "2", "text": "Aba", "is_correct": false}, {"id": "3", "text": "Abu", "is_correct": false}]'),
    (l_id, 'قُلْ', 'Qul (Qaf Damma, Lam Sukun)', 2, '[{"id": "1", "text": "Qul", "is_correct": true}, {"id": "2", "text": "Qula", "is_correct": false}, {"id": "3", "text": "Qulu", "is_correct": false}]');

    -- Level 4: Shaddah
    SELECT id INTO l_id FROM learning_levels WHERE level_number = 4;
    INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
    (l_id, 'رَبُّ', 'Rabbu (Ba mit Shaddah)', 1, '[{"id": "1", "text": "Rabbu", "is_correct": true}, {"id": "2", "text": "Rabu", "is_correct": false}, {"id": "3", "text": "Rab", "is_correct": false}]'),
    (l_id, 'إِنَّ', 'Inna (Nun mit Shaddah)', 2, '[{"id": "1", "text": "Inna", "is_correct": true}, {"id": "2", "text": "Ina", "is_correct": false}, {"id": "3", "text": "In", "is_correct": false}]');

    -- Level 5: Dehnung
    SELECT id INTO l_id FROM learning_levels WHERE level_number = 5;
    INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
    (l_id, 'قَالَ', 'Qaala (Qaf Fatha + Alif)', 1, '[{"id": "1", "text": "Qaala (lang)", "is_correct": true}, {"id": "2", "text": "Qala (kurz)", "is_correct": false}, {"id": "3", "text": "Qila", "is_correct": false}]'),
    (l_id, 'قِيلَ', 'Qiila (Qaf Kasra + Ya)', 2, '[{"id": "1", "text": "Qiila (lang)", "is_correct": true}, {"id": "2", "text": "Qila (kurz)", "is_correct": false}, {"id": "3", "text": "Qula", "is_correct": false}]');

    -- Level 6: Nun Rules
    SELECT id INTO l_id FROM learning_levels WHERE level_number = 6;
    INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
    (l_id, 'مَنْ آمَنَ', 'Man Amana (Izhar - klar)', 1, '[{"id": "1", "text": "Man Amana (Klar)", "is_correct": true}, {"id": "2", "text": "May Amana (Verschmolzen)", "is_correct": false}, {"id": "3", "text": "Ma Amana", "is_correct": false}]'),
    (l_id, 'مَنْ يَقُولُ', 'May Yaqulu (Idgham - verschmolzen)', 2, '[{"id": "1", "text": "May Yaqulu (Verschmolzen)", "is_correct": true}, {"id": "2", "text": "Man Yaqulu (Klar)", "is_correct": false}, {"id": "3", "text": "Ma Yaqulu", "is_correct": false}]');

    -- Level 7: Mim Rules
    SELECT id INTO l_id FROM learning_levels WHERE level_number = 7;
    INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
    (l_id, 'لَهُمْ فِيهَا', 'Lahum Fiha (Izhar - klar)', 1, '[{"id": "1", "text": "Lahum Fiha (Klar)", "is_correct": true}, {"id": "2", "text": "Lahun Fiha", "is_correct": false}, {"id": "3", "text": "Lahu Fiha", "is_correct": false}]');

    -- Level 8: Allah Lam
    SELECT id INTO l_id FROM learning_levels WHERE level_number = 8;
    INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
    (l_id, 'ٱللّٰهُ', 'Allahu (Fatha davor -> Dick)', 1, '[{"id": "1", "text": "Dick (Allahu)", "is_correct": true}, {"id": "2", "text": "Dünn (Llahu)", "is_correct": false}, {"id": "3", "text": "Normal", "is_correct": false}]'),
    (l_id, 'بِسْمِ ٱللّٰهِ', 'Bismillahi (Kasra davor -> Dünn)', 2, '[{"id": "1", "text": "Dünn (Lillahi)", "is_correct": true}, {"id": "2", "text": "Dick (Allahi)", "is_correct": false}, {"id": "3", "text": "Normal", "is_correct": false}]');

    -- Level 9: Qalqalah
    SELECT id INTO l_id FROM learning_levels WHERE level_number = 9;
    INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
    (l_id, 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', 'Al-Falaq (Qaf am Ende -> Echo)', 1, '[{"id": "1", "text": "Falaq (mit Echo)", "is_correct": true}, {"id": "2", "text": "Falaq (ohne Echo)", "is_correct": false}, {"id": "3", "text": "Falaqi", "is_correct": false}]');

    -- Level 10: Hamza
    SELECT id INTO l_id FROM learning_levels WHERE level_number = 10;
    INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
    (l_id, 'ٱلْحَمْدُ', 'Al-Hamdu (Start -> A)', 1, '[{"id": "1", "text": "Al-Hamdu (A gesprochen)", "is_correct": true}, {"id": "2", "text": "L-Hamdu (A stumm)", "is_correct": false}, {"id": "3", "text": "Il-Hamdu", "is_correct": false}]');

    -- Level 11: Long Madd
    SELECT id INTO l_id FROM learning_levels WHERE level_number = 11;
    INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
    (l_id, 'وَٱلضَّآلِّينَ', 'Wal-Daalleen (6 Zählzeiten)', 1, '[{"id": "1", "text": "Extrem lang (6)", "is_correct": true}, {"id": "2", "text": "Normal lang (2)", "is_correct": false}, {"id": "3", "text": "Kurz (1)", "is_correct": false}]');

    -- Level 12: Ra Rules
    SELECT id INTO l_id FROM learning_levels WHERE level_number = 12;
    INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
    (l_id, 'رَبُّنَا', 'Rabbuna (Fatha -> Dick)', 1, '[{"id": "1", "text": "Ra (Dick)", "is_correct": true}, {"id": "2", "text": "Ra (Dünn)", "is_correct": false}, {"id": "3", "text": "Ru", "is_correct": false}]'),
    (l_id, 'رِزْقاً', 'Rizqan (Kasra -> Dünn)', 2, '[{"id": "1", "text": "Ri (Dünn)", "is_correct": true}, {"id": "2", "text": "Ri (Dick)", "is_correct": false}, {"id": "3", "text": "Ru", "is_correct": false}]');

    -- Level 13: Waqf
    SELECT id INTO l_id FROM learning_levels WHERE level_number = 13;
    INSERT INTO learning_items (level_id, content, transliteration, order_index, options) VALUES
    (l_id, 'ٱلرَّحِيمِ', 'Ar-Raheem (Stop -> M Sukun)', 1, '[{"id": "1", "text": "Ar-Raheem (Sukun)", "is_correct": true}, {"id": "2", "text": "Ar-Raheemi (Vokal)", "is_correct": false}, {"id": "3", "text": "Ar-Raheema", "is_correct": false}]');

END $$;
