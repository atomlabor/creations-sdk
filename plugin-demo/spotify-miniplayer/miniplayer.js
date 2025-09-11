// Spotify Miniplayer Plugin
// Playlist/Album search, play commands, UI updates, and hardware integration

class SpotifyMiniPlayer {
  constructor() {
    this.currentTrack = null;
    this.isPlaying = false;
    this.searchResults = [];
    this.currentPlaylist = null;
    this.currentAlbum = null;
    
    this.initializeUI();
    this.setupEventListeners();
    this.setupPluginMessaging();
  }

  // Initialize the miniplayer UI
  initializeUI() {
    const playerContainer = document.createElement('div');
    playerContainer.id = 'spotify-miniplayer';
    playerContainer.innerHTML = `
      <div class="player-header">
        <h3>Spotify Miniplayer</h3>
        <button id="minimize-btn">−</button>
      </div>
      
      <div class="search-section">
        <input type="text" id="search-input" placeholder="Search playlists/albums...">
        <button id="search-btn">Search</button>
      </div>
      
      <div class="results-section">
        <ul id="search-results"></ul>
      </div>
      
      <div class="player-controls">
        <div class="track-info">
          <div id="track-title">No track selected</div>
          <div id="track-artist"></div>
        </div>
        
        <div class="control-buttons">
          <button id="prev-btn">⏮</button>
          <button id="play-pause-btn">▶</button>
          <button id="next-btn">⏭</button>
          <button id="shuffle-btn">🔀</button>
          <button id="repeat-btn">🔁</button>
        </div>
        
        <div class="volume-control">
          <span>🔊</span>
          <input type="range" id="volume-slider" min="0" max="100" value="50">
        </div>
      </div>
      
      <div class="progress-section">
        <input type="range" id="progress-slider" min="0" max="100" value="0">
        <div class="time-display">
          <span id="current-time">0:00</span>
          <span id="total-time">0:00</span>
        </div>
      </div>
    `;
    
    document.body.appendChild(playerContainer);
  }

  // Setup event listeners for all UI elements
  setupEventListeners() {
    // Search functionality
    document.getElementById('search-btn').addEventListener('click', () => this.performSearch());
    document.getElementById('search-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.performSearch();
    });

    // Player controls
    document.getElementById('play-pause-btn').addEventListener('click', () => this.togglePlayPause());
    document.getElementById('prev-btn').addEventListener('click', () => this.previousTrack());
    document.getElementById('next-btn').addEventListener('click', () => this.nextTrack());
    document.getElementById('shuffle-btn').addEventListener('click', () => this.toggleShuffle());
    document.getElementById('repeat-btn').addEventListener('click', () => this.toggleRepeat());

    // Volume and progress controls
    document.getElementById('volume-slider').addEventListener('input', (e) => this.setVolume(e.target.value));
    document.getElementById('progress-slider').addEventListener('input', (e) => this.seekTo(e.target.value));

    // Minimize button
    document.getElementById('minimize-btn').addEventListener('click', () => this.toggleMinimize());

    // Hardware key bindings
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  // Setup plugin messaging system for external communication
  setupPluginMessaging() {
    window.onPluginMessage = (message) => {
      try {
        const data = JSON.parse(message);
        this.handlePluginMessage(data);
      } catch (error) {
        console.error('Error parsing plugin message:', error);
      }
    };
  }

  // Handle incoming plugin messages
  handlePluginMessage(data) {
    switch (data.type) {
      case 'track_update':
        this.updateTrackInfo(data.track);
        break;
      case 'playback_state':
        this.updatePlaybackState(data.isPlaying, data.position, data.duration);
        break;
      case 'search_results':
        this.displaySearchResults(data.results);
        break;
      case 'volume_update':
        this.updateVolumeDisplay(data.volume);
        break;
      case 'playlist_loaded':
        this.onPlaylistLoaded(data.playlist);
        break;
      case 'album_loaded':
        this.onAlbumLoaded(data.album);
        break;
      default:
        console.log('Unknown plugin message type:', data.type);
    }
  }

  // Perform search for playlists and albums
  async performSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    try {
      // Send search request via plugin messaging
      this.sendPluginMessage({
        type: 'search_request',
        query: query,
        searchTypes: ['playlist', 'album']
      });
      
      // Show loading state
      const resultsContainer = document.getElementById('search-results');
      resultsContainer.innerHTML = '<li class="loading">Searching...</li>';
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Search failed. Please try again.');
    }
  }

  // Display search results in the UI
  displaySearchResults(results) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';

    if (!results || results.length === 0) {
      resultsContainer.innerHTML = '<li class="no-results">No results found</li>';
      return;
    }

    results.forEach(item => {
      const listItem = document.createElement('li');
      listItem.className = `result-item ${item.type}`;
      listItem.innerHTML = `
        <div class="item-info">
          <div class="item-title">${item.name}</div>
          <div class="item-details">${item.type === 'playlist' ? item.owner : item.artist} • ${item.trackCount} tracks</div>
        </div>
        <button class="play-btn" data-uri="${item.uri}" data-type="${item.type}">▶</button>
      `;
      
      // Add click listener for play button
      listItem.querySelector('.play-btn').addEventListener('click', (e) => {
        this.playItem(e.target.dataset.uri, e.target.dataset.type);
      });
      
      resultsContainer.appendChild(listItem);
    });
  }

  // Play a playlist or album
  playItem(uri, type) {
    this.sendPluginMessage({
      type: 'play_request',
      uri: uri,
      itemType: type
    });
  }

  // Player control methods
  togglePlayPause() {
    this.sendPluginMessage({
      type: this.isPlaying ? 'pause' : 'play'
    });
  }

  previousTrack() {
    this.sendPluginMessage({ type: 'previous' });
  }

  nextTrack() {
    this.sendPluginMessage({ type: 'next' });
  }

  toggleShuffle() {
    this.sendPluginMessage({ type: 'toggle_shuffle' });
  }

  toggleRepeat() {
    this.sendPluginMessage({ type: 'toggle_repeat' });
  }

  setVolume(volume) {
    this.sendPluginMessage({
      type: 'set_volume',
      volume: parseInt(volume)
    });
  }

  seekTo(position) {
    this.sendPluginMessage({
      type: 'seek',
      position: parseInt(position)
    });
  }

  // UI update methods
  updateTrackInfo(track) {
    this.currentTrack = track;
    document.getElementById('track-title').textContent = track.name || 'Unknown Track';
    document.getElementById('track-artist').textContent = track.artist || 'Unknown Artist';
  }

  updatePlaybackState(isPlaying, position, duration) {
    this.isPlaying = isPlaying;
    
    // Update play/pause button
    const playPauseBtn = document.getElementById('play-pause-btn');
    playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
    
    // Update progress
    if (duration > 0) {
      const progressSlider = document.getElementById('progress-slider');
      progressSlider.value = (position / duration) * 100;
      
      // Update time display
      document.getElementById('current-time').textContent = this.formatTime(position);
      document.getElementById('total-time').textContent = this.formatTime(duration);
    }
  }

  updateVolumeDisplay(volume) {
    document.getElementById('volume-slider').value = volume;
  }

  onPlaylistLoaded(playlist) {
    this.currentPlaylist = playlist;
    console.log('Playlist loaded:', playlist.name);
  }

  onAlbumLoaded(album) {
    this.currentAlbum = album;
    console.log('Album loaded:', album.name);
  }

  // Hardware integration - keyboard shortcuts
  handleKeyboardShortcuts(event) {
    // Only handle shortcuts when the miniplayer is focused or global shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case ' ': // Ctrl/Cmd + Space - Play/Pause
          event.preventDefault();
          this.togglePlayPause();
          break;
        case 'ArrowLeft': // Ctrl/Cmd + Left - Previous track
          event.preventDefault();
          this.previousTrack();
          break;
        case 'ArrowRight': // Ctrl/Cmd + Right - Next track
          event.preventDefault();
          this.nextTrack();
          break;
        case 'ArrowUp': // Ctrl/Cmd + Up - Volume up
          event.preventDefault();
          this.adjustVolume(10);
          break;
        case 'ArrowDown': // Ctrl/Cmd + Down - Volume down
          event.preventDefault();
          this.adjustVolume(-10);
          break;
      }
    }
  }

  adjustVolume(delta) {
    const volumeSlider = document.getElementById('volume-slider');
    const currentVolume = parseInt(volumeSlider.value);
    const newVolume = Math.max(0, Math.min(100, currentVolume + delta));
    volumeSlider.value = newVolume;
    this.setVolume(newVolume);
  }

  // Utility methods
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  toggleMinimize() {
    const player = document.getElementById('spotify-miniplayer');
    player.classList.toggle('minimized');
  }

  showError(message) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = `<li class="error">${message}</li>`;
  }

  // Send message to plugin system
  sendPluginMessage(data) {
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage(JSON.stringify(data), '*');
    } else {
      console.log('Plugin message:', data);
    }
  }
}

// Initialize the miniplayer when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.spotifyMiniPlayer = new SpotifyMiniPlayer();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpotifyMiniPlayer;
}
