# SQL-Skripte für 7JIslam (Supabase)

Führe die Skripte im **Supabase SQL Editor** in dieser **Reihenfolge** aus:

| Nr. | Datei | Wann / Was |
|-----|--------|------------|
| 1 | **01_schema.sql** | Einmal (neue DB: legt alles an; bestehende DB: nur fehlende Teile). |
| 2 | **02_levels_and_items.sql** | Einmal: 13 Tajwīd-Stufen + Lerninhalte Stufe 1–6. |
| 3 | **03_daily_reading_rls.sql** | Einmal: RLS für Koran-Leseplan („Plan generieren“). |
| 4 | **04_make_admin.sql** | Einmal: E-Mail in der Datei durch deine ersetzen, dann ausführen → du wirst Admin. |
| 5 | **05_schema_popups_audio.sql** | Nur falls die DB schon vor den neuen Spalten (modal_content, help_audio_url, …) angelegt wurde – einmal ausführen. |
| 6 | **06_seed_popup_content.sql** | Einmal: Setzt für alle 13 Stufen die Popup-Texte (inkl. Tanwīn und ة in Stufe 4). |
| 7 | **07_seed_levels_7_to_13.sql** | Einmal: Lerninhalte (Quiz-Items) für Stufen 7–13. |
| 8 | **08_swap_reading_assignments.sql** | Einmal: Funktion zum Tauschen der Reihenfolge im täglichen Juz-Plan. |

## Kurzfassung

1. **01_schema.sql** ausführen.  
2. **02_levels_and_items.sql** ausführen.  
3. **03_daily_reading_rls.sql** ausführen.  
4. In **04_make_admin.sql** deine E-Mail eintragen und die Datei ausführen.  
5. Falls deine Datenbank schon vorher existierte: **05_schema_popups_audio.sql** ausführen.  
6. **06_seed_popup_content.sql** ausführen, damit alle Stufen-Popups (mit Tanwīn- und ة-Erklärung in Stufe 4) gesetzt sind.  
7. **07_seed_levels_7_to_13.sql** ausführen für die Quiz-Fragen Stufe 7–13.  
8. **08_swap_reading_assignments.sql** ausführen, damit im Koran-Leseplan die Reihenfolge (wer welche Seiten liest) per „Nach oben / Nach unten“ getauscht werden kann.

Die alten SQL-Dateien im Projektroot (z. B. `database.sql`, `seed_levels_1_to_6.sql`, `update_levels_preserve_1_2.sql`, `fix_quran_rls.sql`, `make_admin.sql` usw.) kannst du löschen; alles Nötige liegt jetzt unter **sql/** in nummerierter Reihenfolge.
