// ==== SPOTIFY MINIPLAYER - Rabbit R1 Compatible ====
// CLIENT_ID und REDIRECT_URI sind App-IDs; jeder meldet sich mit seinem eigenen Spotify-Konto an!
const SPOTIFY_CLIENT_ID = 'f28477d2f23444739d1f6911c1d6be9d';
const SPOTIFY_REDIRECT_URI = 'https://atomlabor.github.io/rabbit-spotify-miniplayer/';
const SPOTIFY_SCOPES = "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state playlist-read-private";
let spotifyPlayer = null;
let currentDeviceId = null;
let isPlaying = false;
let currentTrack = null;
let userInteractionDetected = false;

// PKCE- & UI-Helper wie gehabt...
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}
async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function setStatus(msg) {
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = msg;
}
function showLoginBtn(msg = "") {
  document.getElementById('loginSection').style.display = "flex";
  document.getElementById('playerControls').style.display = "none";
  if (msg) setStatus(msg);
}
function hideLoginBtn() {
  document.getElementById('loginSection').style.display = "none";
}
function showPlayer() {
  document.getElementById('playerControls').style.display = "flex";
}
function updateTrackInfo(track) {
  document.getElementById('trackName').textContent = track?.name || '-';
  document.getElementById('artistName').textContent = (track?.artists?.map(a=>a.name).join(', ')) || '';
  const albumArt = document.getElementById('albumArt');
  if (track?.album?.images?.[0]) {
    albumArt.src = track.album.images[0].url;
    albumArt.style.display = 'block';
  } else {
    albumArt.style.display = 'none';
  }
}
function updatePlayPauseIcon(isPlaying) {
  document.getElementById('playIcon').style.display = isPlaying ? 'none' : 'inline';
  document.getElementById('pauseIcon').style.display = isPlaying ? 'inline' : 'none';
}
function updatePlayButton() { updatePlayPauseIcon(isPlaying); }

// Login-Flow
window.doLoginFlow = async function() {
  setStatus("Preparing login...");
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  localStorage.setItem('spotify_code_verifier', codeVerifier);
  const authUrl = 'https://accounts.spotify.com/authorize'
    + '?response_type=code'
    + '&client_id=' + encodeURIComponent(SPOTIFY_CLIENT_ID)
    + '&scope=' + encodeURIComponent(SPOTIFY_SCOPES)
    + '&redirect_uri=' + encodeURIComponent(SPOTIFY_REDIRECT_URI)
    + '&code_challenge_method=S256'
    + '&code_challenge=' + codeChallenge;
  window.location = authUrl;
};

function handleRedirectCallback() {
  if (window.location.search.includes('code=')) {
    setStatus("Authorizing...");
    const code = new URLSearchParams(window.location.search).get('code');
    const codeVerifier = localStorage.getItem('spotify_code_verifier');
    if (!code || !codeVerifier) {
      setStatus("Authorization data missing.");
      showLoginBtn("Try again.");
      return true;
    }
    fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        code_verifier: codeVerifier
      })
    })
    .then(r=>r.json())
    .then(data=>{
      if (data.access_token) {
        localStorage.setItem("spotify_access_token", data.access_token);
        localStorage.removeItem('spotify_code_verifier');
        window.history.replaceState({}, document.title, SPOTIFY_REDIRECT_URI);
        setStatus("Login erfolgreich. Player lädt ...");
        hideLoginBtn();
        showPlayer();
        initSpotifyPlayer();
        fetchAndShowRecentAlbums();
        setTimeout(()=>{document.getElementById('playHint').style.display='block'}, 400);
      } else {
        setStatus("Authorization failed: "+JSON.stringify(data));
        localStorage.removeItem("spotify_access_token");
        showLoginBtn("Try again.");
      }
    })
    .catch(error=>{
      setStatus("Authorization error: " + error);
      localStorage.removeItem("spotify_access_token");
      showLoginBtn("Try again.");
    });
    return true;
  }
  return false;
}

// Device
function transferPlaybackHere(device_id, token) {
  fetch('https://api.spotify.com/v1/me/player', {
    method: "PUT",
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_ids: [device_id], play: false })
  });
}

// Player-Init
function initSpotifyPlayer() {
  const token = localStorage.getItem('spotify_access_token');
  if (!token) { showLoginBtn("Sign in required."); return; }
  if (!window.Spotify) {
    const script = document.createElement('script'); script.src = 'https://sdk.scdn.co/spotify-player.js'; script.async = true; document.head.appendChild(script);
  }
  window.onSpotifyWebPlaybackSDKReady = () => {
    spotifyPlayer = new Spotify.Player({
      name: "Rabbit R1 Spotify Player",
      getOAuthToken: cb => cb(token),
      volume: 0.8
    });
    spotifyPlayer.addListener('ready', ({ device_id }) => {
      currentDeviceId = device_id;
      setStatus("Player bereit.");
      setTimeout(() => {
        transferPlaybackHere(device_id, token);
        setStatus("Bereit zum Abspielen!");
        document.getElementById('playHint').style.display = 'block';
        fetchAndShowRecentAlbums();
      }, 1000);
    });
    spotifyPlayer.addListener('not_ready', ()=>{ setStatus("Player not ready."); });
    spotifyPlayer.addListener('player_state_changed', (state) => {
      if (!state) return;
      isPlaying = !state.paused;
      currentTrack = state.track_window.current_track;
      updateTrackInfo(currentTrack);
      updatePlayButton();
      setStatus(isPlaying ? "Playing" : "Paused");
    });
    spotifyPlayer.addListener('initialization_error', ({ message }) => setStatus("Init failed: "+message));
    spotifyPlayer.addListener('authentication_error', ({ message }) => {
      localStorage.removeItem('spotify_access_token');
      setStatus("Auth failed: "+message);
      showLoginBtn("Sign in again.");
    });
    spotifyPlayer.addListener('account_error', ({ message }) => setStatus("Account error: "+message));
    spotifyPlayer.addListener('playback_error', ({ message }) => setStatus("Playback error: "+message));
    spotifyPlayer.connect();
  };
}

// Controls
window.togglePlayback = function() {
  userInteractionDetected = true;
  if (spotifyPlayer) spotifyPlayer.togglePlay();
  document.getElementById('playHint').style.display = 'none';
};
window.nextTrack = function() { if (spotifyPlayer) spotifyPlayer.nextTrack(); };
window.previousTrack = function() { if (spotifyPlayer) spotifyPlayer.previousTrack(); };

async function fetchSpotify(url) {
  const token = localStorage.getItem('spotify_access_token');
  const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
  return res.json();
}

// -- Holt und zeigt die drei letzten Alben
async function fetchAndShowRecentAlbums() {
  const token = localStorage.getItem('spotify_access_token');
  if (!token) return;
  try {
    let resp = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=18',{ headers:{'Authorization':'Bearer '+token}});
    let data = await resp.json(), albums = [], seen = {};
    data.items.forEach(item => {
      const album = item.track.album;
      if (album && !seen[album.id]) { albums.push(album); seen[album.id]=true; }
    });
    albums = albums.slice(0,3);
    const ra = document.getElementById('recentAlbums');
    if (!ra) return;
    ra.innerHTML =
      albums.map(a => `
        <div class="recent-album" tabindex="0" data-uri="${a.uri}">
          <img src="${a.images[0]?.url||''}">
          <span>${a.name}</span>
        </div>
      `).join('');
    document.querySelectorAll(".recent-album").forEach(el => {
      el.onclick = function() { playAlbum(this.getAttribute('data-uri')); };
      el.onkeydown = function(e){ if (e.key==="Enter"||e.key===" ") this.click();}
    });
    // Scrollrad-Fokus aktivieren:
    if ('enableRecentFocusability' in window) window.enableRecentFocusability();
  } catch (err) {
    const ra = document.getElementById('recentAlbums');
    if(ra) ra.innerHTML = '';
  }
}
function playAlbum(albumUri) {
  const token = localStorage.getItem('spotify_access_token');
  if (!token) return;
  fetch('https://api.spotify.com/v1/me/player/play', {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ context_uri: albumUri })
  });
}

// Event-Bindings
document.addEventListener('DOMContentLoaded', function() {
  const loginBtn = document.getElementById('loginBtn'); if (loginBtn) loginBtn.onclick = window.doLoginFlow;
  const playBtn = document.getElementById('playPauseBtn'); if (playBtn) playBtn.onclick = window.togglePlayback;
  const nextBtn = document.getElementById('nextBtn'); if (nextBtn) nextBtn.onclick = window.nextTrack;
  const prevBtn = document.getElementById('prevBtn'); if (prevBtn) prevBtn.onclick = window.previousTrack;
  // Init nach Login oder Token-Reload
  if (!handleRedirectCallback()) {
    const token = localStorage.getItem('spotify_access_token');
    if (token) {
      hideLoginBtn();
      showPlayer();
      initSpotifyPlayer();
      fetchAndShowRecentAlbums();
      setTimeout(()=>{document.getElementById('playHint').style.display='block'}, 400);
    } else {
      showLoginBtn("Mit Spotify Premium anmelden.");
    }
  }
});
window.addEventListener('beforeunload', function() {
  if (spotifyPlayer) spotifyPlayer.disconnect();
});
