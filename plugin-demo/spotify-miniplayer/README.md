# Spotify Miniplayer für Rabbit R1
Eine professionelle Spotify Connect-Fernsteuerung für den Rabbit R1, die die nahtlose Steuerung von Spotify-kompatiblen Geräten ermöglicht.

<div align="center">

![Spotify r1mote Beispielansicht](spotify%20r1mote.png "Spotify r1mote Beispielansicht")

</div>

## Überblick
Der **Spotify Miniplayer** ist eine speziell für den Rabbit R1 entwickelte Web-Applikation, die als Spotify Connect-Remote für verbundene Wiedergabegeräte fungiert. Die Anwendung bietet eine benutzerfreundliche Oberfläche zur Steuerung der Musikwiedergabe und zeigt Informationen zum aktuell gespielten Titel an.

## Funktionen
### 🎵 Wiedergabesteuerung
- **Play/Pause**: Start und Stopp der Musikwiedergabe
- **Track-Navigation**: Vor- und Zurückspringen zwischen Titeln
- **Live-Anzeige**: Echtzeit-Darstellung des aktuellen Songs mit Albumcover

### 🔌 Spotify Connect Integration
- **Geräte-Auswahl**: Dropdown-Menü zur Auswahl verfügbarer Spotify Connect-Geräte
- **Automatische Erkennung**: Erkennt alle aktiven Spotify-Geräte im Netzwerk
- **Geräte-Status**: Zeigt aktive und verfügbare Geräte sowie deren Typ an

### 🎛️ Rabbit R1 Hardware-Integration
- **Scroll-Rad**: Geräte-Navigation mit dem physischen Scroll-Rad
- **Seitentasten**: Wiedergabesteuerung über die Hardware-Buttons
- **Feedback-System**: Visuelle Rückmeldung für Hardware-Interaktionen

## Technische Spezifikationen
### Authentifizierung
- **OAuth 2.0 mit PKCE**: Sichere Spotify-Authentifizierung ohne Client Secret
- **Token-Verwaltung**: Automatische Speicherung und Verwaltung von Zugriffstoken
- **Session-Persistenz**: Erhaltung der Anmeldung zwischen App-Starts

### API-Integration
- **Spotify Web API**: Vollständige Integration mit Spotify's REST API
- **Echtzeit-Updates**: Kontinuierliche Synchronisation des Wiedergabestatus
- **Fehlerbehandlung**: Robuste Behandlung von API-Fehlern und Netzwerkproblemen

### Benutzeroberfläche
- **Responsive Design**: Optimiert für das Rabbit R1 Display (240px Breite)
- **Minimalistische UI**: Fokus auf wesentliche Steuerungselemente
- **Touch- und Hardware-Kompatibilität**: Unterstützung für beide Eingabemethoden

## Installation und Einrichtung
### Voraussetzungen
- Rabbit R1 Gerät mit Internetverbindung
- Aktives Spotify Premium-Konto
- Ein oder mehrere Spotify Connect-kompatible Geräte

### Erste Schritte
1. **App öffnen**: Navigieren Sie zur Spotify Miniplayer-App auf Ihrem Rabbit R1
2. **Anmelden**: Tippen Sie auf "Log in with Spotify" und folgen Sie dem Authentifizierungsprozess
3. **Gerät wählen**: Wählen Sie Ihr gewünschtes Wiedergabegerät aus der Dropdown-Liste
4. **Musik genießen**: Nutzen Sie die On-Screen-Buttons oder die Hardware-Steuerung

### Hardware-Bedienung
- **Scroll-Rad hoch/runter**: Navigation zwischen verfügbaren Geräten
- **Seitlicher Button**: Play/Pause-Funktion
- **Touch-Interface**: Vollständige Steuerung über das Display

## Dateien und Struktur
```
spotify-miniplayer/
├── index.html          # Haupt-HTML-Datei mit UI-Struktur
├── miniplayer.js       # JavaScript-Logik und Spotify API-Integration
├── style.css           # Styling für Rabbit R1-optimierte Darstellung
├── css/               # Zusätzliche Stylesheets
├── BlankCoverArt.png   # Standard-Albumcover für Titel ohne Artwork
└── README.md          # Diese Dokumentation
```

## API-Berechtigungen
Die Anwendung verwendet folgende Spotify API-Berechtigungen:
- `user-read-playback-state`: Lesen des aktuellen Wiedergabestatus
- `user-modify-playback-state`: Steuerung der Wiedergabe
- `user-read-currently-playing`: Zugriff auf Informationen zum aktuellen Titel
- `playlist-read-private`: Zugriff auf private Playlists
- `user-library-read`: Lesen der Musikbibliothek
- `streaming`: Direkte Musikwiedergabe (falls unterstützt)

## Sicherheit und Datenschutz
- **PKCE-Authentifizierung**: Moderne OAuth-Sicherheitsstandards
- **Lokale Token-Speicherung**: Zugriffstoken werden lokal im Browser gespeichert
- **Keine Passwort-Speicherung**: Direkte Authentifizierung über Spotify
- **HTTPS-Verbindungen**: Alle API-Aufrufe erfolgen verschlüsselt

## Entwicklung
### Technologie-Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **API**: Spotify Web API
- **Authentifizierung**: OAuth 2.0 mit PKCE
- **Hosting**: GitHub Pages

### Anpassungen
Die Anwendung kann durch Modifikation der JavaScript- und CSS-Dateien an spezifische Anforderungen angepasst werden. Beachten Sie dabei die Spotify API-Richtlinien und die Display-Beschränkungen des Rabbit R1.

## Support und Feedback
Bei Fragen oder Problemen wenden Sie sich gerne an:
- **Entwickler**: atomlabor.de
- **Repository**: [GitHub - atomlabor/rabbit-r1-apps](https://github.com/atomlabor/rabbit-r1-apps)

---
*Entwickelt von atomlabor.de für die Rabbit R1 Community.*
