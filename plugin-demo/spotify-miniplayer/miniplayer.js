// --- Spotify Auth/Token-Utility (Production Robust) ---
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
// --- PKCE helper functions ---
function generateCodeVerifier() {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const randomValues = crypto.getRandomValues(new Uint8Array(64));
    return randomValues.reduce((acc, x) => acc + possible[x % possible.length], '');
}
async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function getAccessToken() {
    const existingToken = window.localStorage.getItem('spotify_token');
    if (existingToken) return existingToken;
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) exchangeCodeForToken(code);
    return null;
}
async function exchangeCodeForToken(code) {
    const codeVerifier = localStorage.getItem('code_verifier');
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: SPOTIFY_CLIENT_ID,
            grant_type: 'authorization_code',
            code,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            code_verifier: codeVerifier,
        }),
    });
    const data = await response.json();
    if (data.access_token) {
        localStorage.setItem('spotify_token', data.access_token);
        localStorage.removeItem('code_verifier');
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.reload();
    }
}
async function loginWithSpotify() {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    localStorage.setItem('code_verifier', codeVerifier);
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: SPOTIFY_CLIENT_ID,
        scope: SPOTIFY_SCOPES.join(' '),
        redirect_uri: SPOTIFY_REDIRECT_URI,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
    });
    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
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
        if(this.token) this.loadSpotifyData();
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
        if(this.playBtn) this.playBtn.addEventListener('click', () => this.togglePlayback());
        if(this.prevBtn) this.prevBtn.addEventListener('click', () => this.previousTrack());
        if(this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextTrack());
    }
    setupHardwareListeners() {
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
            if (focusedElement) this.selectAlbum(parseInt(focusedElement.dataset.index));
        });
    }
    async loadSpotifyData() {
        try {
            const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=7', {
                headers: { 'Authorization': 'Bearer ' + this.token }
            });
            if (!response.ok) {
                this.showHardwareFeedback("⚠️ Spotify-Fehler beim Laden!");
                if (this.loginBtn) this.loginBtn.style.display = "block";
                console.warn('[Spotify API]', await response.text());
                return;
            }
            const json = await response.json();
            this.albums = (json.items ?? []).map(item => ({
                title: item.track.name,
                artist: item.track.artists.map(a => a.name).join(', '),
                artwork: item.track.album.images[0]?.url,
                uri: item.track.uri
            })).filter(album => album.uri);
            this.renderAlbums();
            if (this.albums.length === 0) this.showHardwareFeedback("Keine letzten Alben.");
            await this.updateCurrentFromAPI();
        } catch(e) {
            this.showHardwareFeedback("⚠️ Netzwerk-/API-Fehler!");
            if (this.loginBtn) this.loginBtn.style.display = "block";
            console.error('[Miniplayer] API Error: ', e);
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
                    artwork: data.item.album.images[0]?.url,
                    uri: data.item.uri
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
        const deviceId = window._rabbit_r1_device_id;
        if (!deviceId || !track || !track.uri) {
            this.showHardwareFeedback("⛔ Kein Song auswählbar/Device nicht bereit.");
            return;
        }
        try {
            const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: "PUT",
                headers: {
                    'Authorization': 'Bearer ' + this.token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ uris: [track.uri] })
            });
            if (!response.ok) {
                this.showHardwareFeedback("❗ Wiedergabe-Fehler (" + response.status + ")");
                console.warn('[Spotify Play Error]', await response.text());
            }
        } catch(e) {
            this.showHardwareFeedback("❗ Fehler beim Abspielen!");
            console.error('[Play API] ', e);
        }
    }
    async togglePlayback() {
        const deviceId = window._rabbit_r1_device_id;
        if(!this.token || !deviceId) return;
        this.isPlaying = !this.isPlaying;
        const endpoint = `https://api.spotify.com/v1/me/player/${this.isPlaying ? "play" : "pause"}?device_id=${deviceId}`;
        await fetch(endpoint, { method: "PUT", headers: { 'Authorization': 'Bearer ' + this.token } });
        this.playBtn.textContent = this.isPlaying ? "⏸" : "▶";
        this.playBtn.style.background = this.isPlaying ?
            "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)";
        this.updateCurrentFromAPI();
    }
    async previousTrack() {
        const deviceId = window._rabbit_r1_device_id;
        if(!this.token || !deviceId) return;
        await fetch(`https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`, {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + this.token }
        });
        setTimeout(()=>this.updateCurrentFromAPI(), 1000);
    }
    async nextTrack() {
        const deviceId = window._rabbit_r1_device_id;
        if(!this.token || !deviceId) return;
        await fetch(`https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`, {
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + this.token }
        });
        setTimeout(()=>this.updateCurrentFromAPI(), 1000);
    }
    updateCurrentTrack() {
        if (!this.currentTrack) return;
        const cover = this.currentTrack.artwork && this.currentTrack.artwork.trim() ? this.currentTrack.artwork : 'BlankCoverArt.png';
        this.trackTitle.textContent = this.currentTrack.title;
        this.trackArtist.textContent = this.currentTrack.artist;
        this.albumArt.src = cover;
        this.albumArt.alt = `${this.currentTrack.title} Artwork`;
    }
    renderAlbums() {
        this.albumsGrid.innerHTML = '';
        if (!this.albums || this.albums.length === 0) {
            this.albumsGrid.innerHTML = '<div style="padding:8px;color:#fff;font-size:10px;">Keine Albumauswahl verfügbar.</div>';
            return;
        }
        this.albums.forEach((album, index) => {
            const albumItem = document.createElement('div');
            albumItem.className = 'album-item';
            albumItem.dataset.index = index;
            albumItem.tabIndex = 0;
            const cover = album.artwork && album.artwork.trim() ? album.artwork : 'BlankCoverArt.png';
            albumItem.innerHTML = `
                <img src="${cover}" alt="${album.title}"/>
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
        if (this.albums.length > 0) this.updateFocus();
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

// --- Web Playback SDK-Integration mit Logging ---
window.onSpotifyWebPlaybackSDKReady = () => {
    const token = getAccessToken();
    const player = new Spotify.Player({
        name: 'Rabbit R1 Miniplayer',
        getOAuthToken: cb => cb(token),
        volume: 0.7
    });
    player.addListener('ready', ({ device_id }) => {
        window._rabbit_r1_device_id = device_id;
        console.log('Rabbit R1 Miniplayer ist bereit mit Device ID', device_id);
    });
    player.addListener('not_ready', ({ device_id }) => {
        console.log('Rabbit R1 Miniplayer nicht bereit', device_id);
    });
    player.addListener('initialization_error', e => console.error('Player Init Error', e));
    player.addListener('authentication_error', e => {
        window.localStorage.removeItem('spotify_token');
        alert("❌ Spotify-Token ungültig. Bitte erneut einloggen!");
        window.location.reload();
    });
    player.addListener('account_error', e => alert("⚠️ Spotify Account-Problem: " + e.message));
    player.addListener('playback_error', e => alert("❌ Playback Error: " + e.message));
    player.connect();
};

// --- DOMContentLoaded: Auth/Start + Token-Validierung ---
document.addEventListener('DOMContentLoaded', async () => {
    const loginBtn = document.getElementById('loginSpotify');
    if (loginBtn) loginBtn.onclick = loginWithSpotify;
    let token = getAccessToken();
    let valid = false;
    if (token) {
        try {
            const testResp = await fetch('https://api.spotify.com/v1/me', {
                headers: { Authorization: 'Bearer ' + token }
            });
            valid = testResp.ok;
        } catch(e){
            valid = false;
        }
    }
    if (token && valid) {
        new SpotifyMiniplayerR1(token);
    } else {
        window.localStorage.removeItem('spotify_token');
        if (loginBtn) loginBtn.style.display = "block";
    }
});
