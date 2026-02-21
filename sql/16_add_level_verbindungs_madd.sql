-- ═══════════════════════════════════════════════════════════════════════════
-- 16_add_level_verbindungs_madd.sql – Neue Stufe 14 „Verbindungs Madd & Madd Lazim“
-- Einmal ausführen. Stufen 14–20 werden zu 15–21 verschoben, keine Aufgaben
-- werden gelöscht oder neu erstellt (Audios/YT-Links bleiben erhalten).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Items: level_id 14→15, 15→16, … 20→21 (rückwärts, damit keine Kollision)
UPDATE learning_items SET level_id = 21 WHERE level_id = 20;
UPDATE learning_items SET level_id = 20 WHERE level_id = 19;
UPDATE learning_items SET level_id = 19 WHERE level_id = 18;
UPDATE learning_items SET level_id = 18 WHERE level_id = 17;
UPDATE learning_items SET level_id = 17 WHERE level_id = 16;
UPDATE learning_items SET level_id = 16 WHERE level_id = 15;
UPDATE learning_items SET level_id = 15 WHERE level_id = 14;

-- 2. Levels: level_number 14→15, … 20→21 (rückwärts)
UPDATE learning_levels SET level_number = 21 WHERE level_number = 20;
UPDATE learning_levels SET level_number = 20 WHERE level_number = 19;
UPDATE learning_levels SET level_number = 19 WHERE level_number = 18;
UPDATE learning_levels SET level_number = 18 WHERE level_number = 17;
UPDATE learning_levels SET level_number = 17 WHERE level_number = 16;
UPDATE learning_levels SET level_number = 16 WHERE level_number = 15;
UPDATE learning_levels SET level_number = 15 WHERE level_number = 14;

-- 3. Neue leere Stufe 14 einfügen
INSERT INTO learning_levels (level_number, title, description, unlock_requirement) VALUES
(14, 'Verbindungs Madd & Madd Lazim', NULL, NULL);
