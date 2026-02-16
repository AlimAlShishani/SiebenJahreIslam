-- Korrektur der Schreibweise von "Allah" in verschiedenen Phrasen
-- Wir verwenden hier eine saubere Unicode-Sequenz ohne doppelte Vokalisierung.
-- Sequenz: Aleph Wasla + Lam + Lam + Shaddah + Superscript Aleph + Ha (+ Vokal)

-- 1. Astaghfirullah
update learning_items 
set content = 'أَسْتَغْفِرُ ٱللّٰهَ' 
where transliteration like '%Astaghfirullah%';

-- 2. Bismillah
update learning_items 
set content = 'بِسْمِ ٱللّٰهِ' 
where transliteration like '%Bismillah%';

-- 3. Alhamdulillah
update learning_items 
set content = 'ٱلْحَمْدُ لِلّٰهِ' 
where transliteration like '%Alhamdulillah%';

-- 4. Subhanallah
update learning_items 
set content = 'سُبْحَانَ ٱللّٰهِ' 
where transliteration like '%Subhanallah%';

-- 5. Allahu Akbar
update learning_items 
set content = 'ٱللّٰهُ أَكْبَرُ' 
where transliteration like '%Allahu Akbar%';
