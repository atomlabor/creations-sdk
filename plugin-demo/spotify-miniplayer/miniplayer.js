// --- Spotify Auth/Token-Utility (unchanged, PKCE & robust) ---
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

// --- spotify r1mote REMOTE-APP ---
class SpotifyR1mote {
    constructor(token) {
        this.token = token;
        this.deviceList = [];
        this.deviceIndex = 0;
        this.currentDeviceId = null;
        this.playing = false;
        this.init();
        this.setupHardwareListeners();
        if (this.token) this.updateDevices();
        // Song-Status immer zu Beginn prüfen
        this.updateCurrentSong();
    }
    init() {
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.deviceSelect = document.getElementById('deviceSelect');
        this.trackTitle = document.getElementById('trackTitle');
        this.trackArtist = document.getElementById('trackArtist');
        this.albumArt = document.getElementById('albumArt');
        this.currentSongTitle = document.getElementById('currentSong');
        this.loginBtn = document.getElementById('loginSpotify');
        this.playIcon = document.getElementById('playIcon');
        this.pauseIcon = document.getElementById('pauseIcon');
        if(this.albumArt) {
            this.albumArt.src = "BlankCoverArt.png";
            this.albumArt.alt = "No Album Art";
        }
        this.trackTitle.textContent = "spotify r1mote";
        if (this.loginBtn) this.loginBtn.style.display = "none";
        if(this.playBtn) this.playBtn.addEventListener('click', () => this.togglePlayback());
        if(this.prevBtn) this.prevBtn.addEventListener('click', () => this.previousTrack());
        if(this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextTrack());
        if(this.deviceSelect) this.deviceSelect.addEventListener('change', () => this.selectDevice(this.deviceSelect.selectedIndex));
    }
    setupHardwareListeners() {
        window.addEventListener("scrollUp", () => {
            if (this.deviceList.length === 0) return;
            this.deviceIndex = Math.max(this.deviceIndex - 1, 0);
            this.deviceSelect.selectedIndex = this.deviceIndex;
            this.selectDevice(this.deviceIndex);
            this.showHardwareFeedback("⬆ Device: " + this.deviceList[this.deviceIndex].name);
        });
        window.addEventListener("scrollDown", () => {
            if (this.deviceList.length === 0) return;
            this.deviceIndex = Math.min(this.deviceIndex + 1, this.deviceList.length - 1);
            this.deviceSelect.selectedIndex = this.deviceIndex;
            this.selectDevice(this.deviceIndex);
            this.showHardwareFeedback("⬇ Device: " + this.deviceList[this.deviceIndex].name);
        });
        window.addEventListener("sideClick", () => this.togglePlayback());
    }
    async updateDevices() {
        try {
            const resp = await fetch('https://api.spotify.com/v1/me/player/devices', {
                headers: { 'Authorization': 'Bearer ' + this.token }
            });
            const json = await resp.json();
            this.deviceList = (json.devices||[]);
            this.renderDeviceDropdown();
            if (this.deviceList.length > 0) {
                this.selectDevice(this.deviceIndex);
            } else {
                this.showHardwareFeedback('No Spotify Connect devices found! Make sure your Spotify app is open.');
                this.deviceSelect.innerHTML = '<option disabled selected>No Spotify Connect devices found.</option>';
            }
        } catch(e) {
            this.showHardwareFeedback("Failed to fetch devices.");
            this.deviceSelect.innerHTML = '<option disabled selected>Device fetch error.</option>';
        }
    }
    renderDeviceDropdown() {
        this.deviceSelect.innerHTML = "";
        if (!this.deviceList.length) {
            let opt = document.createElement("option");
            opt.value = "";
            opt.disabled = true;
            opt.selected = true;
            opt.textContent = "No Spotify Connect devices found.";
            this.deviceSelect.appendChild(opt);
            return;
        }
        this.deviceList.forEach(device => {
            const opt = document.createElement("option");
            opt.value = device.id || "";
            opt.disabled = !!device.is_restricted;
            opt.innerText = `${device.name} [${device.type}]`
                + (device.is_active ? " (active)" : "")
                + (device.is_restricted ? " (not controllable)" : "");
            this.deviceSelect.appendChild(opt);
        });
        this.deviceIndex = 0;
        this.deviceSelect.selectedIndex = this.deviceIndex;
    }
    selectDevice(index) {
        if (this.deviceList.length === 0) return;
        this.deviceIndex = index;
        this.currentDeviceId = this.deviceList[index]?.id;
        this.showHardwareFeedback("Controlling: " + this.deviceList[index].name);
        this.updateCurrentSong();
    }
    async playOnCurrentDevice(endpoint) {
        if (!this.currentDeviceId) {
            this.showHardwareFeedback("No device selected!");
            return;
        }
        await fetch(`https://api.spotify.com/v1/me/player/${endpoint}?device_id=${this.currentDeviceId}`, {
            method: endpoint === "play" || endpoint === "pause" ? "PUT" : "POST",
            headers: { 'Authorization': 'Bearer ' + this.token }
        });
        setTimeout(()=>this.updateCurrentSong(), 700);
    }
    async togglePlayback() {
        // Status von Spotify holen und Play/Pause korrekt unterscheiden
        const resp = await fetch('https://api.spotify.com/v1/me/player', {
            headers: { 'Authorization': 'Bearer ' + this.token }
        });
        const data = await resp.json();
        let isPlaying = !!(data && data.is_playing);
        await this.playOnCurrentDevice(isPlaying ? "pause" : "play");
        // Play/Pause-Icon wechseln
        if(this.playIcon && this.pauseIcon) {
            this.playIcon.style.display = isPlaying ? "inline" : "none";
            this.pauseIcon.style.display = isPlaying ? "none" : "inline";
        }
        setTimeout(()=>this.updateCurrentSong(), 800);
    }
    async previousTrack()  { await this.playOnCurrentDevice("previous"); }
    async nextTrack()      { await this.playOnCurrentDevice("next"); }
    async updateCurrentSong() {
        // Zeigt Cover und Songtitel des aktuell laufenden Titels (accountweit, deviceunabhängig)
        try {
            const resp = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: { 'Authorization': 'Bearer ' + this.token }
            });
            if (!resp.ok) {
                this.albumArt.src = "BlankCoverArt.png";
                this.currentSongTitle.textContent = "";
                return;
            }
            const data = await resp.json();
            if (data && data.item) {
                this.albumArt.src = (data.item.album.images[0]?.url) ? data.item.album.images[0].url : "BlankCoverArt.png";
                this.currentSongTitle.textContent = data.item.name + " – " + data.item.artists.map(a=>a.name).join(", ");
            } else {
                this.albumArt.src = "BlankCoverArt.png";
                this.currentSongTitle.textContent = "";
            }
        } catch(e) {
            this.albumArt.src = "BlankCoverArt.png";
            this.currentSongTitle.textContent = "";
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
        } catch(e){ valid = false; }
    }
    if (token && valid) {
        new SpotifyR1mote(token);
    } else {
        window.localStorage.removeItem('spotify_token');
        if (loginBtn) loginBtn.style.display = "block";
    }
});
