# Spotify Embed Wrapper für Rabbit R1

🎵 **Kompakter HTML-Wrapper für Spotify-Integration im Rabbit R1 Mini-Webview (320x240px)**

## Beschreibung

Dieses Projekt bietet eine optimierte HTML-Wrapper-Lösung für die Integration von Spotify-Inhalten in die kleine Webview des Rabbit R1 (320x240 Pixel). Der Wrapper kann sowohl mit dem eigenen [spotify-miniplayer](../spotify-miniplayer/) als auch mit Standard-Spotify-Embed-URLs verwendet werden.

## Features

- ✅ **Optimiert für 320x240px** - Perfekt angepasst an Rabbit R1 Mini-Webview
- ✅ **Responsive Design** - Funktioniert auch auf anderen kleinen Bildschirmen  
- ✅ **Toggle-Funktion** - Wechsel zwischen Info-Platzhalter und Spotify-Embed
- ✅ **Beispiel-Integration** - Vorgefertigtes Spotify-Playlist-Embed
- ✅ **Moderne UI** - Dunkles Design mit Spotify-Grün-Akzenten
- ✅ **Leichtgewichtig** - Keine externen Abhängigkeiten

## Verwendung

### 1. Direkte Nutzung
```html
<!-- Einfach die index.html öffnen -->
file://pfad/zur/index.html
```

### 2. Mit eigenem Mini-Player
```html
<!-- iFrame src ändern auf eigenen Mini-Player -->
<iframe src="../spotify-miniplayer/" ...></iframe>
```

### 3. Mit Spotify-Embed-URL
```html
<!-- Beispiel für Playlist-Embed -->
<iframe src="https://open.spotify.com/embed/playlist/37i9dQZF1DX0XUsuxWHRQd?utm_source=generator&theme=0" ...></iframe>

<!-- Beispiel für Track-Embed -->
<iframe src="https://open.spotify.com/embed/track/4iV5W9uYEdYUVa79Axb7Rh?utm_source=generator" ...></iframe>

<!-- Beispiel für Album-Embed -->
<iframe src="https://open.spotify.com/embed/album/1DFixLWuPkv3KT3TnV35m3?utm_source=generator" ...></iframe>
```

## Anwendungsbeispiele

### Szenario 1: R1 Creation Plugin
```javascript
// Integration als R1 Creation mit SDK
window.location = 'https://atomlabor.github.io/creations-sdk/plugin-demo/spotify-embed-wrapper/';
```

### Szenario 2: Lokale Entwicklung
```bash
# Lokalen Server starten
python3 -m http.server 8000
# Browser öffnen: http://localhost:8000
```

### Szenario 3: Custom Integration
```html
<!DOCTYPE html>
<html>
<head>
    <title>Mein R1 Music Player</title>
</head>
<body>
    <iframe 
        src="spotify-embed-wrapper/index.html" 
        width="320" 
        height="240" 
        frameborder="0">
    </iframe>
</body>
</html>
```

## Technische Details

- **Viewport**: 320x240px (optimiert für Rabbit R1)
- **CSS**: Embedded Styles, keine externen Dateien
- **JavaScript**: Vanilla JS für Toggle-Funktionalität
- **Kompatibilität**: Moderne Browser, mobile Geräte

## Anpassungen

### URL ändern
```javascript
// In index.html, Zeile ~90:
src="https://open.spotify.com/embed/DEINE_SPOTIFY_URL"
```

### Design anpassen
```css
/* Spotify-Grün ändern: */
#1ed760 → #DEINE_FARBE

/* Größe anpassen: */
width: 320px; height: 240px; → width: XYZpx; height: ABCpx;
```

### Toggle-Verhalten
```javascript
// Automatisches Umschalten aktivieren:
setInterval(toggleEmbed, 8000); // alle 8 Sekunden
```

## Siehe auch

- [spotify-miniplayer](../spotify-miniplayer/) - Vollständiger Spotify-Player mit PKCE-Login
- [Rabbit R1 Creation SDK](../../) - Hauptprojekt mit weiteren Tools
- [Spotify for Developers](https://developer.spotify.com/documentation/embeds/) - Offizielle Embed-Dokumentation

---

**🐰 Entwickelt für Rabbit R1 • 🎵 Powered by Spotify**
