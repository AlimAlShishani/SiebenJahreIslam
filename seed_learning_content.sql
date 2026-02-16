-- Lösche existierende Items um Duplikate zu vermeiden (optional, sei vorsichtig wenn du schon eigene hast)
-- delete from learning_items;

-- Stufe 1: Das Alphabet (Alif - Ya)
insert into learning_items (level_id, content, transliteration, order_index) values
(1, 'ا', 'Alif', 1),
(1, 'ب', 'Ba', 2),
(1, 'ت', 'Ta', 3),
(1, 'ث', 'Tha', 4),
(1, 'ج', 'Jim', 5),
(1, 'ح', 'Ha', 6),
(1, 'خ', 'Kha', 7),
(1, 'د', 'Dal', 8),
(1, 'ذ', 'Dhal', 9),
(1, 'ر', 'Ra', 10),
(1, 'ز', 'Zay', 11),
(1, 'س', 'Sin', 12),
(1, 'ش', 'Shin', 13),
(1, 'ص', 'Sad', 14),
(1, 'ض', 'Dad', 15),
(1, 'ط', 'Ta', 16),
(1, 'ظ', 'Za', 17),
(1, 'ع', 'Ain', 18),
(1, 'غ', 'Ghain', 19),
(1, 'ف', 'Fa', 20),
(1, 'ق', 'Qaf', 21),
(1, 'ك', 'Kaf', 22),
(1, 'ل', 'Lam', 23),
(1, 'م', 'Mim', 24),
(1, 'ن', 'Nun', 25),
(1, 'ه', 'Ha', 26),
(1, 'و', 'Waw', 27),
(1, 'ي', 'Ya', 28);

-- Stufe 2: Vokale (Fatha, Kasra, Damma) - Beispiele
insert into learning_items (level_id, content, transliteration, order_index) values
(2, 'بَ', 'Ba (Fatha) - a', 1),
(2, 'بِ', 'Bi (Kasra) - i', 2),
(2, 'بُ', 'Bu (Damma) - u', 3),
(2, 'تَ', 'Ta (Fatha) - a', 4),
(2, 'تِ', 'Ti (Kasra) - i', 5),
(2, 'تُ', 'Tu (Damma) - u', 6),
(2, 'جَ', 'Ja (Fatha) - a', 7),
(2, 'جِ', 'Ji (Kasra) - i', 8),
(2, 'جُ', 'Ju (Damma) - u', 9);

-- Stufe 3: Kurze Wörter aus dem Koran
insert into learning_items (level_id, content, transliteration, order_index) values
(3, 'أَب', 'Ab (Vater)', 1),
(3, 'أُم', 'Um (Mutter)', 2),
(3, 'رَبّ', 'Rabb (Herr)', 3),
(3, 'كِتَاب', 'Kitab (Buch)', 4),
(3, 'نُور', 'Nur (Licht)', 5),
(3, 'قَلَم', 'Qalam (Stift)', 6),
(3, 'شَمْس', 'Shams (Sonne)', 7),
(3, 'قَمَر', 'Qamar (Mond)', 8);

-- Stufe 4: Längere Wörter / Sätze
insert into learning_items (level_id, content, transliteration, order_index) values
(4, 'بِسْمِ ٱللَّٰهِ', 'Bismillah (Im Namen Allahs)', 1),
(4, 'ٱلْحَمْدُ لِلَّٰهِ', 'Alhamdulillah (Alles Lob gebührt Allah)', 2),
(4, 'سُبْحَانَ ٱللَّٰهِ', 'Subhanallah (Gepriesen sei Allah)', 3),
(4, 'ٱللَّٰهُ أَكْبَرُ', 'Allahu Akbar (Allah ist am größten)', 4),
(4, 'أَسْتَغْفِرُ ٱللَّٰهَ', 'Astaghfirullah (Ich bitte Allah um Vergebung)', 5);
