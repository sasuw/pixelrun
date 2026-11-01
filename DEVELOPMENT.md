# Entwicklung

## Icon der installierten Desktop-App aktualisieren

Die App-Icons werden aus `scripts/generate_icons.py` erzeugt.

Das Skript benötigt das Python-Paket Pillow (`PIL`). Einmalig mit derselben Python-Installation, mit der das Skript gestartet wird, installieren:

```bash
python3 -m pip install --user Pillow
```

Anschließend die PNG-Dateien erzeugen:

```bash
python3 scripts/generate_icons.py
```

Ein Austausch der PNG-Dateien unter denselben URLs aktualisiert das Desktop-Icon einer bereits installierten App in Chrome nicht zuverlässig. Seit Chrome 144 gelten unveränderte Icon-Einträge im Web-App-Manifest als unverändert; Chrome lädt die Bilder dann nicht erneut, um sie zu vergleichen. Für jede Icon-Änderung deshalb die URLs der betroffenen Einträge in `manifest.webmanifest` versionieren, zum Beispiel:

```json
{
  "src": "icons/icon-192.png?v=2",
  "sizes": "192x192",
  "type": "image/png",
  "purpose": "any"
}
```

Dasselbe gilt für `icon-512.png` und `icon-maskable-512.png`, wenn sich diese Bilder ändern. Die Manifest-`id` (`"./"`) unverändert lassen, damit die installierte App dieselbe Identität behält. Alle URLs müssen relativ bleiben, weil GitHub Pages die App unter `/pixelrun/` bereitstellt.

Die versionierten Icon-URLs auch in `appFiles` in `sw.js` eintragen und `cacheName` erhöhen. So enthält der neue Offline-Cache die aktuellen Icons. Danach Manifest, Service Worker und Bilder gemeinsam veröffentlichen; der bestehende Deploy-Workflow kopiert `icons/` bereits.

Zum Prüfen die installierte App mit Internetverbindung öffnen. Wenn Chrome ein Icon-Update erkennt, im Drei-Punkte-Menü **„Review app update“** (sinngemäß „App-Update überprüfen“) auswählen und das neue Icon bestätigen. Ein gewöhnliches Neuladen der Seite ersetzt das Desktop-Icon nicht zwingend. Das Verhalten anderer Browser, insbesondere Edge, kann abweichen.

Für eine lokale Windows-Desktop-Verknüpfung kann das aktuelle Projekt-Icon auch direkt gesetzt werden:

```powershell
powershell -File scripts\update_desktop_icon.ps1 --dry-run
powershell -File scripts\update_desktop_icon.ps1
```

Das Skript ermittelt den Desktop und den App-Datenordner des jeweils angemeldeten Benutzers; es enthält keinen festen Home-Pfad. Es aktualisiert nur dessen `Pixel Run.lnk`, sofern die Verknüpfung vorhanden ist. Andere Benutzer führen den Befehl in ihrem eigenen Windows-Profil aus. Das Skript benötigt Python 3 und Pillow wie oben beschrieben. Die Änderung betrifft die Desktop-Verknüpfung, nicht automatisch angeheftete Symbole in Startmenü oder Taskleiste.

Hintergrund: [Chrome: A better way to update your web apps](https://developer.chrome.com/blog/improvements-to-web-app-updates) und [Microsoft Edge: Define icons and a theme color](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/icon-theme-color).
