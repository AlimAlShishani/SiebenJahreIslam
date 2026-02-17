-- ═══════════════════════════════════════════════════════════════════════════
-- 04_make_admin.sql – Einmal ausführen: Deine E-Mail eintragen, dann laufen.
-- Macht den genannten Nutzer zum Admin (Dashboard, Audio-Upload, etc.).
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE profiles
SET role = 'admin'
WHERE email = 'DEINE-EMAIL@beispiel.de';  -- ← Hier deine E-Mail eintragen
