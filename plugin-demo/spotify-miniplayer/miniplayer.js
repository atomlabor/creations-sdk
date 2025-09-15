// ==== SPOTIFY MINIPLAYER - Rabbit R1 Compatible mit Modern PKCE-Login ====
// CLIENT_ID und REDIRECT_URI sind App-IDs; jeder meldet sich mit seinem eigenen Spotify-Konto an!
const SPOTIFY_CLIENT_ID = 'f28477d2f23444739d1f6911c1d6be9d';
const SPOTIFY_REDIRECT_URI = 'https://atomlabor.github.io/rabbit-spotify-miniplayer/';
const SPOTIFY_SCOPES = "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state playlist-read-private";
let spotifyPlayer = null;
let currentDeviceId = null;
let isPlaying = false;
let currentTrack = null;
let userInteractionDetected = false;

// ==== PKCE HELPER FUNCTIONS ====
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// === UI HELPER FUNCTIONS ===
function setStatus(msg) {
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = msg;
  console.log('Status:', msg);
}
function showLoginBtn(msg = "") {
  const loginBtn = document.getElementById('loginBtn');
  const loginSection = document.getElementById('loginSection');
  const controls = document.getElementById('playerControls');
  if (loginBtn) loginBtn.style.display = "block";
  if (loginSection) loginSection.style.display = "flex";
  if (controls) controls.style.display = "none";
  if (msg) setStatus(msg);
}
function hideLoginBtn() {
  const loginBtn = document.getElementById('loginBtn');
  const loginSection = document.getElementById('loginSection');
  if (loginBtn) loginBtn.style.display = "none";
  if (loginSection) loginSection.style.display = "none";
}
function showPlayer() {
  const playerControls = document.getElementById('playerControls');
  if (playerControls) playerControls.style.display = "flex";
}
function hidePlayer() {
  const playerControls = document.getElementById('playerControls');
  if (playerControls) playerControls.style.display = "none";
}
function updateTrackInfo(track) {
  const trackName = document.getElementById('trackName');
  const artistName = document.getElementById('artistName');
  const albumArt = document.getElementById('albumArt');
  if (track) {
    if (trackName) trackName.textContent = track.name || 'Unknown Track';
    if (artistName) artistName.textContent = track.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
    if (albumArt && track.album?.images?.[0]) {
      albumArt.src = track.album.images[0].url;
      albumArt.style.display = 'block';
    }
  } else {
    if (trackName) trackName.textContent = 'No track selected';
    if (artistName) artistName.textContent = '';
    if (albumArt) albumArt.style.display = 'none';
  }
}
function updatePlayButton() {
  const playBtn = document.getElementById('playPauseBtn');
  if (playBtn) {
    playBtn.textContent = isPlaying ? '❚❚' : '►';
    playBtn.title = isPlaying ? 'Pause' : 'Play';
  }
}

// === LOGIN FLOW ===
window.doLoginFlow = async function() {
  try {
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
  } catch (error) {
    console.error('Login flow error:', error);
    setStatus("Login preparation failed.");
  }
};

// === REDIRECT CALLBACK HANDLER ===
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
    .then(response => response.json())
    .then(data => {
      if (data.access_token) {
        localStorage.setItem("spotify_access_token", data.access_token);
        localStorage.removeItem('spotify_code_verifier');
        window.history.replaceState({}, document.title, SPOTIFY_REDIRECT_URI);
        setStatus("Login erfolgreich. Player & Auswahl initialisieren...");
        hideLoginBtn();
        showPlayer();
        initSpotifyPlayer();
        setupRabbitAlbumPlaylistUI();
        const playHint = document.getElementById('playHint');
        if (playHint) playHint.style.display = 'block';
  } else {
    console.error('Token exchange failed:', data);
    setStatus("Authorization failed.");
    showLoginBtn("Try again.");
  }
})
.catch(error => {
  console.error('Token exchange error:', error);
  setStatus("Authorization error.");
  showLoginBtn("Try again.");
});

    return true;
  }
  return false;
}

// === DEVICE ACTIVATION (Rabbit Fix: No Autoplay) ===
function transferPlaybackHere(device_id, token) {
  fetch('https://api.spotify.com/v1/me/player', {
    method: "PUT",
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      device_ids: [device_id],
      play: false // KEIN Autoplay – zwingend!
    })
  });
}

// === SPOTIFY PLAYER INITIALIZATION ===
function initSpotifyPlayer() {
  const token = localStorage.getItem('spotify_access_token');
  if (!token) {
    showLoginBtn("Sign in required.");
    return;
  }
  if (!window.Spotify) {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.head.appendChild(script);
  }
  window.onSpotifyWebPlaybackSDKReady = () => {
    spotifyPlayer = new Spotify.Player({
      name: "Rabbit R1 Spotify Player",
      getOAuthToken: cb => cb(token),
      volume: 0.8
    });
    spotifyPlayer.addListener('ready', ({ device_id }) => {
      currentDeviceId = device_id;
      setStatus("Player ready. Aktivieren...");
      setTimeout(() => {
        transferPlaybackHere(device_id, token);
        setStatus("Bereit zum Abspielen!");
        const playHint = document.getElementById('playHint');
        if (playHint) playHint.style.display = 'block';
      }, 1300); // Wartezeit wichtig
    });
    spotifyPlayer.addListener('not_ready', ({ device_id }) => {
      setStatus("Player not ready.");
      hidePlayer();
    });
    spotifyPlayer.addListener('player_state_changed', (state) => {
      if (!state) return;
      isPlaying = !state.paused;
      currentTrack = state.track_window.current_track;
      updateTrackInfo(currentTrack);
      updatePlayButton();
      setStatus(isPlaying ? "Playing" : "Paused");
    });
    spotifyPlayer.addListener('initialization_error', ({ message }) => {
      setStatus("Player initialization failed.");
    });
    spotifyPlayer.addListener('authentication_error', ({ message }) => {
      localStorage.removeItem('spotify_access_token');
      setStatus("Authentication failed.");
      showLoginBtn("Sign in again.");
    });
    spotifyPlayer.addListener('account_error', ({ message }) => {
      setStatus("Account validation failed. Premium required.");
    });
    spotifyPlayer.addListener('playback_error', ({ message }) => {
      setStatus("Playback error.");
    });
    spotifyPlayer.connect();
  };
}

// === PLAYER CONTROLS ===
window.togglePlayback = function() {
  userInteractionDetected = true;
  if (spotifyPlayer) spotifyPlayer.togglePlay();
  const hint = document.getElementById('playHint');
  if(hint) hint.style.display = 'none';
};
window.nextTrack = function() { if (spotifyPlayer) spotifyPlayer.nextTrack(); };
window.previousTrack = function() { if (spotifyPlayer) spotifyPlayer.previousTrack(); };

// === SPOTIFY API HELPERS ===
async function fetchSpotify(url) {
  const token = localStorage.getItem('spotify_access_token');
  const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
  return res.json();
}
async function populatePlaylists() {
  const el = document.getElementById('playlistSelect');
  if (!el) return;
  el.innerHTML = '';
  const data = await fetchSpotify('https://api.spotify.com/v1/me/playlists?limit=50');
  data.items.forEach(pl => {
    const opt = document.createElement('option');
    opt.value = pl.id;
    opt.text = pl.name;
    el.appendChild(opt);
  });
}
async function populateAlbums() {
  const el = document.getElementById('albumSelect');
  if (!el) return;
  el.innerHTML = '';
  const data = await fetchSpotify('https://api.spotify.com/v1/me/albums?limit=50');
  data.items.forEach(item => {
    const album = item.album;
    const opt = document.createElement('option');
    opt.value = album.id;
    opt.text = `${album.name} – ${album.artists[0]?.name || ''}`;
    el.appendChild(opt);
  });
}
async function populateTrackList(type, id) {
  const ul = document.getElementById('trackList');
  ul.innerHTML = '';
  let tracks = [];
  if (type === 'playlist') {
    const data = await fetchSpotify(`https://api.spotify.com/v1/playlists/${id}/tracks`);
    tracks = data.items.map(i => i.track);
  } else if (type === 'album') {
    const data = await fetchSpotify(`https://api.spotify.com/v1/albums/${id}`);
    tracks = data.tracks.items;
  }
  tracks.forEach((tr, idx) => {
    const li = document.createElement('li');
    li.textContent = `${tr.name} – ${(tr.artists[0]?.name || '')}`;
    li.className = 'touchListItem';
    li.onclick = () => {
      playTrackURI(tr.uri);
      setStatus("Wiedergabe gestartet [" + tr.name + "]");
      const hint = document.getElementById('playHint');
      if(hint) hint.style.display = 'none';
    };
    ul.appendChild(li);
  });
}
async function playTrackURI(uri) {
  const token = localStorage.getItem('spotify_access_token');
  await fetch('https://api.spotify.com/v1/me/player/play', {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris: [uri] })
  });
  const hint = document.getElementById('playHint');
  if(hint) hint.style.display = 'none';
}

// === TOUCH- & INIT EVENT BINDINGS ===
document.addEventListener('DOMContentLoaded', function() {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.onclick = window.doLoginFlow;
  const playBtn = document.getElementById('playPauseBtn');
  if (playBtn) playBtn.onclick = window.togglePlayback;
  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) nextBtn.onclick = window.nextTrack;
  const prevBtn = document.getElementById('prevBtn');
  if (prevBtn) prevBtn.onclick = window.previousTrack;
  const playlistSel = document.getElementById('playlistSelect');
  if (playlistSel) playlistSel.onchange = function() { populateTrackList('playlist', this.value); };
  const albumSel = document.getElementById('albumSelect');
  if (albumSel) albumSel.onchange = function() { populateTrackList('album', this.value); };
  // Init nach Login
  if (!handleRedirectCallback()) {
    const token = localStorage.getItem('spotify_access_token');
    if (token) {
      hideLoginBtn();
      showPlayer();
      initSpotifyPlayer();
      setupRabbitAlbumPlaylistUI();
      const playHint = document.getElementById('playHint');
      if (playHint) playHint.style.display = 'block';
    } else {
      showLoginBtn("Sign in with your Spotify Premium account.");
    }
  }
});

async function setupRabbitAlbumPlaylistUI() {
  await populatePlaylists();
  await populateAlbums();
  const playlistSelect = document.getElementById('playlistSelect');
  if (playlistSelect && playlistSelect.value) populateTrackList('playlist', playlistSelect.value);
}

window.addEventListener('beforeunload', function() {
  if (spotifyPlayer) {
    spotifyPlayer.disconnect();
  }
});
