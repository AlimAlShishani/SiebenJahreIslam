-- ═══════════════════════════════════════════════════════════════════════════
-- 09_seed_new_levels.sql – 21 Lernstufen (leer, keine Items)
-- Nach Ausführen: learning_levels hat 1–21, learning_items sind leer für diese Stufen.
-- ═══════════════════════════════════════════════════════════════════════════

-- Alte Stufen und zugehörige Items entfernen
DELETE FROM learning_items;
DELETE FROM learning_levels;

-- 21 Stufen einfügen (ohne Lerninhalte)
INSERT INTO learning_levels (level_number, title, description, unlock_requirement) VALUES
(1,  'Alphabet 1', NULL, NULL),
(2,  'Alphabet 2', NULL, NULL),
(3,  'Alphabet 3', NULL, NULL),
(4,  'Alphabet 4', NULL, NULL),
(5,  'Vokale (Fathah/Dommah/Kasrah) & Sukoon', NULL, NULL),
(6,  'Alphabet 5 Spezial Buchstaben', NULL, NULL),
(7,  'Shaddah', NULL, NULL),
(8,  'Tanween (an/un/in)', NULL, NULL),
(9,  'Lange Vokale/Natürliches Madd', NULL, NULL),
(10, 'Buchstabenkombinationen', NULL, NULL),
(11, 'Quran Symbole', NULL, NULL),
(12, 'Pausen/Stoppen', NULL, NULL),
(13, 'Madd Muttassil/Mufassil (Verbunden/Getrennt)', NULL, NULL),
(14, 'Verbindungs Madd & Madd Lazim', NULL, NULL),
(15, 'Hamzat al-Wasl/al-Qat''', NULL, NULL),
(16, '"Allah" richtig aussprechen', NULL, NULL),
(17, 'Noon sakinah', NULL, NULL),
(18, 'Meem sakinah', NULL, NULL),
(19, 'Ra aussprechen', NULL, NULL),
(20, 'Qalqalah (Echobuchstaben)', NULL, NULL),
(21, 'Schwere Buchstaben/Leichte Buchstaben', NULL, NULL);
