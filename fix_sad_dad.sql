-- Korrektur für Sad und Dad in Stufe 2

-- Sad (Dumpfes S)
update learning_items 
set transliteration = 'Ssa (Fatha) - a' 
where level_id = 2 and content = 'صَ';

update learning_items 
set transliteration = 'Ssi (Kasra) - i' 
where level_id = 2 and content = 'صِ';

update learning_items 
set transliteration = 'Ssu (Damma) - u' 
where level_id = 2 and content = 'صُ';

-- Dad (Dumpfes D)
update learning_items 
set transliteration = 'Dda (Fatha) - a' 
where level_id = 2 and content = 'ضَ';

update learning_items 
set transliteration = 'Ddi (Kasra) - i' 
where level_id = 2 and content = 'ضِ';

update learning_items 
set transliteration = 'Ddu (Damma) - u' 
where level_id = 2 and content = 'ضُ';
