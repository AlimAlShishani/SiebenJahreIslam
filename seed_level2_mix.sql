-- Stufe 2: Vokale - Mix (Alle Buchstaben mind. 1x, zufällige Vokale)

-- Lösche vorherige Stufe 2 Einträge
delete from learning_items where level_id = 2;

-- Alif (Fatha)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'أَ', 'A (Alif mit Fatha)', 1);

-- Ba (Kasra)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'بِ', 'Bi (Kasra) - i', 2);

-- Ta (Damma)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'تُ', 'Tu (Damma) - u', 3);

-- Tha (Fatha)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'ثَ', 'Tha (Fatha) - a', 4);

-- Jim (Kasra)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'جِ', 'Ji (Kasra) - i', 5);

-- Hha (Damma)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'حُ', 'Hhu (Damma) - u', 6);

-- Kha (Fatha)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'خَ', 'Kha (Fatha) - a', 7);

-- Dal (Kasra)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'دِ', 'Di (Kasra) - i', 8);

-- Dhal (Damma)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'ذُ', 'Dhu (Damma) - u', 9);

-- Ra (Fatha)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'رَ', 'Ra (Fatha) - a', 10);

-- Zay (Kasra)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'زِ', 'Zi (Kasra) - i', 11);

-- Sin (Damma)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'سُ', 'Su (Damma) - u', 12);

-- Shin (Fatha)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'شَ', 'Sha (Fatha) - a', 13);

-- Sad (Kasra)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'صِ', 'Ssi (Kasra) - i', 14);

-- Dad (Damma)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'ضُ', 'Ddu (Damma) - u', 15);

-- Taa (Fatha)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'طَ', 'Tha (Fatha) - a', 16);

-- Zaa (Kasra)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'ظِ', 'Zhi (Kasra) - i', 17);

-- Ain (Damma)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'عُ', 'Au (Damma) - u', 18);

-- Ghain (Fatha)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'غَ', 'Gha (Fatha) - a', 19);

-- Fa (Kasra)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'فِ', 'Fi (Kasra) - i', 20);

-- Qaf (Damma)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'قُ', 'Qu (Damma) - u', 21);

-- Kaf (Fatha)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'كَ', 'Ka (Fatha) - a', 22);

-- Lam (Kasra)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'لِ', 'Li (Kasra) - i', 23);

-- Mim (Damma)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'مُ', 'Mu (Damma) - u', 24);

-- Nun (Fatha)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'نَ', 'Na (Fatha) - a', 25);

-- Ha (Kasra)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'هِ', 'Hi (Kasra) - i', 26);

-- Waw (Damma)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'وُ', 'Wu (Damma) - u', 27);

-- Ya (Fatha)
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'يَ', 'Ya (Fatha) - a', 28);
