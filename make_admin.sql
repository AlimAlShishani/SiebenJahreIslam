-- Mache den Benutzer zum Admin
-- Wir suchen nach ID oder E-Mail, um sicherzugehen.

UPDATE profiles
SET role = 'admin'
WHERE id = 'da0ac3a4-a3a6-4d3b-83ac-b4a23eca64df' 
   OR email = 'akorigov.ak@gmail.com';
