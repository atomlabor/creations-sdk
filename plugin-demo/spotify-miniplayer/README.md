# Spotify Miniplayer für Rabbit R1
Eine professionelle Spotify Connect-Fernsteuerung für den Rabbit R1, die die nahtlose Steuerung von Spotify-kompatiblen Geräten ermöglicht.

<div align="center">
  <img src="spotify%20r1mote.png" alt="Spotify r1mote Beispielansicht" title="Spotify r1mote Beispielansicht">
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
- **Entwickler**: [atomlabor.de](https://atomlabor.de)
- **Repository**: [GitHub - atomlabor/rabbit-r1-apps](https://github.com/atomlabor/rabbit-r1-apps)

---
*Entwickelt von [atomlabor.de](https://atomlabor.de) für die Rabbit R1 Community.*

---

# Spotify Miniplayer for Rabbit R1

A professional Spotify Connect remote control for the Rabbit R1 that enables seamless control of Spotify-compatible devices.

<div align="center">
  <img src="spotify%20r1mote.png" alt="Spotify r1mote Example View" title="Spotify r1mote Example View">
</div>

## Overview

The **Spotify Miniplayer** is a web application specifically developed for the Rabbit R1, serving as a Spotify Connect remote for connected playback devices. The application offers a user-friendly interface for controlling music playback and displays information about the currently playing track.

## Features

### 🎵 Playback Control
- **Play/Pause**: Start and stop music playback
- **Track Navigation**: Skip forward and backward between tracks
- **Live Display**: Real-time display of the current song with album artwork

### 🔌 Spotify Connect Integration
- **Device Selection**: Dropdown menu for selecting available Spotify Connect devices
- **Automatic Detection**: Recognizes all active Spotify devices on the network
- **Device Status**: Shows active and available devices as well as their type

### 🎛️ Rabbit R1 Hardware Integration
- **Scroll Wheel**: Device navigation with the physical scroll wheel
- **Side Buttons**: Playback control via hardware buttons
- **Feedback System**: Visual feedback for hardware interactions

## Technical Specifications

### Authentication
- **OAuth 2.0 with PKCE**: Secure Spotify authentication without Client Secret
- **Token Management**: Automatic storage and management of access tokens
- **Session Persistence**: Maintains login between app starts

### API Integration
- **Spotify Web API**: Complete integration with Spotify's REST API
- **Real-time Updates**: Continuous synchronization of playback status
- **Error Handling**: Robust handling of API errors and network issues

### User Interface
- **Responsive Design**: Optimized for the Rabbit R1 display (240px width)
- **Minimalist UI**: Focus on essential control elements
- **Touch and Hardware Compatibility**: Support for both input methods

## Installation and Setup

### Prerequisites
- Rabbit R1 device with internet connection
- Active Spotify Premium account
- One or more Spotify Connect-compatible devices

### Getting Started
1. **Open App**: Navigate to the Spotify Miniplayer app on your Rabbit R1
2. **Sign In**: Tap on "Log in with Spotify" and follow the authentication process
3. **Select Device**: Choose your desired playback device from the dropdown list
4. **Enjoy Music**: Use the on-screen buttons or hardware controls

### Hardware Operation
- **Scroll Wheel Up/Down**: Navigation between available devices
- **Side Button**: Play/Pause function
- **Touch Interface**: Complete control via the display

## Files and Structure
```
spotify-miniplayer/
├── index.html          # Main HTML file with UI structure
├── miniplayer.js       # JavaScript logic and Spotify API integration
├── style.css           # Styling for Rabbit R1-optimized display
├── css/               # Additional stylesheets
├── BlankCoverArt.png   # Default album cover for tracks without artwork
└── README.md          # This documentation
```

## API Permissions

The application uses the following Spotify API permissions:
- `user-read-playback-state`: Read current playback status
- `user-modify-playback-state`: Control playback
- `user-read-currently-playing`: Access information about the current track
- `playlist-read-private`: Access private playlists
- `user-library-read`: Read music library
- `streaming`: Direct music playback (if supported)

## Security and Privacy
- **PKCE Authentication**: Modern OAuth security standards
- **Local Token Storage**: Access tokens are stored locally in the browser
- **No Password Storage**: Direct authentication via Spotify
- **HTTPS Connections**: All API calls are encrypted

## Development

### Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **API**: Spotify Web API
- **Authentication**: OAuth 2.0 with PKCE
- **Hosting**: GitHub Pages

### Customization

The application can be adapted to specific requirements by modifying the JavaScript and CSS files. Please observe the Spotify API guidelines and the display limitations of the Rabbit R1.

## Support and Feedback

For questions or issues, please contact:
- **Developer**: [atomlabor.de](https://atomlabor.de)
- **Repository**: [GitHub - atomlabor/rabbit-r1-apps](https://github.com/atomlabor/rabbit-r1-apps)

---
*Developed by [atomlabor.de](https://atomlabor.de) for the Rabbit R1 Community.*
