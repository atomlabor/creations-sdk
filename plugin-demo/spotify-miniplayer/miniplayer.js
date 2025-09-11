// ==== SPOTIFY WEBLOGIN - Multiuser-PKCE für Rabbit R1 ====
// CLIENT_ID und REDIRECT_URI sind App-IDs; jeder meldet sich mit seinem eigenen Spotify-Konto an!
const SPOTIFY_CLIENT_ID = '38d152037c7f4c5fa831171423f56e4b';      // <- deine App-ID
const SPOTIFY_REDIRECT_URI = 'https://atomlabor.github.io/creations-sdk/plugin-demo/spotify-miniplayer/';// <- URL deiner Card, wie eingetragen!
const SPOTIFY_SCOPES = "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state playlist-read-private";
// --- PKCE Hilfsfunktionen ---
function generateRandomString(length) {
  let text = '', chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i=0; i<length; i++) text += chars.charAt(Math.floor(Math.random() * chars.length));
  return text;
}
async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
// --- UI Helpers ---
function setStatus(msg) { document.getElementById('status').textContent = msg; }
function showLoginBtn(msg="") {
  document.getElementById('loginBtn').style.display = "";
  setStatus(msg);
}
function hideLoginBtn() { document.getElementById('loginBtn').style.display = "none"; }
// --- Login-Flow global verfügbar machen ---
window.doLoginFlow = function() {
  const codeVerifier = generateRandomString(128);
  generateCodeChallenge(codeVerifier).then(codeChallenge => {
    localStorage.setItem('spotify_code_verifier', codeVerifier);
    const authUrl = 'https://accounts.spotify.com/authorize'
      + '?response_type=code'
      + '&client_id=' + encodeURIComponent(SPOTIFY_CLIENT_ID)
      + '&scope=' + encodeURIComponent(SPOTIFY_SCOPES)
      + '&redirect_uri=' + encodeURIComponent(SPOTIFY_REDIRECT_URI)
      + '&code_challenge_method=S256'
      + '&code_challenge=' + codeChallenge;
    window.location = authUrl;
  });
};
// --- Redirect-Callback: Auth-Code gegen Token tauschen und speichern ---
function handleRedirectCallback() {
  if (window.location.search.includes('code=')) {
    setStatus("Authorizing…");
    const code = new URLSearchParams(window.location.search).get('code');
    const codeVerifier = localStorage.getItem('spotify_code_verifier');
    fetch('https://accounts.spotify.com/api/token', {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: "authorization_code",
        code, redirect_uri:SPOTIFY_REDIRECT_URI, code_verifier:codeVerifier
      })
    }).then(r=>r.json()).then(data => {
      if (data.access_token) {
        localStorage.setItem("spotify_access_token", data.access_token);
        window.history.replaceState({}, document.title, SPOTIFY_REDIRECT_URI);
        setStatus("Login success. Initializing player…");
        hideLoginBtn();
        initSpotifyPlayer();
      } else {
        setStatus("Authorization failed.");
        showLoginBtn("Try again.");
      }
    });
    return true;
  }
  return false;
}
// --- Playback-Device aktivieren und Player initialisieren ---
function transferPlaybackHere(device_id, token) {
  fetch('https://api.spotify.com/v1/me/player', {
    method: "PUT",
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_ids: [device_id], play: false })
  });
}
function initSpotifyPlayer() {
  const token = localStorage.getItem('spotify_access_token');
  if (!token) return showLoginBtn("Sign in required.");
  window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new Spotify.Player({
      name: "spotify r1 player",
      getOAuthToken: cb => cb(token)
    });
    player.addListener('ready', ({ device_id }) => {
      setStatus("Ready to play!");
      transferPlaybackHere(device_id, token);
      document.getElementById('playPauseBtn').style.display = "";
    });
    player.addListener('not_ready', () => setStatus("Player not ready."));
    // Bind Play/Pause und Hardwareevents wie gehabt..
    player.connect();
  };
}
// --- Globale Button-Logik und sicherer Binding nach DOM-Ready ---
document.addEventListener('DOMContentLoaded', function(){
  var btn = document.getElementById('loginBtn');
  if(btn) btn.onclick = window.doLoginFlow;
});
// --- Aufruf beim Laden: Token prüfen oder Login anbieten ---
if (!handleRedirectCallback()) {
  let token = localStorage.getItem('spotify_access_token');
  if (token) { hideLoginBtn(); initSpotifyPlayer(); }
  else showLoginBtn("Sign in with your own Premium account.");
}
/* 
 * CLIENT_ID und REDIRECT_URI sind KEINE geheimen Userdaten!
 * Jeder Nutzer gibt auf der Spotify Loginseite seinen eigenen Premium-Account ein.
 * Zugriffstoken sind nur für die eigene Session/den eigenen Account gültig.
 */
