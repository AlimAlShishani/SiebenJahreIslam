-- ═══════════════════════════════════════════════════════════════════════════
-- 03_daily_reading_rls.sql – RLS für Koran-Leseplan („Plan generieren“)
-- Ermöglicht authentifizierten Nutzern, Einträge zu lesen/schreiben/löschen,
-- damit „Plan generieren“ (Löschen + Neuanlage) funktioniert.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE daily_reading_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reading status is viewable by everyone." ON daily_reading_status;
DROP POLICY IF EXISTS "Users can insert their own status (or via app logic)." ON daily_reading_status;
DROP POLICY IF EXISTS "Users can update their own status." ON daily_reading_status;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON daily_reading_status;
DROP POLICY IF EXISTS "Users can view their own assignments" ON daily_reading_status;
DROP POLICY IF EXISTS "Users can update their own assignments" ON daily_reading_status;

CREATE POLICY "Enable all access for authenticated users"
ON daily_reading_status
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
