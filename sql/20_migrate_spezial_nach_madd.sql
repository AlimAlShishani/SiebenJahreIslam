-- ═══════════════════════════════════════════════════════════════════════════
-- 20_migrate_spezial_nach_madd.sql – Alphabet 5 Spezial nach Madd verschieben
-- Neue Reihenfolge: 5 Vokale → 6 Shaddah → 7 Tanween → 8 Madd → 9 Alphabet 5 Spezial
-- FK-sicher: pro Schritt neue Zeile einfügen, Items umhängen, alte Zeile löschen.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Stufe 6 (Alphabet 5 Spezial) nach 66 auslagern
INSERT INTO learning_levels (level_number, title, description, unlock_requirement, modal_content, modal_audio_url, modal_audio_urls)
SELECT 66, title, description, unlock_requirement, modal_content, modal_audio_url, modal_audio_urls FROM learning_levels WHERE level_number = 6;
UPDATE learning_items SET level_id = 66 WHERE level_id = 6;
DELETE FROM learning_levels WHERE level_number = 6;

-- 2) Shaddah (7) nach 6
INSERT INTO learning_levels (level_number, title, description, unlock_requirement, modal_content, modal_audio_url, modal_audio_urls)
SELECT 6, title, description, unlock_requirement, modal_content, modal_audio_url, modal_audio_urls FROM learning_levels WHERE level_number = 7;
UPDATE learning_items SET level_id = 6 WHERE level_id = 7;
DELETE FROM learning_levels WHERE level_number = 7;

-- 3) Tanween (8) nach 7
INSERT INTO learning_levels (level_number, title, description, unlock_requirement, modal_content, modal_audio_url, modal_audio_urls)
SELECT 7, title, description, unlock_requirement, modal_content, modal_audio_url, modal_audio_urls FROM learning_levels WHERE level_number = 8;
UPDATE learning_items SET level_id = 7 WHERE level_id = 8;
DELETE FROM learning_levels WHERE level_number = 8;

-- 4) Madd (9) nach 8
INSERT INTO learning_levels (level_number, title, description, unlock_requirement, modal_content, modal_audio_url, modal_audio_urls)
SELECT 8, title, description, unlock_requirement, modal_content, modal_audio_url, modal_audio_urls FROM learning_levels WHERE level_number = 9;
UPDATE learning_items SET level_id = 8 WHERE level_id = 9;
DELETE FROM learning_levels WHERE level_number = 9;

-- 5) Ausgelagerte Stufe (66, Alphabet 5 Spezial) nach 9
INSERT INTO learning_levels (level_number, title, description, unlock_requirement, modal_content, modal_audio_url, modal_audio_urls)
SELECT 9, title, description, unlock_requirement, modal_content, modal_audio_url, modal_audio_urls FROM learning_levels WHERE level_number = 66;
UPDATE learning_items SET level_id = 9 WHERE level_id = 66;
DELETE FROM learning_levels WHERE level_number = 66;
