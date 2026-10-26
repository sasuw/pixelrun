# Pixel Run

`Pixel Run` ist ein kleines KI-generiertes Spielprojekt.  
Es wurde von einem jugendlichen Entwickler gebaut.  
Das Spiel ist ein einfacher 2D-Pixel-Platformer im Browser.

## Worum geht es?

Du läufst nach rechts.  
Du springst über Lücken.  
Du sammelst Münzen.  
Du weichst Gegnern aus oder besiegst sie.  
Dein Ziel ist ein hoher Score.

## Spielelemente

- **Spielerfigur**: läuft, springt und greift an.
- **Plattformen**: tragen die Figur und bilden den Weg.
- **Münzen**: geben Punkte und füllen das Guthaben.
- **Gegner**: laufen auf Plattformen hin und her.
- **Katana-Angriff**: trifft Gegner aus der Nähe.
- **Shop**: öffnet sich während des Spiels.
- **Feuerschwert**: kann im Shop gekauft werden.
- **Feuerbälle**: werden nach dem Kauf mit einer Taste abgefeuert.
- **HUD**: zeigt Score, Highscore, Guthaben und Schwert-Status.

## Steuerung

- `Pfeiltasten`: bewegen
- `Leertaste`: springen
- `X` oder `Shift`: angreifen
- `S`: Shop öffnen oder schließen
- `Enter`: Feuerschwert im Shop kaufen
- `F`: Feuerball schießen

### Auf dem Handy oder Tablet

Auf Touch-Geräten erscheinen Buttons auf dem Bildschirm:

- `◀` und `▶`: bewegen
- `JUMP`: springen
- `SLASH`: angreifen
- `FIRE`: Feuerball schießen
- `SHOP`: Shop öffnen oder schließen
- `BUY`: Feuerschwert kaufen (nur im offenen Shop)

Tippe auf das Spielfeld, um zu starten.  
Am besten spielst du im Querformat.

Das Spiel läuft auf jedem Bildschirm gleich schnell, auch bei 90 oder 120 Hz.

## Spiel starten

Am einfachsten startest du das Projekt mit einem kleinen lokalen Server:

```bash
python3 -m http.server 8000
```

Dann öffnest du im Browser:

```text
http://localhost:8000/index.html
```

Direkt das HTML im Browser zu öffnen kann auch funktionieren.  
Der lokale Server ist aber sauberer.

## Code-Struktur

- `index.html`: Hauptdatei des Spiels. Hier sind HTML, CSS, Rendering, Eingaben, Menü, Shop und Spielschleife.
- `game-logic.js`: ausgelagerte Spiellogik. Hier liegt Logik für Startplattform und Gegnerbewegung.
- `game-logic.test.js`: Tests für die ausgelagerte Spiellogik.
- `browser-smoke.test.js`: einfacher Browser-Test. Er prüft, ob das Spiel noch startet.
- `package.json`: kleines Node-Setup mit dem Testbefehl.
- `screenshots/`: Bilder aus dem Spiel.

## Tests

Die Tests startest du mit:

```bash
npm test
```

## Hinweis

Das Spiel lädt Sounds und Musik über externe Links.  
Ohne Internet können diese Audio-Dateien fehlen.
