-- Korrektur von fehlenden Diakritika (z.B. Shaddah) in Stufe 4 (ehemals 3)

-- 1. Mutter (Um -> Umm)
-- Das Mim braucht ein Shaddah
update learning_items 
set content = 'أُمّ' 
where content = 'أُم' or transliteration like '%Mutter%';

-- 2. Herr (Rabb) - zur Sicherheit, falls es fehlt (war im Seed aber eigentlich korrekt)
update learning_items 
set content = 'رَبّ' 
where transliteration like '%Herr%';

-- 3. Vater (Ab) - Hier ist kein Shaddah nötig, aber wir stellen sicher, dass es korrekt ist.
-- 'أَب' ist korrekt für "Ab".

-- Falls du weitere Wörter hast, die korrigiert werden müssen, sag Bescheid.
