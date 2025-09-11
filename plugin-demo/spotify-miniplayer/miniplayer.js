// Spotify Miniplayer Plugin - Rabbit R1 Native Version
// Playlist/Album search, play commands, UI updates, and hardware integration
// Uses only PluginMessageHandler.postMessage() and window.onPluginMessage

// Global functions that can be called from HTML onclick attributes
function searchTracks() {
  if (window.spotifyMiniPlayer) {
    window.spotifyMiniPlayer.performSearch('track');
  }
}

function searchAlbums() {
  if (window.spotifyMiniPlayer) {
    window.spotifyMiniPlayer.performSearch('album');
  }
}

function searchPlaylists() {
  if (window.spotifyMiniPlayer) {
    window.spotifyMiniPlayer.performSearch('playlist');
  }
}

function togglePlayPause() {
  if (window.spotifyMiniPlayer) {
    window.spotifyMiniPlayer.togglePlayPause();
  }
}

function previousTrack() {
  if (window.spotifyMiniPlayer) {
    window.spotifyMiniPlayer.previousTrack();
  }
}

function nextTrack() {
  if (window.spotifyMiniPlayer) {
    window.spotifyMiniPlayer.nextTrack();
  }
}

class SpotifyMiniPlayer {
  constructor() {
    this.currentTrack = null;
    this.isPlaying = false;
    this.searchResults = [];
    this.currentPlaylist = null;
    this.currentAlbum = null;
    
    this.setupEventListeners();
    this.setupPluginMessaging();
  }

  // Setup event listeners for existing HTML elements
  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch('track'); // Default to track search
        }
      });
    }

    // Hardware key bindings
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  // Setup plugin messaging system for Rabbit R1 native communication
  setupPluginMessaging() {
    window.onPluginMessage = (message) => {
      try {
        let data;
        if (typeof message === 'string') {
          data = JSON.parse(message);
        } else if (message.data) {
          data = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
        } else {
          data = message;
        }
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

  // Perform search for tracks, albums, or playlists
  async performSearch(searchType = 'track') {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    if (!query) return;

    try {
      // Send search request via Rabbit R1 native plugin messaging
      PluginMessageHandler.postMessage(JSON.stringify({
        type: 'search_request',
        query: query,
        searchTypes: [searchType]
      }));
      
      // Show loading state
      const resultsContainer = document.getElementById('resultsList');
      if (resultsContainer) {
        resultsContainer.innerHTML = '<li class="result-item"><div class="result-title">Searching...</div></li>';
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Search failed. Please try again.');
    }
  }

  // Display search results in the UI
  displaySearchResults(results) {
    const resultsContainer = document.getElementById('resultsList');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    if (!results || results.length === 0) {
      resultsContainer.innerHTML = '<li class="result-item"><div class="result-title">No results found</div></li>';
      return;
    }

    results.forEach(item => {
      const listItem = document.createElement('li');
      listItem.className = `result-item ${item.type || ''}`;
      listItem.innerHTML = `
        <div class="result-title">${item.name || 'Unknown'}</div>
        <div class="result-subtitle">${item.artist || item.owner || 'Unknown Artist'}</div>
      `;
      
      // Add click listener to play the item
      listItem.addEventListener('click', () => {
        this.playItem(item.uri, item.type);
      });
      
      resultsContainer.appendChild(listItem);
    });
  }

  // Play a track, playlist or album
  playItem(uri, type) {
    PluginMessageHandler.postMessage(JSON.stringify({
      type: 'play_request',
      uri: uri,
      itemType: type
    }));
  }

  // Player control methods
  togglePlayPause() {
    PluginMessageHandler.postMessage(JSON.stringify({
      type: this.isPlaying ? 'pause' : 'play'
    }));
  }

  previousTrack() {
    PluginMessageHandler.postMessage(JSON.stringify({ type: 'previous' }));
  }

  nextTrack() {
    PluginMessageHandler.postMessage(JSON.stringify({ type: 'next' }));
  }

  toggleShuffle() {
    PluginMessageHandler.postMessage(JSON.stringify({ type: 'toggle_shuffle' }));
  }

  toggleRepeat() {
    PluginMessageHandler.postMessage(JSON.stringify({ type: 'toggle_repeat' }));
  }

  setVolume(volume) {
    PluginMessageHandler.postMessage(JSON.stringify({
      type: 'set_volume',
      volume: parseInt(volume)
    }));
  }

  seekTo(position) {
    PluginMessageHandler.postMessage(JSON.stringify({
      type: 'seek',
      position: parseInt(position)
    }));
  }

  // UI update methods
  updateTrackInfo(track) {
    this.currentTrack = track;
    
    // Update track title and artist
    const titleElement = document.getElementById('currentTitle');
    const artistElement = document.getElementById('currentArtist');
    
    if (titleElement) {
      titleElement.textContent = track.name || 'Unknown Title';
    }
    if (artistElement) {
      artistElement.textContent = track.artist || 'Unknown Artist';
    }

    // Update album cover
    this.updateAlbumCover(track.albumArt || track.coverUrl || track.imageUrl);
  }

  // Update album cover image
  updateAlbumCover(imageUrl) {
    const coverImg = document.getElementById('albumCoverImg');
    const placeholder = document.querySelector('.cover-placeholder');
    
    if (!coverImg || !placeholder) return;

    if (imageUrl && imageUrl !== '') {
      // Show the image and hide placeholder
      coverImg.src = imageUrl;
      coverImg.style.display = 'block';
      placeholder.style.display = 'none';
      
      // Handle image load error - fall back to placeholder
      coverImg.onerror = () => {
        coverImg.style.display = 'none';
        placeholder.style.display = 'flex';
      };
    } else {
      // Hide image and show placeholder
      coverImg.style.display = 'none';
      placeholder.style.display = 'flex';
    }
  }

  updatePlaybackState(isPlaying, position, duration) {
    this.isPlaying = isPlaying;
    
    // Update play/pause button
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
      playBtn.innerHTML = isPlaying ? '⏸️' : '▶️';
    }
    
    // Update progress and time display if elements exist
    if (duration > 0) {
      const progressSlider = document.getElementById('progress-slider');
      if (progressSlider) {
        progressSlider.value = (position / duration) * 100;
      }
      
      const currentTimeDisplay = document.getElementById('current-time');
      const totalTimeDisplay = document.getElementById('total-time');
      
      if (currentTimeDisplay) {
        currentTimeDisplay.textContent = this.formatTime(position);
      }
      if (totalTimeDisplay) {
        totalTimeDisplay.textContent = this.formatTime(duration);
      }
    }
  }

  updateVolumeDisplay(volume) {
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
      volumeSlider.value = volume;
    }
  }

  onPlaylistLoaded(playlist) {
    this.currentPlaylist = playlist;
    console.log('Playlist loaded:', playlist.name);
    this.showStatus(`Playlist loaded: ${playlist.name}`);
  }

  onAlbumLoaded(album) {
    this.currentAlbum = album;
    console.log('Album loaded:', album.name);
    this.showStatus(`Album loaded: ${album.name}`);
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
    if (!volumeSlider) return;
    
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

  showError(message) {
    const resultsContainer = document.getElementById('resultsList');
    if (resultsContainer) {
      resultsContainer.innerHTML = `<li class="result-item error"><div class="result-title">${message}</div></li>`;
    }
    
    // Also show in status if available
    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.classList.add('show');
      setTimeout(() => {
        statusElement.classList.remove('show');
      }, 3000);
    }
  }

  showStatus(message) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.classList.add('show');
      setTimeout(() => {
        statusElement.classList.remove('show');
      }, 2000);
    }
  }

  // Send message via Rabbit R1 native plugin system
  sendPluginMessage(data) {
    try {
      PluginMessageHandler.postMessage(JSON.stringify(data));
    } catch (error) {
      console.error('Error sending plugin message:', error);
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
