-- Fix RLS for daily_reading_status
ALTER TABLE daily_reading_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to be safe
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON daily_reading_status;
DROP POLICY IF EXISTS "Users can view their own assignments" ON daily_reading_status;
DROP POLICY IF EXISTS "Users can update their own assignments" ON daily_reading_status;

-- Create a policy that allows authenticated users to do everything (SELECT, INSERT, UPDATE, DELETE)
-- This is needed so that any user can trigger "Generate Plan" which deletes old rows and inserts new ones for the whole group.
CREATE POLICY "Enable all access for authenticated users" 
ON daily_reading_status 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
