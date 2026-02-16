
-- Korrektur für Taa (ط) in Level 1 (Konsistenz)
update learning_items 
set transliteration = 'Tta' 
where level_id = 1 and content = 'ط';