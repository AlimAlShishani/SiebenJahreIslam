# SQL-Skripte für 7JIslam (Supabase)

Führe die Skripte im **Supabase SQL Editor** in dieser **Reihenfolge** aus:

| Nr. | Datei | Wann / Was |
|-----|--------|------------|
| 1 | **01_schema.sql** | Einmal (neue DB: legt alles an; bestehende DB: nur fehlende Teile). |
| 2 | **02_levels_and_items.sql** | Einmal: 13 Tajwīd-Stufen + Lerninhalte Stufe 1–6. |
| 3 | **03_daily_reading_rls.sql** | Einmal: RLS für Koran-Leseplan („Plan generieren“). |
| 4 | **04_make_admin.sql** | Einmal: E-Mail in der Datei durch deine ersetzen, dann ausführen → du wirst Admin. |
| 5 | **05_schema_popups_audio.sql** | Nur falls die DB schon vor den neuen Spalten (modal_content, help_audio_url, …) angelegt wurde – einmal ausführen. |

## Kurzfassung

1. **01_schema.sql** ausführen.  
2. **02_levels_and_items.sql** ausführen.  
3. **03_daily_reading_rls.sql** ausführen.  
4. In **04_make_admin.sql** deine E-Mail eintragen und die Datei ausführen.  
5. Falls deine Datenbank schon vorher existierte: **05_schema_popups_audio.sql** ausführen (neue Spalten + Admin-Update für Stufen).

Die alten SQL-Dateien im Projektroot (z. B. `database.sql`, `seed_levels_1_to_6.sql`, `update_levels_preserve_1_2.sql`, `fix_quran_rls.sql`, `make_admin.sql` usw.) kannst du löschen; alles Nötige liegt jetzt unter **sql/** in nummerierter Reihenfolge.
