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
