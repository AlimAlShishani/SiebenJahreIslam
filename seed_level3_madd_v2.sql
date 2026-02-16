-- KORRIGIERTES Seed-Skript für Stufe 3: Madd (Verlängerung)
-- Behebt Foreign Key Probleme durch richtige Reihenfolge (Insert -> Move -> Delete)
-- Fügt fehlende Spalte unlock_requirement hinzu

-- 0. Schema Update: Spalte unlock_requirement hinzufügen falls nicht vorhanden
alter table learning_levels add column if not exists unlock_requirement text;

-- 1. Stufe 5 erstellen (Platzhalter für alte Stufe 4)
insert into learning_levels (level_number, title, description)
values (5, 'Stufe 5: Längere Wörter / Sätze', 'Fortgeschrittene Wörter und Sätze')
on conflict (level_number) do update set title = EXCLUDED.title;

-- 2. Items von Stufe 4 nach Stufe 5 verschieben
update learning_items set level_id = 5 where level_id = 4;

-- 3. Stufe 4 "leeren" und neu definieren (für alte Stufe 3)
-- Da wir Stufe 4 nicht löschen können (falls noch referenzen existieren, was aber durch step 2 gelöst sein sollte),
-- updaten wir sie einfach oder löschen und erstellen neu.
-- Sicherer: Update existing Level 4 to be the new Level 4 content? 
-- Nein, Level 4 war "Längere Wörter". Jetzt soll Level 4 "Kurze Wörter" sein.
-- Also: Level 4 existiert noch (leer). Wir updaten Titel.
update learning_levels 
set title = 'Stufe 4: Kurze Wörter aus dem Koran', 
    description = 'Erste Wörter aus dem Koran lesen'
where level_number = 4;

-- 4. Items von Stufe 3 nach Stufe 4 verschieben
update learning_items set level_id = 4 where level_id = 3;

-- 5. Stufe 3 neu definieren (Madd)
update learning_levels 
set title = 'Stufe 3: Die Verlängerung (Madd)', 
    description = 'Lerne lange Vokale: Alif, Waw und Ya.',
    unlock_requirement = 'Schließe Stufe 2 ab'
where level_number = 3;

-- Falls Stufe 3 noch gar nicht existierte (unwahrscheinlich), insert:
insert into learning_levels (level_number, title, description, unlock_requirement)
values (3, 'Stufe 3: Die Verlängerung (Madd)', 'Lerne lange Vokale: Alif, Waw und Ya.', 'Schließe Stufe 2 ab')
on conflict (level_number) do nothing;

-- 6. Inhalt für Stufe 3 (Madd) einfügen
-- Erstmal alte Items in Stufe 3 löschen (sollten weg sein, aber zur Sicherheit)
delete from learning_items where level_id = 3;

-- 1. Baa (Alif Madd)
insert into learning_items (level_id, content, transliteration, order_index, options) values
(3, 'بَا', 'Baa (Ba - Fatha - Alif)', 1, 
'[
  {"id": "1", "text": "Baa (Lang)", "is_correct": true, "audio_url": null},
  {"id": "2", "text": "Ba (Kurz)", "is_correct": false, "audio_url": null},
  {"id": "3", "text": "Bu (Kurz)", "is_correct": false, "audio_url": null}
]'::jsonb);

-- 2. Buu (Waw Madd)
insert into learning_items (level_id, content, transliteration, order_index, options) values
(3, 'بُو', 'Buu (Ba - Damma - Waw)', 2, 
'[
  {"id": "1", "text": "Buu (Lang)", "is_correct": true, "audio_url": null},
  {"id": "2", "text": "Bu (Kurz)", "is_correct": false, "audio_url": null},
  {"id": "3", "text": "Baa (Lang)", "is_correct": false, "audio_url": null}
]'::jsonb);

-- 3. Bii (Ya Madd)
insert into learning_items (level_id, content, transliteration, order_index, options) values
(3, 'بِي', 'Bii (Ba - Kasra - Ya)', 3, 
'[
  {"id": "1", "text": "Bii (Lang)", "is_correct": true, "audio_url": null},
  {"id": "2", "text": "Bi (Kurz)", "is_correct": false, "audio_url": null},
  {"id": "3", "text": "Buu (Lang)", "is_correct": false, "audio_url": null}
]'::jsonb);

-- 4. Taa (Alif Madd)
insert into learning_items (level_id, content, transliteration, order_index, options) values
(3, 'تَا', 'Taa (Ta - Fatha - Alif)', 4, 
'[
  {"id": "1", "text": "Taa (Lang)", "is_correct": true, "audio_url": null},
  {"id": "2", "text": "Ta (Kurz)", "is_correct": false, "audio_url": null},
  {"id": "3", "text": "Tii (Lang)", "is_correct": false, "audio_url": null}
]'::jsonb);

-- 5. Tuu (Waw Madd)
insert into learning_items (level_id, content, transliteration, order_index, options) values
(3, 'تُو', 'Tuu (Ta - Damma - Waw)', 5, 
'[
  {"id": "1", "text": "Tuu (Lang)", "is_correct": true, "audio_url": null},
  {"id": "2", "text": "Tu (Kurz)", "is_correct": false, "audio_url": null},
  {"id": "3", "text": "Taa (Lang)", "is_correct": false, "audio_url": null}
]'::jsonb);

-- 6. Tii (Ya Madd)
insert into learning_items (level_id, content, transliteration, order_index, options) values
(3, 'تِي', 'Tii (Ta - Kasra - Ya)', 6, 
'[
  {"id": "1", "text": "Tii (Lang)", "is_correct": true, "audio_url": null},
  {"id": "2", "text": "Ti (Kurz)", "is_correct": false, "audio_url": null},
  {"id": "3", "text": "Tuu (Lang)", "is_correct": false, "audio_url": null}
]'::jsonb);

-- 7. Nuur (Beispiel Wort)
insert into learning_items (level_id, content, transliteration, order_index, options) values
(3, 'نُور', 'Nuur (Licht)', 7, 
'[
  {"id": "1", "text": "Nuur (Lang - Waw)", "is_correct": true, "audio_url": null},
  {"id": "2", "text": "Nur (Kurz)", "is_correct": false, "audio_url": null},
  {"id": "3", "text": "Naar (Lang - Alif)", "is_correct": false, "audio_url": null}
]'::jsonb);

-- 8. Fiil (Elefant - Beispiel Ya Madd)
insert into learning_items (level_id, content, transliteration, order_index, options) values
(3, 'فِيل', 'Fiil (Elefant)', 8, 
'[
  {"id": "1", "text": "Fiil (Lang - Ya)", "is_correct": true, "audio_url": null},
  {"id": "2", "text": "Fil (Kurz)", "is_correct": false, "audio_url": null},
  {"id": "3", "text": "Faal (Lang - Alif)", "is_correct": false, "audio_url": null}
]'::jsonb);

-- 9. Baab (Tür - Beispiel Alif Madd)
insert into learning_items (level_id, content, transliteration, order_index, options) values
(3, 'بَاب', 'Baab (Tür)', 9, 
'[
  {"id": "1", "text": "Baab (Lang - Alif)", "is_correct": true, "audio_url": null},
  {"id": "2", "text": "Bab (Kurz)", "is_correct": false, "audio_url": null},
  {"id": "3", "text": "Buub (Lang - Waw)", "is_correct": false, "audio_url": null}
]'::jsonb);
