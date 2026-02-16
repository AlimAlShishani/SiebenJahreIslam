-- Neues Seed-Skript für Stufe 3: Madd (Verlängerung)

-- 1. Bestehende Stufen verschieben (Platz machen für Stufe 3)
-- Wir müssen sicherstellen, dass wir keine Konflikte erzeugen.
-- Wir gehen davon aus, dass Stufe 3 "Kurze Wörter" und Stufe 4 "Längere Wörter" sind.
-- Wir wollen: 
-- 1: Alphabet
-- 2: Vokale
-- 3: Madd (NEU)
-- 4: Kurze Wörter (war 3)
-- 5: Längere Wörter (war 4)

-- Erstmal Stufe 4 zu 5 machen
update learning_items set level_id = 5 where level_id = 4;
update learning_levels set level_number = 5, title = 'Stufe 5: Längere Wörter / Sätze' where level_number = 4;

-- Dann Stufe 3 zu 4 machen
update learning_items set level_id = 4 where level_id = 3;
update learning_levels set level_number = 4, title = 'Stufe 4: Kurze Wörter aus dem Koran' where level_number = 3;

-- Jetzt Stufe 3 erstellen (falls nicht existiert)
insert into learning_levels (level_number, title, description, unlock_requirement)
values (3, 'Stufe 3: Die Verlängerung (Madd)', 'Lerne lange Vokale: Alif, Waw und Ya.', 'Schließe Stufe 2 ab')
on conflict (level_number) do update 
set title = 'Stufe 3: Die Verlängerung (Madd)', 
    description = 'Lerne lange Vokale: Alif, Waw und Ya.',
    unlock_requirement = 'Schließe Stufe 2 ab';

-- Inhalt für Stufe 3 (Madd) einfügen
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
