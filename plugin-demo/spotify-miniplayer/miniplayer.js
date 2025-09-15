// --- Spotify Auth/Token-Utility ---
const SPOTIFY_CLIENT_ID = 'f28477d2f23444739d1f6911c1d6be9d';
const SPOTIFY_REDIRECT_URI = 'https://atomlabor.github.io/rabbit-r1-apps/plugin-demo/spotify-miniplayer/';
const SPOTIFY_SCOPES = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'playlist-read-private',
    'user-library-read',
    'streaming'
];

function getAccessToken() {
    // Token aus URL-Hash ziehen
    if(window.location.hash) {
        const hash = window.location.hash.substring(1).split('&').reduce((acc, cur) => {
            const [key, value] = cur.split('=');
            acc[key] = value;
            return acc;
        }, {});
        if(hash.access_token) {
            window.localStorage.setItem('spotify_token', hash.access_token);
            window.location.hash = '';
        }
    }
    return window.localStorage.getItem('spotify_token');
}

function loginWithSpotify() {
    const url = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_SCOPES.join(' '))}`;
    window.location = url;
}

// --- SPOTIFY MINIPLAYER-CLASS ---
class SpotifyMiniplayerR1 {
    constructor(token) {
        this.token = token;
        this.currentFocus = 0;
        this.isPlaying = false;
        this.currentTrack = null;
        this.albums = [];
        this.init();
        this.setupHardwareListeners();
        if(this.token) {
            this.loadSpotifyData();
        }
    }

    init() {
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.albumsGrid = document.getElementById('albumsGrid');
        this.trackTitle = document.getElementById('trackTitle');
        this.trackArtist = document.getElementById('trackArtist');
        this.albumArt = document.getElementById('albumArt');
        this.r1Status = document.getElementById('r1Status');
        this.loginBtn = document.getElementById('loginSpotify');
        if(this.loginBtn) this.loginBtn.style.display = "none";

        this.playBtn.addEventListener('click', () => this.togglePlayback());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
    }

    setupHardwareListeners() {
        // Rabbit R1 Hardware Events
        window.addEventListener("sideClick", () => {
            this.togglePlayback();
            this.showHardwareFeedback("⏯ Play/Pause");
        });
        window.addEventListener("scrollUp", () => {
            this.navigateUp();
            this.showHardwareFeedback("⬆ Hoch");
        });
        window.addEventListener("scrollDown", () => {
            this.navigateDown();
            this.showHardwareFeedback("⬇ Runter");
        });
        window.addEventListener("touchClick", (event) => {
            const focusedElement = document.querySelector('.album-item.focused');
            if (focusedElement) {
                this.selectAlbum(parseInt(focusedElement.dataset.index));
            }
        });
    }

    async loadSpotifyData() {
        try {
            // 1. Kürzlich gespielt holen
            const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=7', {
                headers: { 'Authorization': 'Bearer ' + this.token }
            });
            const json = await response.json();
            this.albums = json.items.map(item => ({
                title: item.track.name,
                artist: item.track.artists.map(a => a.name).join(', '),
                artwork: item.track.album.images[0]?.url
            }));
            this.renderAlbums();

            // 2. Aktueller Track
            await this.updateCurrentFromAPI();
        } catch(e) {
            this.showHardwareFeedback("⚠️ Login erforderlich!");
            if(this.loginBtn) this.loginBtn.style.display = "block";
        }
    }

    async updateCurrentFromAPI() {
        try {
            const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: { 'Authorization': 'Bearer ' + this.token }
            });
            if(!response.ok) return;
            const data = await response.json();
            if(data.item) {
                this.currentTrack = {
                    title: data.item.name,
                    artist: data.item.artists.map(a => a.name).join(", "),
                    artwork: data.item.album.images[0]?.url
                };
                this.updateCurrentTrack();
            }
        } catch(e){ /* fallback */ }
    }

    navigateUp() {
        if (this.albums.length === 0) return;
        this.currentFocus = Math.max(this.currentFocus - 1, 0);
        this.updateFocus();
    }

    navigateDown() {
        if (this.albums.length === 0) return;
        this.currentFocus = Math.min(this.currentFocus + 1, this.albums.length - 1);
        this.updateFocus();
    }

    updateFocus() {
        document.querySelectorAll('.album-item').forEach(item => item.classList.remove('focused'));
        const currentItem = document.querySelector(`[data-index="${this.currentFocus}"]`);
        if (currentItem) {
            currentItem.classList.add('focused');
            currentItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    selectAlbum(index) {
        if (index >= 0 && index < this.albums.length) {
            this.currentTrack = this.albums[index];
            this.updateCurrentTrack();
            this.playThisTrack(this.currentTrack);
            this.showHardwareFeedback(`♪ ${this.currentTrack.title}`);
        }
    }

    async playThisTrack(track) {
        // Suche Track URI heraus (idealerweise track.uri statt Name—hier auf /search ausbauen, wenn nötig)
        // Bei recently-played: eventuell via item.track.uri holen:
        //
        // Beispiel: await fetch('https://api.spotify.com/v1/me/player/play', ...) mit body {uris:[track.uri]}
    }

    async togglePlayback() {
        if(!this.token) return;
        this.isPlaying = !this.isPlaying;
        const endpoint = `https://api.spotify.com/v1/me/player/${this.isPlaying ? "play" : "pause"}`;
        await fetch(endpoint, {
            method: "PUT",
            headers: { 'Authorization': 'Bearer ' + this.token }
        });
        this.playBtn.textContent = this.isPlaying ? "⏸" : "▶";
        this.playBtn.style.background = this.isPlaying ?
            "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)";
        this.updateCurrentFromAPI();
    }

    async previousTrack() {
        if(!this.token) return;
        await fetch('https://api.spotify.com/v1/me/player/previous', {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + this.token }
        });
        setTimeout(()=>this.updateCurrentFromAPI(), 1000);
    }

    async nextTrack() {
        if(!this.token) return;
        await fetch('https://api.spotify.com/v1/me/player/next', {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + this.token }
        });
        setTimeout(()=>this.updateCurrentFromAPI(), 1000);
    }

    updateCurrentTrack() {
        if (!this.currentTrack) return;
        this.trackTitle.textContent = this.currentTrack.title;
        this.trackArtist.textContent = this.currentTrack.artist;
        this.albumArt.src = this.currentTrack.artwork;
        this.albumArt.alt = `${this.currentTrack.title} Artwork`;
    }

    renderAlbums() {
        this.albumsGrid.innerHTML = '';
        this.albums.forEach((album, index) => {
            const albumItem = document.createElement('div');
            albumItem.className = 'album-item';
            albumItem.dataset.index = index;
            albumItem.tabIndex = 0;
            albumItem.innerHTML = `
                <img src="${album.artwork}" alt="${album.title}">
                <div class="album-info">
                    <div class="album-title">${album.title}</div>
                    <div class="album-artist">${album.artist}</div>
                </div>
            `;
            albumItem.addEventListener('click', () => {
                this.currentFocus = index;
                this.selectAlbum(index);
                this.updateFocus();
            });
            this.albumsGrid.appendChild(albumItem);
        });
        if (this.albums.length > 0) {
            this.updateFocus();
        }
    }

    showHardwareFeedback(message) {
        const existingFeedback = document.querySelector('.hardware-feedback');
        if (existingFeedback) { existingFeedback.remove(); }
        const feedback = document.createElement('div');
        feedback.className = 'hardware-feedback';
        feedback.textContent = message;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.classList.add('show'), 10);
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => feedback.remove(), 300);
        }, 1500);
    }
}

// --- DOMContentLoaded: Auth/Start ---
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginSpotify');
    if(loginBtn) loginBtn.onclick = loginWithSpotify;
    const token = getAccessToken();
    if(token){
        new SpotifyMiniplayerR1(token);
    } else if(loginBtn) {
        loginBtn.style.display = "block";
    }
});
