-- Stufe 2: Vokale (Fatha, Kasra, Damma) - Reduzierte & Korrigierte Liste
-- Wir nehmen nur eine Auswahl von Buchstaben, aber decken alle Vokale ab.

-- Lösche vorherige Stufe 2 Einträge um Duplikate zu vermeiden (optional, aber empfohlen)
-- delete from learning_items where level_id = 2;

-- Alif (Basis)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'أَ', 'A (Alif mit Fatha)', 1),
(2, 'إِ', 'I (Alif mit Kasra)', 2),
(2, 'أُ', 'U (Alif mit Damma)', 3);

-- Ba (Beispiel für einfachen Buchstaben)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'بَ', 'Ba (Fatha) - a', 4),
(2, 'بِ', 'Bi (Kasra) - i', 5),
(2, 'بُ', 'Bu (Damma) - u', 6);

-- Tha (Zungenbuchstabe)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'ثَ', 'Tha (Fatha) - a', 7),
(2, 'ثِ', 'Thi (Kasra) - i', 8),
(2, 'ثُ', 'Thu (Damma) - u', 9);

-- Ha (Hha - scharfes H) - KORRIGIERT
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'حَ', 'Hha (Fatha) - a', 10),
(2, 'حِ', 'Hhi (Kasra) - i', 11),
(2, 'حُ', 'Hhu (Damma) - u', 12);

-- Kha (Rachenlaut)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'خَ', 'Kha (Fatha) - a', 13),
(2, 'خِ', 'Khi (Kasra) - i', 14),
(2, 'خُ', 'Khu (Damma) - u', 15);

-- Ra (Rollendes R)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'رَ', 'Ra (Fatha) - a', 16),
(2, 'رِ', 'Ri (Kasra) - i', 17),
(2, 'رُ', 'Ru (Damma) - u', 18);

-- Sin (Scharfes S)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'سَ', 'Sa (Fatha) - a', 19),
(2, 'سِ', 'Si (Kasra) - i', 20),
(2, 'سُ', 'Su (Damma) - u', 21);

-- Sad (Dumpfes S)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'صَ', 'Sa (Fatha) - a', 22),
(2, 'صِ', 'Si (Kasra) - i', 23),
(2, 'صُ', 'Su (Damma) - u', 24);

-- Ta (Taa - Dumpfes T) - KORRIGIERT
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'طَ', 'Tha (Fatha) - a', 25),
(2, 'طِ', 'Thi (Kasra) - i', 26),
(2, 'طُ', 'Thu (Damma) - u', 27);

-- Za (Zaa - Dumpfes Z) - KORRIGIERT
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'ظَ', 'Zha (Fatha) - a', 28),
(2, 'ظِ', 'Zhi (Kasra) - i', 29),
(2, 'ظُ', 'Zhu (Damma) - u', 30);

-- Ain (Kehllaut)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'عَ', 'Aa (Fatha) - a', 31),
(2, 'عِ', 'Ai (Kasra) - i', 32),
(2, 'عُ', 'Au (Damma) - u', 33);

-- Fa
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'فَ', 'Fa (Fatha) - a', 34),
(2, 'فِ', 'Fi (Kasra) - i', 35),
(2, 'فُ', 'Fu (Damma) - u', 36);

-- Qaf (Rachen-K)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'قَ', 'Qa (Fatha) - a', 37),
(2, 'قِ', 'Qi (Kasra) - i', 38),
(2, 'قُ', 'Qu (Damma) - u', 39);

-- Lam
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'لَ', 'La (Fatha) - a', 40),
(2, 'لِ', 'Li (Kasra) - i', 41),
(2, 'لُ', 'Lu (Damma) - u', 42);

-- Mim
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'مَ', 'Ma (Fatha) - a', 43),
(2, 'مِ', 'Mi (Kasra) - i', 44),
(2, 'مُ', 'Mu (Damma) - u', 45);

-- Ha (Weiches H)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'هَ', 'Ha (Fatha) - a', 46),
(2, 'هِ', 'Hi (Kasra) - i', 47),
(2, 'هُ', 'Hu (Damma) - u', 48);
