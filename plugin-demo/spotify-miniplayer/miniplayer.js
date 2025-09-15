// Spotify Miniplayer für Rabbit R1
class SpotifyMiniplayerR1 {
    constructor() {
        this.currentFocus = 0;
        this.isPlaying = false;
        this.currentTrack = null;
        this.recentAlbums = [];
        this.albums = [];
        
        this.init();
        this.setupHardwareListeners();
        this.loadMockData();
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

        // Standard Button Events
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

        // Touch events für R1 Display
        window.addEventListener("touchClick", (event) => {
            const focusedElement = document.querySelector('.album-item.focused');
            if (focusedElement) {
                this.selectAlbum(parseInt(focusedElement.dataset.index));
            }
        });
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
        // Entferne alten Fokus
        document.querySelectorAll('.album-item').forEach(item => {
            item.classList.remove('focused');
        });

        // Setze neuen Fokus
        const currentItem = document.querySelector(`[data-index="${this.currentFocus}"]`);
        if (currentItem) {
            currentItem.classList.add('focused');
            currentItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    selectAlbum(index) {
        if (index >= 0 && index < this.albums.length) {
            const album = this.albums[index];
            this.currentTrack = album;
            this.updateCurrentTrack();
            this.showHardwareFeedback(`♪ ${album.title}`);
        }
    }

    togglePlayback() {
        this.isPlaying = !this.isPlaying;
        this.playBtn.textContent = this.isPlaying ? "⏸" : "▶";
        this.playBtn.style.background = this.isPlaying ? 
            "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)";
    }

    previousTrack() {
        if (this.albums.length === 0) return;
        
        const currentIndex = this.albums.findIndex(album => 
            album.title === this.currentTrack?.title
        );
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : this.albums.length - 1;
        this.selectAlbum(prevIndex);
        this.currentFocus = prevIndex;
        this.updateFocus();
    }

    nextTrack() {
        if (this.albums.length === 0) return;
        
        const currentIndex = this.albums.findIndex(album => 
            album.title === this.currentTrack?.title
        );
        const nextIndex = currentIndex < this.albums.length - 1 ? currentIndex + 1 : 0;
        this.selectAlbum(nextIndex);
        this.currentFocus = nextIndex;
        this.updateFocus();
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

        // Setze initialen Fokus
        if (this.albums.length > 0) {
            this.updateFocus();
        }
    }

    showHardwareFeedback(message) {
        // Entferne vorhandenes Feedback
        const existingFeedback = document.querySelector('.hardware-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Erstelle neues Feedback
        const feedback = document.createElement('div');
        feedback.className = 'hardware-feedback';
        feedback.textContent = message;
        document.body.appendChild(feedback);

        // Zeige Feedback
        setTimeout(() => feedback.classList.add('show'), 10);
        
        // Verstecke Feedback nach 1.5 Sekunden
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => feedback.remove(), 300);
        }, 1500);
    }

    loadMockData() {
        // Mock-Daten für Demonstration
        this.albums = [
            {
                title: "Random Access Memories",
                artist: "Daft Punk", 
                artwork: "https://i.scdn.co/image/ab67616d0000b273b33d46dfa2635a47eebf63b2"
            },
            {
                title: "Discovery",
                artist: "Daft Punk",
                artwork: "https://i.scdn.co/image/ab67616d0000b273d8d32474bd98d3a3d7e8f0b2"
            },
            {
                title: "Homework", 
                artist: "Daft Punk",
                artwork: "https://i.scdn.co/image/ab67616d0000b273a7528d6b9fa6103c7d337f4e"
            },
            {
                title: "Human After All",
                artist: "Daft Punk",
                artwork: "https://i.scdn.co/image/ab67616d0000b273e3393c77978b0d4e51b66b52"
            },
            {
                title: "TRON: Legacy",
                artist: "Daft Punk", 
                artwork: "https://i.scdn.co/image/ab67616d0000b273dad5c4d4b451c5c96bf8b1fe"
            }
        ];

        this.renderAlbums();
        
        // Setze ersten Track als aktuell
        if (this.albums.length > 0) {
            this.currentTrack = this.albums[0];
            this.updateCurrentTrack();
        }
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    const miniplayer = new SpotifyMiniplayerR1();
    
    // Global verfügbar machen für Debugging
    window.spotifyPlayer = miniplayer;
});
