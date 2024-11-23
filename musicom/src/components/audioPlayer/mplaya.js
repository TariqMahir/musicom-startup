class AudioPlayer extends HTMLElement {
    playing = false;
    currentTime = 0;
    duration = 0;
    volume = 0.4;
    previousVolume = 0.4; // Store the previous volume before muting
    smoothDataArray = [];
    barColors = [];
    lastBeatTime = 0;
    initialized = false;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    static get observedAttributes() {
        return ['src', 'mute', 'crossorigin', 'autoplay', 'loop', 'controls', 'preload', 'volume'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'src') {
            if (this.playing) {
                this.audio.pause();
            }
            this.initialized = false;
            this.render();
            this.setTitleFromSrc();
        }

        if (!this.initialized) {
            this.initializeAudio();
        }

        console.log('Attribute changed:', name, oldValue, newValue);
    }

    extractFileName(src) {
        if (!src) return 'Untitled';
        const parts = src.split('/');
        return parts[parts.length - 1];
    }

    setTitleFromSrc() {
        const src = this.getAttribute('src');
        const title = this.extractFileName(src);
        if (this.shadowRoot.querySelector('.audio-name')) {
            this.shadowRoot.querySelector('.audio-name').textContent = title;
        }
    }

    initializeAudio() {
        if (this.initialized) return;

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.track = this.audioCtx.createMediaElementSource(this.audio);
        this.gainNode = this.audioCtx.createGain();
        this.analyzerNode = this.audioCtx.createAnalyser();
        this.analyzerNode.fftSize = 256; // Reduce fftSize for better beat detection
        this.bufferLength = this.analyzerNode.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        this.smoothDataArray = new Float32Array(this.bufferLength);
        this.initialized = true;

        this.track.connect(this.gainNode).connect(this.analyzerNode).connect(this.audioCtx.destination);
        this.gainNode.gain.value = this.volume = 0.4;  // Set initial volume

        this.generateBarColors();
        this.attachEvents();
        this.changeVolume(); // Ensure the volume state is correctly initialized

        console.log('AudioContext initialized');
        console.log('Gain node value:', this.gainNode.gain.value);
        console.log('Audio element source:', this.audio.src);
    }

    generateBarColors() {
        this.barColors = [];
        const barCount = Math.floor(this.shadowRoot.querySelector('canvas').width / (3 + 1)); // Thinner bars with smaller gaps
        for (let i = 0; i < barCount; i++) {
            this.barColors.push(this.getRandomColor());
        }
    }

    getRandomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgb(${r},${g},${b})`;
    }

    attachEvents() {
        this.playPauseBtn.addEventListener('click', this.togglePlay.bind(this));
        this.volumeField.addEventListener('input', this.changeVolume.bind(this));
        this.volumeBtn.addEventListener('click', this.toggleMute.bind(this)); // Add event listener for mute/unmute
        this.progressBar.addEventListener('input', this.updateProgress.bind(this));
        this.audio.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this));
        this.audio.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
        this.audio.addEventListener('ended', this.onAudioEnded.bind(this));
        this.audio.addEventListener('error', this.onAudioError.bind(this));
    }

    onLoadedMetadata() {
        this.duration = this.audio.duration;
        this.progressBar.max = this.duration;
        this.durationEl.textContent = this.formatTime(this.duration);
    }

    onTimeUpdate() {
        this.updateAutoTime(this.audio.currentTime);
    }

    onAudioEnded() {
        this.playing = false;
        this.updateButtonIcon();
    }

    onAudioError(e) {
        console.error('Error loading audio:', e);
    }

    updateProgress() {
        this.seekTo(this.progressBar.value);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    detectBeat() {
        const threshold = 128; // Threshold for detecting a beat
        const now = Date.now();
        let sum = 0;

        for (let i = 0; i < this.bufferLength; i++) {
            sum += this.dataArray[i];
        }

        const average = sum / this.bufferLength;

        if (average > threshold && now - this.lastBeatTime > 300) { // Minimum 300ms between beats
            this.lastBeatTime = now;
            return true;
        }

        return false;
    }

    updateFrequency() {
        if (!this.playing) return;
        this.analyzerNode.getByteFrequencyData(this.dataArray);
        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear canvas

        for (let i = 0; i < this.bufferLength; i++) {
            this.smoothDataArray[i] = this.smoothDataArray[i] * 0.8 + this.dataArray[i] * 0.2;
        }

        const barWidth = 3; // Thinner bars
        const gap = 1; // Smaller gap between bars
        const padding = 10;
        const maxBarHeight = (this.canvas.height - padding * 2) * 0.8;
        const barCount = Math.floor(this.canvas.width / (barWidth + gap));
        let x = 0;
        const beatDetected = this.detectBeat();

        for (let i = 0; i < barCount; i++) {
            let barHeight = (this.smoothDataArray[i] / 2) * this.volume;
            if (beatDetected) {
                barHeight *= 2; // Emphasize the beat by doubling the bar height
            }
            barHeight = Math.min(barHeight, maxBarHeight);
            this.canvasCtx.fillStyle = beatDetected ? 'rgb(255, 0, 0)' : this.barColors[i % this.barColors.length]; // Change color on beat
            this.canvasCtx.fillRect(x, this.canvas.height - padding - barHeight, barWidth, barHeight);
            x += barWidth + gap;
        }

        requestAnimationFrame(this.updateFrequency.bind(this));
    }

    async togglePlay() {
        if (!this.audioCtx) {
            this.initializeAudio();
        } else if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }

        if (this.playing) {
            await this.audio.pause();
            this.playing = false;
        } else {
            await this.audio.play();
            this.playing = true;
            this.updateFrequency();
        }

        this.updateButtonIcon();

        console.log('Audio is playing:', this.playing);
    }

    updateButtonIcon() {
        const playIcon = this.playPauseBtn.querySelector('.play-icon');
        const pauseIcon = this.playPauseBtn.querySelector('.pause-icon');
        if (this.playing) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }

    seekTo(time) {
        this.audio.currentTime = time;
    }

    updateAutoTime(time) {
        this.currentTime = time;
        this.progressBar.value = time;
        const mins = parseInt(this.currentTime / 60, 10);
        const secs = parseInt(this.currentTime % 60, 10).toString().padStart(2, '0');
        this.currentTimeEl.textContent = `${mins}:${secs}`;
    }

    changeVolume() {
        this.volume = 1 - this.volumeField.value; // Invert the volume value
        this.gainNode.gain.value = this.volume;

        if (this.audio.muted) {
            this.audio.muted = false;
        }

        this.updateVolumeIcon();

        console.log('Volume changed to:', this.volume);
        console.log('Gain node value:', this.gainNode.gain.value);
    }

    updateVolumeIcon() {
        const muteIcon = this.volumeBtn.querySelector('.mute-icon');
        const lowIcon = this.volumeBtn.querySelector('.low-icon');
        const mediumIcon = this.volumeBtn.querySelector('.medium-icon');
        const highIcon = this.volumeBtn.querySelector('.high-icon');

        muteIcon.style.display = 'none';
        lowIcon.style.display = 'none';
        mediumIcon.style.display = 'none';
        highIcon.style.display = 'none';

        if (this.audio.muted || this.volume === 0) {
            muteIcon.style.display = 'block';
        } else if (this.volume < 0.33) {
            lowIcon.style.display = 'block';
        } else if (this.volume < 0.66) {
            mediumIcon.style.display = 'block';
        } else {
            highIcon.style.display = 'block';
        }
    }

    toggleMute() {
        if (this.audio.muted) {
            this.audio.muted = false;
            this.gainNode.gain.value = this.previousVolume; // Restore previous volume
            this.volumeField.value = 1 - this.previousVolume; // Restore previous volume in the slider (inverted)
        } else {
            this.audio.muted = true;
            this.previousVolume = this.volume; // Save the current volume
            this.gainNode.gain.value = 0; // Set volume to 0
            this.volumeField.value = 1; // Set slider to 0 (inverted)
        }

        this.updateVolumeIcon();

        console.log('Audio muted:', this.audio.muted);
    }

    getStyle() {
        return `
            <style>
                :host {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    width: 100vw;
                    font-family: 'Arial', sans-serif;
                }
                .audio-player {
                    background: #111;
                    border-radius: 5px;
                    padding: 5px;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    position: relative;
                    margin: 0 0 25px;
                    width: 100%;
                    max-width: 600px;
                    height: 50px;
                    box-sizing: border-box;
                }
                .audio-name {
                    position: absolute;
                    color: #fff;
                    padding: 5px 10px;
                    font-size: 12px;
                    width: calc(100% - 20px);
                    left: 0;
                    z-index: 2;
                    text-transform: capitalize;
                    text-overflow: ellipsis;
                    overflow: hidden;
                    white-space: nowrap;
                    font-weight: 400;
                    top: calc(100% + 2px);
                    background: #111;
                    margin: 0;
                    border-radius: 3px;
                }
                .play-btn, .volume-btn {
                    width: 30px;
                    height: 100%;
                    appearance: none;
                    border: none;
                    color: transparent;
                    cursor: pointer;
                    z-index: 3;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: transparent;
                }
                .play-btn svg, .volume-btn svg {
                    width: 20px;
                    height: 20px;
                    fill: white;
                }
                .play-btn.pause svg {
                    width: 18px;
                    height: 18px;
                }
                .progress-indicator {
                    display: flex;
                    justify-content: flex-end;
                    position: relative;
                    flex: 1;
                    font-size: 12px;
                    align-items: center;
                    height: 100%;
                    z-index: 2;
                }
                .progress-bar {
                    flex: 1;
                    position: absolute;
                    top: 0;
                    left: 0;
                    bottom: 0;
                    z-index: 1;
                    width: 100%;
                    height: 100%;
                    appearance: none;
                    margin: 0;
                    overflow: hidden;
                    background: none;
                }
                .progress-bar::-webkit-slider-thumb {
                    appearance: none;
                    height: 100%;
                    width: 0;
                    box-shadow: -300px 0 0 300px rgba(255, 255, 255, 0.2);
                }
                .progress-bar::-moz-range-thumb {
                    appearance: none;
                    height: 100%;
                    width: 0;
                    box-shadow: -300px 0 0 300px rgba(255, 255, 255, 0.2);
                }
                .progress-bar::-ms-thumb {
                    appearance: none;
                    height: 100%;
                    width: 0;
                    box-shadow: -300px 0 0 300px rgba(255, 255, 255, 0.2);
                }
                .volume-bar {
                    width: 30px;
                    height: 100%;
                    position: relative;
                    z-index: 3;
                }
                .volume-field {
                    display: none;
                    position: absolute;
                    appearance: none;
                    height: 20px;
                    right: 100%;
                    top: 50%;
                    transform: translateY(-50%) rotate(180deg);
                    z-index: 5;
                    margin: 0;
                    border-radius: 2px;
                    background: #ffffff;
                }
                .volume-field::-webkit-slider-thumb {
                    appearance: none;
                    height: 20px;
                    width: 10px;
                    background: #6d78ff;
                }
                .volume-field::-moz-range-thumb {
                    appearance: none;
                    height: 20px;
                    width: 10px;
                    background: #6d78ff;
                }
                .volume-field::-ms-thumb {
                    appearance: none;
                    height: 20px;
                    width: 10px;
                    background: #6d78ff;
                }
                .volume-bar:hover .volume-field {
                    display: block;
                }
                .duration,
                .current-time {
                    position: relative;
                    z-index: 2;
                    text-shadow: 0 0 2px #111;
                }
                .duration {
                    margin-left: 2px;
                    margin-right: 5px;
                }
                .duration::before {
                    content: '/';
                    display: inline-block;
                    margin-right: 2px;
                }
                canvas {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0.6;
                    z-index: 2;
                }
                .overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 3;
                }
                @media only screen and (max-width: 900px) {
                    .audio-player {
                        flex-direction: column;
                        height: auto;
                        padding: 10px;
                    }
                    .play-btn, .volume-btn {
                        width: 100%;
                        height: auto;
                    }
                    .progress-indicator {
                        flex-direction: column;
                        align-items: center;
                    }
                    .progress-bar {
                        width: 90%;
                    }
                    .current-time, .duration {
                        margin-top: 5px;
                    }
                    canvas {
                        width: 100%;
                        height: 50px;
                    }
                }
            </style>
        `;
    }

    render() {
        this.shadowRoot.innerHTML = `
            ${this.getStyle()}
            <figure class="audio-player">
                <figcaption class="audio-name">${this.extractFileName(this.getAttribute('src'))}</figcaption>
                <audio src="${this.getAttribute('src')}"></audio>
                <button class="play-btn play" type="button">
                    <svg viewBox="0 0 24 24" class="play-icon">
                        <polygon points="5,3 19,12 5,21" fill="white"></polygon>
                    </svg>
                    <svg viewBox="0 0 24 24" class="pause-icon" style="display: none;">
                        <rect x="6" y="4" width="4" height="16" fill="white"></rect>
                        <rect x="14" y="4" width="4" height="16" fill="white"></rect>
                    </svg>
                </button>
                <canvas></canvas>
                <div class="progress-indicator">
                    <span class="current-time">0:00</span>
                    <input type="range" class="progress-bar" value="0" min="0">
                    <span class="duration">0:00</span>
                </div>
                <div class="volume-bar">
                    <input type="range" class="volume-field" min="0" max="1" step="0.01" value="${1 - this.volume}">
                    <button class="volume-btn high" type="button">
                        <svg viewBox="0 0 24 24" class="mute-icon" style="display: none;">
                            <path d="M12 3.75V20.25L7.75 16H3V8H7.75L12 3.75ZM15.54 8.46L17.66 10.59L19.77 8.47L21.18 9.88L19.07 12L21.18 14.12L19.77 15.53L17.65 13.41L15.53 15.53L14.12 14.12L16.24 12L14.12 9.88L15.54 8.46Z" fill="white"></path>
                        </svg>
                        <svg viewBox="0 0 24 24" class="low-icon" style="display: none;">
                            <path d="M7.75 8H3V16H7.75L12 20.25V3.75L7.75 8ZM15 12C15 10.9 14.1 10 13 10V14C14.1 14 15 13.1 15 12Z" fill="white"></path>
                        </svg>
                        <svg viewBox="0 0 24 24" class="medium-icon" style="display: none;">
                            <path d="M7.75 8H3V16H7.75L12 20.25V3.75L7.75 8ZM15 12C15 10.9 14.1 10 13 10V14C14.1 14 15 13.1 15 12ZM19 12C19 8.7 16.3 6 13 6V10C15.2 10 17 11.8 17 14H21C21 10.1 17.9 7 14 7V6C17.9 6 21 9.1 21 13H17V15H21V12H19Z" fill="white"></path>
                        </svg>
                        <svg viewBox="0 0 24 24" class="high-icon">
                            <path d="M7.75 8H3V16H7.75L12 20.25V3.75L7.75 8ZM15 12C15 10.9 14.1 10 13 10V14C14.1 14 15 13.1 15 12ZM19 12C19 8.7 16.3 6 13 6V10C15.2 10 17 11.8 17 14H21C21 10.1 17.9 7 14 7V6C17.9 6 21 9.1 21 13H17V15H21V12H19ZM23 13H19V15H23V13Z" fill="white"></path>
                        </svg>
                    </button>
                </div>
            </figure>
        `;
        this.audio = this.shadowRoot.querySelector('audio');
        this.canvas = this.shadowRoot.querySelector('canvas');
        this.playPauseBtn = this.shadowRoot.querySelector('.play-btn');
        this.volumeBar = this.shadowRoot.querySelector('.volume-bar');
        this.volumeField = this.shadowRoot.querySelector('.volume-field');
        this.volumeBtn = this.shadowRoot.querySelector('.volume-btn');
        this.progressIndicator = this.shadowRoot.querySelector('.progress-indicator');
        this.currentTimeEl = this.progressIndicator.children[0];
        this.progressBar = this.progressIndicator.children[1];
        this.durationEl = this.progressIndicator.children[2];
        this.canvasCtx = this.canvas.getContext('2d');
        this.titleElement = this.shadowRoot.querySelector('.audio-name');

        this.updateButtonIcon();
        this.updateVolumeIcon();

        console.log('Elements initialized');
        console.log('Audio element:', this.audio);
        console.log('Play button:', this.playPauseBtn);
        console.log('Volume bar:', this.volumeBar);
        console.log('Progress bar:', this.progressBar);
    }

    updateButtonIcon() {
        const playIcon = this.playPauseBtn.querySelector('.play-icon');
        const pauseIcon = this.playPauseBtn.querySelector('.pause-icon');
        if (this.playing) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }

    updateVolumeIcon() {
        const muteIcon = this.volumeBtn.querySelector('.mute-icon');
        const lowIcon = this.volumeBtn.querySelector('.low-icon');
        const mediumIcon = this.volumeBtn.querySelector('.medium-icon');
        const highIcon = this.volumeBtn.querySelector('.high-icon');

        muteIcon.style.display = 'none';
        lowIcon.style.display = 'none';
        mediumIcon.style.display = 'none';
        highIcon.style.display = 'none';

        if (this.audio.muted || this.volume === 0) {
            muteIcon.style.display = 'block';
        } else if (this.volume < 0.33) {
            lowIcon.style.display = 'block';
        } else if (this.volume < 0.66) {
            mediumIcon.style.display = 'block';
        } else {
            highIcon.style.display = 'block';
        }
    }

    toggleMute() {
        if (this.audio.muted) {
            this.audio.muted = false;
            this.gainNode.gain.value = this.previousVolume; // Restore previous volume
            this.volumeField.value = 1 - this.previousVolume; // Restore previous volume in the slider (inverted)
        } else {
            this.audio.muted = true;
            this.previousVolume = this.volume; // Save the current volume
            this.gainNode.gain.value = 0; // Set volume to 0
            this.volumeField.value = 1; // Set slider to 0 (inverted)
        }

        this.updateVolumeIcon();

        console.log('Audio muted:', this.audio.muted);
    }
}

customElements.define('m-playa', AudioPlayer);
