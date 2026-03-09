# Changelog

## [1.1.0] – 2026-02

### Added
- **Quran offline in APK** – Der gesamte Koran (604 Seiten) ist in der App enthalten. Kein Internet nötig zum Lesen.
- **Vier Übersetzungen mitgeliefert** – Deutsch (Abu Rida), Englisch (Sahih International), Russisch (Kuliev) und Türkisch (Diyanet) sind in der APK enthalten und funktionieren offline.
- **Weitere Übersetzungen online** – Zusätzliche Übersetzungen (z. B. Bubenheim, Asad) sind bei Internetverbindung verfügbar.
- **Preload-Button** – Im Quran-Reader-Einstellungen: „Quran für Offline vorbereiten“ lädt alle Seiten in den Cache (für PWA/Browser).

### Changed
- **Quran-Reader** – Surah- und Vers-Dropdown funktionieren jetzt auch offline mit den gebündelten Daten.
- **Vercel Build** – Prebuild überspringt API-Fetch, wenn Quran-Daten bereits vorhanden sind (vermeidet Rate-Limit 429).

---

## [2.2] – 2025

### Added
- **Tester Feedback** – New feedback page where testers can submit suggestions, bug reports, and ideas. Accessible from Profile. Admins can view all feedback in the Admin panel.

### Changed
- **Surah Kahf** – Renamed from "Surah Kahf Light" to "Surah Kahf Instance" for consistency with other Quran instances.
- **Surah Kahf Hadith** – The hadith and description text are now properly translated and switch with the app language.

### Fixed
- **Surah dropdown** – When selecting a surah (e.g. Surah 76 Al-Insan), the reader now jumps to the first verse of that surah instead of the first verse on the page. This was especially confusing in single-verse mode when the page still contained verses from the previous surah.
- **Play Store TWA** – Added documentation for using the Play App Signing certificate fingerprint in Digital Asset Links, so the app runs without the browser bar when installed from the Play Store (internal testing, production).

---

## [2.1] – 2025

### Changed
- **Reading goals** – Removed the "Sura" option from goal units. Use "Aya" instead (e.g. 76:1–76:31 for Surah 76).

### Fixed
- **versionCode** – Corrected type: `versionCode` must be an integer for Android builds.
