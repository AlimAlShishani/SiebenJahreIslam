# Anleitung zur Veröffentlichung (Deployment)

Um die App deinen Freunden per Link zu schicken, müssen wir sie ins Internet stellen. Der einfachste Weg ist **Vercel**.

Da auf deinem Computer anscheinend noch kein **Git** installiert ist, müssen wir das zuerst tun.

## Schritt 0: Git installieren
Damit wir den Code zu GitHub und dann zu Vercel bekommen, brauchst du Git.

1.  Lade Git für Windows herunter: [https://git-scm.com/download/win](https://git-scm.com/download/win)
2.  Installiere es (einfach immer "Next" klicken).
3.  **Wichtig:** Starte Cursor (oder dein Terminal) danach neu, damit der Befehl `git` erkannt wird.

## Schritt 1: Code auf GitHub hochladen
Nachdem Git installiert ist:

1.  Öffne ein Terminal in diesem Ordner.
2.  Führe diese Befehle nacheinander aus:
    ```bash
    git init
    git add .
    git commit -m "Erster Start"
    ```
3.  Gehe auf [GitHub.com](https://github.com) und erstelle ein **neues Repository** (z.B. `ramadan-app`).
4.  Kopiere die Befehle von GitHub (unter "…or push an existing repository…") und führe sie im Terminal aus. Das sieht ca. so aus:
    ```bash
    git remote add origin https://github.com/DEIN_NAME/ramadan-app.git
    git branch -M main
    git push -u origin main
    ```

## Schritt 2: App auf Vercel veröffentlichen
1.  Gehe auf [Vercel.com](https://vercel.com) und erstelle einen Account (am besten mit GitHub einloggen).
2.  Klicke auf **"Add New..."** -> **"Project"**.
3.  Wähle dein `ramadan-app` Repository aus und klicke **"Import"**.

## Schritt 3: WICHTIG - Umgebungsvariablen
Damit die App funktioniert, braucht Vercel deine Supabase-Schlüssel.

1.  Im Vercel-Setup (oder später unter Settings -> Environment Variables):
2.  Füge diese Variablen hinzu (Werte aus deiner `.env` Datei kopieren):
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
    *   `VITE_VAPID_PUBLIC_KEY` (für echte Push-Benachrichtigungen)
3.  Klicke auf **"Deploy"**.

Du erhältst einen Link (z.B. `https://ramadan-app.vercel.app`).

## Schritt 4: Supabase Login erlauben
Damit der Login auf der neuen Seite geht:

1.  Gehe in dein [Supabase Dashboard](https://supabase.com/dashboard).
2.  Gehe zu **Authentication** -> **URL Configuration**.
3.  Trage bei **Site URL** deinen neuen Vercel-Link ein.
4.  Füge ihn auch bei **Redirect URLs** hinzu (z.B. `https://ramadan-app.vercel.app/**`).
5.  Speichern.

**Fertig!** Jetzt kannst du den Link teilen.

## Echte Push-Benachrichtigungen aktivieren
1. In Supabase SQL Editor die neuen Migrationen ausführen:
   - `sql/31_reading_activity_logs_add_plan_updated_type.sql`
   - `sql/32_push_subscriptions.sql`
2. VAPID Key-Paar erzeugen (einmalig), Public Key in Vercel als `VITE_VAPID_PUBLIC_KEY` setzen.
3. Edge Function Env Vars setzen (Supabase Dashboard → Edge Functions → Secrets oder per CLI):
   - `PUBLISHABLE_KEY` (dein Publishable Key, gleicher Wert wie VITE_SUPABASE_ANON_KEY)
   - `ADMIN_SECRET_KEY` (einen Secret Key erstellen unter Project Settings → API Keys)
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT` (z.B. `mailto:you@example.com`)
4. Supabase Edge Function deployen (mit --no-verify-jwt, da wir Publishable/Secret Keys nutzen):
   - `supabase functions deploy send-push-notification --no-verify-jwt`

## Capacitor (Android/iOS Native App)

Die App nutzt Capacitor statt Bubblewrap/TWA. Build-Befehle:

```bash
npm run cap:sync      # Web bauen und in native Projekte kopieren
npm run cap:android   # Android Studio öffnen
```

### Android Signing

1. `keystore.properties.example` nach `keystore.properties` kopieren
2. Passwörter eintragen (nicht committen – in .gitignore)
3. `android.keystore` im Projektroot (wie bei TWA)

### Firebase / Push (native)

1. [Firebase Console](https://console.firebase.google.com) → Projekt → Android-App hinzufügen (Package: `net.nuruna.app`)
2. `google-services.json` herunterladen → `android/app/google-services.json`
3. Supabase Edge Function Secrets setzen:
   - `FCM_PROJECT_ID` (aus google-services.json: project_id)
   - `FCM_CLIENT_EMAIL` (aus Firebase Service Account JSON)
   - `FCM_PRIVATE_KEY` (aus Service Account JSON, mit \n für Zeilenumbrüche)
4. Migration `sql/45_push_fcm_token.sql` ausführen

### iOS (später)

```bash
npx cap add ios
```

Erfordert Mac mit Xcode und Apple Developer Account.

---

## TWA/APK (veraltet – durch Capacitor ersetzt): App ohne Browser-Leiste (Digital Asset Links)

Damit die installierte APK wie eine echte App wirkt (ohne Adresszeile, ohne Browser-UI), muss die Website **Digital Asset Links** bereitstellen. Ohne diese Verknüpfung zeigt Chrome die Browser-Oberfläche.

### 1. SHA-256 Fingerprint ermitteln

Im Projektordner im Terminal ausführen:

```powershell
& "C:\Program Files\Java\jre1.8.0_451\bin\keytool.exe" -list -v -keystore android.keystore -alias android -storepass DEIN_PASSWORT
```

`DEIN_PASSWORT` durch das tatsächliche Keystore-Passwort ersetzen. **Hinweis:** Das Passwort erscheint im Klartext – danach ggf. die Befehlszeile aus der History löschen.

Alternative ohne Passwort im Befehl: Den Befehl ohne `-storepass` ausführen. Wenn nach dem Passwort gefragt wird: **einfach tippen und Enter drücken** – es erscheint nichts beim Tippen (Sicherheitsfeature), die Eingabe funktioniert aber.

In der Ausgabe die Zeile **SHA256:** suchen. Den Fingerprint kopieren (Format z.B. `AB:CD:EF:12:34:...`), **ohne** Leerzeichen, in **Großbuchstaben**.

### 2. Fingerprint in assetlinks.json eintragen

Datei `public/.well-known/assetlinks.json` öffnen und `DEIN_SHA256_FINGERPRINT_HIER_EINFÜGEN` durch den echten Fingerprint ersetzen.

### 3. Deployen

Nach dem nächsten Vercel-Deploy muss die Datei unter `https://nuruna.net/.well-known/assetlinks.json` erreichbar sein. Prüfen mit:

```
https://nuruna.net/.well-known/assetlinks.json
```

### 4. APK neu bauen und installieren

Nach dem Deploy die APK neu bauen (`bubblewrap build`) und auf dem Gerät neu installieren. Danach sollte die App ohne Browser-Leiste starten.

### 5. Play Store: Zusätzlicher Fingerprint nötig

**Problem:** Bei lokaler APK-Installation funktioniert TWA, aber bei Installation über den Play Store (interner Test etc.) erscheint die Browser-Leiste und Benachrichtigungen kommen vom Browser.

**Ursache:** Google signiert die App im Play Store mit dem **Play App Signing Key** neu. Chrome prüft diesen Fingerprint – nicht den deines Upload-Keystores.

**Lösung:**

1. **Play Console** öffnen → deine App → **Release** → **Setup** → **App-Integrität** (oder **App signing**)
2. Unter **„App-Signaturschlüssel-Zertifikat“** den **SHA-256-Zertifikatsfingerabdruck** kopieren
3. In `public/.well-known/assetlinks.json` diesen Fingerprint **zusätzlich** in das Array `sha256_cert_fingerprints` eintragen (beide Fingerprints behalten – lokaler + Play-Signing):
   ```json
   "sha256_cert_fingerprints": [
     "DEIN_LOKALER_FINGERPRINT",
     "PLAY_APP_SIGNING_FINGERPRINT_HIER"
   ]
   ```
4. Vercel deployen

Danach sollte die App auch aus dem Play Store ohne Browser-Leiste und mit korrekten App-Benachrichtigungen laufen.
