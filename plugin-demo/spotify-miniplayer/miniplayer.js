// ==== SPOTIFY MINIPLAYER - Rabbit R1 Compatible with Modern PKCE-Login ====
// CLIENT_ID und REDIRECT_URI sind App-IDs; jeder meldet sich mit seinem eigenen Spotify-Konto an!
const SPOTIFY_CLIENT_ID = '38d152037c7f4c5fa831171423f56e4b';
const SPOTIFY_REDIRECT_URI = 'https://atomlabor.github.io/creations-sdk/plugin-demo/spotify-miniplayer/';
const SPOTIFY_SCOPES = "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state playlist-read-private";

// === GLOBAL STATE ===
let spotifyPlayer = null;
let currentDeviceId = null;
let isPlaying = false;
let currentTrack = null;
let userInteractionDetected = false; // Track whether user has interacted

// === PKCE HELPER FUNCTIONS ===
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
  if (loginBtn) loginBtn.style.display = "block";
  if (msg) setStatus(msg);
}

function hideLoginBtn() {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.style.display = "none";
}

function showPlayer() {
  const playerControls = document.getElementById('playerControls');
  if (playerControls) playerControls.style.display = "block";
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
    playBtn.textContent = isPlaying ? '⏸️' : '▶️';
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
        setStatus("Login successful. Initializing player...");
        hideLoginBtn();
        initSpotifyPlayer();
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

// === DEVICE ACTIVATION ===
function transferPlaybackHere(device_id, token) {
  fetch('https://api.spotify.com/v1/me/player', {
    method: "PUT",
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      device_ids: [device_id],
      play: false // Never autoplay - only play after user interaction
    })
  })
  .then(response => {
    if (response.ok) {
      setStatus("Device activated successfully.");
    } else {
      console.warn('Device activation response:', response.status);
    }
  })
  .catch(error => {
    console.error('Device activation error:', error);
  });
}

// === SPOTIFY PLAYER INITIALIZATION ===
function initSpotifyPlayer() {
  const token = localStorage.getItem('spotify_access_token');
  if (!token) {
    showLoginBtn("Sign in required.");
    return;
  }
  
  // Load Spotify Web Playback SDK if not already loaded
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
    
    // Ready event with delay before device activation
    spotifyPlayer.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      currentDeviceId = device_id;
      setStatus("Player ready. Activating device...");
      
      // Rabbit R1 Workaround: Add delay before transferPlaybackHere
      setTimeout(() => {
        transferPlaybackHere(device_id, token);
        showPlayer();
        setStatus("Ready to play!");
      }, 1200); // 1.2 second delay
    });
    
    // Not Ready event
    spotifyPlayer.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
      setStatus("Player not ready.");
      hidePlayer();
    });
    
    // Player state changes
    spotifyPlayer.addListener('player_state_changed', (state) => {
      if (!state) return;
      
      isPlaying = !state.paused;
      currentTrack = state.track_window.current_track;
      
      updateTrackInfo(currentTrack);
      updatePlayButton();
      
      setStatus(isPlaying ? "Playing" : "Paused");
    });
    
    // Error handling
    spotifyPlayer.addListener('initialization_error', ({ message }) => {
      console.error('Failed to initialize:', message);
      setStatus("Player initialization failed.");
    });
    
    spotifyPlayer.addListener('authentication_error', ({ message }) => {
      console.error('Failed to authenticate:', message);
      localStorage.removeItem('spotify_access_token');
      setStatus("Authentication failed.");
      showLoginBtn("Sign in again.");
    });
    
    spotifyPlayer.addListener('account_error', ({ message }) => {
      console.error('Failed to validate Spotify account:', message);
      setStatus("Account validation failed. Premium required.");
    });
    
    spotifyPlayer.addListener('playback_error', ({ message }) => {
      console.error('Failed to perform playback:', message);
      setStatus("Playback error.");
    });
    
    // Connect the player
    spotifyPlayer.connect();
  };
}

// === PLAYER CONTROLS ===
window.togglePlayback = function() {
  // Only allow play/pause if user has explicitly interacted with the button
  if (!userInteractionDetected) {
    console.log('Ignoring play/pause - no user interaction detected');
    return;
  }
  
  if (!spotifyPlayer) return;
  
  spotifyPlayer.togglePlay().then(() => {
    console.log('Toggled playback after user interaction');
  }).catch(error => {
    console.error('Error toggling playback:', error);
  });
};

window.nextTrack = function() {
  if (!spotifyPlayer) return;
  
  spotifyPlayer.nextTrack().then(() => {
    console.log('Skipped to next track');
  }).catch(error => {
    console.error('Error skipping track:', error);
  });
};

window.previousTrack = function() {
  if (!spotifyPlayer) return;
  
  spotifyPlayer.previousTrack().then(() => {
    console.log('Skipped to previous track');
  }).catch(error => {
    console.error('Error going to previous track:', error);
  });
};

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
  // Bind login button
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.onclick = window.doLoginFlow;
  
  // Bind player controls with user interaction detection
  const playPauseBtn = document.getElementById('playPauseBtn');
  if (playPauseBtn) {
    playPauseBtn.onclick = function() {
      userInteractionDetected = true; // Mark that user has interacted
      window.togglePlayback();
    };
  }
  
  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) nextBtn.onclick = window.nextTrack;
  
  const prevBtn = document.getElementById('prevBtn');
  if (prevBtn) prevBtn.onclick = window.previousTrack;
  
  // Initialize app
  if (!handleRedirectCallback()) {
    const token = localStorage.getItem('spotify_access_token');
    if (token) {
      hideLoginBtn();
      initSpotifyPlayer();
    } else {
      showLoginBtn("Sign in with your Spotify Premium account.");
    }
  }
});

// === CLEANUP ===
window.addEventListener('beforeunload', function() {
  if (spotifyPlayer) {
    spotifyPlayer.disconnect();
  }
});

/*
 * SECURITY NOTES:
 * - CLIENT_ID und REDIRECT_URI sind KEINE geheimen Userdaten!
 * - Jeder Nutzer gibt auf der Spotify Loginseite seinen eigenen Premium-Account ein.
 * - Zugriffstoken sind nur für die eigene Session/den eigenen Account gültig.
 * - PKCE flow ensures secure authorization without client secrets.
 * 
 * RABBIT R1 WORKAROUNDS:
 * - Added 1200ms delay after player ready event before device activation
 * - Play/Pause only triggers after explicit user button click (no autoplay)
 * - userInteractionDetected flag prevents unwanted playback triggers
 */
