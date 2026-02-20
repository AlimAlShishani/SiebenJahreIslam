-- ═══════════════════════════════════════════════════════════════════════════
-- 14_migrate_swap_level_5_6.sql – Vokale vor Alphabet 5 Spezial (einmalig)
-- Stufe 5 = Vokale, Stufe 6 = Alphabet 5 Spezial (Items werden mitgetauscht).
-- Nur ausführen, wenn die DB noch die alte Reihenfolge hat (5=Spezial, 6=Vokale).
-- ═══════════════════════════════════════════════════════════════════════════

-- Temporäre Stufe (level_id referenziert level_number)
INSERT INTO learning_levels (level_number, title, description) VALUES (55, 'temp', NULL);

-- Items von 5 und 6 tauschen
UPDATE learning_items SET level_id = 55 WHERE level_id = 5;
UPDATE learning_items SET level_id = 5  WHERE level_id = 6;
UPDATE learning_items SET level_id = 6  WHERE level_id = 55;

DELETE FROM learning_levels WHERE level_number = 55;

-- Titel anpassen
UPDATE learning_levels SET title = 'Vokale (Fathah/Dommah/Kasrah) & Sukoon' WHERE level_number = 5;
UPDATE learning_levels SET title = 'Alphabet 5 Spezial Buchstaben' WHERE level_number = 6;
