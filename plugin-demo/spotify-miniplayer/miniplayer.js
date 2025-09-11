// Rabbit R1 Spotify Miniplayer JavaScript
// Basic music player functionality for demonstration

class SpotifyMiniplayer {
    constructor() {
        this.isPlaying = false;
        this.currentTime = 0;
        this.totalTime = 180; // 3 minutes demo track
        this.volume = 0.7;
        this.progressInterval = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
    }
    
    initializeElements() {
        // Get DOM elements
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.progressSlider = document.getElementById('progressSlider');
        this.progressBar = document.getElementById('progress');
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');
        this.trackTitle = document.getElementById('trackTitle');
        this.trackArtist = document.getElementById('trackArtist');
        this.albumImage = document.getElementById('albumImage');
        this.playIcon = document.getElementById('playIcon');
        this.pauseIcon = document.getElementById('pauseIcon');
    }
    
    attachEventListeners() {
        // Play/Pause button
        this.playBtn.addEventListener('click', () => this.togglePlayPause());
        
        // Previous/Next buttons
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        
        // Progress slider
        this.progressSlider.addEventListener('input', (e) => this.seekTo(e.target.value));
        this.progressSlider.addEventListener('change', (e) => this.seekTo(e.target.value));
        
        // Keyboard shortcuts for Rabbit R1
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Touch events for mobile-like interaction
        this.addTouchSupport();
    }
    
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        
        if (this.isPlaying) {
            this.startProgress();
            this.playIcon.style.display = 'none';
            this.pauseIcon.style.display = 'block';
            this.addButtonAnimation(this.playBtn);
        } else {
            this.stopProgress();
            this.playIcon.style.display = 'block';
            this.pauseIcon.style.display = 'none';
            this.addButtonAnimation(this.playBtn);
        }
        
        this.updateDisplay();
    }
    
    startProgress() {
        this.progressInterval = setInterval(() => {
            if (this.currentTime < this.totalTime) {
                this.currentTime += 1;
                this.updateProgress();
            } else {
                this.nextTrack();
            }
        }, 1000);
    }
    
    stopProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }
    
    seekTo(percentage) {
        this.currentTime = Math.floor((percentage / 100) * this.totalTime);
        this.updateProgress();
    }
    
    previousTrack() {
        this.addButtonAnimation(this.prevBtn);
        this.loadRandomTrack();
        if (this.isPlaying) {
            this.startProgress();
        }
    }
    
    nextTrack() {
        this.addButtonAnimation(this.nextBtn);
        this.loadRandomTrack();
        if (this.isPlaying) {
            this.startProgress();
        }
    }
    
    loadRandomTrack() {
        const tracks = [
            {
                title: "Digital Dreams",
                artist: "Synthwave Collective",
                duration: 210
            },
            {
                title: "Neon Nights",
                artist: "Cyber Sound",
                duration: 180
            },
            {
                title: "Electric Horizon",
                artist: "Future Bass",
                duration: 195
            },
            {
                title: "Quantum Beats",
                artist: "Tech House Lab",
                duration: 240
            },
            {
                title: "Rabbit Rhythm",
                artist: "R1 Studio",
                duration: 165
            }
        ];
        
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        
        this.trackTitle.textContent = randomTrack.title;
        this.trackArtist.textContent = randomTrack.artist;
        this.totalTime = randomTrack.duration;
        this.currentTime = 0;
        
        this.updateDisplay();
    }
    
    updateProgress() {
        const percentage = (this.currentTime / this.totalTime) * 100;
        this.progressBar.style.width = percentage + '%';
        this.progressSlider.value = percentage;
        
        this.currentTimeEl.textContent = this.formatTime(this.currentTime);
        this.totalTimeEl.textContent = this.formatTime(this.totalTime);
    }
    
    updateDisplay() {
        this.updateProgress();
        
        // Update play button state
        if (this.isPlaying) {
            this.playBtn.setAttribute('aria-label', 'Pause');
        } else {
            this.playBtn.setAttribute('aria-label', 'Play');
        }
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    addButtonAnimation(button) {
        button.classList.add('active');
        setTimeout(() => {
            button.classList.remove('active');
        }, 300);
    }
    
    handleKeyPress(e) {
        // Rabbit R1 specific key mappings
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousTrack();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextTrack();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.seekTo(Math.min(100, (this.currentTime / this.totalTime) * 100 + 5));
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.seekTo(Math.max(0, (this.currentTime / this.totalTime) * 100 - 5));
                break;
        }
    }
    
    addTouchSupport() {
        // Add touch feedback for better mobile experience
        const buttons = [this.playBtn, this.prevBtn, this.nextBtn];
        
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.95)';
            });
            
            button.addEventListener('touchend', () => {
                button.style.transform = '';
            });
        });
    }
    
    // Rabbit R1 Creation SDK Integration
    initializeR1Integration() {
        // Check if running on Rabbit R1
        if (typeof window.creationSensors !== 'undefined') {
            console.log('Rabbit R1 detected - Enhanced features available');
            
            // Add scroll wheel support if available
            if (window.creationSensors.scrollWheel) {
                window.addEventListener('scrollUp', () => {
                    this.nextTrack();
                });
                
                window.addEventListener('scrollDown', () => {
                    this.previousTrack();
                });
            }
            
            // Add side button support
            window.addEventListener('sideClick', () => {
                this.togglePlayPause();
            });
        }
    }
}

// Initialize the miniplayer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const player = new SpotifyMiniplayer();
    
    // Initialize R1 integration
    player.initializeR1Integration();
    
    // Load initial track
    player.loadRandomTrack();
    
    // Make player globally accessible for debugging
    window.miniPlayer = player;
    
    console.log('Spotify Miniplayer initialized for Rabbit R1');
});
